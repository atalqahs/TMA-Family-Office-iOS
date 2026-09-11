import type { FamilyMember } from '../family/types';
import type { Property } from '../properties/types';
import type { HouseholdStaff } from '../staff/types';
import type { Vehicle } from '../vehicles/types';
import type { ContractLinkedEntityType } from './types';

/** The small, household-scale entity lists a Contract may optionally link to — one list per linkable type. */
export interface LinkableEntities {
  property: Property[];
  vehicle: Vehicle[];
  staff: HouseholdStaff[];
  family: FamilyMember[];
}

export type LinkableEntity = Property | Vehicle | HouseholdStaff | FamilyMember;

/** Finds the linked entity by (type, id), or `undefined` if it no longer exists — the caller decides how to render that gracefully; this never fabricates a stand-in. */
export function findLinkedEntity(
  entities: LinkableEntities,
  type: ContractLinkedEntityType,
  id: string,
): LinkableEntity | undefined {
  return entities[type].find((entity) => entity.id === id);
}

/** The display label for a linked entity, per its type's own name/title field. */
export function getLinkedEntityLabel(type: ContractLinkedEntityType, entity: LinkableEntity): string {
  switch (type) {
    case 'property':
      return (entity as Property).name;
    case 'vehicle':
      return (entity as Vehicle).name;
    case 'staff':
      return (entity as HouseholdStaff).fullName;
    case 'family':
      return (entity as FamilyMember).fullName;
  }
}
