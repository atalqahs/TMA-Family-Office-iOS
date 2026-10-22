import type { TranslationKey } from '../../localization/translations';

/**
 * The General Calendar is a DERIVED AGGREGATION LAYER, exactly like
 * Notifications and Archive: every CalendarEvent is computed on demand
 * from Family/Vehicles/Staff/Contracts/Properties/Tasks' own existing
 * records (see sources/*.ts) -- nothing here is ever persisted to
 * IndexedDB, there is no calendar store, and no DB_VERSION bump for this
 * module itself. Recomputing against a changed record (edited date,
 * archived, deleted) simply produces a different event set on the next
 * load; nothing needs to be explicitly invalidated.
 *
 * Unlike Notifications (which loads every CURRENTLY actionable item
 * regardless of date), the Calendar is RANGE-SCOPED: `calendarService.
 * loadCalendarEvents` takes an explicit [rangeStart, rangeEnd] and only
 * ever returns events whose date falls inside it, recomputed fresh each
 * time the displayed month changes -- this is what keeps a recurring
 * Task/salary schedule's occurrences bounded to what a month view can
 * actually show, rather than materializing its entire (possibly
 * unbounded) history up front.
 *
 * Category ids match `features/categories/categories.ts`'s own
 * `CategoryDefinition.id` values exactly, so the UI can resolve a
 * category's display label/icon directly from `CATEGORIES` without a
 * second translation-key mapping. Health and Education are deliberately
 * absent: neither module has any date-bearing field today (no profile
 * date field, and their own document types carry no `expiryDate`), so
 * there is nothing true to source a calendar event from -- adding one
 * would mean fabricating a date, which this module must never do.
 */
export type CalendarCategoryId = 'family' | 'properties' | 'vehicles' | 'staff' | 'contracts' | 'tasks';

/**
 * A single derived calendar occurrence. `id` is deterministic (the same
 * convention as NotificationItem.id) so the exact same underlying
 * condition always produces the exact same id.
 *
 * Title is EITHER a translated `titleKey`+`titleParams` (for an
 * app-authored label like "Civil ID" or "Registration", combined with
 * the record's own name as a parameter) OR a `rawTitle` taken directly
 * from the record's own free-text field (a Task's `title`, a document's
 * `title`) -- raw user data is never routed through a TranslationKey,
 * matching how the rest of the app already renders free-text record
 * titles (see TaskCalendarPage's own task.title usage).
 *
 * `color` is resolved once, by the SOURCE that knows what it means (a
 * Task Group's own stored color, or the single shared neutral color for
 * every non-Task category) -- the UI never branches on `category` to
 * decide a color, it only ever renders `event.color` directly.
 */
export interface CalendarEvent {
  id: string;
  category: CalendarCategoryId;
  sourceId: string;
  /** Local 'YYYY-MM-DD' -- the one real calendar day this event occupies. */
  date: string;
  color: string;
  /** The real feature route this event is about -- the Calendar never duplicates the source's own detail UI, it only links to it. */
  route: string;
  titleKey?: TranslationKey;
  titleParams?: Record<string, string>;
  rawTitle?: string;
}
