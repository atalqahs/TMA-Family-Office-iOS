import { getDB } from '../../storage/db';
import type { Property, PropertyDocument } from './types';

/**
 * All IndexedDB access for the Properties module goes through this file.
 * Presentation components and pages never call `getDB()`/idb directly —
 * they go through this repository (or `propertyService.ts`, which builds
 * on it) instead.
 */

export async function listProperties(): Promise<Property[]> {
  const db = await getDB();
  const all = await db.getAll('properties');
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function getProperty(id: string): Promise<Property | undefined> {
  const db = await getDB();
  return db.get('properties', id);
}

export async function saveProperty(property: Property): Promise<void> {
  const db = await getDB();
  await db.put('properties', property);
}

/**
 * Direct, permanent delete (acceptable for this experimental prototype —
 * Properties has no Trash requirement, unlike Family). Deletes the
 * property and every document that belongs to it in a single IndexedDB
 * transaction spanning both stores, so the operation either fully commits
 * or fully rolls back — never leaving orphaned PropertyDocument records.
 */
export async function deletePropertyWithDocuments(id: string): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['properties', 'propertyDocuments'], 'readwrite');
  const documentsStore = tx.objectStore('propertyDocuments');
  const documentIds = await documentsStore.index('propertyId').getAllKeys(id);

  await Promise.all([
    tx.objectStore('properties').delete(id),
    ...documentIds.map((documentId) => documentsStore.delete(documentId)),
  ]);
  await tx.done;
}

export async function getPropertyCount(): Promise<number> {
  const db = await getDB();
  return db.count('properties');
}

export async function listDocumentsForProperty(propertyId: string): Promise<PropertyDocument[]> {
  const db = await getDB();
  const docs = await db.getAllFromIndex('propertyDocuments', 'propertyId', propertyId);
  return docs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export async function savePropertyDocument(document: PropertyDocument): Promise<void> {
  const db = await getDB();
  await db.put('propertyDocuments', document);
}

export async function deletePropertyDocument(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('propertyDocuments', id);
}
