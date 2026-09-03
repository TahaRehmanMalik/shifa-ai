require('dotenv').config();
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const diseases = [
  {
    name_en: 'Type 2 Diabetes',
    name_ur: 'ذیابیطس ٹائپ 2 (شوگر)',
    name_pa: 'ذیابیطس ٹائپ 2 (شوگر)',
    symptoms_en:
      'Increased thirst and frequent urination, unexplained fatigue, blurred vision, slow-healing wounds, tingling or numbness in hands or feet, unexplained weight loss, frequent infections',
    symptoms_ur:
      'بار بار پیاس لگنا اور پیشاب آنا، بلاوجہ تھکاوٹ، دھندلا نظر آنا، زخموں کا دیر سے بھرنا، ہاتھ پاؤں میں جھنجھناہٹ یا سن ہونا، بلاوجہ وزن کم ہونا، بار بار انفیکشن ہونا',
    root_cause_en:
      "Type 2 diabetes develops when the body's cells become resistant to insulin, the hormone that moves sugar (glucose) from the blood into cells for energy. Over time the pancreas cannot produce enough insulin to overcome this resistance, so glucose builds up in the bloodstream. It is commonly associated with excess body weight (especially abdominal fat), a diet high in refined carbohydrates and sugar, physical inactivity, and a family history of diabetes.",
    root_cause_ur:
      'ذیابیطس ٹائپ 2 اس وقت ہوتی ہے جب جسم کے خلیے انسولین کے خلاف مزاحم ہو جاتے ہیں — انسولین وہ ہارمون ہے جو خون میں موجود شوگر (گلوکوز) کو توانائی کے لیے خلیوں تک پہنچاتا ہے۔ وقت کے ساتھ لبلبہ (Pancreas) اتنی انسولین نہیں بنا پاتا کہ اس مزاحمت پر قابو پا سکے، جس سے خون میں گلوکوز کی مقدار بڑھ جاتی ہے۔ اس کا تعلق عموماً زیادہ وزن (خاص طور پر پیٹ کی چربی)، زیادہ میٹھی اور ریفائنڈ غذاؤں والی خوراک، جسمانی سرگرمی کی کمی اور خاندان میں ذیابیطس کی تاریخ سے ہوتا ہے۔',
    diet_plan_en:
      'Build meals around high-fiber, low-glycemic foods: whole grains like brown rice, whole wheat roti, and oats instead of white rice and maida; plenty of non-starchy vegetables like bitter gourd (karela), spinach, bottle gourd (lauki), okra, and cucumber; whole legumes and lentils (daal, chana) for protein and fiber; and moderate portions of fruits like guava, apple, and papaya rather than mango or grapes. Replace sugary tea, soft drinks, and desserts with water, unsweetened tea, or fresh lime water. Eat smaller, more frequent meals instead of large ones, favor grilling, boiling, or light sauteing over deep frying, and include a short walk (even 15-20 minutes) after meals to help control blood sugar spikes.',
    diet_plan_ur:
      'خوراک کو زیادہ فائبر اور کم گلائسیمک انڈیکس والی غذاؤں پر مرکوز رکھیں: سفید چاول اور میدے کی بجائے براؤن رائس، گندم کی روٹی اور دلیہ استعمال کریں؛ کریلا، پالک، لوکی، بھنڈی اور کھیرے جیسی سبزیاں کثرت سے کھائیں؛ پروٹین اور فائبر کے لیے دالیں اور چنے شامل کریں؛ اور آم یا انگور کی بجائے امرود، سیب اور پپیتا جیسے پھل اعتدال میں کھائیں۔ میٹھی چائے، سوفٹ ڈرنکس اور مٹھائیوں کی جگہ پانی، بغیر چینی کی چائے یا تازہ لیموں پانی پیئیں۔ بڑے کھانوں کی بجائے تھوڑی تھوڑی مقدار میں بار بار کھانا کھائیں، تلنے کی بجائے گرل یا ابال کر پکائیں، اور کھانے کے بعد 15 سے 20 منٹ کی چہل قدمی کو معمول بنائیں تاکہ شوگر لیول کنٹرول میں رہے۔',
    medicine_class_en:
      'Doctors commonly manage Type 2 diabetes with oral medicines from the biguanide class (such as metformin) as a first-line option, sometimes alongside other classes like sulfonylureas or DPP-4 inhibitors depending on the individual case. This is general information only — the exact medicine and dose must be prescribed by a qualified doctor.',
    medicine_class_ur:
      'ڈاکٹر عموماً ذیابیطس ٹائپ 2 کے علاج کے لیے بگوانائیڈ کلاس کی ادویات (جیسے میٹفارمن) کو بطور پہلا انتخاب تجویز کرتے ہیں، اور بعض اوقات مریض کی حالت کے مطابق سلفونی لیوریا یا DPP-4 روکنے والی ادویات بھی شامل کی جاتی ہیں۔ یہ صرف عمومی معلومات ہیں — درست دوا اور مقدار کا تعین صرف مستند ڈاکٹر ہی کر سکتا ہے۔',
    search_keywords:
      'diabetes, type 2 diabetes, sugar, high blood sugar, shuger, ذیابیطس, شوگر, blood glucose, frequent urination, excessive thirst, blurred vision',
  },
  {
    name_en: 'Hypertension (High Blood Pressure)',
    name_ur: 'بلند فشارِ خون (ہائی بلڈ پریشر)',
    name_pa: 'بلند فشارِ خون (ہائی بلڈ پریشر)',
    symptoms_en:
      "Often no symptoms at all in early stages (a 'silent' condition), but may include headaches (especially at the back of the head), dizziness, blurred vision, chest discomfort, shortness of breath, nosebleeds, and a pounding feeling in the chest, neck, or ears",
    symptoms_ur:
      "عموماً ابتدائی مراحل میں کوئی علامت ظاہر نہیں ہوتی (یہ ایک 'خاموش' بیماری ہے)، تاہم سر درد (خاص طور پر سر کے پچھلے حصے میں)، چکر آنا، دھندلا نظر آنا، سینے میں تکلیف، سانس پھولنا، ناک سے خون آنا، اور سینے، گردن یا کانوں میں دھڑکن محسوس ہونا شامل ہو سکتے ہیں",
    root_cause_en:
      'Hypertension is commonly associated with the arteries narrowing or losing flexibility, which forces the heart to pump harder to circulate blood. Contributing factors typically include a diet high in salt and processed food, chronic stress, excess body weight, lack of physical activity, smoking, and a family history of high blood pressure. In many cases it develops gradually over years without a single identifiable cause.',
    root_cause_ur:
      'ہائی بلڈ پریشر کا تعلق عموماً شریانوں کے تنگ ہونے یا لچک کھو دینے سے ہوتا ہے، جس کی وجہ سے دل کو خون گردش کرنے کے لیے زیادہ زور لگانا پڑتا ہے۔ اس میں نمک اور پروسیسڈ غذاؤں کی زیادتی، مسلسل ذہنی دباؤ، زائد وزن، جسمانی سرگرمی کی کمی، تمباکو نوشی اور خاندان میں بلڈ پریشر کی تاریخ جیسے عوامل شامل ہوتے ہیں۔ اکثر یہ بیماری برسوں میں آہستہ آہستہ بڑھتی ہے اور اس کی کوئی ایک واضح وجہ نہیں ہوتی۔',
    diet_plan_en:
      'Reduce salt sharply — cook with minimal added salt, avoid papads, achar, and packaged/processed snacks, and rinse canned foods before eating. Increase potassium-rich foods such as bananas, spinach, sweet potatoes, and oranges, which help balance sodium\'s effect on blood pressure. Favor whole grains, low-fat dairy like yogurt, and healthy fats from sources like walnuts and olive oil over ghee-heavy cooking. Garlic, in food or as a supplement after checking with a doctor, is often mentioned for its mild blood-pressure-lowering effect. Limit tea, coffee, and energy drinks (caffeine can spike blood pressure temporarily), avoid smoking and alcohol entirely, and aim for at least 30 minutes of brisk walking most days of the week.',
    diet_plan_ur:
      'نمک کا استعمال نمایاں طور پر کم کریں — کھانا کم نمک کے ساتھ پکائیں، پاپڑ، اچار اور پیکٹ والے پروسیسڈ اسنیکس سے پرہیز کریں، اور ڈبہ بند غذاؤں کو کھانے سے پہلے دھو لیں۔ کیلا، پالک، شکرقندی اور مالٹے جیسی پوٹاشیم سے بھرپور غذائیں بڑھائیں جو نمک کے اثر کو متوازن کرنے میں مدد دیتی ہیں۔ گھی والے کھانوں کی بجائے ثابت اناج، دہی جیسی کم چکنائی والی ڈیری اور اخروٹ و زیتون کے تیل جیسے صحت مند چکنائی کے ذرائع اپنائیں۔ لہسن کو خوراک میں شامل کرنا (یا ڈاکٹر سے مشورے کے بعد سپلیمنٹ کے طور پر) بلڈ پریشر کم کرنے میں معاون سمجھا جاتا ہے۔ چائے، کافی اور انرجی ڈرنکس کم کریں (کیفین وقتی طور پر بلڈ پریشر بڑھا سکتی ہے)، تمباکو نوشی اور شراب سے مکمل پرہیز کریں، اور ہفتے کے اکثر دنوں میں کم از کم 30 منٹ تیز چہل قدمی کریں۔',
    medicine_class_en:
      'Doctors commonly treat hypertension with medicines from classes such as ACE inhibitors, ARBs (angiotensin receptor blockers), calcium channel blockers, or diuretics, often starting with one class and adjusting based on response. This is general information only — the exact medicine and dose must be prescribed by a qualified doctor.',
    medicine_class_ur:
      'ڈاکٹر عموماً ہائی بلڈ پریشر کے علاج کے لیے ACE inhibitors، ARBs (انجیوٹینسن ریسیپٹر بلاکرز)، کیلشیم چینل بلاکرز یا ڈائیوریٹکس جیسی ادویات کی کلاسز تجویز کرتے ہیں، اور مریض کے ردعمل کے مطابق دوا تبدیل کی جا سکتی ہے۔ یہ صرف عمومی معلومات ہیں — درست دوا اور مقدار کا تعین صرف مستند ڈاکٹر ہی کر سکتا ہے۔',
    search_keywords:
      'hypertension, high blood pressure, bp, blood pressure, بلڈ پریشر, فشار خون, headache dizziness, chest discomfort, silent condition',
  },
  {
    name_en: 'Gastric Acidity / Acid Reflux',
    name_ur: 'معدے کی تیزابیت / گیس',
    name_pa: 'معدے کی تیزابیت / گیس',
    symptoms_en:
      'Burning sensation in the chest or upper abdomen (heartburn), sour or bitter taste in the mouth, bloating and excessive belching, nausea, discomfort that worsens after eating or when lying down, and a persistent feeling of fullness or indigestion',
    symptoms_ur:
      'سینے یا معدے کے اوپری حصے میں جلن (ہارٹ برن)، منہ میں کھٹا یا تلخ ذائقہ آنا، پیٹ پھولنا اور زیادہ ڈکاریں آنا، متلی، کھانے کے بعد یا لیٹنے پر تکلیف کا بڑھنا، اور مسلسل بھاری پن یا بدہضمی کا احساس',
    root_cause_en:
      'Gastric acidity is commonly associated with excess stomach acid production or a weakening of the valve between the stomach and food pipe (esophagus), which allows acid to flow back upward. It is often triggered by eating spicy, oily, or fried food, eating large meals or eating too close to bedtime, excess tea or coffee, smoking, stress, and in some cases, an H. pylori bacterial infection.',
    root_cause_ur:
      'معدے کی تیزابیت کا تعلق عموماً معدے میں زیادہ تیزاب بننے یا معدے اور خوراک کی نالی (Esophagus) کے درمیان موجود والو کے کمزور ہونے سے ہوتا ہے، جس کی وجہ سے تیزاب واپس اوپر کی طرف آ جاتا ہے۔ یہ عموماً مصالحے دار، چکنائی والی یا تلی ہوئی غذا کھانے، بڑا کھانا کھانے یا سونے سے فوراً پہلے کھانے، زیادہ چائے یا کافی، تمباکو نوشی، ذہنی دباؤ اور بعض اوقات H. pylori نامی بیکٹیریا کے انفیکشن سے جنم لیتی ہے۔',
    diet_plan_en:
      'Avoid spicy, deep-fried, and heavily oily foods, along with citrus fruits, tomato-based dishes, and carbonated drinks, which commonly trigger reflux. Favor easily digestible foods like plain rice, boiled vegetables, bananas, oatmeal, and yogurt, and sip warm water or ajwain (carom seed) water after meals, which is traditionally used to ease digestion. Eat smaller meals more frequently rather than large heavy meals, avoid lying down for at least 2-3 hours after eating, and reduce tea, coffee, and cold drinks. A small amount of plain yogurt or a banana between meals can help soothe the stomach lining. Chewing food slowly and avoiding late-night eating also reduce symptoms significantly.',
    diet_plan_ur:
      'مصالحے دار، تلی ہوئی اور زیادہ چکنائی والی غذاؤں کے ساتھ ساتھ کھٹے پھل، ٹماٹر والی ڈشز اور کاربونیٹڈ مشروبات سے پرہیز کریں کیونکہ یہ عموماً تیزابیت بڑھاتے ہیں۔ سادہ چاول، ابلی ہوئی سبزیاں، کیلا، دلیہ اور دہی جیسی ہلکی اور آسانی سے ہضم ہونے والی غذائیں کھائیں، اور کھانے کے بعد نیم گرم پانی یا اجوائن کا پانی پئیں جو روایتی طور پر ہاضمے میں مدد دیتا ہے۔ بڑے بھاری کھانوں کی بجائے تھوڑی مقدار میں بار بار کھانا کھائیں، کھانے کے کم از کم 2 سے 3 گھنٹے تک نہ لیٹیں، اور چائے، کافی اور ٹھنڈے مشروبات کم کریں۔ کھانوں کے درمیان تھوڑا دہی یا کیلا معدے کو سکون دینے میں مددگار ہے۔ آہستہ آہستہ چبا کر کھانا اور رات دیر سے کھانے سے گریز کرنا بھی علامات میں نمایاں کمی لاتا ہے۔',
    medicine_class_en:
      'Doctors commonly recommend medicines from the antacid class for quick relief, or proton pump inhibitors (PPIs) and H2 blockers for more persistent acidity, depending on severity and frequency. This is general information only — the exact medicine and dose must be prescribed by a qualified doctor.',
    medicine_class_ur:
      'ڈاکٹر عموماً فوری آرام کے لیے اینٹی ایسڈ کلاس کی ادویات، جبکہ مستقل تیزابیت کے لیے شدت اور تعدد کے مطابق پروٹون پمپ روکنے والی ادویات (PPIs) یا H2 بلاکرز تجویز کرتے ہیں۔ یہ صرف عمومی معلومات ہیں — درست دوا اور مقدار کا تعین صرف مستند ڈاکٹر ہی کر سکتا ہے۔',
    search_keywords:
      'gastric, acidity, acid reflux, heartburn, gas, indigestion, تیزابیت, گیس, بدہضمی, سینے میں جلن, bloating',
  },
  {
    name_en: 'Fever',
    name_ur: 'بخار',
    name_pa: 'بخار',
    symptoms_en:
      'A body temperature higher than the normal range (around 98.6°F/37°C), often with chills or shivering followed by sweating, headache, muscle aches, general weakness and fatigue, loss of appetite, and irritability. Very high fevers can also lead to dehydration.',
    symptoms_ur:
      'جسم کا درجہ حرارت معمول (تقریباً 37 ڈگری سینٹی گریڈ) سے زیادہ ہو جانا، سردی لگ کر کپکپی طاری ہونا اور پھر پسینہ آنا، سر درد، جسم اور پٹھوں میں درد، عمومی کمزوری اور تھکاوٹ، بھوک کم لگنا، اور چڑچڑاپن۔ تیز بخار کی صورت میں جسم میں پانی کی کمی بھی ہو سکتی ہے۔',
    root_cause_en:
      "Fever is the body's natural defense response, most commonly triggered by an infection — viral or bacterial — such as a cold, flu, or a throat or urinary infection. Less commonly, it is associated with inflammatory conditions, certain medications, or immunizations. Fever itself is not a disease but a sign that the body is fighting something.",
    root_cause_ur:
      'بخار دراصل جسم کا قدرتی دفاعی ردعمل ہے جو زیادہ تر کسی انفیکشن (وائرل یا بیکٹیریل، جیسے نزلہ، فلو، یا گلے و پیشاب کی نالی کا انفیکشن) کے باعث ہوتا ہے۔ کم عام صورتوں میں اس کا تعلق ورم پیدا کرنے والی بیماریوں، بعض ادویات یا حفاظتی ٹیکوں سے بھی ہو سکتا ہے۔ بخار خود کوئی بیماری نہیں بلکہ اس بات کی علامت ہے کہ جسم کسی چیز کے خلاف مدافعت کر رہا ہے۔',
    diet_plan_en:
      "Focus on fluids to prevent dehydration: water, clear soup or broth, and oral rehydration solution (ORS) help replace what's lost through sweating; ice pops or diluted juice can help if appetite is low. Rest is important. If appetite is poor, don't force large meals — light, easy-to-digest food such as khichri, plain rice, or soup is enough when tolerated. Keep clothing and blankets light and the room at a comfortable temperature, and a lukewarm sponge bath can ease discomfort (avoid ice or cold water, which can trigger shivering). Paracetamol or ibuprofen can be used when the temperature is high enough to cause distress, but low-grade fevers often don't need medicine at all, since fever itself helps the body fight infection.",
    diet_plan_ur:
      'پانی کی کمی سے بچنے کے لیے سیال اشیاء پر توجہ دیں — پانی، صاف شوربہ اور اورل ری ہائیڈریشن سلوشن (ORS) پسینے سے ضائع ہونے والے پانی کی کمی پوری کرنے میں مدد دیتے ہیں؛ اگر بھوک کم ہو تو آئس پاپس یا ہلکا پھلوں کا رس بھی لیا جا سکتا ہے۔ آرام ضروری ہے۔ اگر کھانے کو دل نہ چاہے تو زبردستی بھاری کھانا نہ کھلائیں، بلکہ ہلکی اور آسانی سے ہضم ہونے والی غذا جیسے کھچڑی، سادہ چاول یا سوپ دیں۔ زیادہ کپڑے یا کمبل لادنے سے گریز کریں، کمرے کا درجہ حرارت آرام دہ رکھیں، اور نیم گرم پانی سے جسم صاف کرنا آرام دہ ثابت ہو سکتا ہے (برف یا ٹھنڈے پانی کا استعمال نہ کریں کیونکہ اس سے کپکپی بڑھ سکتی ہے)۔ اگر بخار تکلیف دہ حد تک زیادہ ہو تو پیراسیٹامول یا آئبوپروفین لی جا سکتی ہے، تاہم ہلکے بخار میں اکثر دوا کی ضرورت نہیں ہوتی کیونکہ بخار خود انفیکشن سے لڑنے میں مددگار ہوتا ہے۔',
    medicine_class_en:
      "Antipyretics such as paracetamol (acetaminophen) or ibuprofen are commonly used to bring down a fever and ease discomfort when the temperature is high enough to cause distress; low-grade fevers often don't need medicine at all. This is general information only — a doctor should confirm the right medicine and dose.",
    medicine_class_ur:
      'بخار کم کرنے اور تکلیف میں آرام کے لیے عموماً اینٹی پائریٹک ادویات جیسے پیراسیٹامول یا آئبوپروفین استعمال کی جاتی ہیں، خاص طور پر جب درجہ حرارت اتنا زیادہ ہو کہ تکلیف دے؛ ہلکے بخار میں اکثر دوا کی ضرورت نہیں پڑتی۔ یہ صرف عمومی معلومات ہیں — درست دوا اور مقدار کا تعین صرف مستند ڈاکٹر ہی کر سکتا ہے۔',
    search_keywords:
      'fever, high temperature, bukhar, بخار, body temperature, chills, jism garam, feeling hot, تیز بخار, tap, high body temp',
  },
  {
    name_en: 'Common Cold & Flu',
    name_ur: 'نزلہ زکام',
    name_pa: 'نزلہ زکام',
    symptoms_en:
      'A blocked or runny nose, sneezing, sore throat, cough, mild fever, headache, muscle or body aches, fatigue, and general unwellness. Flu symptoms tend to come on more suddenly and severely than a cold, often with a higher fever, chills, and more pronounced body aches.',
    symptoms_ur:
      'ناک بند ہونا یا بہنا، چھینکیں آنا، گلے میں خراش، کھانسی، ہلکا بخار، سر درد، جسم اور پٹھوں میں درد، تھکاوٹ اور عمومی بے چینی۔ فلو کی علامات نزلہ زکام کے مقابلے میں زیادہ اچانک اور شدید ہوتی ہیں، اکثر تیز بخار، سردی لگنے اور جسم کے شدید درد کے ساتھ۔',
    root_cause_en:
      'Both are viral infections of the nose, throat, and airways — the common cold is usually caused by rhinoviruses and similar viruses, while flu is caused specifically by influenza viruses, which tend to cause more severe illness. Both spread through droplets from coughing and sneezing, and via contaminated hands and surfaces. Antibiotics do not work against these viruses.',
    root_cause_ur:
      'یہ دونوں بیماریاں ناک، گلے اور سانس کی نالی کے وائرل انفیکشن سے ہوتی ہیں — عام نزلہ زکام رائنو وائرس اور اسی طرح کے دیگر وائرسز سے، جبکہ فلو خاص طور پر انفلوئنزا وائرس سے ہوتا ہے جو زیادہ شدید بیماری کا سبب بن سکتا ہے۔ دونوں کھانسی اور چھینک سے نکلنے والی بوندوں، اور آلودہ ہاتھوں یا سطحوں کے ذریعے پھیلتے ہیں۔ اینٹی بائیوٹکس ان وائرسز کے خلاف مؤثر نہیں ہوتیں۔',
    diet_plan_en:
      "Drink plenty of fluids, especially water, to avoid dehydration. For a sore throat, gargle with warm salt water (adults only) and try a warm honey-and-lemon drink (never give honey to babies under 1 year). Steam inhalation can ease a blocked nose. Rest, and eat light, nutritious food as your appetite allows — warm soup or broth, vitamin-C-rich fruits like citrus or guava, and ginger tea are all reasonable choices. Most people start to feel better within 1 to 2 weeks.",
    diet_plan_ur:
      'پانی کی کمی سے بچنے کے لیے کثرت سے سیال اشیاء، خاص طور پر پانی، پئیں۔ گلے کی خراش کے لیے نیم گرم پانی میں نمک ڈال کر غرارے کریں (صرف بڑوں کے لیے) اور شہد و لیموں والا نیم گرم مشروب لیں (ایک سال سے کم عمر بچوں کو شہد ہرگز نہ دیں)۔ ناک بند ہونے کی صورت میں بھاپ لینا آرام دہ ثابت ہو سکتا ہے۔ آرام کریں اور جیسے ہی بھوک لگے ہلکی اور غذائیت سے بھرپور خوراک جیسے سوپ، یخنی، لیموں یا امرود جیسے وٹامن سی سے بھرپور پھل، اور ادرک والی چائے لیں۔ عام طور پر یہ بیماری ایک سے دو ہفتوں میں خود بخود بہتر ہو جاتی ہے۔',
    medicine_class_en:
      'Doctors commonly recommend antipyretic/analgesic medicines such as paracetamol or ibuprofen to ease fever, body aches, and headache, along with decongestants or antihistamines for nasal symptoms if needed. Antibiotics are not effective against cold or flu viruses. This is general information only — a doctor should confirm the right medicine and dose.',
    medicine_class_ur:
      'ڈاکٹر عموماً بخار، جسمانی درد اور سر درد میں آرام کے لیے پیراسیٹامول یا آئبوپروفین جیسی ادویات تجویز کرتے ہیں، اور ضرورت پڑنے پر ناک بندش کے لیے ڈی کنجسٹنٹ یا اینٹی ہسٹامائن بھی دی جا سکتی ہیں۔ اینٹی بائیوٹکس نزلہ زکام یا فلو کے وائرس پر اثر انداز نہیں ہوتیں۔ یہ صرف عمومی معلومات ہیں — درست دوا اور مقدار کا تعین صرف مستند ڈاکٹر ہی کر سکتا ہے۔',
    search_keywords:
      'cold, flu, influenza, common cold, nazla, zukam, نزلہ, زکام, cough, khansi, کھانسی, runny nose, sore throat, gala kharab, body aches, fever with cold',
  },
  {
    name_en: 'Headache / Migraine',
    name_ur: 'سر درد / درد شقیقہ',
    name_pa: 'سر درد / درد شقیقہ',
    symptoms_en:
      'Intense throbbing or pulsing pain, usually on one side of the head, which can worsen with activity; nausea and vomiting; extreme sensitivity to light, sound, and sometimes smell; and in some people, warning "aura" symptoms beforehand such as flashes of light, blind spots, or tingling in the face, arm, or leg. Attacks can last from a few hours to several days.',
    symptoms_ur:
      'سر کے ایک طرف شدید دھڑکن دار یا کھنچاؤ والا درد جو حرکت کرنے سے بڑھ سکتا ہے؛ متلی اور قے؛ روشنی، آواز اور بعض اوقات خوشبو کے لیے غیرمعمولی حساسیت؛ اور بعض افراد میں درد سے پہلے "اورا" کی علامات جیسے آنکھوں کے سامنے چمک، دھندلاہٹ، یا چہرے، بازو یا ٹانگ میں جھنجھناہٹ محسوس ہونا۔ درد کا دورہ چند گھنٹوں سے لے کر کئی دنوں تک رہ سکتا ہے۔',
    root_cause_en:
      "Migraine is linked to abnormal chemical and electrical activity involving the brain, nerves, and blood vessels around the skull, though the exact cause isn't fully understood. Attacks are often triggered by specific factors such as certain foods and drinks (aged cheese, chocolate, caffeine, alcohol, processed meats), skipping meals, dehydration, poor or irregular sleep, stress, hormonal changes, and bright lights or strong smells.",
    root_cause_ur:
      'درد شقیقہ کا تعلق دماغ، اعصاب اور کھوپڑی کے ارد گرد خون کی نالیوں میں غیرمعمولی کیمیائی اور برقی سرگرمی سے ہوتا ہے، اگرچہ اس کی مکمل وجہ ابھی تک واضح نہیں۔ اس کے دورے اکثر مخصوص محرکات سے شروع ہوتے ہیں جیسے بعض غذائیں اور مشروبات (پرانا پنیر، چاکلیٹ، کیفین، الکحل، پروسیسڈ گوشت)، کھانا چھوڑنا، پانی کی کمی، نیند کی خرابی یا بے قاعدگی، ذہنی دباؤ، ہارمونل تبدیلیاں، اور تیز روشنی یا تیز خوشبو۔',
    diet_plan_en:
      'Avoid common trigger foods — aged cheese, chocolate, caffeine, alcohol, cured or processed meats (salami, hot dogs), foods high in MSG or nitrates, and citrus or high-amine fruits if they personally seem to trigger attacks. Eat regular meals at even intervals (roughly every 4 hours) and avoid skipping meals or fasting for long periods, since hunger and low blood sugar are common triggers. Stay well hydrated with water throughout the day. A diet rich in fruits, vegetables, and omega-3 sources like fish may help lower headache frequency and severity. Keeping a food-and-headache diary can help identify personal triggers, since these vary from person to person.',
    diet_plan_ur:
      'عام محرک غذاؤں سے پرہیز کریں — پرانا پنیر، چاکلیٹ، کیفین، الکحل، پروسیسڈ یا کیورڈ گوشت (سلامی، ہاٹ ڈاگ)، MSG یا زیادہ نائٹریٹ والی غذائیں، اور اگر ذاتی طور پر محرک محسوس ہوں تو کھٹے پھل بھی کم کریں۔ کھانا وقت پر اور باقاعدگی سے (تقریباً ہر 4 گھنٹے بعد) کھائیں اور کبھی طویل عرصے تک بھوکا نہ رہیں، کیونکہ بھوک یا کم شوگر لیول ایک عام محرک ہے۔ دن بھر بھرپور مقدار میں پانی پیئیں۔ پھل، سبزیاں اور مچھلی جیسے اومیگا-3 سے بھرپور غذائیں سر درد کی شدت اور تعدد کم کرنے میں مددگار ثابت ہو سکتی ہیں۔ اپنی ذاتی محرک غذاؤں کی نشاندہی کے لیے خوراک اور سر درد کی ڈائری رکھنا مفید ہے، کیونکہ یہ ہر فرد میں مختلف ہو سکتی ہیں۔',
    medicine_class_en:
      'For occasional attacks, doctors commonly recommend simple pain relievers such as paracetamol, ibuprofen, or aspirin; for more frequent or severe migraines, they may prescribe migraine-specific medicines such as triptans, or preventive medicines taken regularly. This is general information only — a doctor should confirm the right medicine and dose.',
    medicine_class_ur:
      'کبھی کبھار ہونے والے درد کے لیے ڈاکٹر عموماً سادہ درد کش ادویات جیسے پیراسیٹامول، آئبوپروفین یا اسپرین تجویز کرتے ہیں؛ زیادہ بار یا شدید درد شقیقہ کے لیے مخصوص ادویات جیسے ٹرپٹانز، یا باقاعدگی سے لی جانے والی احتیاطی ادویات تجویز کی جا سکتی ہیں۔ یہ صرف عمومی معلومات ہیں — درست دوا اور مقدار کا تعین صرف مستند ڈاکٹر ہی کر سکتا ہے۔',
    search_keywords:
      'headache, migraine, sar dard, سر درد, درد شقیقہ, one sided headache, throbbing head pain, sir mein dard, sensitivity to light, nausea headache',
  },
  {
    name_en: 'Diarrhea / Food Poisoning',
    name_ur: 'اسہال / فوڈ پوائزننگ',
    name_pa: 'اسہال / فوڈ پوائزننگ',
    symptoms_en:
      'Frequent, loose or watery stools, stomach cramps or pain, nausea, vomiting, loss of appetite, mild fever, and in more severe cases signs of dehydration such as thirst, a dry mouth, dizziness, or reduced urination.',
    symptoms_ur:
      'بار بار پتلا یا پانی جیسا پاخانہ آنا، پیٹ میں مروڑ یا درد، متلی، قے، بھوک میں کمی، ہلکا بخار، اور شدید صورت میں پانی کی کمی کی علامات جیسے پیاس، منہ کا خشک ہونا، چکر آنا یا پیشاب کم آنا۔',
    root_cause_en:
      'Usually caused by an infection of the gut from contaminated food or water — from viruses (like norovirus), bacteria (like Salmonella or Campylobacter), or parasites — commonly called food poisoning or gastroenteritis. It can also be triggered by certain medications, food intolerances, or too much alcohol or caffeine. Most cases clear up on their own within about a week.',
    root_cause_ur:
      'عموماً یہ آلودہ خوراک یا پانی سے آنتوں کے انفیکشن کے باعث ہوتا ہے — وائرس (جیسے نوروو وائرس)، بیکٹیریا (جیسے سالمونیلا یا کیمپائیلوبیکٹر) یا پیراسائٹس کے ذریعے، جسے عام طور پر فوڈ پوائزننگ یا گیسٹرو اینٹرائٹس کہا جاتا ہے۔ بعض اوقات یہ ادویات، غذائی حساسیت یا زیادہ الکحل و کیفین کے استعمال سے بھی ہو سکتا ہے۔ زیادہ تر کیسز ایک ہفتے کے اندر خود بخود ٹھیک ہو جاتے ہیں۔',
    diet_plan_en:
      'The most important thing is to avoid dehydration — take small, frequent sips of water or an oral rehydration solution (ORS); avoid fruit juice and fizzy drinks, which can make diarrhea worse. Eat when you feel able to, favoring bland, easily digestible foods such as plain rice, khichri, boiled potatoes, banana, toast, or yogurt, and avoid fatty or spicy foods. Mix ORS with clean, boiled water, which is especially important for young children and the elderly. Keep breastfeeding infants with smaller, more frequent feeds.',
    diet_plan_ur:
      'سب سے اہم چیز پانی کی کمی سے بچنا ہے — تھوڑی تھوڑی مقدار میں بار بار پانی یا اورل ری ہائیڈریشن سلوشن (ORS) پیئیں؛ پھلوں کا رس اور کاربونیٹڈ مشروبات نہ لیں کیونکہ یہ اسہال بڑھا سکتے ہیں۔ جیسے ہی کھانے کو دل چاہے، ہلکی اور آسانی سے ہضم ہونے والی غذا لیں جیسے سادہ چاول، کھچڑی، ابلے آلو، کیلا، ٹوسٹ یا دہی، اور تیل مصالحے والی یا چکنائی سے بھرپور غذاؤں سے پرہیز کریں۔ صاف یا ابلے ہوئے پانی میں گھول کر بنائے گئے ORS کا استعمال خاص طور پر بچوں اور بزرگوں کے لیے اہم ہے۔ دودھ پیتے بچوں کو ماں کا دودھ تھوڑی تھوڑی مقدار میں بار بار دیتے رہیں۔',
    medicine_class_en:
      'Oral rehydration salts (ORS) are the primary treatment recommended to prevent and treat dehydration; a doctor may also recommend antiemetics for vomiting or, only when a bacterial cause is confirmed, antibiotics — though these are not routinely needed since most cases are viral and resolve on their own. This is general information only — a doctor should confirm the right medicine and dose.',
    medicine_class_ur:
      'پانی کی کمی سے بچاؤ اور علاج کے لیے اورل ری ہائیڈریشن سالٹس (ORS) بنیادی علاج سمجھا جاتا ہے؛ ڈاکٹر قے کے لیے اینٹی ایمیٹک ادویات، یا صرف بیکٹیریل انفیکشن کی تصدیق ہونے پر اینٹی بائیوٹکس بھی تجویز کر سکتے ہیں — لیکن چونکہ زیادہ تر کیسز وائرل ہوتے ہیں اور خود بخود ٹھیک ہو جاتے ہیں، عام طور پر اینٹی بائیوٹکس کی ضرورت نہیں پڑتی۔ یہ صرف عمومی معلومات ہیں — درست دوا اور مقدار کا تعین صرف مستند ڈاکٹر ہی کر سکتا ہے۔',
    search_keywords:
      'diarrhea, diarrhoea, food poisoning, loose motions, ishaal, اسہال, پیٹ خراب, pait kharab, stomach upset, vomiting, qai, قے, dehydration',
  },
  {
    name_en: 'Typhoid',
    name_ur: 'ٹائیفائیڈ',
    name_pa: 'ٹائیفائیڈ',
    symptoms_en:
      'A prolonged, high fever that tends to rise gradually, along with fatigue, headache, nausea, abdominal pain, and either constipation or diarrhea; some people develop a rash. Untreated, severe cases can lead to serious complications.',
    symptoms_ur:
      'طویل عرصے تک رہنے والا تیز بخار جو آہستہ آہستہ بڑھتا ہے، تھکاوٹ، سر درد، متلی، پیٹ میں درد، اور قبض یا اسہال۔ بعض مریضوں میں جسم پر دانے بھی نمودار ہو سکتے ہیں۔ اگر علاج نہ کیا جائے تو شدید کیسز میں سنگین پیچیدگیاں پیدا ہو سکتی ہیں۔',
    root_cause_en:
      'Typhoid is caused by the bacterium Salmonella Typhi, which lives only in humans and spreads through food or water contaminated with the feces of an infected person. It is closely linked to inadequate access to safe drinking water and poor sanitation — a significant public health issue in parts of Pakistan, where outbreaks (including antibiotic-resistant strains) have been linked to contaminated municipal water supplies and damaged sewage systems, especially in Sindh.',
    root_cause_ur:
      'ٹائیفائیڈ سالمونیلا ٹائفی (Salmonella Typhi) نامی بیکٹیریا سے ہوتا ہے جو صرف انسانوں میں پایا جاتا ہے اور کسی متاثرہ شخص کے فضلے سے آلودہ خوراک یا پانی کے ذریعے پھیلتا ہے۔ اس کا گہرا تعلق صاف پینے کے پانی کی کمی اور ناقص نکاسیِ آب سے ہے — پاکستان کے بعض علاقوں، خاص طور پر سندھ، میں یہ ایک اہم مسئلہ ہے جہاں ٹوٹی پھوٹی سیوریج لائنوں کی وجہ سے پینے کے پانی کی فراہمی آلودہ ہو جاتی ہے، اور یہ ادویات کے خلاف مزاحم (ڈرگ ریزسٹنٹ) ٹائیفائیڈ کی وباؤں کا سبب بھی بنا ہے۔',
    diet_plan_en:
      'Drink only boiled or safely treated/bottled water, and avoid ice made from untreated water; eat only thoroughly cooked, hot food, and avoid raw or unpasteurized milk; wash fruit and vegetables well or peel them before eating; and wash your hands frequently, especially before eating and after using the toilet. During recovery, eat a soft, high-calorie, easily digestible diet — khichri, boiled rice, soup, mashed vegetables, and ripe banana — in small, frequent meals, and keep up fluids and ORS to offset dehydration from fever and diarrhea.',
    diet_plan_ur:
      'صرف ابلا یا محفوظ طریقے سے صاف کیا گیا پانی پئیں اور غیرمحفوظ پانی سے بنی برف سے پرہیز کریں؛ صرف اچھی طرح پکی ہوئی گرم غذا کھائیں اور کچے یا بغیر پاسچرائزڈ دودھ سے گریز کریں؛ پھل اور سبزیاں کھانے سے پہلے اچھی طرح دھو لیں یا چھیل لیں؛ اور کھانے سے پہلے و ٹوائلٹ استعمال کرنے کے بعد ہاتھ ضرور دھوئیں۔ بیماری کے دوران نرم، زیادہ کیلوریز والی اور آسانی سے ہضم ہونے والی غذا جیسے کھچڑی، ابلے چاول، سوپ، میشڈ سبزیاں اور پکا ہوا کیلا تھوڑی تھوڑی مقدار میں بار بار کھائیں، اور بخار و اسہال کی وجہ سے ہونے والی پانی کی کمی سے بچنے کے لیے سیال اشیاء اور ORS کا استعمال جاری رکھیں۔',
    medicine_class_en:
      'Typhoid is treated with antibiotics, though growing antibiotic resistance — including extensively drug-resistant strains reported in parts of Pakistan — is making treatment more complicated, so lab-confirmed diagnosis and the correct antibiotic choice matter. This is general information only — a doctor should confirm the right medicine and dose.',
    medicine_class_ur:
      'ٹائیفائیڈ کا علاج اینٹی بائیوٹکس سے کیا جاتا ہے، تاہم اینٹی بائیوٹکس کے خلاف بڑھتی ہوئی مزاحمت (بشمول پاکستان کے بعض علاقوں میں رپورٹ ہونے والے انتہائی مزاحم — ایکسٹینسیولی ڈرگ ریزسٹنٹ — کیسز) علاج کو مشکل بنا رہی ہے، اس لیے لیبارٹری تشخیص اور صحیح اینٹی بائیوٹک کا انتخاب اہم ہے۔ یہ صرف عمومی معلومات ہیں — درست دوا اور مقدار کا تعین صرف مستند ڈاکٹر ہی کر سکتا ہے۔',
    search_keywords:
      'typhoid, typhoid fever, ٹائیفائیڈ, میعادی بخار, miadi bukhar, prolonged fever, contaminated water fever, Salmonella Typhi, drug resistant typhoid Pakistan',
  },
  {
    name_en: 'Malaria',
    name_ur: 'ملیریا',
    name_pa: 'ملیریا',
    symptoms_en:
      'Fever, chills, and headache are the most common early symptoms, usually appearing within 10-15 days of being bitten by an infected mosquito, and can be mild at first. Without prompt treatment, malaria can progress to severe symptoms such as extreme fatigue, confusion, seizures, difficulty breathing, and jaundice.',
    symptoms_ur:
      'بخار، سردی لگنا اور سر درد سب سے عام ابتدائی علامات ہیں، جو عموماً متاثرہ مچھر کے کاٹنے کے 10 سے 15 دن کے اندر ظاہر ہوتی ہیں اور شروع میں ہلکی ہو سکتی ہیں۔ بروقت علاج نہ ہونے کی صورت میں یہ شدید علامات جیسے شدید کمزوری، ذہنی الجھن، دورے اور سانس لینے میں دشواری کی صورت اختیار کر سکتا ہے۔',
    root_cause_en:
      'Malaria is caused by Plasmodium parasites spread through the bite of infected female Anopheles mosquitoes; it does not spread directly from person to person. In Pakistan, transmission is seasonal and rises sharply during and after the monsoon (roughly June to September), when stagnant rainwater and flooding create ideal mosquito breeding conditions — Khyber Pakhtunkhwa, Sindh, and Balochistan are especially affected, and outbreaks have surged following major flooding.',
    root_cause_ur:
      'ملیریا پلازموڈیم (Plasmodium) نامی پیراسائٹ سے ہوتا ہے جو متاثرہ مادہ اینوفلیس (Anopheles) مچھر کے کاٹنے سے پھیلتا ہے؛ یہ ایک شخص سے دوسرے شخص میں براہ راست منتقل نہیں ہوتا۔ پاکستان میں اس کی منتقلی موسمی ہوتی ہے اور مون سون کے دوران اور بعد میں (تقریباً جون سے ستمبر) نمایاں طور پر بڑھ جاتی ہے، جب بارش کا کھڑا پانی اور سیلاب مچھروں کی افزائش کے لیے سازگار ماحول پیدا کرتے ہیں — خیبر پختونخوا، سندھ اور بلوچستان خاص طور پر متاثر ہوتے ہیں، اور بڑے سیلابوں کے بعد ملیریا کے کیسز میں نمایاں اضافہ دیکھا گیا ہے۔',
    diet_plan_en:
      'Prevention is the main defense — sleep under an insecticide-treated mosquito net, use mosquito repellent after dusk, wear covering clothing, and use window and door screens or clear stagnant water around the home, especially during and after monsoon season. During illness and recovery, drink plenty of fluids (water, ORS, or coconut water) to offset fever-related fluid loss, eat small, frequent, light meals — soup, khichri, banana, papaya — to maintain energy despite nausea, and include iron-rich foods such as leafy greens and lentils during recovery to help rebuild after the anemia malaria can cause. Rest is essential.',
    diet_plan_ur:
      'بچاؤ سب سے اہم دفاع ہے — کیڑے مار دوا لگی مچھر دانی میں سوئیں، شام کے بعد مچھر بھگانے والی کریمیں یا اسپرے استعمال کریں، جسم کو ڈھانپنے والے کپڑے پہنیں، اور کھڑکیوں دروازوں پر جالیاں لگائیں یا گھر کے ارد گرد خاص طور پر مون سون کے دوران و بعد میں کھڑا پانی جمع نہ ہونے دیں۔ بیماری کے دوران اور صحت یابی کے مرحلے میں بخار کی وجہ سے ضائع ہونے والے سیال کی کمی پوری کرنے کے لیے پانی، ORS یا ناریل پانی کثرت سے پیئیں، متلی کے باوجود توانائی برقرار رکھنے کے لیے تھوڑی تھوڑی مقدار میں ہلکی غذا جیسے سوپ، کھچڑی، کیلا اور پپیتا کھائیں، اور ملیریا سے ہونے والی خون کی کمی (انیمیا) سے نمٹنے کے لیے صحت یابی کے دوران آئرن سے بھرپور غذائیں جیسے سبز پتوں والی سبزیاں اور دالیں شامل کریں۔ آرام انتہائی ضروری ہے۔',
    medicine_class_en:
      'Malaria is treated with specific antimalarial medicines, chosen based on the Plasmodium species involved and local drug-resistance patterns — commonly artemisinin-based combination therapies (ACTs). This is general information only — a doctor should confirm the right medicine and dose.',
    medicine_class_ur:
      'ملیریا کا علاج مخصوص اینٹی ملیریل ادویات سے کیا جاتا ہے، جن کا انتخاب پلازموڈیم کی قسم اور مقامی طور پر ادویات کے خلاف مزاحمت کے رجحان کے مطابق کیا جاتا ہے — عام طور پر آرٹیمسینن پر مبنی مشترکہ تھراپی (ACTs) استعمال ہوتی ہے۔ یہ صرف عمومی معلومات ہیں — درست دوا اور مقدار کا تعین صرف مستند ڈاکٹر ہی کر سکتا ہے۔',
    search_keywords:
      'malaria, ملیریا, mosquito fever, machar ka bukhar, مچھر کا بخار, monsoon fever, chills and fever, Anopheles mosquito, Plasmodium, malaria Pakistan',
  },
];

async function run() {
  const dbName = process.env.DB_NAME;

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true,
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.query(`USE \`${dbName}\``);

  const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await connection.query(schemaSql);

  // schema.sql only creates the unique key on a fresh table (CREATE TABLE IF NOT
  // EXISTS), so back-fill it here for databases seeded before this key existed —
  // the upsert below depends on it to key ON DUPLICATE KEY UPDATE off name_en.
  try {
    await connection.query('ALTER TABLE diseases ADD UNIQUE KEY uq_diseases_name_en (name_en)');
  } catch (error) {
    if (error.code !== 'ER_DUP_KEYNAME') {
      throw error;
    }
  }

  for (const disease of diseases) {
    await connection.query(
      `INSERT INTO diseases
        (name_en, name_ur, name_pa, symptoms_en, symptoms_ur, root_cause_en, root_cause_ur, diet_plan_en, diet_plan_ur, medicine_class_en, medicine_class_ur, search_keywords)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        name_ur = VALUES(name_ur),
        name_pa = VALUES(name_pa),
        symptoms_en = VALUES(symptoms_en),
        symptoms_ur = VALUES(symptoms_ur),
        root_cause_en = VALUES(root_cause_en),
        root_cause_ur = VALUES(root_cause_ur),
        diet_plan_en = VALUES(diet_plan_en),
        diet_plan_ur = VALUES(diet_plan_ur),
        medicine_class_en = VALUES(medicine_class_en),
        medicine_class_ur = VALUES(medicine_class_ur),
        search_keywords = VALUES(search_keywords)`,
      [
        disease.name_en,
        disease.name_ur,
        disease.name_pa,
        disease.symptoms_en,
        disease.symptoms_ur,
        disease.root_cause_en,
        disease.root_cause_ur,
        disease.diet_plan_en,
        disease.diet_plan_ur,
        disease.medicine_class_en,
        disease.medicine_class_ur,
        disease.search_keywords,
      ]
    );
  }

  await connection.end();
  console.log(`Seed complete: ${diseases.length} diseases upserted into "${dbName}" (existing rows updated, matched by name_en; no duplicates created).`);
}

run().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
