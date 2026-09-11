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
  | 'nextServiceLabel'
  | 'fieldMileageAtService'
  | 'fieldServiceIntervalKm'
  | 'fieldTargetMileage'
  | 'serviceIntervalHint'
  | 'targetMileagePlaceholder'
  | 'validationServiceIntervalInvalid'
  | 'validationServiceIntervalTooLarge'
  | 'maintenanceRemainingKm'
  | 'maintenanceServiceDue'
  | 'maintenanceOverdueByKm'
  | 'completeServiceAction'
  | 'completeServiceFormTitle'
  | 'completeServiceSubmitAction'
  | 'completeServicePreviousTargetLabel'
  | 'fieldRole'
  | 'fieldPassportNumber'
  | 'fieldEmploymentStartDate'
  | 'fieldCivilIdExpiry'
  | 'fieldPassportExpiry'
  | 'fieldResidencyExpiry'
  | 'fieldMonthlySalary'
  | 'fieldAmount'
  | 'fieldPaidDate'
  | 'fieldAge'
  | 'profileSectionIdentification'
  | 'profileSectionEmployment'
  | 'profileSectionSalaryPayments'
  | 'staffRoleUnspecified'
  | 'validationSalaryNegative'
  | 'validationSalaryAmountInvalid'
  | 'validationPaidDateRequired'
  | 'validationDuplicateSalaryOccurrence'
  | 'validationScheduleIntervalInvalid'
  | 'validationDueDayInvalid'
  | 'validationDueMonthInvalid'
  | 'validationStartDateRequired'
  | 'validationEndDateBeforeStart'
  | 'staffFormAddTitle'
  | 'staffFormEditTitle'
  | 'staffNotFoundTitle'
  | 'backToStaffLabel'
  | 'staffDeleteAction'
  | 'staffDeleteConfirmTitle'
  | 'staffDeleteConfirmBody'
  | 'staffDeleteConfirmAction'
  | 'staffStatusGreen'
  | 'staffStatusOrange'
  | 'staffStatusRed'
  | 'staffReasonCivilIdExpiringSoon'
  | 'staffReasonCivilIdExpired'
  | 'staffReasonPassportExpiringSoon'
  | 'staffReasonPassportExpired'
  | 'staffReasonResidencyExpiringSoon'
  | 'staffReasonResidencyExpired'
  | 'staffReasonDocumentExpiringSoon'
  | 'staffReasonDocumentExpired'
  | 'staffReasonSalaryUnconfirmed'
  | 'salaryPaymentsAddAction'
  | 'salaryPaymentFormEditTitle'
  | 'salaryPaymentsEmpty'
  | 'salaryStatusNotYetDue'
  | 'salaryStatusPending'
  | 'salaryStatusOverdue'
  | 'kwdUnitLabel'
  | 'fieldRepeatsEvery'
  | 'fieldDueDayOfMonth'
  | 'fieldDueMonth'
  | 'fieldStartDate'
  | 'fieldEndDateOptional'
  | 'frequencyDay'
  | 'frequencyMonth'
  | 'frequencyYear'
  | 'frequencyEveryLabel'
  | 'scheduleDueDayLabel'
  | 'salarySchedulesLabel'
  | 'salarySchedulesEmpty'
  | 'salaryScheduleFormAddTitle'
  | 'salaryScheduleFormEditTitle'
  | 'salaryUpcomingLabel'
  | 'salaryUpcomingEmpty'
  | 'salaryHistoryLabel'
  | 'salaryConfirmPaymentAction'
  | 'salaryConfirmPaymentTitle'
  | 'salaryOccurrenceDueLabel'
  | 'salaryPaidOnLabel'
  | 'fieldContractTitle'
  | 'fieldContractType'
  | 'fieldContractNumber'
  | 'fieldPartyName'
  | 'fieldEndDate'
  | 'fieldCurrency'
  | 'currencyUnspecifiedLabel'
  | 'fieldLinkedTo'
  | 'linkedToNoneLabel'
  | 'linkedEntityEmptyState'
  | 'linkedEntitySelectPlaceholder'
  | 'linkedEntityUnavailableLabel'
  | 'validationContractTitleRequired'
  | 'validationContractPartyRequired'
  | 'validationContractStartDateRequired'
  | 'validationContractEndDateBeforeStart'
  | 'validationContractAmountNegative'
  | 'validationLinkedEntityRequired'
  | 'contractStatusActive'
  | 'contractStatusExpiringSoon'
  | 'contractStatusExpired'
  | 'contractFormAddTitle'
  | 'contractFormEditTitle'
  | 'contractNotFoundTitle'
  | 'backToContractsLabel'
  | 'profileSectionContractInfo'
  | 'contractDeleteAction'
  | 'contractDeleteConfirmTitle'
  | 'contractDeleteConfirmBody'
  | 'contractDeleteConfirmAction';

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
    settingsVersionValue: 'نسخة تجريبية — المرحلة 6',
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
    fieldCurrentMileage: 'العداد الحالي',
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
    fieldMileageAtService: 'العداد وقت الصيانة',
    fieldServiceIntervalKm: 'الصيانة بعد',
    fieldTargetMileage: 'العداد المستهدف',
    serviceIntervalHint: 'أدخل أي قيمة حتى 200,000 كم، أو اختر من الاقتراحات.',
    targetMileagePlaceholder: 'يُحسب تلقائياً',
    validationServiceIntervalInvalid: 'يجب أن تكون قيمة "الصيانة بعد" رقماً موجباً.',
    validationServiceIntervalTooLarge: 'الحد الأقصى لـ "الصيانة بعد" هو 200,000 كم.',
    maintenanceRemainingKm: 'متبقي {km} كم',
    maintenanceServiceDue: 'الصيانة مستحقة الآن',
    maintenanceOverdueByKm: 'متأخر بمقدار {km} كم',
    completeServiceAction: 'تمت الصيانة',
    completeServiceFormTitle: 'تسجيل إتمام الصيانة',
    completeServiceSubmitAction: 'بدء الدورة القادمة',
    completeServicePreviousTargetLabel: 'الهدف السابق كان',
    fieldRole: 'الوظيفة',
    fieldPassportNumber: 'رقم جواز السفر',
    fieldEmploymentStartDate: 'تاريخ بدء العمل',
    fieldCivilIdExpiry: 'انتهاء البطاقة المدنية',
    fieldPassportExpiry: 'انتهاء جواز السفر',
    fieldResidencyExpiry: 'انتهاء الإقامة',
    fieldMonthlySalary: 'الراتب الشهري',
    fieldAmount: 'المبلغ',
    fieldPaidDate: 'تاريخ الدفع',
    fieldAge: 'العمر',
    profileSectionIdentification: 'بيانات الهوية',
    profileSectionEmployment: 'بيانات التوظيف',
    profileSectionSalaryPayments: 'الراتب',
    staffRoleUnspecified: 'غير محدد',
    validationSalaryNegative: 'لا يمكن أن يكون الراتب رقماً سالباً.',
    validationSalaryAmountInvalid: 'يجب أن يكون المبلغ أكبر من صفر.',
    validationPaidDateRequired: 'تاريخ الدفع مطلوب.',
    validationDuplicateSalaryOccurrence: 'تم تأكيد دفع هذه الدفعة مسبقاً.',
    validationScheduleIntervalInvalid: 'يجب أن يكون التكرار رقماً صحيحاً أكبر من صفر.',
    validationDueDayInvalid: 'يجب اختيار يوم استحقاق صحيح (1-31).',
    validationDueMonthInvalid: 'يجب اختيار شهر استحقاق صحيح (1-12).',
    validationStartDateRequired: 'تاريخ البدء مطلوب.',
    validationEndDateBeforeStart: 'لا يمكن أن يكون تاريخ الانتهاء قبل تاريخ البدء.',
    staffFormAddTitle: 'إضافة عامل',
    staffFormEditTitle: 'تعديل بيانات العامل',
    staffNotFoundTitle: 'لم يتم العثور على هذا العامل.',
    backToStaffLabel: 'العودة إلى العمالة',
    staffDeleteAction: 'حذف العامل',
    staffDeleteConfirmTitle: 'هل تريد حذف هذا العامل؟',
    staffDeleteConfirmBody:
      'سيتم حذف هذا العامل وجميع مستنداته ودفعات راتبه نهائياً. لا يمكن التراجع عن هذا الإجراء.',
    staffDeleteConfirmAction: 'حذف',
    staffStatusGreen: 'لا توجد مشاكل',
    staffStatusOrange: 'يتطلب انتباه',
    staffStatusRed: 'يتطلب إجراء',
    staffReasonCivilIdExpiringSoon: 'البطاقة المدنية تنتهي قريباً',
    staffReasonCivilIdExpired: 'انتهت البطاقة المدنية',
    staffReasonPassportExpiringSoon: 'جواز السفر ينتهي قريباً',
    staffReasonPassportExpired: 'انتهى جواز السفر',
    staffReasonResidencyExpiringSoon: 'الإقامة تنتهي قريباً',
    staffReasonResidencyExpired: 'انتهت الإقامة',
    staffReasonDocumentExpiringSoon: 'مستند ينتهي قريباً',
    staffReasonDocumentExpired: 'انتهى مستند',
    staffReasonSalaryUnconfirmed: 'راتب {amount} المستحق {date} لم يتم تأكيد دفعه.',
    salaryPaymentsAddAction: '+ إضافة راتب',
    salaryPaymentFormEditTitle: 'تعديل الدفعة',
    salaryPaymentsEmpty: 'لا يوجد سجل دفعات بعد.',
    salaryStatusNotYetDue: 'لم يحن موعده بعد',
    salaryStatusPending: 'الدفع معلّق',
    salaryStatusOverdue: 'متأخر',
    kwdUnitLabel: 'د.ك',
    fieldRepeatsEvery: 'يتكرر كل',
    fieldDueDayOfMonth: 'يوم الاستحقاق',
    fieldDueMonth: 'شهر الاستحقاق',
    fieldStartDate: 'تاريخ البدء',
    fieldEndDateOptional: 'تاريخ الانتهاء (اختياري)',
    frequencyDay: 'يوم',
    frequencyMonth: 'شهر',
    frequencyYear: 'سنة',
    frequencyEveryLabel: 'كل',
    scheduleDueDayLabel: 'يوم',
    salarySchedulesLabel: 'رواتب متكررة',
    salarySchedulesEmpty: 'لم تتم إضافة أي راتب متكرر بعد.',
    salaryScheduleFormAddTitle: 'إضافة راتب',
    salaryScheduleFormEditTitle: 'تعديل الراتب',
    salaryUpcomingLabel: 'الدفعات الحالية والقادمة',
    salaryUpcomingEmpty: 'لا توجد دفعات مستحقة حالياً.',
    salaryHistoryLabel: 'سجل الدفعات',
    salaryConfirmPaymentAction: 'تأكيد الدفع',
    salaryConfirmPaymentTitle: 'تأكيد دفع الراتب',
    salaryOccurrenceDueLabel: 'تاريخ الاستحقاق',
    salaryPaidOnLabel: 'دُفع في',
    fieldContractTitle: 'عنوان العقد',
    fieldContractType: 'نوع العقد',
    fieldContractNumber: 'رقم العقد',
    fieldPartyName: 'الطرف الآخر',
    fieldEndDate: 'تاريخ الانتهاء',
    fieldCurrency: 'العملة',
    currencyUnspecifiedLabel: 'غير محدد',
    fieldLinkedTo: 'مرتبط بـ',
    linkedToNoneLabel: 'بدون ارتباط',
    linkedEntityEmptyState: 'لا توجد عناصر في هذه الفئة بعد.',
    linkedEntitySelectPlaceholder: 'اختر...',
    linkedEntityUnavailableLabel: 'العنصر المرتبط لم يعد متاحاً.',
    validationContractTitleRequired: 'عنوان العقد مطلوب.',
    validationContractPartyRequired: 'اسم الطرف الآخر مطلوب.',
    validationContractStartDateRequired: 'تاريخ بدء العقد مطلوب.',
    validationContractEndDateBeforeStart: 'لا يمكن أن يكون تاريخ الانتهاء قبل تاريخ البدء.',
    validationContractAmountNegative: 'لا يمكن أن يكون المبلغ رقماً سالباً.',
    validationLinkedEntityRequired: 'يرجى اختيار العنصر المرتبط.',
    contractStatusActive: 'ساري',
    contractStatusExpiringSoon: 'يقترب الانتهاء',
    contractStatusExpired: 'منتهٍ',
    contractFormAddTitle: 'إضافة عقد',
    contractFormEditTitle: 'تعديل العقد',
    contractNotFoundTitle: 'لم يتم العثور على هذا العقد.',
    backToContractsLabel: 'العودة إلى العقود',
    profileSectionContractInfo: 'معلومات العقد',
    contractDeleteAction: 'حذف العقد',
    contractDeleteConfirmTitle: 'هل تريد حذف هذا العقد؟',
    contractDeleteConfirmBody: 'سيتم حذف هذا العقد وجميع مستنداته نهائياً. لا يمكن التراجع عن هذا الإجراء.',
    contractDeleteConfirmAction: 'حذف',
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
    settingsVersionValue: 'Prototype — Phase 6',
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
    fieldMileageAtService: 'Mileage at Service',
    fieldServiceIntervalKm: 'Service After',
    fieldTargetMileage: 'Target Mileage',
    serviceIntervalHint: 'Enter any value up to 200,000 km, or pick a suggestion.',
    targetMileagePlaceholder: 'Calculated automatically',
    validationServiceIntervalInvalid: '"Service After" must be a positive number.',
    validationServiceIntervalTooLarge: '"Service After" cannot exceed 200,000 km.',
    maintenanceRemainingKm: '{km} km remaining',
    maintenanceServiceDue: 'Service due',
    maintenanceOverdueByKm: 'Overdue by {km} km',
    completeServiceAction: 'Service Completed',
    completeServiceFormTitle: 'Record Service Completed',
    completeServiceSubmitAction: 'Start Next Cycle',
    completeServicePreviousTargetLabel: 'Previous target was',
    fieldRole: 'Role',
    fieldPassportNumber: 'Passport Number',
    fieldEmploymentStartDate: 'Employment Start Date',
    fieldCivilIdExpiry: 'Civil ID Expiry',
    fieldPassportExpiry: 'Passport Expiry',
    fieldResidencyExpiry: 'Residency Expiry',
    fieldMonthlySalary: 'Monthly Salary',
    fieldAmount: 'Amount',
    fieldPaidDate: 'Paid Date',
    fieldAge: 'Age',
    profileSectionIdentification: 'Identification',
    profileSectionEmployment: 'Employment',
    profileSectionSalaryPayments: 'Salary',
    staffRoleUnspecified: 'Not specified',
    validationSalaryNegative: 'Salary cannot be negative.',
    validationSalaryAmountInvalid: 'Amount must be greater than zero.',
    validationPaidDateRequired: 'Paid date is required.',
    validationDuplicateSalaryOccurrence: 'This payment has already been confirmed.',
    validationScheduleIntervalInvalid: 'Repeat interval must be a whole number greater than zero.',
    validationDueDayInvalid: 'Choose a valid due day (1-31).',
    validationDueMonthInvalid: 'Choose a valid due month (1-12).',
    validationStartDateRequired: 'Start date is required.',
    validationEndDateBeforeStart: 'End date cannot be before the start date.',
    staffFormAddTitle: 'Add Staff',
    staffFormEditTitle: 'Edit Staff',
    staffNotFoundTitle: 'This staff member could not be found.',
    backToStaffLabel: 'Back to Staff',
    staffDeleteAction: 'Delete Staff',
    staffDeleteConfirmTitle: 'Delete this staff member?',
    staffDeleteConfirmBody:
      'This staff member and all of their documents and salary payments will be permanently deleted. This cannot be undone.',
    staffDeleteConfirmAction: 'Delete',
    staffStatusGreen: 'No Issues',
    staffStatusOrange: 'Needs Attention',
    staffStatusRed: 'Action Required',
    staffReasonCivilIdExpiringSoon: 'Civil ID expires soon',
    staffReasonCivilIdExpired: 'Civil ID expired',
    staffReasonPassportExpiringSoon: 'Passport expires soon',
    staffReasonPassportExpired: 'Passport expired',
    staffReasonResidencyExpiringSoon: 'Residency expires soon',
    staffReasonResidencyExpired: 'Residency expired',
    staffReasonDocumentExpiringSoon: 'Document expiring soon',
    staffReasonDocumentExpired: 'Document expired',
    staffReasonSalaryUnconfirmed: 'Salary of {amount} due {date} has not been confirmed as paid.',
    salaryPaymentsAddAction: '+ Add Salary',
    salaryPaymentFormEditTitle: 'Edit Payment',
    salaryPaymentsEmpty: 'No payment history yet.',
    salaryStatusNotYetDue: 'Not yet due',
    salaryStatusPending: 'Payment pending',
    salaryStatusOverdue: 'Overdue',
    kwdUnitLabel: 'KWD',
    fieldRepeatsEvery: 'Repeats every',
    fieldDueDayOfMonth: 'Due day',
    fieldDueMonth: 'Due month',
    fieldStartDate: 'Start Date',
    fieldEndDateOptional: 'End Date (optional)',
    frequencyDay: 'Day',
    frequencyMonth: 'Month',
    frequencyYear: 'Year',
    frequencyEveryLabel: 'Every',
    scheduleDueDayLabel: 'Day',
    salarySchedulesLabel: 'Recurring Salary Schedules',
    salarySchedulesEmpty: 'No recurring salary added yet.',
    salaryScheduleFormAddTitle: 'Add Salary',
    salaryScheduleFormEditTitle: 'Edit Salary',
    salaryUpcomingLabel: 'Current / Upcoming Payments',
    salaryUpcomingEmpty: 'Nothing currently due.',
    salaryHistoryLabel: 'Payment History',
    salaryConfirmPaymentAction: 'Confirm Payment',
    salaryConfirmPaymentTitle: 'Confirm Salary Payment',
    salaryOccurrenceDueLabel: 'Due date',
    salaryPaidOnLabel: 'Paid on',
    fieldContractTitle: 'Contract Title',
    fieldContractType: 'Contract Type',
    fieldContractNumber: 'Contract Number',
    fieldPartyName: 'Party Name',
    fieldEndDate: 'End Date',
    fieldCurrency: 'Currency',
    currencyUnspecifiedLabel: 'Unspecified',
    fieldLinkedTo: 'Linked To',
    linkedToNoneLabel: 'None',
    linkedEntityEmptyState: 'No entries in this category yet.',
    linkedEntitySelectPlaceholder: 'Select...',
    linkedEntityUnavailableLabel: 'The linked entity is no longer available.',
    validationContractTitleRequired: 'Contract title is required.',
    validationContractPartyRequired: 'Party name is required.',
    validationContractStartDateRequired: 'Contract start date is required.',
    validationContractEndDateBeforeStart: 'End date cannot be earlier than the start date.',
    validationContractAmountNegative: 'Amount cannot be negative.',
    validationLinkedEntityRequired: 'Please select the linked entity.',
    contractStatusActive: 'Active',
    contractStatusExpiringSoon: 'Expiring Soon',
    contractStatusExpired: 'Expired',
    contractFormAddTitle: 'Add Contract',
    contractFormEditTitle: 'Edit Contract',
    contractNotFoundTitle: 'This contract could not be found.',
    backToContractsLabel: 'Back to Contracts',
    profileSectionContractInfo: 'Contract Information',
    contractDeleteAction: 'Delete Contract',
    contractDeleteConfirmTitle: 'Delete this contract?',
    contractDeleteConfirmBody: 'This contract and all of its documents will be permanently deleted. This cannot be undone.',
    contractDeleteConfirmAction: 'Delete',
  },
};

export const LOCALE_DIR: Record<Locale, 'rtl' | 'ltr'> = {
  ar: 'rtl',
  en: 'ltr',
};

export const DEFAULT_LOCALE: Locale = 'ar';
