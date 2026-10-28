import { describe, expect, it } from 'vitest';
import { DEFAULT_TASK_GROUP_COLOR, TASK_GROUP_COLOR_PALETTE, getTaskGroupColor } from '../../src/features/tasks/taskGroupColor';

describe('TASK_GROUP_COLOR_PALETTE', () => {
  it('has at least a handful of distinct, elegant swatches', () => {
    expect(TASK_GROUP_COLOR_PALETTE.length).toBeGreaterThanOrEqual(6);
  });

  it('every swatch value is unique', () => {
    const values = TASK_GROUP_COLOR_PALETTE.map((option) => option.value);
    expect(new Set(values).size).toBe(values.length);
  });

  it('every swatch is a valid hex color', () => {
    for (const option of TASK_GROUP_COLOR_PALETTE) {
      expect(option.value).toMatch(/^#[0-9A-Fa-f]{6}$/);
    }
  });

  it('every swatch has both an Arabic and an English name for accessible labeling', () => {
    for (const option of TASK_GROUP_COLOR_PALETTE) {
      expect(option.name.ar.length).toBeGreaterThan(0);
      expect(option.name.en.length).toBeGreaterThan(0);
    }
  });

  it('the default color is one of the palette values', () => {
    expect(TASK_GROUP_COLOR_PALETTE.map((o) => o.value)).toContain(DEFAULT_TASK_GROUP_COLOR);
  });
});

describe('getTaskGroupColor', () => {
  it("returns the group's own stored color when set", () => {
    expect(getTaskGroupColor({ color: '#E0645A' })).toBe('#E0645A');
  });

  it('falls back to the default color for a group created before this feature (no stored color)', () => {
    expect(getTaskGroupColor({})).toBe(DEFAULT_TASK_GROUP_COLOR);
  });

  it('falls back to the default color when color is explicitly undefined', () => {
    expect(getTaskGroupColor({ color: undefined })).toBe(DEFAULT_TASK_GROUP_COLOR);
  });
});
