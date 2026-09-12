import { getDB } from '../../storage/db';
import type { Property, PropertyDocument } from './types';

/**
 * All IndexedDB access for the Properties module goes through this file.
 * Presentation components and pages never call `getDB()`/idb directly —
 * they go through this repository (or `propertyService.ts`, which builds
 * on it) instead.
 */

/** Every property, ARCHIVED ONES INCLUDED -- the read path for Notifications/Archive, which must see archived records too (see features/archive/, features/notifications/). */
export async function listProperties(): Promise<Property[]> {
  const db = await getDB();
  const all = await db.getAll('properties');
  return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Non-archived -- the normal active Properties list. Centralized here so no component ever filters `archivedAt` itself. */
export async function listActiveProperties(): Promise<Property[]> {
  const all = await listProperties();
  return all.filter((property) => !property.archivedAt);
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
 * Direct, permanent delete. Deletes the property and every document that
 * belongs to it in a single IndexedDB transaction spanning both stores, so
 * the operation either fully commits or fully rolls back — never leaving
 * orphaned PropertyDocument records.
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

export async function getActivePropertyCount(): Promise<number> {
  const all = await listActiveProperties();
  return all.length;
}

/** Sets `archivedAt` -- a display/organization change only, never touching any other field. */
export async function archiveProperty(id: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get('properties', id);
  if (!existing) return;
  await db.put('properties', { ...existing, archivedAt: new Date().toISOString() });
}

/** Clears `archivedAt`, returning the property to the active list exactly as it was -- never recreates/copies the record. */
export async function unarchiveProperty(id: string): Promise<void> {
  const db = await getDB();
  const existing = await db.get('properties', id);
  if (!existing) return;
  const { archivedAt: _archivedAt, ...rest } = existing;
  await db.put('properties', rest);
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
