import { listStaff } from '../../staff/staffRepository';
import type { ArchivedCardItem } from '../types';

/** Reuses `listStaff` (non-deleted, archived included) -- never re-queries IndexedDB itself. */
export async function loadArchivedStaff(): Promise<ArchivedCardItem[]> {
  const all = await listStaff();
  return all
    .filter((staff) => staff.archivedAt !== undefined)
    .map((staff) => ({
      id: staff.id,
      sourceType: 'staff' as const,
      title: staff.fullName,
      archivedAt: staff.archivedAt as string,
      route: `/staff/${staff.id}`,
    }));
}
