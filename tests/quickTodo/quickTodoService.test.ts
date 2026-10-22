import { describe, expect, it } from 'vitest';
import * as quickTodoRepository from '../../src/features/quickTodo/quickTodoRepository';
import {
  countIncompleteQuickTodoItems,
  createQuickTodoItem,
  EmptyQuickTodoTextError,
  removeQuickTodoItem,
  sortQuickTodoItemsForDisplay,
  toggleQuickTodoItemCompleted,
  updateQuickTodoItemText,
} from '../../src/features/quickTodo/quickTodoService';
import type { QuickTodoItem } from '../../src/features/quickTodo/types';

describe('createQuickTodoItem', () => {
  it('creates an item with completed: false and trims surrounding whitespace', async () => {
    const item = await createQuickTodoItem('  Get a haircut  ');
    expect(item).toMatchObject({ text: 'Get a haircut', completed: false });
    expect(item.id).toBeTruthy();
    expect(await quickTodoRepository.getQuickTodoItem(item.id)).toMatchObject({ text: 'Get a haircut' });
  });

  it('rejects empty/whitespace-only text without writing anything', async () => {
    await expect(createQuickTodoItem('   ')).rejects.toThrow(EmptyQuickTodoTextError);
    expect(await quickTodoRepository.listQuickTodoItems()).toEqual([]);
  });
});

describe('updateQuickTodoItemText', () => {
  it('edits an existing item\'s text, leaving completed/createdAt untouched', async () => {
    const item = await createQuickTodoItem('Buy groceries');
    const updated = await updateQuickTodoItemText(item.id, 'Buy groceries and milk');
    expect(updated.text).toBe('Buy groceries and milk');
    expect(updated.completed).toBe(false);
    expect(updated.createdAt).toBe(item.createdAt);
  });

  it('rejects empty text on edit', async () => {
    const item = await createQuickTodoItem('Pick up dry cleaning');
    await expect(updateQuickTodoItemText(item.id, '   ')).rejects.toThrow(EmptyQuickTodoTextError);
  });

  it('throws for a non-existent item', async () => {
    await expect(updateQuickTodoItemText('missing', 'text')).rejects.toThrow();
  });
});

describe('toggleQuickTodoItemCompleted', () => {
  it('marks an incomplete item complete, and can mark it incomplete again (uncheck)', async () => {
    const item = await createQuickTodoItem('Refuel the car');
    const completed = await toggleQuickTodoItemCompleted(item.id);
    expect(completed.completed).toBe(true);

    const uncompleted = await toggleQuickTodoItemCompleted(item.id);
    expect(uncompleted.completed).toBe(false);
  });
});

describe('removeQuickTodoItem', () => {
  it('permanently deletes an item', async () => {
    const item = await createQuickTodoItem('Pick up an item');
    await removeQuickTodoItem(item.id);
    expect(await quickTodoRepository.getQuickTodoItem(item.id)).toBeUndefined();
  });

  it('a completed item remains fully readable until explicitly deleted', async () => {
    const item = await createQuickTodoItem('Water the plants');
    await toggleQuickTodoItemCompleted(item.id);
    const items = await quickTodoRepository.listQuickTodoItems();
    expect(items).toHaveLength(1);
    expect(items[0].completed).toBe(true);
  });
});

describe('countIncompleteQuickTodoItems', () => {
  it('counts only incomplete items', () => {
    const items: QuickTodoItem[] = [
      { id: '1', text: 'a', completed: false, createdAt: 't1', updatedAt: 't1' },
      { id: '2', text: 'b', completed: true, createdAt: 't2', updatedAt: 't2' },
      { id: '3', text: 'c', completed: false, createdAt: 't3', updatedAt: 't3' },
    ];
    expect(countIncompleteQuickTodoItems(items)).toBe(2);
  });

  it('is zero for an empty list or an all-completed list', () => {
    expect(countIncompleteQuickTodoItems([])).toBe(0);
    expect(
      countIncompleteQuickTodoItems([{ id: '1', text: 'a', completed: true, createdAt: 't1', updatedAt: 't1' }]),
    ).toBe(0);
  });
});

describe('sortQuickTodoItemsForDisplay', () => {
  it('places every incomplete item before every completed item, each group in creation order', () => {
    const items: QuickTodoItem[] = [
      { id: '1', text: 'first', completed: true, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '' },
      { id: '2', text: 'second', completed: false, createdAt: '2026-01-02T00:00:00.000Z', updatedAt: '' },
      { id: '3', text: 'third', completed: false, createdAt: '2026-01-01T12:00:00.000Z', updatedAt: '' },
      { id: '4', text: 'fourth', completed: true, createdAt: '2026-01-03T00:00:00.000Z', updatedAt: '' },
    ];
    expect(sortQuickTodoItemsForDisplay(items).map((item) => item.id)).toEqual(['3', '2', '1', '4']);
  });

  it('never mutates the input array', () => {
    const items: QuickTodoItem[] = [{ id: '1', text: 'a', completed: true, createdAt: 't1', updatedAt: 't1' }];
    const original = [...items];
    sortQuickTodoItemsForDisplay(items);
    expect(items).toEqual(original);
  });
});
