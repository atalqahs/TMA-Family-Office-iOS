import type { Locale, TranslationKey } from '../localization/translations';
import { useLanguage } from '../hooks/useLanguage';
import { renderStatusReasonText, type StatusReason } from '../utils/statusReasons';
import './StatusReasonsList.css';

interface StatusReasonsListProps {
  reasons: StatusReason[];
  /** Override the default per-reason text renderer -- Staff's salary reason
   * appends a currency unit the generic renderer doesn't know about, so it
   * passes its own existing `renderStaffReasonText` here instead of
   * duplicating this list's markup just for that one difference. */
  renderText?: (reason: StatusReason, t: (key: TranslationKey) => string, locale: Locale) => string;
}

/**
 * Every active reason behind a record's status, listed out in full --
 * the profile/detail-page half of the shared status-reasons
 * presentation (summarizeStatusReasons, in statusReasons.ts, is the
 * short card-summary half). Shared by Vehicle/Staff/Family/Contract
 * profile pages so "list every active reason" is implemented once.
 */
export function StatusReasonsList({ reasons, renderText = renderStatusReasonText }: StatusReasonsListProps) {
  const { t, locale } = useLanguage();
  if (reasons.length === 0) return null;

  return (
    <ul className="status-reasons">
      {reasons.map((reason, index) => (
        <li key={index} className={`status-reasons__item status-reasons__item--${reason.level}`}>
          {renderText(reason, t, locale)}
        </li>
      ))}
    </ul>
  );
}
