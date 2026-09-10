import { useState } from 'react';
import { CalendarClock, Repeat, Wallet } from 'lucide-react';
import { DangerButton } from '../../../components/DangerButton';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { StatusBadge } from '../../../components/StatusBadge';
import { useLanguage } from '../../../hooks/useLanguage';
import type { TranslationKey } from '../../../localization/translations';
import { getLocalToday } from '../../../utils/localDate';
import { formatMoneyNumber } from '../../../utils/money';
import { buildScheduleOccurrences, type SalaryOccurrence } from '../salarySchedule';
import { computeOccurrenceLevel, STAFF_STATUS_VARIANT, type SalaryOccurrenceLevel } from '../staffStatus';
import { removeSalaryPayment, removeSalarySchedule } from '../staffService';
import { getPaymentDueDate } from '../types';
import type { StaffSalaryPayment, StaffSalarySchedule } from '../types';
import './SalarySection.css';

interface SalarySectionProps {
  salarySchedules: StaffSalarySchedule[];
  salaryPayments: StaffSalaryPayment[];
  onAddSchedule: () => void;
  onEditSchedule: (schedule: StaffSalarySchedule) => void;
  onConfirmOccurrence: (occurrence: SalaryOccurrence) => void;
  onEditPayment: (payment: StaffSalaryPayment) => void;
  onRefresh: () => Promise<void> | void;
}

const FREQUENCY_LABEL_KEY: Record<StaffSalarySchedule['frequency'], TranslationKey> = {
  day: 'frequencyDay',
  month: 'frequencyMonth',
  year: 'frequencyYear',
};

function formatDate(dateStr: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(`${dateStr}T00:00:00`),
  );
}

interface ScheduleRowProps {
  schedule: StaffSalarySchedule;
  onEdit: () => void;
  onRemoved: () => void;
}

function ScheduleRow({ schedule, onEdit, onRemoved }: ScheduleRowProps) {
  const { t, locale } = useLanguage();
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const monthName =
    schedule.frequency === 'year' && schedule.dueMonth
      ? new Intl.DateTimeFormat(locale, { month: 'long' }).format(new Date(2000, schedule.dueMonth - 1, 1))
      : undefined;

  const metaParts = [
    `${t('frequencyEveryLabel')} ${schedule.interval} ${t(FREQUENCY_LABEL_KEY[schedule.frequency])}`,
    schedule.dueDayOfMonth !== undefined ? `${t('scheduleDueDayLabel')} ${schedule.dueDayOfMonth}` : undefined,
    monthName ? `${t('fieldDueMonth')} ${monthName}` : undefined,
  ].filter(Boolean);

  const handleRemove = async () => {
    setRemoving(true);
    setError(null);
    try {
      await removeSalarySchedule(schedule.id);
      onRemoved();
    } catch (err) {
      console.error('Failed to remove salary schedule', err);
      setError(t('formSaveError'));
      setRemoving(false);
    }
  };

  return (
    <li className="salary-schedule-row">
      <span className="salary-schedule-row__icon" aria-hidden="true">
        <Repeat size={20} strokeWidth={1.75} />
      </span>
      <span className="salary-schedule-row__text">
        <span className="salary-schedule-row__amount">
          {formatMoneyNumber(schedule.amount, locale)} {t('kwdUnitLabel')}
        </span>
        <span className="salary-schedule-row__meta">{metaParts.join(' · ')}</span>
        {schedule.notes && <span className="salary-schedule-row__notes">{schedule.notes}</span>}
        {error && <span className="salary-schedule-row__error">{error}</span>}
      </span>
      <span className="salary-schedule-row__actions">
        <SecondaryButton type="button" onClick={onEdit}>
          {t('profileEditAction')}
        </SecondaryButton>
        {confirming ? (
          <DangerButton type="button" onClick={handleRemove} disabled={removing}>
            {removing ? t('formSaving') : t('actionConfirm')}
          </DangerButton>
        ) : (
          <DangerButton type="button" onClick={() => setConfirming(true)}>
            {t('documentDeleteAction')}
          </DangerButton>
        )}
      </span>
    </li>
  );
}

const OCCURRENCE_STATE_LABEL_KEY: Record<SalaryOccurrenceLevel, TranslationKey> = {
  green: 'salaryStatusNotYetDue',
  orange: 'salaryStatusPending',
  red: 'salaryStatusOverdue',
};

interface OccurrenceRowProps {
  occurrence: SalaryOccurrence;
  today: string;
  onConfirm: () => void;
}

function OccurrenceRow({ occurrence, today, onConfirm }: OccurrenceRowProps) {
  const { t, locale } = useLanguage();
  const level = computeOccurrenceLevel(occurrence, today);
  const isFuture = occurrence.dueDate > today;

  return (
    <li className="salary-occurrence-row">
      <span className="salary-occurrence-row__icon" aria-hidden="true">
        <CalendarClock size={20} strokeWidth={1.75} />
      </span>
      <span className="salary-occurrence-row__text">
        <span className="salary-occurrence-row__date">{formatDate(occurrence.dueDate, locale)}</span>
        <span className="salary-occurrence-row__amount">
          {formatMoneyNumber(occurrence.amount, locale)} {t('kwdUnitLabel')}
        </span>
        {!isFuture && <StatusBadge variant={STAFF_STATUS_VARIANT[level]}>{t(OCCURRENCE_STATE_LABEL_KEY[level])}</StatusBadge>}
      </span>
      <PrimaryButton type="button" onClick={onConfirm}>
        {t('salaryConfirmPaymentAction')}
      </PrimaryButton>
    </li>
  );
}

interface PaymentRowProps {
  payment: StaffSalaryPayment;
  onEdit: () => void;
  onRemoved: () => void;
}

function PaymentRow({ payment, onEdit, onRemoved }: PaymentRowProps) {
  const { t, locale } = useLanguage();
  const [confirming, setConfirming] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dueDate = getPaymentDueDate(payment);

  const handleRemove = async () => {
    setRemoving(true);
    setError(null);
    try {
      await removeSalaryPayment(payment.id);
      onRemoved();
    } catch (err) {
      console.error('Failed to remove salary payment', err);
      setError(t('formSaveError'));
      setRemoving(false);
    }
  };

  return (
    <li className="salary-payment-row">
      <span className="salary-payment-row__icon" aria-hidden="true">
        <Wallet size={20} strokeWidth={1.75} />
      </span>
      <span className="salary-payment-row__text">
        <span className="salary-payment-row__month">{dueDate ? formatDate(dueDate, locale) : payment.paidDate}</span>
        <span className="salary-payment-row__meta">
          {formatMoneyNumber(payment.amount, locale)} {t('kwdUnitLabel')} · {t('salaryPaidOnLabel')}{' '}
          {new Intl.DateTimeFormat(locale).format(new Date(payment.paidDate))}
        </span>
        {payment.notes && <span className="salary-payment-row__notes">{payment.notes}</span>}
        {error && <span className="salary-payment-row__error">{error}</span>}
      </span>
      <span className="salary-payment-row__actions">
        <SecondaryButton type="button" onClick={onEdit}>
          {t('profileEditAction')}
        </SecondaryButton>
        {confirming ? (
          <DangerButton type="button" onClick={handleRemove} disabled={removing}>
            {removing ? t('formSaving') : t('actionConfirm')}
          </DangerButton>
        ) : (
          <DangerButton type="button" onClick={() => setConfirming(true)}>
            {t('documentDeleteAction')}
          </DangerButton>
        )}
      </span>
    </li>
  );
}

export function SalarySection({
  salarySchedules,
  salaryPayments,
  onAddSchedule,
  onEditSchedule,
  onConfirmOccurrence,
  onEditPayment,
  onRefresh,
}: SalarySectionProps) {
  const { t } = useLanguage();
  const today = getLocalToday();

  const occurrences = salarySchedules.flatMap((schedule) => buildScheduleOccurrences(schedule, salaryPayments, today));
  const pendingOccurrences = occurrences.filter((occurrence) => !occurrence.paid).sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  return (
    <div className="salary-section">
      <h3 className="salary-section__subtitle">{t('salarySchedulesLabel')}</h3>
      {salarySchedules.length === 0 ? (
        <p className="salary-section__empty">{t('salarySchedulesEmpty')}</p>
      ) : (
        <ul className="salary-section__list">
          {salarySchedules.map((schedule) => (
            <ScheduleRow
              key={schedule.id}
              schedule={schedule}
              onEdit={() => onEditSchedule(schedule)}
              onRemoved={() => void onRefresh()}
            />
          ))}
        </ul>
      )}
      <PrimaryButton type="button" onClick={onAddSchedule}>
        {t('salaryPaymentsAddAction')}
      </PrimaryButton>

      <h3 className="salary-section__subtitle salary-section__subtitle--spaced">{t('salaryUpcomingLabel')}</h3>
      {pendingOccurrences.length === 0 ? (
        <p className="salary-section__empty">{t('salaryUpcomingEmpty')}</p>
      ) : (
        <ul className="salary-section__list">
          {pendingOccurrences.map((occurrence) => (
            <OccurrenceRow
              key={`${occurrence.scheduleId}-${occurrence.dueDate}`}
              occurrence={occurrence}
              today={today}
              onConfirm={() => onConfirmOccurrence(occurrence)}
            />
          ))}
        </ul>
      )}

      <h3 className="salary-section__subtitle salary-section__subtitle--spaced">{t('salaryHistoryLabel')}</h3>
      {salaryPayments.length === 0 ? (
        <p className="salary-section__empty">{t('salaryPaymentsEmpty')}</p>
      ) : (
        <ul className="salary-section__list">
          {salaryPayments.map((payment) => (
            <PaymentRow
              key={payment.id}
              payment={payment}
              onEdit={() => onEditPayment(payment)}
              onRemoved={() => void onRefresh()}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
