import { Avatar } from '../../../components/Avatar';
import { useLanguage } from '../../../hooks/useLanguage';
import { calculateAge } from '../../../utils/age';
import type { FamilyMember } from '../types';
import './FamilyMemberCard.css';

interface FamilyMemberCardProps {
  member: FamilyMember;
  onClick: () => void;
}

export function FamilyMemberCard({ member, onClick }: FamilyMemberCardProps) {
  const { t } = useLanguage();
  const age = calculateAge(member.dateOfBirth);

  return (
    <button type="button" className="family-member-card" onClick={onClick}>
      <Avatar photo={member.profilePhoto} name={member.fullName} size="md" />
      <span className="family-member-card__text">
        <span className="family-member-card__name">{member.fullName}</span>
        <span className="family-member-card__meta">
          {member.relationship || t('fieldNotProvided')}
          {age !== null && ` · ${age} ${t('ageUnitLabel')}`}
        </span>
      </span>
    </button>
  );
}
