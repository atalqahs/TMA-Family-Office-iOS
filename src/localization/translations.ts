export type Locale = 'ar' | 'en';

/** A piece of category/domain text pre-translated for both locales. */
export interface LocalizedText {
  ar: string;
  en: string;
}

export type TranslationKey =
  | 'appName'
  | 'appTagline'
  | 'dashboardTitle'
  | 'dashboardSubtitle'
  | 'menuTitle'
  | 'menuOpenLabel'
  | 'menuCloseLabel'
  | 'menuMoreSection'
  | 'homeLabel'
  | 'searchLabel'
  | 'searchPlaceholderMessage'
  | 'notificationsLabel'
  | 'settingsLabel'
  | 'comingSoonNotice'
  | 'settingsTitle'
  | 'settingsLanguageSectionTitle'
  | 'settingsLanguageSectionHint'
  | 'languageNameArabic'
  | 'languageNameEnglish'
  | 'settingsAboutSectionTitle'
  | 'settingsVersionValue'
  | 'settingsDisclaimer'
  | 'trashTitle'
  | 'trashEmptyMessage'
  | 'loadingLabel'
  | 'actionSave'
  | 'actionCancel'
  | 'actionConfirm'
  | 'fieldFullName'
  | 'fieldRelationship'
  | 'fieldDateOfBirth'
  | 'fieldNationality'
  | 'fieldCivilId'
  | 'fieldPhone'
  | 'fieldEmail'
  | 'fieldBloodType'
  | 'fieldNotes'
  | 'fieldNotProvided'
  | 'formAddTitle'
  | 'formEditTitle'
  | 'formSaving'
  | 'formSaveError'
  | 'validationFullNameRequired'
  | 'validationEmailInvalid'
  | 'validationDateOfBirthInvalid'
  | 'validationDateOfBirthFuture'
  | 'validationDateOfBirthTooOld'
  | 'validationDuplicateCivilId'
  | 'validationFileTooLarge'
  | 'validationFileTypeUnsupported'
  | 'validationFileRequired'
  | 'photoChooseLabel'
  | 'photoChangeLabel'
  | 'photoRemoveLabel'
  | 'photoProcessingLabel'
  | 'photoProcessingError'
  | 'bloodTypeUnknown'
  | 'ageUnitLabel'
  | 'memberNotFoundTitle'
  | 'backToFamilyLabel'
  | 'profileEditAction'
  | 'profileDeleteAction'
  | 'profileDeleteConfirmTitle'
  | 'profileDeleteConfirmBody'
  | 'profileDeleteConfirmAction'
  | 'profileSectionPersonalInfo'
  | 'profileSectionNotes'
  | 'profileNotesEmpty'
  | 'profileSectionDocuments'
  | 'documentsEmpty'
  | 'documentsAddAction'
  | 'documentFormAddTitle'
  | 'fieldDocumentType'
  | 'fieldDocumentTitle'
  | 'fieldDocumentExpiry'
  | 'fieldDocumentFile'
  | 'documentChooseFileLabel'
  | 'documentOpenAction'
  | 'documentOpenError'
  | 'documentDeleteAction'
  | 'documentExpiryPrefixLabel'
  | 'validationPropertyNameRequired'
  | 'propertyFormAddTitle'
  | 'propertyFormEditTitle'
  | 'fieldPropertyName'
  | 'fieldPropertyType'
  | 'fieldPropertyStatus'
  | 'fieldCountry'
  | 'fieldCity'
  | 'fieldArea'
  | 'fieldBlock'
  | 'fieldStreet'
  | 'fieldAvenue'
  | 'fieldHouseNumber'
  | 'fieldPropertyNumber'
  | 'profileSectionLocation'
  | 'profileSectionPropertyInfo'
  | 'propertyNotFoundTitle'
  | 'backToPropertiesLabel'
  | 'propertyDeleteAction'
  | 'propertyDeleteConfirmTitle'
  | 'propertyDeleteConfirmBody'
  | 'propertyDeleteConfirmAction'
  | 'validationVehicleNameRequired'
  | 'validationYearInvalid'
  | 'validationMileageNegative'
  | 'validationMaintenanceTitleRequired'
  | 'validationMaintenanceDateRequired'
  | 'vehicleFormAddTitle'
  | 'vehicleFormEditTitle'
  | 'fieldVehicleName'
  | 'fieldMake'
  | 'fieldModel'
  | 'fieldYear'
  | 'fieldTrim'
  | 'fieldPlateNumber'
  | 'fieldVin'
  | 'fieldColor'
  | 'fieldCurrentMileage'
  | 'fieldRegistrationExpiry'
  | 'fieldInsuranceExpiry'
  | 'mileageUnitLabel'
  | 'profileSectionVehicleInfo'
  | 'profileSectionExpiry'
  | 'profileSectionMaintenance'
  | 'vehicleNotFoundTitle'
  | 'backToVehiclesLabel'
  | 'vehicleDeleteAction'
  | 'vehicleDeleteConfirmTitle'
  | 'vehicleDeleteConfirmBody'
  | 'vehicleDeleteConfirmAction'
  | 'vehicleStatusGreen'
  | 'vehicleStatusOrange'
  | 'vehicleStatusRed'
  | 'maintenanceEmpty'
  | 'maintenanceAddAction'
  | 'maintenanceFormAddTitle'
  | 'maintenanceFormEditTitle'
  | 'fieldMaintenanceType'
  | 'fieldMaintenanceTitle'
  | 'fieldServiceDate'
  | 'fieldMileage'
  | 'fieldNextServiceDate'
  | 'fieldNextServiceMileage'
  | 'nextServiceLabel';

type Dictionary = Record<TranslationKey, string>;

export const translations: Record<Locale, Dictionary> = {
  ar: {
    appName: 'TMA FAMILY OFFICE',
    appTagline: 'المكتب العائلي',
    dashboardTitle: 'لوحة التحكم',
    dashboardSubtitle: 'نظرة عامة على فئات مكتب العائلة.',
    menuTitle: 'الفئات',
    menuOpenLabel: 'فتح القائمة',
    menuCloseLabel: 'إغلاق',
    menuMoreSection: 'المزيد',
    homeLabel: 'الانتقال إلى الصفحة الرئيسية',
    searchLabel: 'بحث',
    searchPlaceholderMessage: 'سيتم تفعيل البحث في مرحلة لاحقة.',
    notificationsLabel: 'الإشعارات',
    settingsLabel: 'الإعدادات',
    comingSoonNotice: 'ستتوفر هذه الميزة في مرحلة لاحقة.',
    settingsTitle: 'الإعدادات',
    settingsLanguageSectionTitle: 'اللغة',
    settingsLanguageSectionHint: 'اختر لغة عرض التطبيق.',
    languageNameArabic: 'العربية',
    languageNameEnglish: 'English',
    settingsAboutSectionTitle: 'معلومات التطبيق',
    settingsVersionValue: 'نسخة تجريبية — المرحلة 5',
    settingsDisclaimer:
      'هذه نسخة تجريبية لتجربة الفكرة والتصميم على آيفون. النسخة النهائية ستكون تطبيق ويندوز مستقل.',
    trashTitle: 'سلة المحذوفات',
    trashEmptyMessage: 'لا توجد عناصر محذوفة.',
    loadingLabel: 'جارٍ التحميل...',
    actionSave: 'حفظ',
    actionCancel: 'إلغاء',
    actionConfirm: 'تأكيد',
    fieldFullName: 'الاسم الكامل',
    fieldRelationship: 'صلة القرابة',
    fieldDateOfBirth: 'تاريخ الميلاد',
    fieldNationality: 'الجنسية',
    fieldCivilId: 'الرقم المدني',
    fieldPhone: 'الهاتف',
    fieldEmail: 'البريد الإلكتروني',
    fieldBloodType: 'فصيلة الدم',
    fieldNotes: 'ملاحظات',
    fieldNotProvided: 'غير متوفر',
    formAddTitle: 'إضافة فرد من العائلة',
    formEditTitle: 'تعديل بيانات الفرد',
    formSaving: 'جارٍ الحفظ...',
    formSaveError: 'تعذر الحفظ. حاول مرة أخرى.',
    validationFullNameRequired: 'الاسم الكامل مطلوب.',
    validationEmailInvalid: 'صيغة البريد الإلكتروني غير صحيحة.',
    validationDateOfBirthInvalid: 'تاريخ الميلاد غير صالح.',
    validationDateOfBirthFuture: 'لا يمكن أن يكون تاريخ الميلاد في المستقبل.',
    validationDateOfBirthTooOld: 'تاريخ الميلاد غير منطقي.',
    validationDuplicateCivilId: 'يوجد فرد آخر بنفس الرقم المدني.',
    validationFileTooLarge: 'حجم الملف كبير جداً.',
    validationFileTypeUnsupported: 'نوع الملف غير مدعوم.',
    validationFileRequired: 'الرجاء اختيار ملف.',
    photoChooseLabel: 'اختيار صورة',
    photoChangeLabel: 'تغيير الصورة',
    photoRemoveLabel: 'إزالة الصورة',
    photoProcessingLabel: 'جارٍ معالجة الصورة...',
    photoProcessingError: 'تعذرت معالجة هذه الصورة.',
    bloodTypeUnknown: 'غير محدد',
    ageUnitLabel: 'سنة',
    memberNotFoundTitle: 'لم يتم العثور على هذا الفرد.',
    backToFamilyLabel: 'العودة إلى الأسرة',
    profileEditAction: 'تعديل',
    profileDeleteAction: 'حذف الفرد',
    profileDeleteConfirmTitle: 'هل تريد حذف هذا الفرد؟',
    profileDeleteConfirmBody: 'سيتم إخفاء هذا الفرد من قائمة الأسرة.',
    profileDeleteConfirmAction: 'حذف',
    profileSectionPersonalInfo: 'المعلومات الشخصية',
    profileSectionNotes: 'ملاحظات',
    profileNotesEmpty: 'لا توجد ملاحظات.',
    profileSectionDocuments: 'المستندات',
    documentsEmpty: 'لم تتم إضافة أي مستند بعد.',
    documentsAddAction: '+ إضافة مستند',
    documentFormAddTitle: 'إضافة مستند',
    fieldDocumentType: 'نوع المستند',
    fieldDocumentTitle: 'عنوان المستند',
    fieldDocumentExpiry: 'تاريخ الانتهاء',
    fieldDocumentFile: 'الملف',
    documentChooseFileLabel: 'اختيار ملف',
    documentOpenAction: 'فتح',
    documentOpenError: 'تعذر فتح هذا المستند.',
    documentDeleteAction: 'إزالة',
    documentExpiryPrefixLabel: 'ينتهي في',
    validationPropertyNameRequired: 'اسم العقار مطلوب.',
    propertyFormAddTitle: 'إضافة عقار',
    propertyFormEditTitle: 'تعديل بيانات العقار',
    fieldPropertyName: 'اسم العقار',
    fieldPropertyType: 'نوع العقار',
    fieldPropertyStatus: 'الحالة',
    fieldCountry: 'الدولة',
    fieldCity: 'المدينة',
    fieldArea: 'المنطقة',
    fieldBlock: 'القطعة',
    fieldStreet: 'الشارع',
    fieldAvenue: 'الجادة',
    fieldHouseNumber: 'رقم المنزل',
    fieldPropertyNumber: 'رقم العقار',
    profileSectionLocation: 'الموقع',
    profileSectionPropertyInfo: 'معلومات العقار',
    propertyNotFoundTitle: 'لم يتم العثور على هذا العقار.',
    backToPropertiesLabel: 'العودة إلى العقارات',
    propertyDeleteAction: 'حذف العقار',
    propertyDeleteConfirmTitle: 'هل تريد حذف هذا العقار؟',
    propertyDeleteConfirmBody: 'سيتم حذف هذا العقار وجميع مستنداته نهائياً. لا يمكن التراجع عن هذا الإجراء.',
    propertyDeleteConfirmAction: 'حذف',
    validationVehicleNameRequired: 'اسم المركبة مطلوب.',
    validationYearInvalid: 'سنة الصنع غير منطقية.',
    validationMileageNegative: 'لا يمكن أن يكون العداد رقماً سالباً.',
    validationMaintenanceTitleRequired: 'عنوان الصيانة مطلوب.',
    validationMaintenanceDateRequired: 'تاريخ الصيانة مطلوب.',
    vehicleFormAddTitle: 'إضافة مركبة',
    vehicleFormEditTitle: 'تعديل بيانات المركبة',
    fieldVehicleName: 'اسم المركبة',
    fieldMake: 'الشركة المصنعة',
    fieldModel: 'الطراز',
    fieldYear: 'سنة الصنع',
    fieldTrim: 'الفئة',
    fieldPlateNumber: 'رقم اللوحة',
    fieldVin: 'رقم الهيكل (VIN)',
    fieldColor: 'اللون',
    fieldCurrentMileage: 'قراءة العداد الحالية',
    fieldRegistrationExpiry: 'انتهاء استمارة التسجيل',
    fieldInsuranceExpiry: 'انتهاء التأمين',
    mileageUnitLabel: 'كم',
    profileSectionVehicleInfo: 'معلومات المركبة',
    profileSectionExpiry: 'تواريخ الانتهاء',
    profileSectionMaintenance: 'الصيانة',
    vehicleNotFoundTitle: 'لم يتم العثور على هذه المركبة.',
    backToVehiclesLabel: 'العودة إلى المركبات',
    vehicleDeleteAction: 'حذف المركبة',
    vehicleDeleteConfirmTitle: 'هل تريد حذف هذه المركبة؟',
    vehicleDeleteConfirmBody:
      'سيتم حذف هذه المركبة وجميع مستنداتها وسجلات صيانتها نهائياً. لا يمكن التراجع عن هذا الإجراء.',
    vehicleDeleteConfirmAction: 'حذف',
    vehicleStatusGreen: 'لا توجد مشاكل',
    vehicleStatusOrange: 'يقترب الموعد',
    vehicleStatusRed: 'متأخر',
    maintenanceEmpty: 'لم تتم إضافة أي سجل صيانة بعد.',
    maintenanceAddAction: '+ إضافة سجل صيانة',
    maintenanceFormAddTitle: 'إضافة سجل صيانة',
    maintenanceFormEditTitle: 'تعديل سجل الصيانة',
    fieldMaintenanceType: 'نوع الصيانة',
    fieldMaintenanceTitle: 'عنوان الصيانة',
    fieldServiceDate: 'تاريخ الصيانة',
    fieldMileage: 'قراءة العداد',
    fieldNextServiceDate: 'تاريخ الصيانة القادمة',
    fieldNextServiceMileage: 'عداد الصيانة القادمة',
    nextServiceLabel: 'الصيانة القادمة',
  },
  en: {
    appName: 'TMA FAMILY OFFICE',
    appTagline: 'Family Office',
    dashboardTitle: 'Dashboard',
    dashboardSubtitle: 'An overview of your family office categories.',
    menuTitle: 'Categories',
    menuOpenLabel: 'Open menu',
    menuCloseLabel: 'Close',
    menuMoreSection: 'More',
    homeLabel: 'Go to Home',
    searchLabel: 'Search',
    searchPlaceholderMessage: 'Search will be available in a later phase.',
    notificationsLabel: 'Notifications',
    settingsLabel: 'Settings',
    comingSoonNotice: 'This feature will be available in a later phase.',
    settingsTitle: 'Settings',
    settingsLanguageSectionTitle: 'Language',
    settingsLanguageSectionHint: 'Choose the app display language.',
    languageNameArabic: 'العربية',
    languageNameEnglish: 'English',
    settingsAboutSectionTitle: 'App Information',
    settingsVersionValue: 'Prototype — Phase 5',
    settingsDisclaimer:
      'This is an experimental prototype for testing the idea and design on iPhone. The final version will be a standalone Windows application.',
    trashTitle: 'Trash',
    trashEmptyMessage: 'No deleted items.',
    loadingLabel: 'Loading…',
    actionSave: 'Save',
    actionCancel: 'Cancel',
    actionConfirm: 'Confirm',
    fieldFullName: 'Full Name',
    fieldRelationship: 'Relationship',
    fieldDateOfBirth: 'Date of Birth',
    fieldNationality: 'Nationality',
    fieldCivilId: 'Civil ID',
    fieldPhone: 'Phone',
    fieldEmail: 'Email',
    fieldBloodType: 'Blood Type',
    fieldNotes: 'Notes',
    fieldNotProvided: 'Not provided',
    formAddTitle: 'Add Family Member',
    formEditTitle: 'Edit Family Member',
    formSaving: 'Saving…',
    formSaveError: 'Could not save. Please try again.',
    validationFullNameRequired: 'Full name is required.',
    validationEmailInvalid: 'Enter a valid email address.',
    validationDateOfBirthInvalid: 'Date of birth is not valid.',
    validationDateOfBirthFuture: 'Date of birth cannot be in the future.',
    validationDateOfBirthTooOld: 'Date of birth is not realistic.',
    validationDuplicateCivilId: 'Another family member already has this Civil ID.',
    validationFileTooLarge: 'This file is too large.',
    validationFileTypeUnsupported: 'This file type is not supported.',
    validationFileRequired: 'Please choose a file.',
    photoChooseLabel: 'Choose Photo',
    photoChangeLabel: 'Change Photo',
    photoRemoveLabel: 'Remove Photo',
    photoProcessingLabel: 'Processing photo…',
    photoProcessingError: 'Could not process this photo.',
    bloodTypeUnknown: 'Not specified',
    ageUnitLabel: 'years',
    memberNotFoundTitle: 'This family member could not be found.',
    backToFamilyLabel: 'Back to Family',
    profileEditAction: 'Edit',
    profileDeleteAction: 'Delete Member',
    profileDeleteConfirmTitle: 'Delete this member?',
    profileDeleteConfirmBody: 'This member will be hidden from your Family list.',
    profileDeleteConfirmAction: 'Delete',
    profileSectionPersonalInfo: 'Personal Information',
    profileSectionNotes: 'Notes',
    profileNotesEmpty: 'No notes added.',
    profileSectionDocuments: 'Documents',
    documentsEmpty: 'No documents added yet.',
    documentsAddAction: '+ Add Document',
    documentFormAddTitle: 'Add Document',
    fieldDocumentType: 'Document Type',
    fieldDocumentTitle: 'Document Title',
    fieldDocumentExpiry: 'Expiry Date',
    fieldDocumentFile: 'File',
    documentChooseFileLabel: 'Choose File',
    documentOpenAction: 'Open',
    documentOpenError: 'Could not open this document.',
    documentDeleteAction: 'Remove',
    documentExpiryPrefixLabel: 'Expires',
    validationPropertyNameRequired: 'Property name is required.',
    propertyFormAddTitle: 'Add Property',
    propertyFormEditTitle: 'Edit Property',
    fieldPropertyName: 'Property Name',
    fieldPropertyType: 'Property Type',
    fieldPropertyStatus: 'Status',
    fieldCountry: 'Country',
    fieldCity: 'City',
    fieldArea: 'Area',
    fieldBlock: 'Block',
    fieldStreet: 'Street',
    fieldAvenue: 'Avenue',
    fieldHouseNumber: 'House Number',
    fieldPropertyNumber: 'Property Number',
    profileSectionLocation: 'Location',
    profileSectionPropertyInfo: 'Property Information',
    propertyNotFoundTitle: 'This property could not be found.',
    backToPropertiesLabel: 'Back to Properties',
    propertyDeleteAction: 'Delete Property',
    propertyDeleteConfirmTitle: 'Delete this property?',
    propertyDeleteConfirmBody: 'This property and all of its documents will be permanently deleted. This cannot be undone.',
    propertyDeleteConfirmAction: 'Delete',
    validationVehicleNameRequired: 'Vehicle name is required.',
    validationYearInvalid: 'Enter a realistic model year.',
    validationMileageNegative: 'Mileage cannot be negative.',
    validationMaintenanceTitleRequired: 'Maintenance title is required.',
    validationMaintenanceDateRequired: 'Service date is required.',
    vehicleFormAddTitle: 'Add Vehicle',
    vehicleFormEditTitle: 'Edit Vehicle',
    fieldVehicleName: 'Vehicle Name',
    fieldMake: 'Make',
    fieldModel: 'Model',
    fieldYear: 'Year',
    fieldTrim: 'Trim',
    fieldPlateNumber: 'Plate Number',
    fieldVin: 'VIN',
    fieldColor: 'Color',
    fieldCurrentMileage: 'Current Mileage',
    fieldRegistrationExpiry: 'Registration Expiry',
    fieldInsuranceExpiry: 'Insurance Expiry',
    mileageUnitLabel: 'km',
    profileSectionVehicleInfo: 'Vehicle Information',
    profileSectionExpiry: 'Expiry',
    profileSectionMaintenance: 'Maintenance',
    vehicleNotFoundTitle: 'This vehicle could not be found.',
    backToVehiclesLabel: 'Back to Vehicles',
    vehicleDeleteAction: 'Delete Vehicle',
    vehicleDeleteConfirmTitle: 'Delete this vehicle?',
    vehicleDeleteConfirmBody:
      'This vehicle and all of its documents and maintenance records will be permanently deleted. This cannot be undone.',
    vehicleDeleteConfirmAction: 'Delete',
    vehicleStatusGreen: 'Up to Date',
    vehicleStatusOrange: 'Due Soon',
    vehicleStatusRed: 'Overdue',
    maintenanceEmpty: 'No maintenance records added yet.',
    maintenanceAddAction: '+ Add Maintenance Record',
    maintenanceFormAddTitle: 'Add Maintenance Record',
    maintenanceFormEditTitle: 'Edit Maintenance Record',
    fieldMaintenanceType: 'Maintenance Type',
    fieldMaintenanceTitle: 'Maintenance Title',
    fieldServiceDate: 'Service Date',
    fieldMileage: 'Mileage',
    fieldNextServiceDate: 'Next Service Date',
    fieldNextServiceMileage: 'Next Service Mileage',
    nextServiceLabel: 'Next service',
  },
};

export const LOCALE_DIR: Record<Locale, 'rtl' | 'ltr'> = {
  ar: 'rtl',
  en: 'ltr',
};

export const DEFAULT_LOCALE: Locale = 'ar';
