import {
  Archive,
  Bell,
  Briefcase,
  Building2,
  Car,
  FileText,
  GraduationCap,
  HeartPulse,
  ListChecks,
  Settings,
  Trash2,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { LocalizedText } from '../../localization/translations';

export interface CategoryDefinition {
  id: string;
  path: string;
  icon: LucideIcon;
  title: LocalizedText;
  subtitle: LocalizedText;
  emptyMessage: LocalizedText;
  /** Omitted for categories that have no manual "add" action (e.g. Notifications). */
  addLabel?: LocalizedText;
  countUnit: LocalizedText;
}

/**
 * The 11 main categories minus Dashboard itself (Dashboard is the page that
 * lists these, not a card on itself). This is the single source of truth
 * for routes, the Dashboard grid, and the category menu — add a category
 * here once and it appears everywhere consistently.
 */
export const CATEGORIES: CategoryDefinition[] = [
  {
    id: 'family',
    path: '/family',
    icon: Users,
    title: { ar: 'الأسرة', en: 'Family' },
    subtitle: {
      ar: 'أفراد العائلة وبياناتهم الأساسية.',
      en: 'Family members and their essential records.',
    },
    emptyMessage: { ar: 'لم تتم إضافة أي فرد من العائلة بعد.', en: 'No family members have been added yet.' },
    addLabel: { ar: '+ إضافة فرد', en: '+ Add Family Member' },
    countUnit: { ar: 'أفراد', en: 'members' },
  },
  {
    id: 'properties',
    path: '/properties',
    icon: Building2,
    title: { ar: 'العقارات', en: 'Properties' },
    subtitle: { ar: 'العقارات والممتلكات العائلية.', en: 'Family real estate and properties.' },
    emptyMessage: { ar: 'لم تتم إضافة أي عقار بعد.', en: 'No properties have been added yet.' },
    addLabel: { ar: '+ إضافة عقار', en: '+ Add Property' },
    countUnit: { ar: 'عقارات', en: 'properties' },
  },
  {
    id: 'vehicles',
    path: '/vehicles',
    icon: Car,
    title: { ar: 'المركبات', en: 'Vehicles' },
    subtitle: { ar: 'المركبات المملوكة للعائلة.', en: 'Vehicles owned by the family.' },
    emptyMessage: { ar: 'لم تتم إضافة أي مركبة بعد.', en: 'No vehicles have been added yet.' },
    addLabel: { ar: '+ إضافة مركبة', en: '+ Add Vehicle' },
    countUnit: { ar: 'مركبات', en: 'vehicles' },
  },
  {
    id: 'staff',
    path: '/staff',
    icon: Briefcase,
    title: { ar: 'العمالة', en: 'Staff' },
    subtitle: { ar: 'العاملون في خدمة العائلة.', en: 'Household staff working for the family.' },
    emptyMessage: { ar: 'لم تتم إضافة أي عامل بعد.', en: 'No staff members have been added yet.' },
    addLabel: { ar: '+ إضافة عامل', en: '+ Add Staff Member' },
    countUnit: { ar: 'عاملين', en: 'staff' },
  },
  {
    id: 'contracts',
    path: '/contracts',
    icon: FileText,
    title: { ar: 'العقود', en: 'Contracts' },
    subtitle: { ar: 'العقود والاتفاقيات الخاصة بالعائلة.', en: 'Family contracts and agreements.' },
    emptyMessage: { ar: 'لم تتم إضافة أي عقد بعد.', en: 'No contracts have been added yet.' },
    addLabel: { ar: '+ إضافة عقد', en: '+ Add Contract' },
    countUnit: { ar: 'عقود', en: 'contracts' },
  },
  {
    id: 'tasks',
    path: '/tasks',
    icon: ListChecks,
    title: { ar: 'المهام والتذكيرات', en: 'Tasks & Reminders' },
    subtitle: { ar: 'المهام والمتابعات اليومية.', en: 'Day-to-day tasks and follow-ups.' },
    emptyMessage: { ar: 'لا توجد مهام حالياً.', en: 'No tasks yet.' },
    addLabel: { ar: '+ إضافة مهمة', en: '+ Add Task' },
    countUnit: { ar: 'مهام نشطة', en: 'active tasks' },
  },
  {
    id: 'archive',
    path: '/archive',
    icon: Archive,
    title: { ar: 'الأرشيف', en: 'Archive' },
    subtitle: {
      ar: 'البطاقات التي تمت أرشفتها من التصنيفات الأخرى.',
      en: 'Cards archived from other categories.',
    },
    emptyMessage: { ar: 'لا توجد بطاقات مؤرشفة.', en: 'No archived cards.' },
    countUnit: { ar: 'بطاقات', en: 'cards' },
  },
  {
    id: 'education',
    path: '/education',
    icon: GraduationCap,
    title: { ar: 'التعليم', en: 'Education' },
    subtitle: { ar: 'السجلات التعليمية لأفراد العائلة.', en: 'Education records for family members.' },
    emptyMessage: {
      ar: 'لم تتم إضافة أي سجل تعليمي بعد.',
      en: 'No education records have been added yet.',
    },
    addLabel: { ar: '+ إضافة سجل تعليمي', en: '+ Add Education Record' },
    countUnit: { ar: 'سجلات', en: 'records' },
  },
  {
    id: 'health',
    path: '/health',
    icon: HeartPulse,
    title: { ar: 'الصحة', en: 'Health' },
    subtitle: { ar: 'السجلات الصحية لأفراد العائلة.', en: 'Health records for family members.' },
    emptyMessage: { ar: 'لم تتم إضافة أي سجل صحي بعد.', en: 'No health records have been added yet.' },
    addLabel: { ar: '+ إضافة سجل صحي', en: '+ Add Health Record' },
    countUnit: { ar: 'سجلات', en: 'records' },
  },
  {
    id: 'notifications',
    path: '/notifications',
    icon: Bell,
    title: { ar: 'الإشعارات', en: 'Notifications' },
    subtitle: { ar: 'التنبيهات والتذكيرات المهمة.', en: 'Important alerts and reminders.' },
    emptyMessage: { ar: 'لا توجد إشعارات حالياً.', en: 'No notifications yet.' },
    countUnit: { ar: 'تنبيهات', en: 'alerts' },
  },
];

export interface SecondaryNavItem {
  id: string;
  path: string;
  icon: LucideIcon;
  title: LocalizedText;
}

/** Settings and Trash: reachable from the menu, deliberately not on the Dashboard grid. */
export const SECONDARY_NAV_ITEMS: SecondaryNavItem[] = [
  {
    id: 'settings',
    path: '/settings',
    icon: Settings,
    title: { ar: 'الإعدادات', en: 'Settings' },
  },
  {
    id: 'trash',
    path: '/trash',
    icon: Trash2,
    title: { ar: 'سلة المحذوفات', en: 'Trash' },
  },
];
