import { Avatar } from '../../../components/Avatar';
import { useLanguage } from '../../../hooks/useLanguage';
import type { FamilyMember } from '../../family/types';
import type { EducationProfile } from '../types';
import './EducationProfileCard.css';

interface EducationProfileCardProps {
  profile: EducationProfile;
  familyMember: FamilyMember | undefined;
  onClick: () => void;
}

/** Concise by design (Phase 11 Part 4.E): Family Member photo/name plus education stage/institution only -- never every Education field. */
export function EducationProfileCard({ profile, familyMember, onClick }: EducationProfileCardProps) {
  const { t } = useLanguage();

  return (
    <button type="button" className="education-profile-card" onClick={onClick}>
      <Avatar photo={familyMember?.profilePhoto} name={familyMember?.fullName ?? ''} size="md" />
      <span className="education-profile-card__text">
        <span className="education-profile-card__name">{familyMember?.fullName ?? t('fieldNotProvided')}</span>
        <span className="education-profile-card__meta">
          {profile.educationStage}
          {profile.institution && ` · ${profile.institution}`}
        </span>
      </span>
    </button>
  );
}
