import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { Sheet } from '../components/Sheet';
import { CATEGORIES } from '../features/categories/categories';
import { StaffCard } from '../features/staff/components/StaffCard';
import { StaffForm } from '../features/staff/components/StaffForm';
import * as staffService from '../features/staff/staffService';
import { useStaffList } from '../features/staff/hooks/useStaffList';
import { useDisclosure } from '../hooks/useDisclosure';
import { useLanguage } from '../hooks/useLanguage';
import { useLocalizedText } from '../hooks/useLocalizedText';
import './StaffPage.css';

const STAFF_CATEGORY = CATEGORIES.find((category) => category.id === 'staff')!;

export function StaffPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { staff, schedulesByStaff, paymentsByStaff, documentsByStaff, loading, error, refresh } = useStaffList();
  const addSheet = useDisclosure();

  const title = useLocalizedText(STAFF_CATEGORY.title);
  const subtitle = useLocalizedText(STAFF_CATEGORY.subtitle);
  const emptyMessage = useLocalizedText(STAFF_CATEGORY.emptyMessage);
  const addLabel = useLocalizedText(STAFF_CATEGORY.addLabel);
  const Icon = STAFF_CATEGORY.icon;

  return (
    <div className="staff-page">
      <PageHeader icon={<Icon size={22} strokeWidth={1.75} />} title={title} subtitle={subtitle} />

      {loading && <p className="staff-page__status">{t('loadingLabel')}</p>}

      {!loading && error && <p className="staff-page__status">{t('formSaveError')}</p>}

      {!loading && !error && staff.length === 0 && (
        <EmptyState title={emptyMessage} action={<PrimaryButton onClick={addSheet.open}>{addLabel}</PrimaryButton>} />
      )}

      {!loading && !error && staff.length > 0 && (
        <>
          <div className="staff-page__grid">
            {staff.map((member) => (
              <StaffCard
                key={member.id}
                staff={member}
                documents={documentsByStaff[member.id] ?? []}
                salarySchedules={schedulesByStaff[member.id] ?? []}
                salaryPayments={paymentsByStaff[member.id] ?? []}
                onClick={() => navigate(`/staff/${member.id}`)}
              />
            ))}
          </div>
          <div className="staff-page__add-action">
            <PrimaryButton onClick={addSheet.open}>{addLabel}</PrimaryButton>
          </div>
        </>
      )}

      <Sheet
        open={addSheet.isOpen}
        onClose={addSheet.close}
        title={t('staffFormAddTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        <StaffForm
          onCancel={addSheet.close}
          onSubmit={async (values) => {
            await staffService.createStaffMember(values);
            await refresh();
            addSheet.close();
          }}
        />
      </Sheet>
    </div>
  );
}
