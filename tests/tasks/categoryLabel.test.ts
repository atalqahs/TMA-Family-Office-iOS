import { describe, expect, it } from 'vitest';
import { CATEGORIES } from '../../src/features/categories/categories';

/**
 * Permanent Phase 10.1 regression suite -- Section 1 (Tasks category
 * display name), items #1-3: this is a DISPLAY/LOCALIZATION change only.
 * Every internal identifier (route, folder, TypeScript type, IndexedDB
 * store, id) must remain completely untouched.
 */
describe('Tasks category display label: "Tasks & Reminders" / "المهام والتذكيرات"', () => {
  const tasksCategory = CATEGORIES.find((category) => category.id === 'tasks')!;

  it('1. Arabic category label is "المهام والتذكيرات"', () => {
    expect(tasksCategory.title.ar).toBe('المهام والتذكيرات');
  });

  it('2. English category label is "Tasks & Reminders"', () => {
    expect(tasksCategory.title.en).toBe('Tasks & Reminders');
  });

  it('3. the internal category id and route are completely untouched by the display rename', () => {
    expect(tasksCategory.id).toBe('tasks');
    expect(tasksCategory.path).toBe('/tasks');
  });
});
