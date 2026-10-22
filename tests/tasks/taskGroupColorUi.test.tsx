import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TaskGroupForm } from '../../src/features/tasks/components/TaskGroupForm';
import { DEFAULT_TASK_GROUP_COLOR, TASK_GROUP_COLOR_PALETTE } from '../../src/features/tasks/taskGroupColor';
import type { TaskGroup } from '../../src/features/tasks/types';
import { LanguageProvider } from '../../src/localization/LanguageContext';
import { setSetting } from '../../src/storage/db';

/**
 * Permanent regression suite for the Task Group color picker (the General
 * Calendar correction): the exact same edit/create sheet used by
 * TasksPage (create) and TaskGroupDetailPage (edit, via its pencil icon)
 * must support selecting one color per group, pre-select a sensible
 * default for a group created before this feature, and preserve the
 * existing name/notes fields untouched.
 */
describe('TaskGroupForm: color picker', () => {
  it('renders every palette swatch as a selectable, accessibly-labeled option', async () => {
    await setSetting('locale', 'en');
    render(
      <LanguageProvider>
        <TaskGroupForm onSubmit={async () => {}} onCancel={() => {}} />
      </LanguageProvider>,
    );
    for (const option of TASK_GROUP_COLOR_PALETTE) {
      expect(await screen.findByRole('button', { name: option.name.en })).toBeInTheDocument();
    }
  });

  it('a new group defaults to the first palette color and submits it on save', async () => {
    await setSetting('locale', 'en');
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <LanguageProvider>
        <TaskGroupForm onSubmit={onSubmit} onCancel={() => {}} />
      </LanguageProvider>,
    );
    const defaultOption = TASK_GROUP_COLOR_PALETTE[0];
    expect(await screen.findByRole('button', { name: defaultOption.name.en })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.change(screen.getByLabelText('Group Name'), { target: { value: 'Household' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ name: 'Household', color: DEFAULT_TASK_GROUP_COLOR });
  });

  it('selecting a different swatch updates the selection and submits that color', async () => {
    await setSetting('locale', 'en');
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    render(
      <LanguageProvider>
        <TaskGroupForm onSubmit={onSubmit} onCancel={() => {}} />
      </LanguageProvider>,
    );
    const target = TASK_GROUP_COLOR_PALETTE[2];
    fireEvent.change(await screen.findByLabelText('Group Name'), { target: { value: 'Travel' } });
    fireEvent.click(screen.getByRole('button', { name: target.name.en }));
    expect(screen.getByRole('button', { name: target.name.en })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ color: target.value });
  });

  it('editing a pre-existing group with no stored color pre-selects the default, and preserves name/notes on save', async () => {
    await setSetting('locale', 'en');
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const legacyGroup: TaskGroup = {
      id: 'g1',
      name: 'Vehicle Reminders',
      notes: 'Pre-existing group from before colors existed',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    };
    render(
      <LanguageProvider>
        <TaskGroupForm initialValue={legacyGroup} onSubmit={onSubmit} onCancel={() => {}} />
      </LanguageProvider>,
    );
    expect(await screen.findByRole('button', { name: TASK_GROUP_COLOR_PALETTE[0].name.en })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByLabelText('Group Name')).toHaveValue('Vehicle Reminders');

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await vi.waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      name: 'Vehicle Reminders',
      notes: 'Pre-existing group from before colors existed',
      color: DEFAULT_TASK_GROUP_COLOR,
    });
  });

  it('editing a group that already has a stored color pre-selects that exact color', async () => {
    await setSetting('locale', 'en');
    const coloredGroup: TaskGroup = {
      id: 'g2',
      name: 'Work Tasks',
      color: TASK_GROUP_COLOR_PALETTE[1].value,
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
    };
    render(
      <LanguageProvider>
        <TaskGroupForm initialValue={coloredGroup} onSubmit={async () => {}} onCancel={() => {}} />
      </LanguageProvider>,
    );
    expect(await screen.findByRole('button', { name: TASK_GROUP_COLOR_PALETTE[1].name.en })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('renders the Arabic field label and color names', async () => {
    await setSetting('locale', 'ar');
    render(
      <LanguageProvider>
        <TaskGroupForm onSubmit={async () => {}} onCancel={() => {}} />
      </LanguageProvider>,
    );
    expect(await screen.findByText('لون المجموعة')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: TASK_GROUP_COLOR_PALETTE[0].name.ar })).toBeInTheDocument();
  });
});
