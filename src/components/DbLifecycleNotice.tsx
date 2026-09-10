import { useDbLifecycle } from '../hooks/useDbLifecycle';
import { PrimaryButton } from './PrimaryButton';
import './DbLifecycleNotice.css';

/**
 * Full-screen recovery notice for the rare IndexedDB `blocked`/`terminated`
 * states (see storage/db.ts). Deliberately rendered as a sibling of
 * `LanguageProvider`, not inside it: while genuinely blocked, the app's
 * locale setting can never finish loading from IndexedDB either, so
 * anything gated behind `LanguageProvider`'s `ready` flag — including
 * `useLanguage()` — would never mount. The text below is therefore a
 * plain bilingual (Arabic + English) message rather than going through
 * the translation system, so it can still be shown during that deadlock.
 */
export function DbLifecycleNotice() {
  const state = useDbLifecycle();
  if (state.status === 'ok') return null;

  const isBlocked = state.status === 'blocked';

  return (
    <div className="db-lifecycle-notice" role="alert">
      <div className="db-lifecycle-notice__card">
        <p className="db-lifecycle-notice__text" dir="rtl">
          {isBlocked
            ? 'يبدو أن نسخة أخرى من تطبيق TMA FAMILY OFFICE ما زالت مفتوحة على جهاز أو نافذة أخرى. الرجاء إغلاقها ثم إعادة المحاولة.'
            : 'انقطع الاتصال بقاعدة البيانات بشكل غير متوقع. لم يتم فقدان أي بيانات — الرجاء إعادة المحاولة.'}
        </p>
        <p className="db-lifecycle-notice__text" dir="ltr">
          {isBlocked
            ? 'Another instance of TMA FAMILY OFFICE may still be open in a different tab, window, or device. Please close it, then retry.'
            : 'The database connection was interrupted unexpectedly. No data was lost — please retry.'}
        </p>
        <PrimaryButton onClick={() => window.location.reload()}>Retry — إعادة المحاولة</PrimaryButton>
      </div>
    </div>
  );
}
