import { useEffect, useState } from 'react';
import { listActiveFamilyMembers } from '../../family/familyRepository';
import { listProperties } from '../../properties/propertyRepository';
import { listStaff } from '../../staff/staffRepository';
import { listVehicles } from '../../vehicles/vehicleRepository';
import type { LinkableEntities } from '../linkedEntity';

const EMPTY: LinkableEntities = { property: [], vehicle: [], staff: [], family: [] };

/**
 * The small set of existing entities a Contract may optionally link to —
 * loaded once for the "Linked To" picker (ContractForm) and for resolving
 * a contract's linked-entity display name (ContractProfilePage). Every
 * list here is already the household-scale dataset the rest of this
 * prototype assumes (the same assumption useStaffList/useVehicles make),
 * so loading all four up front is simpler and more consistent than four
 * separate fetches keyed to whichever type happens to be selected.
 */
export function useLinkableEntities() {
  const [entities, setEntities] = useState<LinkableEntities>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([listProperties(), listVehicles(), listStaff(), listActiveFamilyMembers()])
      .then(([property, vehicle, staff, family]) => {
        if (cancelled) return;
        setEntities({ property, vehicle, staff, family });
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
