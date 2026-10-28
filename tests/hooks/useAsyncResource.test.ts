import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAsyncResource } from '../../src/hooks/useAsyncResource';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useAsyncResource', () => {
  it('fetches on mount and exposes the result', async () => {
    const fetcher = vi.fn().mockResolvedValue(['a', 'b']);
    const { result } = renderHook(() => useAsyncResource(fetcher, [] as string[]));
    await waitFor(() => expect(result.current.data).toEqual(['a', 'b']));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(false);
  });

  it('sets error and keeps stale data cleared to the last successful value when the fetch rejects', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('boom'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useAsyncResource(fetcher, [] as string[]));
    await waitFor(() => expect(result.current.error).toBe(true));
    expect(result.current.loading).toBe(false);
    consoleSpy.mockRestore();
  });

  it('a newer refresh() result is never overwritten by an older one resolving later', async () => {
    const first = deferred<string[]>();
    const second = deferred<string[]>();
    const fetcher = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const { result } = renderHook(() => useAsyncResource(fetcher, [] as string[]));
    act(() => {
      void result.current.refresh();
    });
    expect(fetcher).toHaveBeenCalledTimes(2);

    await act(async () => {
      second.resolve(['new']);
    });
    await waitFor(() => expect(result.current.data).toEqual(['new']));

    await act(async () => {
      first.resolve(['old']);
    });
    await act(async () => {
      await Promise.resolve();
    });
    expect(result.current.data).toEqual(['new']);
  });

  it('loading stays true until the LATEST in-flight call settles, even if an older call finishes first', async () => {
    const first = deferred<string[]>();
    const second = deferred<string[]>();
    const fetcher = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    const { result } = renderHook(() => useAsyncResource(fetcher, [] as string[]));
    act(() => {
      void result.current.refresh();
    });

    await act(async () => {
      first.resolve(['old']); // the OLDER call settles first
    });
    expect(result.current.loading).toBe(true); // the newer call is still pending

    await act(async () => {
      second.resolve(['new']);
    });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual(['new']);
  });
});
