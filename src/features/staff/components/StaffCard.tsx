import { Avatar } from '../../../components/Avatar';
import { StatusBadge } from '../../../components/StatusBadge';
import { useLanguage } from '../../../hooks/useLanguage';
import { computeStaffStatus, STAFF_STATUS_LABEL_KEY, STAFF_STATUS_VARIANT } from '../staffStatus';
import { STAFF_ROLES } from '../types';
import type { HouseholdStaff, StaffDocument, StaffSalaryPayment, StaffSalarySchedule } from '../types';
import './StaffCard.css';

interface StaffCardProps {
  staff: HouseholdStaff;
  documents: StaffDocument[];
  salarySchedules: StaffSalarySchedule[];
  salaryPayments: StaffSalaryPayment[];
  onClick: () => void;
}

export function StaffCard({ staff, documents, salarySchedules, salaryPayments, onClick }: StaffCardProps) {
  const { t, locale } = useLanguage();

  const roleLabel = staff.role ? STAFF_ROLES.find((option) => option.id === staff.role)?.title[locale] : undefined;
  const { level } = computeStaffStatus(staff, documents, salarySchedules, salaryPayments);

  return (
    <button type="button" className="staff-card" onClick={onClick}>
      <Avatar photo={staff.profilePhoto} name={staff.fullName} size="md" />
      <div className="staff-card__body">
        <span className="staff-card__name">{staff.fullName}</span>
        <span className="staff-card__meta">{[roleLabel, staff.nationality].filter(Boolean).join(' · ')}</span>
        <StatusBadge variant={STAFF_STATUS_VARIANT[level]}>{t(STAFF_STATUS_LABEL_KEY[level])}</StatusBadge>
      </div>
    </button>
  );
}
