import { FileText } from 'lucide-react';
import { StatusBadge } from '../../../components/StatusBadge';
import { useLanguage } from '../../../hooks/useLanguage';
import { findLinkedEntity, getLinkedEntityLabel, type LinkableEntities } from '../linkedEntity';
import { computeContractStatus, CONTRACT_STATUS_LABEL_KEY, CONTRACT_STATUS_VARIANT } from '../contractStatus';
import { CONTRACT_TYPES } from '../types';
import type { Contract } from '../types';
import './ContractCard.css';

interface ContractCardProps {
  contract: Contract;
  linkableEntities: LinkableEntities;
  onClick: () => void;
}

export function ContractCard({ contract, linkableEntities, onClick }: ContractCardProps) {
  const { t, locale } = useLanguage();

  const typeLabel = CONTRACT_TYPES.find((option) => option.id === contract.contractType)?.title[locale];
  const status = computeContractStatus(contract);

  const linkedEntity =
    contract.linkedEntityType && contract.linkedEntityId
      ? findLinkedEntity(linkableEntities, contract.linkedEntityType, contract.linkedEntityId)
      : undefined;
  const linkedLabel =
    contract.linkedEntityType && linkedEntity
      ? getLinkedEntityLabel(contract.linkedEntityType, linkedEntity)
      : undefined;

  const metaParts = [contract.partyName, typeLabel].filter(Boolean).join(' · ');

  return (
    <button type="button" className="contract-card" onClick={onClick}>
      <span className="contract-card__icon" aria-hidden="true">
        <FileText size={20} strokeWidth={1.75} />
      </span>
      <div className="contract-card__body">
        <span className="contract-card__title">{contract.title}</span>
        {metaParts && <span className="contract-card__meta">{metaParts}</span>}
        {contract.endDate && (
          <span className="contract-card__meta">
            {t('fieldEndDate')}: {new Intl.DateTimeFormat(locale).format(new Date(contract.endDate))}
          </span>
        )}
        {linkedLabel && <span className="contract-card__meta">{t('fieldLinkedTo')}: {linkedLabel}</span>}
        <StatusBadge variant={CONTRACT_STATUS_VARIANT[status]}>{t(CONTRACT_STATUS_LABEL_KEY[status])}</StatusBadge>
      </div>
    </button>
  );
}
