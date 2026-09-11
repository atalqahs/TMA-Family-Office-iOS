import type { Contract } from '../contracts/types';
import type { FamilyMember } from '../family/types';
import type { Property } from '../properties/types';
import type { HouseholdStaff } from '../staff/types';
import type { Vehicle } from '../vehicles/types';
import type { TaskLinkedEntityType } from './types';

/**
 * The small, household-scale entity lists a Task may optionally link to —
 * one list per linkable type. This mirrors the shape of
 * `features/contracts/linkedEntity.ts` but is a deliberately separate,
 * Task-specific module (not a shared import) because Contracts' version
 * doesn't support linking to a Contract itself, and Phase 8 is scoped to
 * not touch Phase 7 modules. See taskService.ts / TASK docs for context.
 */
export interface LinkableEntities {
  family: FamilyMember[];
  property: Property[];
  vehicle: Vehicle[];
  staff: HouseholdStaff[];
  contract: Contract[];
}

export type LinkableEntity = FamilyMember | Property | Vehicle | HouseholdStaff | Contract;

/** Finds the linked entity by (type, id), or `undefined` if it no longer exists — the caller decides how to render that gracefully; this never fabricates a stand-in. */
export function findLinkedEntity(
  entities: LinkableEntities,
  type: TaskLinkedEntityType,
  id: string,
): LinkableEntity | undefined {
  return entities[type].find((entity) => entity.id === id);
}

/** The display label for a linked entity, per its type's own name/title field. */
export function getLinkedEntityLabel(type: TaskLinkedEntityType, entity: LinkableEntity): string {
  switch (type) {
    case 'family':
      return (entity as FamilyMember).fullName;
    case 'property':
      return (entity as Property).name;
    case 'vehicle':
      return (entity as Vehicle).name;
    case 'staff':
      return (entity as HouseholdStaff).fullName;
    case 'contract':
      return (entity as Contract).title;
  }
}
