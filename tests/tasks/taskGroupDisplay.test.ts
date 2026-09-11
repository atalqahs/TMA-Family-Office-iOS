import { describe, expect, it } from 'vitest';
import { getTaskGroupDisplayName } from '../../src/features/tasks/taskGroupDisplay';
import { MIGRATION_GENERAL_GROUP_ID } from '../../src/features/tasks/types';

describe('getTaskGroupDisplayName', () => {
  it('resolves the migration-created General group via translation, regardless of its stored name', () => {
    const t = (key: string) => (key === 'taskGroupGeneralName' ? 'General' : key);
    expect(getTaskGroupDisplayName({ id: MIGRATION_GENERAL_GROUP_ID, name: 'whatever-was-stored' }, t)).toBe('General');
  });

  it('shows a normal user-created group’s stored name as-is', () => {
    const t = (key: string) => key;
    expect(getTaskGroupDisplayName({ id: 'custom-id', name: 'Vehicle Reminders' }, t)).toBe('Vehicle Reminders');
  });
});
