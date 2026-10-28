/**
 * The single, understated indicator color for every calendar event that
 * is NOT from Tasks & Reminders (Family, Vehicles, Staff, Contracts,
 * Properties) -- a faint, semi-transparent gray, deliberately never
 * bright or visually dominant, and deliberately distinct from every
 * swatch in the Task Group color palette (see
 * features/tasks/taskGroupColor.ts) so a gray dot is never confusable
 * with a colored one. Derived from the same neutral text-secondary tone
 * already used elsewhere in the dark theme (see styles/theme.css),
 * rather than inventing a new color family just for this.
 */
export const NON_TASK_EVENT_COLOR = 'rgba(154, 160, 170, 0.55)';
