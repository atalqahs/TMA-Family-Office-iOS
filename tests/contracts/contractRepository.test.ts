import { describe, expect, it } from 'vitest';
import * as contractRepository from '../../src/features/contracts/contractRepository';
import { createContract, removeContract, updateContract } from '../../src/features/contracts/contractService';
import { findLinkedEntity } from '../../src/features/contracts/linkedEntity';
import * as vehicleRepository from '../../src/features/vehicles/vehicleRepository';
import type { ContractDocument } from '../../src/features/contracts/types';

describe('document cascade delete', () => {
  it('deleting a contract removes every document that belongs to it', async () => {
    const contract = await createContract({
      title: 'Villa Rental',
      contractType: 'rental',
      partyName: 'ACME Properties',
      startDate: '2026-01-01',
    });
    const doc: ContractDocument = {
      id: 'd1',
      contractId: contract.id,
      type: 'signedContract',
      title: 'Signed Contract',
      file: new Blob(['x']),
      fileName: 'contract.pdf',
      mimeType: 'application/pdf',
      fileSize: 1,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    await contractRepository.saveContractDocument(doc);

    await removeContract(contract.id);

    expect(await contractRepository.getContract(contract.id)).toBeUndefined();
    expect(await contractRepository.listDocumentsForContract(contract.id)).toEqual([]);
  });
});

describe('contract delete never touches the linked entity', () => {
  it('deleting a contract linked to a vehicle leaves the vehicle fully intact', async () => {
    await vehicleRepository.saveVehicle({
      id: 'v1',
      name: 'Family SUV',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const contract = await createContract({
      title: 'Vehicle Insurance',
      contractType: 'insurance',
      partyName: 'Gulf Insurance',
      startDate: '2026-01-01',
      linkedEntityType: 'vehicle',
      linkedEntityId: 'v1',
    });

    await removeContract(contract.id);

    expect(await vehicleRepository.getVehicle('v1')).toBeDefined();
  });
});

describe('linked-entity fields persist across edits', () => {
  it('linkedEntityType/linkedEntityId survive an unrelated field update', async () => {
    const contract = await createContract({
      title: 'Vehicle Insurance',
      contractType: 'insurance',
      partyName: 'Gulf Insurance',
      startDate: '2026-01-01',
      linkedEntityType: 'vehicle',
      linkedEntityId: 'v1',
    });
    const updated = await updateContract(contract.id, { ...contract, amount: 500 });
    expect(updated.linkedEntityType).toBe('vehicle');
    expect(updated.linkedEntityId).toBe('v1');
    expect(updated.amount).toBe(500);
  });
});

describe('malformed-linked-relationship characterization (tech debt — see Phase 9A Section K/H report)', () => {
  it('CURRENT BEHAVIOR: a Contract can be saved referencing a linkedEntityId that does not exist — neither validation.ts nor contractService verify existence', async () => {
    const contract = await createContract({
      title: 'Ghost Link',
      contractType: 'vehicle',
      partyName: 'Nobody',
      startDate: '2026-01-01',
      linkedEntityType: 'vehicle',
      linkedEntityId: 'does-not-exist',
    });
    expect(contract.linkedEntityId).toBe('does-not-exist');
    const stored = await contractRepository.getContract(contract.id);
    expect(stored?.linkedEntityId).toBe('does-not-exist');
  });

  it('CURRENT BEHAVIOR: a deleted linked entity is handled gracefully by findLinkedEntity (returns undefined, never throws/fabricates)', async () => {
    await vehicleRepository.saveVehicle({
      id: 'v1',
      name: 'Family SUV',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    const contract = await createContract({
      title: 'Vehicle Insurance',
      contractType: 'insurance',
      partyName: 'Gulf Insurance',
      startDate: '2026-01-01',
      linkedEntityType: 'vehicle',
      linkedEntityId: 'v1',
    });
    await vehicleRepository.deleteVehicleWithChildren('v1');

    const stillReadable = await contractRepository.getContract(contract.id);
    expect(stillReadable).toBeDefined(); // the Contract itself is never deleted/corrupted
    expect(
      findLinkedEntity({ property: [], vehicle: [], staff: [], family: [] }, 'vehicle', 'v1'),
    ).toBeUndefined();
  });
});
