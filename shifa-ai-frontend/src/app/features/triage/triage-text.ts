import { AppLanguage } from '../../core/models/health-response.model';
import {
  TriageAgeGroup,
  TriageConditionId,
  TriageRedFlagId,
  TriageSex,
} from '../../core/models/triage.model';

export interface TriageCopy {
  pageTitle: string;
  resultTitle: string;
  stepPatient: string;
  stepProblem: string;
  stepWarningSigns: string;
  stepBackground: string;
  ageGroupLabel: string;
  ageGroups: Record<TriageAgeGroup, string>;
  sexLabel: string;
  sexes: Record<TriageSex, string>;
  pregnancyLabel: string;
  yes: string;
  no: string;
  complaintLabel: string;
  complaintHint: string;
  durationLabel: string;
  severityLabel: string;
  severityNotSet: string;
  warningSignsIntro: string;
  redFlags: Record<TriageRedFlagId, string>;
  noneOfThese: string;
  backgroundIntro: string;
  conditions: Record<TriageConditionId, string>;
  otherCondition: string;
  otherConditionsLabel: string;
  noConditions: string;
  otherConditionsRequired: string;
  otherConditionsTooLong: string;
  conditionsRequired: string;
  next: string;
  back: string;
  submit: string;
  checking: string;
  ageGroupRequired: string;
  sexRequired: string;
  pregnancyRequired: string;
  complaintRequired: string;
  complaintTooShort: string;
  complaintTooLong: string;
  durationRequired: string;
  durationInvalid: string;
  severityRequired: string;
  warningSignsRequired: string;
  callRescue: string;
  supportingAdvice: string;
  rootCause: string;
  dietPlan: string;
  medicineClass: string;
  medicineInformation: string;
  sources: string;
  sourceDatabase: string;
  sourceAi: string;
  followUpLabel: string;
  sendFollowUp: string;
  startNewCheck: string;
  translatingToPunjabi: string;
  punjabiTranslationFailed: string;
  disclaimer: string;
}

export const TRIAGE_TEXT: Record<AppLanguage, TriageCopy> = {
  en: {
    pageTitle: 'Check how urgent this is',
    resultTitle: 'How urgent this is',
    stepPatient: 'About the patient',
    stepProblem: 'The problem',
    stepWarningSigns: 'Warning signs',
    stepBackground: 'Health background',
    ageGroupLabel: 'Age group',
    ageGroups: {
      infant: 'Infant (under 1 year)',
      child: 'Child',
      adult: 'Adult',
      elderly: 'Elderly (60 years or more)',
    },
    sexLabel: 'Sex',
    sexes: { male: 'Male', female: 'Female', other: 'Other' },
    pregnancyLabel: 'Is she pregnant?',
    yes: 'Yes',
    no: 'No',
    complaintLabel: 'Main complaint',
    complaintHint: 'Describe the main problem in your own words',
    durationLabel: 'How long (days)',
    severityLabel: 'How severe is it? (0 = none, 10 = worst)',
    severityNotSet: 'Not set yet',
    warningSignsIntro: 'Tick any of these that are happening now',
    redFlags: {
      chest_pain: 'Chest pain or pressure',
      breathing_difficulty: 'Trouble breathing',
      confusion: 'Confusion or unusual drowsiness',
      fainting: 'Fainting or passing out',
      seizure: 'Seizure or fit',
      severe_bleeding: 'Severe bleeding',
      stiff_neck_with_fever: 'Stiff neck with fever',
      blood_in_vomit_or_stool: 'Blood in vomit or stool',
      stroke_signs: 'Stroke signs (face drooping, arm weakness, slurred speech)',
      infant_not_feeding: 'Baby not feeding',
      severe_dehydration: 'Severe dehydration (very little urine, sunken eyes, very weak)',
      pregnancy_with_bleeding_or_severe_pain: 'Pregnancy with bleeding or severe pain',
      suicidal_thoughts: 'Thoughts of self-harm',
    },
    noneOfThese: 'None of these',
    backgroundIntro: 'Does the patient have any of these conditions?',
    conditions: {
      diabetes: 'Diabetes',
      heart_disease: 'Heart disease',
      hypertension: 'High blood pressure (hypertension)',
    },
    otherCondition: 'Other',
    otherConditionsLabel: 'Which other condition(s)?',
    noConditions: 'None',
    otherConditionsRequired: 'Please write the other condition.',
    otherConditionsTooLong: 'Please keep it under 200 characters.',
    conditionsRequired: 'Tick any conditions, choose "Other", or choose "None".',
    next: 'Next',
    back: 'Back',
    submit: 'Check urgency',
    checking: 'Checking how urgent this is...',
    ageGroupRequired: 'Please choose an age group.',
    sexRequired: "Please choose the patient's sex.",
    pregnancyRequired: 'Please say whether she is pregnant.',
    complaintRequired: 'Please describe the main problem.',
    complaintTooShort: 'Please write at least 3 characters.',
    complaintTooLong: 'Please keep it under 2000 characters.',
    durationRequired: 'Please enter how many days.',
    durationInvalid: 'Enter a whole number of days from 0 to 365.',
    severityRequired: 'Please move the slider to show how severe it is.',
    warningSignsRequired: 'Tick any warning signs, or choose "None of these".',
    callRescue: 'Call Rescue 1122',
    supportingAdvice: 'Supporting advice while you arrange care',
    rootCause: 'Root Cause',
    dietPlan: 'Diet Plan',
    medicineClass: 'Medicine Class',
    medicineInformation: 'Medicine Information',
    sources: 'Sources',
    sourceDatabase: 'Source: database',
    sourceAi: 'Source: AI',
    followUpLabel: 'Ask a follow-up question',
    sendFollowUp: 'Send follow-up question',
    startNewCheck: 'Start a new check',
    translatingToPunjabi: 'Translating to Punjabi...',
    punjabiTranslationFailed: 'Punjabi translation is unavailable, showing Urdu instead.',
    disclaimer:
      'Shifa AI is a health education platform. The information shown is for general awareness only and is not a medical diagnosis or prescription. For severe or worsening symptoms, visit your nearest government hospital or Basic Health Unit (BHU).',
  },
  ur: {
    pageTitle: 'جانچیں کہ یہ کتنا فوری ہے',
    resultTitle: 'یہ کتنا فوری ہے',
    stepPatient: 'مریض کے بارے میں',
    stepProblem: 'مسئلہ',
    stepWarningSigns: 'خطرے کی علامات',
    stepBackground: 'صحت کا پس منظر',
    ageGroupLabel: 'عمر کا گروپ',
    ageGroups: {
      infant: 'شیر خوار (1 سال سے کم)',
      child: 'بچہ',
      adult: 'بالغ',
      elderly: 'بزرگ (60 سال یا زیادہ)',
    },
    sexLabel: 'جنس',
    sexes: { male: 'مرد', female: 'عورت', other: 'دیگر' },
    pregnancyLabel: 'کیا وہ حاملہ ہیں؟',
    yes: 'ہاں',
    no: 'نہیں',
    complaintLabel: 'بنیادی تکلیف',
    complaintHint: 'اپنے الفاظ میں بنیادی مسئلہ بیان کریں',
    durationLabel: 'کتنے دنوں سے',
    severityLabel: 'تکلیف کتنی شدید ہے؟ (0 = بالکل نہیں، 10 = انتہائی شدید)',
    severityNotSet: 'ابھی منتخب نہیں کیا گیا',
    warningSignsIntro: 'ان میں سے جو علامات ابھی موجود ہیں ان پر نشان لگائیں',
    redFlags: {
      chest_pain: 'سینے میں درد یا دباؤ',
      breathing_difficulty: 'سانس لینے میں دشواری',
      confusion: 'ذہنی الجھن یا غیر معمولی غنودگی',
      fainting: 'بے ہوش ہو جانا',
      seizure: 'دورہ یا جھٹکے',
      severe_bleeding: 'شدید خون بہنا',
      stiff_neck_with_fever: 'بخار کے ساتھ گردن میں اکڑاؤ',
      blood_in_vomit_or_stool: 'قے یا پاخانے میں خون',
      stroke_signs: 'فالج کی علامات (چہرہ ٹیڑھا ہونا، بازو میں کمزوری، بولنے میں دقت)',
      infant_not_feeding: 'بچہ دودھ نہیں پی رہا',
      severe_dehydration: 'پانی کی شدید کمی (بہت کم پیشاب، دھنسی ہوئی آنکھیں، بہت کمزوری)',
      pregnancy_with_bleeding_or_severe_pain: 'حمل کے دوران خون آنا یا شدید درد',
      suicidal_thoughts: 'خود کو نقصان پہنچانے کے خیالات',
    },
    noneOfThese: 'ان میں سے کوئی نہیں',
    backgroundIntro: 'کیا مریض کو ان میں سے کوئی بیماری ہے؟',
    conditions: {
      diabetes: 'ذیابیطس (شوگر)',
      heart_disease: 'دل کی بیماری',
      hypertension: 'ہائی بلڈ پریشر',
    },
    otherCondition: 'دیگر',
    otherConditionsLabel: 'کون سی دوسری بیماری؟',
    noConditions: 'کوئی نہیں',
    otherConditionsRequired: 'براہ کرم دوسری بیماری کا نام لکھیں۔',
    otherConditionsTooLong: 'براہ کرم 200 حروف سے کم لکھیں۔',
    conditionsRequired: 'کوئی بیماری منتخب کریں، "دیگر" چنیں، یا "کوئی نہیں" چنیں۔',
    next: 'آگے',
    back: 'پیچھے',
    submit: 'فوری ضرورت جانچیں',
    checking: 'جانچ ہو رہی ہے کہ یہ کتنا فوری ہے...',
    ageGroupRequired: 'براہ کرم عمر کا گروپ منتخب کریں۔',
    sexRequired: 'براہ کرم مریض کی جنس منتخب کریں۔',
    pregnancyRequired: 'براہ کرم بتائیں کہ کیا وہ حاملہ ہیں۔',
    complaintRequired: 'براہ کرم بنیادی مسئلہ بیان کریں۔',
    complaintTooShort: 'براہ کرم کم از کم 3 حروف لکھیں۔',
    complaintTooLong: 'براہ کرم 2000 حروف سے کم لکھیں۔',
    durationRequired: 'براہ کرم دنوں کی تعداد درج کریں۔',
    durationInvalid: '0 سے 365 تک دنوں کی پوری تعداد درج کریں۔',
    severityRequired: 'براہ کرم سلائیڈر سے بتائیں کہ تکلیف کتنی شدید ہے۔',
    warningSignsRequired: 'کوئی خطرے کی علامت منتخب کریں، یا "ان میں سے کوئی نہیں" چنیں۔',
    callRescue: 'ریسکیو 1122 پر کال کریں',
    supportingAdvice: 'علاج کا بندوبست کرتے ہوئے معاون مشورہ',
    rootCause: 'بنیادی وجہ',
    dietPlan: 'غذائی منصوبہ',
    medicineClass: 'دوا کی قسم',
    medicineInformation: 'دوا کی معلومات',
    sources: 'ذرائع',
    sourceDatabase: 'ماخذ: ڈیٹا بیس',
    sourceAi: 'ماخذ: اے آئی',
    followUpLabel: 'مزید سوال پوچھیں',
    sendFollowUp: 'سوال بھیجیں',
    startNewCheck: 'نئی جانچ شروع کریں',
    translatingToPunjabi: 'پنجابی میں ترجمہ ہو رہا ہے...',
    punjabiTranslationFailed: 'پنجابی ترجمہ دستیاب نہیں، اس لیے اردو میں دکھایا جا رہا ہے۔',
    disclaimer:
      'شفاء AI صرف صحت سے متعلق آگاہی اور تعلیم فراہم کرتا ہے۔ یہ طبی تشخیص یا نسخہ نہیں ہے۔ اگر علامات شدید ہوں یا طبیعت بگڑے، تو فوری طور پر قریبی سرکاری ہسپتال یا بنیادی مرکز صحت (BHU) جائیں۔',
  },
  pa: {
    pageTitle: 'ویکھو ایہہ کنا ضروری اے',
    resultTitle: 'ایہہ کنا ضروری اے',
    stepPatient: 'مریض بارے',
    stepProblem: 'مسئلہ',
    stepWarningSigns: 'خطرے دیاں نشانیاں',
    stepBackground: 'صحت دا پچھوکڑ',
    ageGroupLabel: 'عمر دا گروپ',
    ageGroups: {
      infant: 'نیانا (1 سال توں گھٹ)',
      child: 'بچہ',
      adult: 'وڈا',
      elderly: 'بزرگ (60 سال یا ودھ)',
    },
    sexLabel: 'جنس',
    sexes: { male: 'مرد', female: 'زنانی', other: 'ہور' },
    pregnancyLabel: 'کی اوہ امید نال اے؟',
    yes: 'ہاں',
    no: 'نئیں',
    complaintLabel: 'وڈی تکلیف',
    complaintHint: 'اپنے لفظاں وچ وڈا مسئلہ دسو',
    durationLabel: 'کنے دناں توں',
    severityLabel: 'تکلیف کنی شدید اے؟ (0 = بالکل نئیں، 10 = بہت ودھ)',
    severityNotSet: 'ہلے چنیا نئیں گیا',
    warningSignsIntro: 'ایہناں وچوں جیہڑیاں نشانیاں ہنے ہین اوہناں تے نشان لاؤ',
    redFlags: {
      chest_pain: 'چھاتی وچ درد یا دباء',
      breathing_difficulty: 'ساہ لین وچ اوکھ',
      confusion: 'دماغی الجھن یا غیر معمولی اونگھ',
      fainting: 'بے ہوش ہو جانا',
      seizure: 'دورہ یا جھٹکے',
      severe_bleeding: 'بہت زیادہ لہو وگنا',
      stiff_neck_with_fever: 'بخار نال دھون آکڑنا',
      blood_in_vomit_or_stool: 'الٹی یا پخانے وچ لہو',
      stroke_signs: 'فالج دیاں نشانیاں (منہ ڈنگا ہونا، بانہہ وچ کمزوری، بولن وچ اوکھ)',
      infant_not_feeding: 'بچہ دودھ نئیں پی رہیا',
      severe_dehydration: 'پانی دی بہت گھاٹ (بہت گھٹ پیشاب، اندر دھسیاں اکھاں، بہت کمزوری)',
      pregnancy_with_bleeding_or_severe_pain: 'حمل دوران لہو آنا یا بہت درد',
      suicidal_thoughts: 'اپنے آپ نوں نقصان پہنچان دے خیال',
    },
    noneOfThese: 'ایہناں وچوں کوئی نئیں',
    backgroundIntro: 'کی مریض نوں ایہناں وچوں کوئی بیماری اے؟',
    conditions: {
      diabetes: 'شوگر',
      heart_disease: 'دل دی بیماری',
      hypertension: 'ہائی بلڈ پریشر',
    },
    otherCondition: 'ہور',
    otherConditionsLabel: 'کیہڑی ہور بیماری؟',
    noConditions: 'کوئی نئیں',
    otherConditionsRequired: 'مہربانی کر کے دوجی بیماری دا ناں لکھو۔',
    otherConditionsTooLong: 'مہربانی کر کے 200 حرفاں توں گھٹ لکھو۔',
    conditionsRequired: 'کوئی بیماری چنو، "ہور" چنو، یا "کوئی نئیں" چنو۔',
    next: 'اگے',
    back: 'پچھے',
    submit: 'ضرورت جانچو',
    checking: 'جانچ ہو رہی اے کہ ایہہ کنا ضروری اے...',
    ageGroupRequired: 'مہربانی کر کے عمر دا گروپ چنو۔',
    sexRequired: 'مہربانی کر کے مریض دی جنس چنو۔',
    pregnancyRequired: 'مہربانی کر کے دسو کہ اوہ امید نال اے یا نئیں۔',
    complaintRequired: 'مہربانی کر کے وڈا مسئلہ دسو۔',
    complaintTooShort: 'مہربانی کر کے گھٹ توں گھٹ 3 حرف لکھو۔',
    complaintTooLong: 'مہربانی کر کے 2000 حرفاں توں گھٹ لکھو۔',
    durationRequired: 'مہربانی کر کے دناں دی گنتی لکھو۔',
    durationInvalid: '0 توں 365 تک دناں دی پوری گنتی لکھو۔',
    severityRequired: 'مہربانی کر کے سلائیڈر نال دسو کہ تکلیف کنی شدید اے۔',
    warningSignsRequired: 'کوئی خطرے دی نشانی چنو، یا "ایہناں وچوں کوئی نئیں" چنو۔',
    callRescue: 'ریسکیو 1122 تے کال کرو',
    supportingAdvice: 'علاج دا بندوبست کردیاں مددگار صلاح',
    rootCause: 'اصل وجہ',
    dietPlan: 'خوراک دا پلان',
    medicineClass: 'دوائی دی قسم',
    medicineInformation: 'دوائی دی جانکاری',
    sources: 'ذریعے',
    sourceDatabase: 'ذریعہ: ڈیٹا بیس',
    sourceAi: 'ذریعہ: اے آئی',
    followUpLabel: 'ہور سوال پچھو',
    sendFollowUp: 'سوال بھیجو',
    startNewCheck: 'نویں جانچ شروع کرو',
    translatingToPunjabi: 'پنجابی وچ ترجمہ ہو رہیا اے...',
    punjabiTranslationFailed: 'پنجابی ترجمہ نئیں ہو سکیا، ایس لئی اردو وچ وکھایا جا رہیا اے۔',
    disclaimer:
      'شفاء AI صرف صحت بارے جانکاری تے تعلیم دیندا اے۔ ایہہ ڈاکٹری تشخیص یا نسخہ نئیں اے۔ جے علامتاں شدید ہون یا طبیعت وگڑے، تے فوراً نیڑے دے سرکاری ہسپتال یا بنیادی مرکز صحت (BHU) جاؤ۔',
  },
};
