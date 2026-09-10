import { useState } from 'react';
import { Wallet } from 'lucide-react';
import { DangerButton } from '../../../components/DangerButton';
import { PrimaryButton } from '../../../components/PrimaryButton';
import { SecondaryButton } from '../../../components/SecondaryButton';
import { StatusBadge } from '../../../components/StatusBadge';
import { useLanguage } from '../../../hooks/useLanguage';
import type { TranslationKey } from '../../../localization/translations';
import { formatMoneyNumber } from '../../../utils/money';
import { computeCurrentMonthSalaryState, type SalaryPaymentState } from '../staffStatus';
import { removeSalaryPayment } from '../staffService';
import type { HouseholdStaff, StaffSalaryPayment } from '../types';
import './SalarySection.css';

interface SalarySectionProps {
  staff: Pick<HouseholdStaff, 'monthlySalary'>;
  hasCurrentMonthPayment: boolean;
  payments: StaffSalaryPayment[];
  onAdd: () => void;
  onEdit: (payment: StaffSalaryPayment) => void;
  onRefresh: () => Promise<void> | void;
}

const SALARY_STATE_VARIANT: Record<SalaryPaymentState, 'success' | 'warning' | 'danger' | 'neutral'> = {
  notTracked: 'neutral',
  paid: 'success',
  notYetDue: 'neutral',
  pending: 'warning',
  overdue: 'danger',
};

const SALARY_STATE_LABEL_KEY: Record<Exclude<SalaryPaymentState, 'notTracked'>, TranslationKey> = {
  paid: 'salaryStatusPaid',
  notYetDue: 'salaryStatusNotYetDue',
  pending: 'salaryStatusPending',
  overdue: 'salaryStatusOverdue',
};

function formatSalaryMonth(salaryMonth: string, locale: string): string {
  const [year, month] = salaryMonth.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long' }).format(date);
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
        <span className="salary-payment-row__month">{formatSalaryMonth(payment.salaryMonth, locale)}</span>
        <span className="salary-payment-row__meta">
          {formatMoneyNumber(payment.amount, locale)} {t('kwdUnitLabel')} ·{' '}
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

export function SalarySection({ staff, hasCurrentMonthPayment, payments, onAdd, onEdit, onRefresh }: SalarySectionProps) {
  const { t } = useLanguage();

  const currentState = computeCurrentMonthSalaryState(staff, hasCurrentMonthPayment);

  return (
    <div className="salary-section">
      {currentState !== 'notTracked' && (
        <div className="salary-section__current">
          <span className="salary-section__current-label">{t('salaryCurrentMonthLabel')}</span>
          <StatusBadge variant={SALARY_STATE_VARIANT[currentState]}>
            {t(SALARY_STATE_LABEL_KEY[currentState])}
          </StatusBadge>
        </div>
      )}

      {payments.length === 0 ? (
        <p className="salary-section__empty">{t('salaryPaymentsEmpty')}</p>
      ) : (
        <ul className="salary-section__list">
          {payments.map((payment) => (
            <PaymentRow
              key={payment.id}
              payment={payment}
              onEdit={() => onEdit(payment)}
              onRemoved={() => void onRefresh()}
            />
          ))}
        </ul>
      )}
      <PrimaryButton type="button" onClick={onAdd}>
        {t('salaryPaymentsAddAction')}
      </PrimaryButton>
    </div>
  );
}
