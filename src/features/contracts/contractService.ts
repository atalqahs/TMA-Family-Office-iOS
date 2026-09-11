import { generateId } from '../../utils/id';
import * as contractRepository from './contractRepository';
import type { Contract, ContractDocument, ContractDocumentFormValues, ContractFormValues } from './types';

export async function createContract(values: ContractFormValues): Promise<Contract> {
  const now = new Date().toISOString();
  const contract: Contract = {
    id: generateId(),
    ...values,
    createdAt: now,
    updatedAt: now,
  };
  await contractRepository.saveContract(contract);
  return contract;
}

export async function updateContract(id: string, values: ContractFormValues): Promise<Contract> {
  const existing = await contractRepository.getContract(id);
  if (!existing) {
    throw new Error(`Contract ${id} not found`);
  }
  const updated: Contract = {
    ...existing,
    ...values,
    updatedAt: new Date().toISOString(),
  };
  await contractRepository.saveContract(updated);
  return updated;
}

/** Direct, permanent delete of the contract and all of its documents (see contractRepository for the transactional cascade). Never touches the linked entity, if any. */
export async function removeContract(id: string): Promise<void> {
  await contractRepository.deleteContractWithChildren(id);
}

/** Archives the contract (Phase 10): a display/organization change only -- see features/archive/. */
export async function archiveContract(id: string): Promise<void> {
  await contractRepository.archiveContract(id);
}

export async function unarchiveContract(id: string): Promise<void> {
  await contractRepository.unarchiveContract(id);
}

/** "Delete Card" from within Archive: a forward-compatible soft-delete for the later Trash phase -- distinct from `removeContract`'s existing hard cascade delete, which is unrelated and untouched. */
export async function deleteContractCard(id: string): Promise<void> {
  await contractRepository.softDeleteContract(id);
}

export async function addContractDocument(
  contractId: string,
  values: ContractDocumentFormValues,
): Promise<ContractDocument> {
  const now = new Date().toISOString();
  const document: ContractDocument = {
    id: generateId(),
    contractId,
    type: values.type,
    title: values.title,
    file: values.file,
    fileName: values.file.name,
    mimeType: values.file.type || 'application/octet-stream',
    fileSize: values.file.size,
    createdAt: now,
    updatedAt: now,
  };
  await contractRepository.saveContractDocument(document);
  return document;
}

export async function removeContractDocument(id: string): Promise<void> {
  await contractRepository.deleteContractDocument(id);
}
