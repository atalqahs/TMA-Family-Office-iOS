import { generateId } from '../../utils/id';
import * as propertyRepository from './propertyRepository';
import type { Property, PropertyDocument, PropertyDocumentFormValues, PropertyFormValues } from './types';

export async function createProperty(values: PropertyFormValues): Promise<Property> {
  const now = new Date().toISOString();
  const property: Property = {
    id: generateId(),
    ...values,
    createdAt: now,
    updatedAt: now,
  };
  await propertyRepository.saveProperty(property);
  return property;
}

export async function updateProperty(id: string, values: PropertyFormValues): Promise<Property> {
  const existing = await propertyRepository.getProperty(id);
  if (!existing) {
    throw new Error(`Property ${id} not found`);
  }
  const updated: Property = {
    ...existing,
    ...values,
    updatedAt: new Date().toISOString(),
  };
  await propertyRepository.saveProperty(updated);
  return updated;
}

/** Direct, permanent delete of the property and all of its documents (see propertyRepository for the transactional cascade). */
export async function removeProperty(id: string): Promise<void> {
  await propertyRepository.deletePropertyWithDocuments(id);
}

export async function addPropertyDocument(
  propertyId: string,
  values: PropertyDocumentFormValues,
): Promise<PropertyDocument> {
  const now = new Date().toISOString();
  const document: PropertyDocument = {
    id: generateId(),
    propertyId,
    type: values.type,
    title: values.title,
    file: values.file,
    fileName: values.file.name,
    mimeType: values.file.type || 'application/octet-stream',
    fileSize: values.file.size,
    expiryDate: values.expiryDate,
    createdAt: now,
    updatedAt: now,
  };
  await propertyRepository.savePropertyDocument(document);
  return document;
}

export async function removePropertyDocument(id: string): Promise<void> {
  await propertyRepository.deletePropertyDocument(id);
}
