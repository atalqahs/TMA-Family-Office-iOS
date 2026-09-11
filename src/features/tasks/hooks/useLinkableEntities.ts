import { useEffect, useState } from 'react';
import { listContracts } from '../../contracts/contractRepository';
import { listActiveFamilyMembers } from '../../family/familyRepository';
import { listProperties } from '../../properties/propertyRepository';
import { listStaff } from '../../staff/staffRepository';
import { listVehicles } from '../../vehicles/vehicleRepository';
import type { LinkableEntities } from '../linkedEntity';

const EMPTY: LinkableEntities = { family: [], property: [], vehicle: [], staff: [], contract: [] };

/**
 * The small set of existing entities a Task may optionally link to —
 * loaded once for the "Linked To" picker (TaskForm) and for resolving a
 * task's linked-entity display name (TaskProfilePage). Every list here is
 * already the household-scale dataset the rest of this prototype assumes,
 * so loading all five up front is simpler and more consistent than five
 * separate fetches keyed to whichever type happens to be selected.
 */
export function useLinkableEntities() {
  const [entities, setEntities] = useState<LinkableEntities>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([listActiveFamilyMembers(), listProperties(), listVehicles(), listStaff(), listContracts()])
      .then(([family, property, vehicle, staff, contract]) => {
        if (cancelled) return;
        setEntities({ family, property, vehicle, staff, contract });
      })
      .catch((error) => {
        console.error('Failed to load linkable entities', error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { entities, loading };
}
