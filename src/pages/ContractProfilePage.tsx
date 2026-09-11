import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { ArchivedNotice } from '../components/ArchivedNotice';
import { DangerButton } from '../components/DangerButton';
import { EmptyState } from '../components/EmptyState';
import { IconButton } from '../components/IconButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { SecondaryButton } from '../components/SecondaryButton';
import { StatusBadge } from '../components/StatusBadge';
import { Sheet } from '../components/Sheet';
import { ContractDocumentForm } from '../features/contracts/components/ContractDocumentForm';
import { ContractDocumentsSection } from '../features/contracts/components/ContractDocumentsSection';
import { ContractForm } from '../features/contracts/components/ContractForm';
import * as contractService from '../features/contracts/contractService';
import { useContract } from '../features/contracts/hooks/useContract';
import { useLinkableEntities } from '../features/contracts/hooks/useLinkableEntities';
import { computeContractStatus, CONTRACT_STATUS_LABEL_KEY, CONTRACT_STATUS_VARIANT } from '../features/contracts/contractStatus';
import { findLinkedEntity, getLinkedEntityLabel } from '../features/contracts/linkedEntity';
import { CONTRACT_LINKED_ENTITY_TYPES, CONTRACT_TYPES } from '../features/contracts/types';
import { useDisclosure } from '../hooks/useDisclosure';
import { useLanguage } from '../hooks/useLanguage';
import { formatMoneyNumber } from '../utils/money';
import './ContractProfilePage.css';

export function ContractProfilePage() {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const { t, locale, dir } = useLanguage();
  const { contract, documents, loading, refresh } = useContract(contractId);
  const { entities: linkableEntities, loading: linkableEntitiesLoading } = useLinkableEntities();
  const editSheet = useDisclosure();
  const addDocSheet = useDisclosure();
  const deleteSheet = useDisclosure();
  const archiveSheet = useDisclosure();
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  const BackIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;

  if (loading) {
    return <p className="contract-profile-page__status">{t('loadingLabel')}</p>;
  }

  if (!contract) {
    return (
      <div className="contract-profile-page">
        <EmptyState
          title={t('contractNotFoundTitle')}
          action={<PrimaryButton onClick={() => navigate('/contracts')}>{t('backToContractsLabel')}</PrimaryButton>}
        />
      </div>
    );
  }

  // Hard Phase 10 rule: an archived card is never opened for viewing/
  // editing directly -- Unarchive is the only way back to the full profile.
  if (contract.archivedAt) {
    return (
      <div className="contract-profile-page">
        <div className="contract-profile-page__topbar">
          <IconButton
            icon={<BackIcon size={22} strokeWidth={1.75} />}
            label={t('backToContractsLabel')}
            onClick={() => navigate('/contracts')}
          />
        </div>
        <ArchivedNotice
          onUnarchive={async () => {
            await contractService.unarchiveContract(contract.id);
            await refresh();
          }}
        />
      </div>
    );
  }

  const status = computeContractStatus(contract);
  const typeLabel = CONTRACT_TYPES.find((option) => option.id === contract.contractType)?.title[locale];

  const linkedEntity =
    contract.linkedEntityType && contract.linkedEntityId
      ? findLinkedEntity(linkableEntities, contract.linkedEntityType, contract.linkedEntityId)
      : undefined;
  const linkedTypeLabel = contract.linkedEntityType
    ? CONTRACT_LINKED_ENTITY_TYPES.find((option) => option.id === contract.linkedEntityType)?.title[locale]
    : undefined;

  // Only rows that actually have a value are shown — an empty optional
  // field is simply omitted rather than displayed as a "-" placeholder row.
  const contractInfoRows: Array<[string, string]> = (
    [
      [t('fieldContractType'), typeLabel],
      [t('fieldContractNumber'), contract.contractNumber],
      [t('fieldPartyName'), contract.partyName],
      [t('fieldStartDate'), new Intl.DateTimeFormat(locale).format(new Date(contract.startDate))],
      [t('fieldEndDate'), contract.endDate && new Intl.DateTimeFormat(locale).format(new Date(contract.endDate))],
      [
        t('fieldAmount'),
        contract.amount !== undefined
          ? `${formatMoneyNumber(contract.amount, locale)}${contract.currency ? ` ${contract.currency}` : ''}`
          : undefined,
      ],
    ] as Array<[string, string | undefined]>
  ).filter((row): row is [string, string] => Boolean(row[1]));

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await contractService.removeContract(contract.id);
      navigate('/contracts');
    } catch (err) {
      console.error('Failed to delete contract', err);
      setDeleteError(t('formSaveError'));
      setDeleting(false);
    }
  };

  return (
    <div className="contract-profile-page">
      <div className="contract-profile-page__topbar">
        <IconButton
          icon={<BackIcon size={22} strokeWidth={1.75} />}
          label={t('backToContractsLabel')}
          onClick={() => navigate('/contracts')}
        />
      </div>

      <div className="contract-profile-page__header">
        <span className="contract-profile-page__icon" aria-hidden="true">
          <FileText size={28} strokeWidth={1.75} />
        </span>
        <h1 className="contract-profile-page__title">{contract.title}</h1>
        <StatusBadge variant={CONTRACT_STATUS_VARIANT[status]}>{t(CONTRACT_STATUS_LABEL_KEY[status])}</StatusBadge>
        <div className="contract-profile-page__header-actions">
          <SecondaryButton onClick={editSheet.open}>{t('profileEditAction')}</SecondaryButton>
          <SecondaryButton onClick={archiveSheet.open}>{t('archiveAction')}</SecondaryButton>
        </div>
      </div>

      {contractInfoRows.length > 0 && (
        <section className="contract-profile-page__section">
          <h2 className="contract-profile-page__section-title">{t('profileSectionContractInfo')}</h2>
          <dl className="contract-profile-page__info-list">
            {contractInfoRows.map(([label, value]) => (
              <div className="contract-profile-page__info-row" key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {contract.linkedEntityType && (
        <section className="contract-profile-page__section">
          <h2 className="contract-profile-page__section-title">{t('fieldLinkedTo')}</h2>
          {linkableEntitiesLoading ? (
            <p className="contract-profile-page__linked-loading">{t('loadingLabel')}</p>
          ) : linkedEntity ? (
            <p className="contract-profile-page__linked-entity">
              {linkedTypeLabel}: {getLinkedEntityLabel(contract.linkedEntityType, linkedEntity)}
            </p>
          ) : (
            // The linked entity was deleted on its own side (e.g. the
            // Vehicle/Property/Staff/Family record itself was removed) --
            // the Contract stays fully readable and is NEVER auto-deleted
            // or given fabricated stand-in data; this is the only
            // acknowledgment shown.
            <p className="contract-profile-page__linked-entity-missing">{t('linkedEntityUnavailableLabel')}</p>
          )}
        </section>
      )}

      <section className="contract-profile-page__section">
        <h2 className="contract-profile-page__section-title">{t('profileSectionDocuments')}</h2>
        <ContractDocumentsSection documents={documents} onAdd={addDocSheet.open} onRefresh={refresh} />
      </section>

      <section className="contract-profile-page__section">
        <h2 className="contract-profile-page__section-title">{t('profileSectionNotes')}</h2>
        <p className="contract-profile-page__notes">{contract.notes || t('profileNotesEmpty')}</p>
      </section>

      <div className="contract-profile-page__danger-zone">
        <DangerButton onClick={deleteSheet.open}>{t('contractDeleteAction')}</DangerButton>
      </div>

      <Sheet
        open={editSheet.isOpen}
        onClose={editSheet.close}
        title={t('contractFormEditTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        <ContractForm
          initialValue={contract}
          onCancel={editSheet.close}
          onSubmit={async (values) => {
            await contractService.updateContract(contract.id, values);
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
        <ContractDocumentForm
          onCancel={addDocSheet.close}
          onSubmit={async (values) => {
            await contractService.addContractDocument(contract.id, values);
            await refresh();
            addDocSheet.close();
          }}
        />
      </Sheet>

      <Sheet
        open={deleteSheet.isOpen}
        onClose={deleteSheet.close}
        title={t('contractDeleteConfirmTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        <p className="contract-profile-page__delete-body">{t('contractDeleteConfirmBody')}</p>
        {deleteError && <p className="contract-profile-page__delete-error">{deleteError}</p>}
        <div className="contract-profile-page__delete-actions">
          <SecondaryButton onClick={deleteSheet.close} disabled={deleting}>
            {t('actionCancel')}
          </SecondaryButton>
          <DangerButton onClick={handleDelete} disabled={deleting}>
            {deleting ? t('formSaving') : t('contractDeleteConfirmAction')}
          </DangerButton>
        </div>
      </Sheet>
      <Sheet
        open={archiveSheet.isOpen}
        onClose={archiveSheet.close}
        title={t('archiveConfirmTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        <p className="contract-profile-page__delete-body">{t('archiveConfirmBody')}</p>
        <div className="contract-profile-page__delete-actions">
          <SecondaryButton onClick={archiveSheet.close} disabled={archiving}>
            {t('actionCancel')}
          </SecondaryButton>
          <PrimaryButton
            onClick={async () => {
              setArchiving(true);
              try {
                await contractService.archiveContract(contract.id);
                navigate('/contracts');
              } catch (err) {
                console.error('Failed to archive contract', err);
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
