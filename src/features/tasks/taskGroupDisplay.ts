import type { TranslationKey } from '../../localization/translations';
import { MIGRATION_GENERAL_GROUP_ID, type TaskGroup } from './types';

/**
 * The display name for a group -- the one migration-created group (see
 * MIGRATION_GENERAL_GROUP_ID) always reads as "General"/"عام" via
 * translation regardless of what happens to be stored in its `name`
 * field, so it's correctly localized even though a normal user-created
 * group's `name` is a plain, single-language string the user typed.
 */
export function getTaskGroupDisplayName(group: Pick<TaskGroup, 'id' | 'name'>, t: (key: TranslationKey) => string): string {
  return group.id === MIGRATION_GENERAL_GROUP_ID ? t('taskGroupGeneralName') : group.name;
}
