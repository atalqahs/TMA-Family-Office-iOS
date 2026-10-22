import { Avatar } from '../../../components/Avatar';
import { StatusBadge } from '../../../components/StatusBadge';
import { useLanguage } from '../../../hooks/useLanguage';
import { calculateAge } from '../../../utils/age';
import { summarizeStatusReasons } from '../../../utils/statusReasons';
import { computeFamilyStatus, FAMILY_STATUS_LABEL_KEY, FAMILY_STATUS_VARIANT } from '../familyStatus';
import type { FamilyMember } from '../types';
import './FamilyMemberCard.css';

interface FamilyMemberCardProps {
  member: FamilyMember;
  onClick: () => void;
}

export function FamilyMemberCard({ member, onClick }: FamilyMemberCardProps) {
  const { t, locale } = useLanguage();
  const age = calculateAge(member.dateOfBirth);
  const { level, reasons } = computeFamilyStatus(member);
  const reasonsSummary = summarizeStatusReasons(reasons, t, locale);

  return (
    <button type="button" className="family-member-card" onClick={onClick}>
      <Avatar photo={member.profilePhoto} name={member.fullName} size="md" />
      <span className="family-member-card__text">
        <span className="family-member-card__name">{member.fullName}</span>
        <span className="family-member-card__meta">
          {member.relationship || t('fieldNotProvided')}
          {age !== null && ` · ${age} ${t('ageUnitLabel')}`}
        </span>
        {reasons.length > 0 && (
          <span className="family-member-card__status">
            <StatusBadge variant={FAMILY_STATUS_VARIANT[level]}>{t(FAMILY_STATUS_LABEL_KEY[level])}</StatusBadge>
            {reasonsSummary && (
              <span className={`family-member-card__status-reason family-member-card__status-reason--${level}`}>
                {reasonsSummary}
              </span>
            )}
          </span>
        )}
      </span>
    </button>
  );
}
