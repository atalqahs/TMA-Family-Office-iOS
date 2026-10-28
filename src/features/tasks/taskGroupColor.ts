import type { LocalizedText } from '../../localization/translations';
import type { TaskGroup } from './types';

/**
 * A curated, fixed set of elegant, mutually distinguishable colors a user
 * can assign to a Task Group -- deliberately not a full color wheel/picker
 * (no external UI library, and a small fixed set is what keeps every
 * group's color reliably distinguishable against the dark UI and against
 * the app's own gold accent). Each swatch is chosen for solid contrast
 * against `--color-bg`/`--color-surface` (see theme.css) and against the
 * understated gray used for every non-Task calendar indicator (see
 * features/calendar/colors.ts) -- a Task Group color must never be
 * confusable with that neutral gray.
 */
export interface TaskGroupColorOption {
  value: string;
  name: LocalizedText;
}

export const TASK_GROUP_COLOR_PALETTE: TaskGroupColorOption[] = [
  { value: '#5B8DEF', name: { ar: 'أزرق', en: 'Blue' } },
  { value: '#E0645A', name: { ar: 'أحمر', en: 'Red' } },
  { value: '#4CAF7D', name: { ar: 'أخضر', en: 'Green' } },
  { value: '#9B7FD4', name: { ar: 'بنفسجي', en: 'Purple' } },
  { value: '#4FB8C4', name: { ar: 'فيروزي', en: 'Teal' } },
  { value: '#D97B3F', name: { ar: 'برتقالي', en: 'Orange' } },
  { value: '#D46BA3', name: { ar: 'وردي', en: 'Pink' } },
  { value: '#6B7FD1', name: { ar: 'نيلي', en: 'Indigo' } },
];

/**
 * The color a group falls back to when it has none stored yet -- every
 * Task Group created before this feature existed simply lacks `color`
 * (see storage/db.ts's v14->v15 migration doc comment), and this resolves
 * it to a real, always-valid value at read time rather than ever
 * persisting a fabricated default onto old records.
 */
export const DEFAULT_TASK_GROUP_COLOR = TASK_GROUP_COLOR_PALETTE[0].value;

/** The effective color for a group -- its own stored color, or the default for one that predates this feature. Use this EVERYWHERE a group's color is rendered (TaskGroupCard, TaskGroupForm, the General Calendar's task events) so there is exactly one fallback rule. */
export function getTaskGroupColor(group: Pick<TaskGroup, 'color'>): string {
  return group.color ?? DEFAULT_TASK_GROUP_COLOR;
}
