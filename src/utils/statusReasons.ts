import type { Locale, TranslationKey } from '../localization/translations';
import { renderTemplateText } from './templateText';

export type StatusReasonLevel = 'orange' | 'red';

/**
 * One independent, currently-active cause behind a record's orange/red
 * status -- e.g. "Civil ID expired" or "Oil change overdue by 5,000 km".
 * Shared shape for every module's own status file (vehicleStatus.ts,
 * staffStatus.ts, familyStatus.ts, contractStatus.ts), which is what
 * lets a single pair of presentation components (StatusReasonsList,
 * summarizeStatusReasons below) work identically everywhere instead of
 * each module inventing its own reasons UI. Each reason is re-derived
 * from its own live underlying data on every render -- there is no
 * stored/cached reason, so resolving the condition that caused it (e.g.
 * renewing a document) makes the reason disappear on its own, with nothing
 * to manually clear.
 */
export interface StatusReason {
  level: StatusReasonLevel;
  textKey: TranslationKey;
  /** Extra context appended after the translated text (e.g. a document's own title), kept as plain text so it works in either language untranslated. */
  detail?: string;
  /** Template placeholders (e.g. {date}, {km}, {amount}) substituted into the translation, via the same convention as Notifications/Calendar (see templateText.ts). */
  params?: Record<string, string>;
}

/** Full, translated sentence for one reason -- used on profile/detail pages where every active reason is listed out. */
export function renderStatusReasonText(reason: StatusReason, t: (key: TranslationKey) => string, locale: Locale): string {
  let text = renderTemplateText(reason.textKey, reason.params, t, locale);
  if (reason.detail) text += `: ${reason.detail}`;
  return text;
}

/**
 * A short, card-friendly summary of a record's active reasons:
 * - no reasons -> undefined (nothing to show next to a green/neutral badge)
 * - exactly one -> that reason's own full text (specific and short enough
 *   on its own, e.g. "Civil ID expired" -- more useful than a bare "1 reason")
 * - two or more -> a translated "{count} reasons" count, so a small list
 *   card never has to wrap a multi-line reason list (the full list is
 *   always one tap away on the record's own profile page).
 */
export function summarizeStatusReasons(
  reasons: StatusReason[],
  t: (key: TranslationKey) => string,
  locale: Locale,
): string | undefined {
  if (reasons.length === 0) return undefined;
  if (reasons.length === 1) return renderStatusReasonText(reasons[0], t, locale);
  if (reasons.length === 2) return t('statusReasonsCountTwo');
  return renderTemplateText('statusReasonsCountMany', { count: String(reasons.length) }, t, locale);
}
