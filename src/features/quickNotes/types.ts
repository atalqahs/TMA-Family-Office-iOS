/**
 * A single Quick Note -- a short or multiline piece of informal free text
 * (e.g. "The driver needs something for his vehicle"), jotted down fast
 * from the Dashboard. There is no title, no folder/tag/category, no
 * linked record -- deliberately as simple as a sticky note.
 *
 * `text` preserves line breaks exactly as typed (rendered with
 * `white-space: pre-wrap`, never collapsed/joined) -- see
 * `QuickNotesWidget.css`.
 *
 * This module has ZERO relationship to any other feature: it is never
 * read by the General Calendar, Notifications, Archive, or Tasks &
 * Reminders (see the architecture gate's own isolation rule).
 */
export interface QuickNote {
  id: string;
  text: string;
  createdAt: string;
  updatedAt: string;
}
