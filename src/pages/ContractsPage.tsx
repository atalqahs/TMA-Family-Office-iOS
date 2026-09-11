import { useNavigate } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { PageHeader } from '../components/PageHeader';
import { PrimaryButton } from '../components/PrimaryButton';
import { Sheet } from '../components/Sheet';
import { CATEGORIES } from '../features/categories/categories';
import { ContractCard } from '../features/contracts/components/ContractCard';
import { ContractForm } from '../features/contracts/components/ContractForm';
import * as contractService from '../features/contracts/contractService';
import { useContracts } from '../features/contracts/hooks/useContracts';
import { useLinkableEntities } from '../features/contracts/hooks/useLinkableEntities';
import { useDisclosure } from '../hooks/useDisclosure';
import { useLanguage } from '../hooks/useLanguage';
import { useLocalizedText } from '../hooks/useLocalizedText';
import './ContractsPage.css';

const CONTRACTS_CATEGORY = CATEGORIES.find((category) => category.id === 'contracts')!;

export function ContractsPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { contracts, loading, error, refresh } = useContracts();
  const { entities: linkableEntities } = useLinkableEntities();
  const addSheet = useDisclosure();

  const title = useLocalizedText(CONTRACTS_CATEGORY.title);
  const subtitle = useLocalizedText(CONTRACTS_CATEGORY.subtitle);
  const emptyMessage = useLocalizedText(CONTRACTS_CATEGORY.emptyMessage);
  const addLabel = useLocalizedText(CONTRACTS_CATEGORY.addLabel);
  const Icon = CONTRACTS_CATEGORY.icon;

  return (
    <div className="contracts-page">
      <PageHeader icon={<Icon size={22} strokeWidth={1.75} />} title={title} subtitle={subtitle} />

      {loading && <p className="contracts-page__status">{t('loadingLabel')}</p>}

      {!loading && error && <p className="contracts-page__status">{t('formSaveError')}</p>}

      {!loading && !error && contracts.length === 0 && (
        <EmptyState title={emptyMessage} action={<PrimaryButton onClick={addSheet.open}>{addLabel}</PrimaryButton>} />
      )}

      {!loading && !error && contracts.length > 0 && (
        <>
          <div className="contracts-page__grid">
            {contracts.map((contract) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                linkableEntities={linkableEntities}
                onClick={() => navigate(`/contracts/${contract.id}`)}
              />
            ))}
          </div>
          <div className="contracts-page__add-action">
            <PrimaryButton onClick={addSheet.open}>{addLabel}</PrimaryButton>
          </div>
        </>
      )}

      <Sheet
        open={addSheet.isOpen}
        onClose={addSheet.close}
        title={t('contractFormAddTitle')}
        closeLabel={t('menuCloseLabel')}
      >
        <ContractForm
          onCancel={addSheet.close}
          onSubmit={async (values) => {
            await contractService.createContract(values);
            await refresh();
            addSheet.close();
          }}
        />
      </Sheet>
    </div>
  );
}
