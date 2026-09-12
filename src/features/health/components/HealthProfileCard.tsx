import { Avatar } from '../../../components/Avatar';
import { useLanguage } from '../../../hooks/useLanguage';
import { calculateAge } from '../../../utils/age';
import type { FamilyMember } from '../../family/types';
import { HEALTH_STATUSES } from '../types';
import type { HealthProfile } from '../types';
import './HealthProfileCard.css';

interface HealthProfileCardProps {
  profile: HealthProfile;
  familyMember: FamilyMember | undefined;
  onClick: () => void;
}

/** Concise by design (Phase 11 Part 3.E): Family Member photo/name/age plus Health Status only -- never every Health field. */
export function HealthProfileCard({ profile, familyMember, onClick }: HealthProfileCardProps) {
  const { t, locale } = useLanguage();
  const age = calculateAge(familyMember?.dateOfBirth);
  const statusLabel = HEALTH_STATUSES.find((status) => status.id === profile.healthStatus)?.title[locale];

  return (
    <button type="button" className="health-profile-card" onClick={onClick}>
      <Avatar photo={familyMember?.profilePhoto} name={familyMember?.fullName ?? ''} size="md" />
      <span className="health-profile-card__text">
        <span className="health-profile-card__name">{familyMember?.fullName ?? t('fieldNotProvided')}</span>
        <span className="health-profile-card__meta">
          {age !== null && `${age} ${t('ageUnitLabel')} · `}
          {statusLabel}
        </span>
      </span>
    </button>
  );
}
