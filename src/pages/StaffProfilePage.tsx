import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { ArchivedNotice } from '../components/ArchivedNotice';
import { Avatar } from '../components/Avatar';
import { DangerButton } from '../components/DangerButton';
import { EmptyState } from '../components/EmptyState';
import { IconButton } from '../components/IconButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { StatusBadge } from '../components/StatusBadge';
import { Sheet } from '../components/Sheet';
import { SalaryPaymentForm } from '../features/staff/components/SalaryPaymentForm';
import { SalaryScheduleForm } from '../features/staff/components/SalaryScheduleForm';
import { SalarySection } from '../features/staff/components/SalarySection';
import { StaffDocumentForm } from '../features/staff/components/StaffDocumentForm';
import { StaffDocumentsSection } from '../features/staff/components/StaffDocumentsSection';
import { StaffForm } from '../features/staff/components/StaffForm';
import * as staffService from '../features/staff/staffService';
import { useStaffMember } from '../features/staff/hooks/useStaffMember';
import type { SalaryOccurrence } from '../features/staff/salarySchedule';
import { computeStaffStatus, STAFF_STATUS_LABEL_KEY, STAFF_STATUS_VARIANT } from '../features/staff/staffStatus';
import { getPaymentDueDate, STAFF_ROLES } from '../features/staff/types';
import type { StaffSalaryPayment, StaffSalarySchedule } from '../features/staff/types';
import { useDisclosure } from '../hooks/useDisclosure';
import { useLanguage } from '../hooks/useLanguage';
import { calculateAge } from '../utils/age';
import { formatMoneyNumber } from '../utils/money';
import './StaffProfilePage.css';

interface PaymentContext {
  dueDate: string;
  scheduleId?: string;
  defaultAmount?: number;
  existing?: StaffSalaryPayment;
}

export function StaffProfilePage() {
  const { staffId } = useParams<{ staffId: string }>();
  const navigate = useNavigate();
  const { t, locale, dir } = useLanguage();
  const { staff, documents, salarySchedules, salaryPayments, loading, refresh } = useStaffMember(staffId);
  const editSheet = useDisclosure();
  const addDocSheet = useDisclosure();
  const scheduleSheet = useDisclosure();
  const paymentSheet = useDisclosure();
  const deleteSheet = useDisclosure();
  const archiveSheet = useDisclosure();
  const [archiving, setArchiving] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<StaffSalarySchedule | null>(null);
  const [paymentContext, setPaymentContext] = useState<PaymentContext | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const BackIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;

  if (loading) {
    return <p className="staff-profile-page__status">{t('loadingLabel')}</p>;
  }

  if (!staff) {
    return (
      <div className="staff-profile-page">
        <EmptyState
          title={t('staffNotFoundTitle')}
          action={<PrimaryButton onClick={() => navigate('/staff')}>{t('backToStaffLabel')}</PrimaryButton>}
        />
      </div>
    );
  }

  // Hard Phase 10 rule: an archived card is never opened for viewing/
  // editing directly -- Unarchive is the only way back to the full profile.
  if (staff.archivedAt) {
    return (
      <div className="staff-profile-page">
        <div className="staff-profile-page__topbar">
          <IconButton
            icon={<BackIcon size={22} strokeWidth={1.75} />}
            label={t('backToStaffLabel')}
            onClick={() => navigate('/staff')}
          />
        </div>
        <ArchivedNotice
          onUnarchive={async () => {
            await staffService.unarchiveStaffMember(staff.id);
            await refresh();
          }}
        />
      </div>
    );
  }

  const { level: statusLevel, reasons } = computeStaffStatus(staff, documents, salarySchedules, salaryPayments);
  const roleLabel = staff.role ? STAFF_ROLES.find((option) => option.id === staff.role)?.title[locale] : undefined;
  const age = calculateAge(staff.dateOfBirth);

  const renderReasonText = (reason: (typeof reasons)[number]): string => {
    let text = t(reason.textKey);
    if (reason.params) {
      for (const [key, value] of Object.entries(reason.params)) {
        const displayValue =
          key === 'date'
            ? new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' }).format(new Date(`${value}T00:00:00`))
            : key === 'amount'
              ? `${formatMoneyNumber(Number(value), locale)} ${t('kwdUnitLabel')}`
              : value;
        text = text.replace(`{${key}}`, displayValue);
      }
    }
    if (reason.detail) text += `: ${reason.detail}`;
    return text;
  };

  // Only rows that actually have a value are shown — an empty optional
  // field is simply omitted rather than displayed as a "-" placeholder row.
  const personalInfoRows: Array<[string, string]> = (
    [
      [t('fieldNationality'), staff.nationality],
      [t('fieldDateOfBirth'), staff.dateOfBirth && new Intl.DateTimeFormat(locale).format(new Date(staff.dateOfBirth))],
      [t('fieldAge'), age !== null ? `${age} ${t('ageUnitLabel')}` : undefined],
      [t('fieldPhone'), staff.phone],
    ] as Array<[string, string | undefined]>
  ).filter((row): row is [string, string] => Boolean(row[1]));

  const identificationRows: Array<[string, string]> = (
    [
      [t('fieldCivilId'), staff.civilId],
      [t('fieldCivilIdExpiry'), staff.civilIdExpiry && new Intl.DateTimeFormat(locale).format(new Date(staff.civilIdExpiry))],
      [t('fieldPassportNumber'), staff.passportNumber],
      [t('fieldPassportExpiry'), staff.passportExpiry && new Intl.DateTimeFormat(locale).format(new Date(staff.passportExpiry))],
      [t('fieldResidencyExpiry'), staff.residencyExpiry && new Intl.DateTimeFormat(locale).format(new Date(staff.residencyExpiry))],
    ] as Array<[string, string | undefined]>
  ).filter((row): row is [string, string] => Boolean(row[1]));

  const employmentRows: Array<[string, string]> = (
    [
      [
        t('fieldEmploymentStartDate'),
        staff.employmentStartDate && new Intl.DateTimeFormat(locale).format(new Date(staff.employmentStartDate)),
      ],
      [
        t('fieldMonthlySalary'),
        staff.monthlySalary !== undefined ? `${formatMoneyNumber(staff.monthlySalary, locale)} ${t('kwdUnitLabel')}` : undefined,
      ],
    ] as Array<[string, string | undefined]>
  ).filter((row): row is [string, string] => Boolean(row[1]));

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await staffService.removeStaffMember(staff.id);
      navigate('/staff');
    } catch (err) {
      console.error('Failed to delete staff member', err);
      setDeleteError(t('formSaveError'));
      setDeleting(false);
    }
  };

  const openAddSchedule = () => {
    setEditingSchedule(null);
    scheduleSheet.open();
  };

  const openEditSchedule = (schedule: StaffSalarySchedule) => {
    setEditingSchedule(schedule);
    scheduleSheet.open();
  };

  const openConfirmOccurrence = (occurrence: SalaryOccurrence) => {
    setPaymentContext({ dueDate: occurrence.dueDate, scheduleId: occurrence.scheduleId, defaultAmount: occurrence.amount });
    paymentSheet.open();
  };

  const openEditPayment = (payment: StaffSalaryPayment) => {
    setPaymentContext({
      dueDate: getPaymentDueDate(payment) ?? payment.paidDate,
      scheduleId: payment.salaryScheduleId,
      existing: payment,
    });
    paymentSheet.open();
  };

  return (
    <div className="staff-profile-page">
      <div className="staff-profile-page__topbar">
        <IconButton
          icon={<BackIcon size={22} strokeWidth={1.75} />}
          label={t('backToStaffLabel')}
          onClick={() => navigate('/staff')}
        />
      </div>

      <div className="staff-profile-page__header">
        <Avatar photo={staff.profilePhoto} name={staff.fullName} size="lg" />
        <h1 className="staff-profile-page__name">{staff.fullName}</h1>
        {roleLabel && <p className="staff-profile-page__subtitle">{roleLabel}</p>}
        <StatusBadge variant={STAFF_STATUS_VARIANT[statusLevel]}>{t(STAFF_STATUS_LABEL_KEY[statusLevel])}</StatusBadge>

        {reasons.length > 0 && (
          <ul className="staff-profile-page__reasons">
            {reasons.map((reason, index) => (
              <li key={index} className={`staff-profile-page__reason staff-profile-page__reason--${reason.level}`}>
                {renderReasonText(reason)}
              </li>
            ))}
          </ul>
        )}

        <div className="staff-profile-page__header-actions">
          <SecondaryButton onClick={editSheet.open}>{t('profileEditAction')}</SecondaryButton>
          <SecondaryButton onClick={archiveSheet.open}>{t('archiveAction')}</SecondaryButton>
        </div>
      </div>

      {personalInfoRows.length > 0 && (
        <section className="staff-profile-page__section">
          <h2 className="staff-profile-page__section-title">{t('profileSectionPersonalInfo')}</h2>
          <dl className="staff-profile-page__info-list">
            {personalInfoRows.map(([label, value]) => (
              <div className="staff-profile-page__info-row" key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {identificationRows.length > 0 && (
        <section className="staff-profile-page__section">
          <h2 className="staff-profile-page__section-title">{t('profileSectionIdentification')}</h2>
          <dl className="staff-profile-page__info-list">
            {identificationRows.map(([label, value]) => (
              <div className="staff-profile-page__info-row" key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {employmentRows.length > 0 && (
        <section className="staff-profile-page__section">
          <h2 className="staff-profile-page__section-title">{t('profileSectionEmployment')}</h2>
          <dl className="staff-profile-page__info-list">
            {employmentRows.map(([label, value]) => (
              <div className="staff-profile-page__info-row" key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="staff-profile-page__section">
        <h2 className="staff-profile-page__section-title">{t('profileSectionSalaryPayments')}</h2>
        <SalarySection
          salarySchedules={salarySchedules}
          salaryPayments={salaryPayments}
          onAddSchedule={openAddSchedule}
          onEditSchedule={openEditSchedule}
          onConfirmOccurrence={openConfirmOccurrence}
          onEditPayment={openEditPayment}
          onRefresh={refresh}
        />
      </section>

      <section className="staff-profile-page__section">
        <h2 className="staff-profile-page__section-title">{t('profileSectionDocuments')}</h2>
        <StaffDocumentsSection documents={documents} onAdd={addDocSheet.open} onRefresh={refresh} />
      </section>

      <section className="staff-profile-page__section">
        <h2 className="staff-profile-page__section-title">{t('profileSectionNotes')}</h2>
        <p className="staff-profile-page__notes">{staff.notes || t('profileNotesEmpty')}</p>
      </section>

      <div className="staff-profile-page__danger-zone">
        <DangerButton onClick={deleteSheet.open}>{t('staffDeleteAction')}</DangerButton>
      </div>

      <Sheet
        open={editSheet.isOpen}
        onClose={editSheet.close}
        title={t('staffFormEditTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        <StaffForm
          initialValue={staff}
          onCancel={editSheet.close}
          onSubmit={async (values) => {
            await staffService.updateStaffMember(staff.id, values);
            await refresh();
            editSheet.close();
          }}
        />
      </Sheet>

      <Sheet
        open={addDocSheet.isOpen}
        onClose={addDocSheet.close}
        title={t('documentFormAddTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        <StaffDocumentForm
          onCancel={addDocSheet.close}
          onSubmit={async (values) => {
            await staffService.addStaffDocument(staff.id, values);
            await refresh();
            addDocSheet.close();
          }}
        />
      </Sheet>

      <Sheet
        open={scheduleSheet.isOpen}
        onClose={scheduleSheet.close}
        title={editingSchedule ? t('salaryScheduleFormEditTitle') : t('salaryScheduleFormAddTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        <SalaryScheduleForm
          initialValue={editingSchedule ?? undefined}
          defaultAmount={staff.monthlySalary}
          onCancel={scheduleSheet.close}
          onSubmit={async (values) => {
            if (editingSchedule) {
              await staffService.updateSalarySchedule(editingSchedule.id, values);
            } else {
              await staffService.createSalarySchedule(staff.id, values);
            }
            await refresh();
            scheduleSheet.close();
          }}
        />
      </Sheet>

      {paymentContext && (
        <Sheet
          open={paymentSheet.isOpen}
          onClose={paymentSheet.close}
          title={paymentContext.existing ? t('salaryPaymentFormEditTitle') : t('salaryConfirmPaymentTitle')}
          closeLabel={t('menuCloseLabel')}
        >
          <SalaryPaymentForm
            dueDate={paymentContext.dueDate}
            defaultAmount={paymentContext.defaultAmount}
            initialValue={paymentContext.existing}
            onCancel={paymentSheet.close}
            onSubmit={async (values) => {
              if (paymentContext.existing) {
                await staffService.updateSalaryPayment(paymentContext.existing.id, values);
              } else {
                await staffService.confirmSalaryPayment(staff.id, paymentContext.scheduleId!, paymentContext.dueDate, values);
              }
              await refresh();
              paymentSheet.close();
            }}
          />
        </Sheet>
      )}

      <Sheet
        open={deleteSheet.isOpen}
        onClose={deleteSheet.close}
        title={t('staffDeleteConfirmTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        <p className="staff-profile-page__delete-body">{t('staffDeleteConfirmBody')}</p>
        {deleteError && <p className="staff-profile-page__delete-error">{deleteError}</p>}
        <div className="staff-profile-page__delete-actions">
          <SecondaryButton onClick={deleteSheet.close} disabled={deleting}>
            {t('actionCancel')}
          </SecondaryButton>
          <DangerButton onClick={handleDelete} disabled={deleting}>
            {deleting ? t('formSaving') : t('staffDeleteConfirmAction')}
          </DangerButton>
        </div>
      </Sheet>
      <Sheet
        open={archiveSheet.isOpen}
        onClose={archiveSheet.close}
        title={t('archiveConfirmTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        <p className="staff-profile-page__delete-body">{t('archiveConfirmBody')}</p>
        <div className="staff-profile-page__delete-actions">
          <SecondaryButton onClick={archiveSheet.close} disabled={archiving}>
            {t('actionCancel')}
          </SecondaryButton>
          <PrimaryButton
            onClick={async () => {
              setArchiving(true);
              try {
                await staffService.archiveStaffMember(staff.id);
                navigate('/staff');
              } catch (err) {
                console.error('Failed to archive staff member', err);
                setArchiving(false);
              }
            }}
            disabled={archiving}
          >
            {archiving ? t('formSaving') : t('archiveConfirmAction')}
          </PrimaryButton>
        </div>
      </Sheet>
    </div>
  );
}
