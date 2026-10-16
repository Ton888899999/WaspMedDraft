export type Lang = 'ru' | 'uz' | 'en';

export const LANGS: { code: Lang; label: string }[] = [
  { code: 'ru', label: 'RU' },
  { code: 'uz', label: 'UZ' },
  { code: 'en', label: 'EN' },
];

const ru = {
  themeToggle: 'Переключить тему',
  nav: {
    problem: 'Проблема',
    how: 'Решение',
    features: 'Возможности',
    tech: 'Технология',
    faq: 'FAQ',
    forWho: 'Для кого',
    cta: 'Запросить демо',
  },
  hero: {
    pill: 'AI-ассистент радиолога · МРТ и КТ',
    h1a: 'Черновик протокола — ',
    h1accent: 'за минуту',
    h1b: ', а не за двадцать',
    leadA: 'WaspMed Draft — настольное приложение для macOS и Windows. Система подключается напрямую к аппаратам МРТ и МСКТ, анализирует исследование локально на рабочей станции врача и формирует структурированный черновик протокола. Модель обучена на ',
    leadB: '10 000+ размеченных МРТ и КТ',
    leadC: '. Финальное слово — всегда за врачом.',
    ctaDemo: 'Запросить демо',
    ctaHow: 'Как это работает ↓',
    points: [
      'Приложение для macOS и Windows',
      'Работает локально, без передачи данных в интернет',
      'Протоколы на русском и английском',
      'Каждое заключение подписывает врач',
    ],
  },
  mockup: {
    time: 'готово за 42 с',
    analyzing: 'анализ исследования…',
    finding: 'Находка: грыжа L4-L5 — подтвердить',
    verified: '✓ Врач проверил: заключение подтверждено',
    accept: '✓ Принять',
    edit: '✎ Править',
    print: '⎙ Печать',
    alt: 'МРТ пояснично-крестцового отдела позвоночника, сагиттальный срез',
    conclusionMark: 'ЗАКЛЮЧЕНИЕ',
    lines: [
      'МРТ пояснично-крестцового отдела. Протокол: Т2 sag/ax 4 мм, T1 sag/cor 4 мм, Т2 IRFSE sag 4 мм.',
      'Поясничный лордоз сохранён. Тела позвонков с краевыми заострениями, сигнальные характеристики сохранены.',
      'В замыкательных пластинках и костном мозге смежных тел L4-L5 — зоны низкого МР-сигнала на Т1ВИ и высокого на Т2ВИ (воспаление, выраженный отёк).',
      'Спинной мозг обычной формы, размеров и структуры. Конский хвост без особенностей.',
      'Дугоотростчатые суставы не гипертрофированы. Связки не утолщены.',
      'Высота межпозвонковых дисков снижена. Медианная грыжа диска L4-L5 (5 мм) с компримированием дурального мешка и корешка.',
      'Сагиттальный размер канала на уровне L4 — 10 мм; канал умеренно сужен на уровне грыжи. Межпозвонковые отверстия сужены.',
      'Паравертебральные ткани без патологических сигналов.',
      'ЗАКЛЮЧЕНИЕ: МР-признаки остеохондроза пояснично-крестцового отдела. Изменения в телах L4-L5 по типу Модик-1. Узкий позвоночный канал. Сакрализация L5. Медианная грыжа диска L4-L5. Рекомендована консультация невропатолога.',
    ],
  },
  stats: [
    { num: '10 000+', cap: 'размеченных МРТ/КТ исследований в датасете' },
    { num: '< 60 сек', cap: 'от загрузки исследования до черновика протокола' },
    { num: '8×', cap: 'быстрее рутинного описания вручную' },
    { num: '100%', cap: 'заключений проверяет и подписывает врач' },
  ],
  problem: {
    kicker: 'Проблема',
    h2: 'Радиологи тонут в рутине описаний',
    intro:
      'Объём лучевой диагностики растёт быстрее, чем число специалистов. Врач тратит большую часть смены не на анализ сложных случаев, а на набор однотипного текста.',
    cards: [
      {
        k: '15–20 мин',
        h3: 'На один протокол',
        p: 'Столько уходит на ручное описание рутинного МРТ или КТ — при потоке в десятки исследований за смену.',
      },
      {
        k: 'Дни ожидания',
        h3: 'Дефицит кадров в регионах',
        p: 'Снимки из районных клиник ждут описания днями: узких специалистов на местах не хватает.',
      },
      {
        k: 'Цена ошибки',
        h3: 'Усталость и переработки',
        p: 'Монотонный текст в конце смены повышает риск пропустить клинически значимую находку.',
      },
    ],
  },
  how: {
    kicker: 'Решение',
    h2: 'Три шага от снимка до подписанного протокола',
    intro:
      'WaspMed Draft встроен в привычный рабочий процесс: врач остаётся в одном окне — от просмотра серии до отправки заключения.',
    steps: [
      {
        h3: 'Загрузка исследования',
        p: 'DICOM-серии открываются во встроенном вьювере: окнирование, масштабирование, измерения. Исследования поступают напрямую с аппаратов МРТ и МСКТ или автоматически из PACS.',
      },
      {
        h3: 'AI-анализ и черновик',
        p: 'Мультимодальная модель находит значимые изменения и за секунды генерирует структурированный черновик протокола по клиническому шаблону.',
      },
      {
        h3: 'Проверка врачом',
        p: 'Врач правит черновик, подтверждает находки и подписывает заключение. Готовый протокол уходит в печать или в МИС.',
      },
    ],
  },
  features: {
    kicker: 'Возможности',
    h2: 'Всё рабочее место радиолога — в одном окне',
    intro: 'Не просто генерация текста: вьювер, шаблоны, редактор и интеграции собраны в единый процесс.',
    items: [
      {
        title: 'Встроенный DICOM-вьювер',
        text: 'Окнирование, масштабирование, измерения и навигация по сериям — в настольном приложении для macOS и Windows, без отдельного PACS-клиента.',
      },
      {
        title: 'Структурированные шаблоны',
        text: 'Черновик формируется по клиническому шаблону: локализация, описание, заключение (impression) — в привычной врачу структуре.',
      },
      {
        title: 'Подключение к аппаратам, МИС и PACS',
        text: 'Прямое подключение к аппаратам МРТ и МСКТ: исследования поступают в систему автоматически, готовый протокол уходит в МИС.',
      },
      {
        title: 'Редактор заключений',
        text: 'Врач принимает или правит каждую находку. Финальный текст — всегда решение специалиста.',
      },
      {
        title: 'Русский и английский',
        text: 'Протоколы на двух языках, шаблоны локальной клинической практики — из коробки.',
      },
      {
        title: 'Безопасность данных',
        text: 'Локальное развёртывание в контуре клиники: данные пациентов не уходят в интернет. Деперсонализация и шифрование при передаче и хранении.',
      },
    ],
  },
  audiences: {
    kicker: 'Для кого',
    h2: 'Где WaspMed Draft приносит пользу с первого дня',
    items: [
      {
        title: 'Частные клиники и диагностические центры',
        text: 'Больше описанных исследований за смену без расширения штата. Короче очередь — выше пропускная способность каждого аппарата.',
      },
      {
        title: 'Региональные больницы',
        text: 'Черновик появляется сразу после исследования, даже когда узкого специалиста нет на месте.',
      },
      {
        title: 'Телерадиология',
        text: 'Распределённая команда врачей работает в единой среде: исследование, черновик и редактор — в одном приложении.',
      },
      {
        title: 'Скрининговые программы',
        text: 'Массовые обследования без накопления неописанных исследований: рутину берёт на себя модель, за врачом остаётся контроль.',
      },
    ],
  },
  tech: {
    kicker: 'Технология',
    h2: 'Модель и данные',
    intro:
      'Под капотом — современная мультимодальная модель, адаптированная под реальные протоколы и стандарты описания лучевых исследований.',
    modelTitle: 'Модель',
    model: [
      { b: 'Мультимодальность', rest: ' — одновременно понимает изображение, анамнез и метаданные исследования' },
      { b: 'Специализация на радиологии', rest: ' — обучение на клинических протоколах МРТ/КТ' },
      { b: 'Структурированный вывод', rest: ' — по шаблонам протоколов: локализация, описание, заключение (impression)' },
      { b: 'Врач в контуре', rest: ' — система выдаёт черновик, а не диагноз' },
    ],
    datasetTitle: 'Датасет',
    dataset: [
      { b: '10 000+ исследований', rest: ' — МРТ и КТ с верифицированными протоколами врачей' },
      { b: 'Разметка практикующими радиологами', rest: ' — пары «снимок → заключение» для обучения и валидации' },
      { b: 'Локализация', rest: ' — русский и английский языки протоколов, шаблоны местной клинической практики' },
      { b: 'Деперсонализация', rest: ' — контроль качества данных и разметки на каждом этапе' },
    ],
    disclaimerB: 'Важно:',
    disclaimer:
      ' WaspMed Draft — ассистент врача, а не замена. Система ускоряет подготовку документации; клиническое решение и подпись всегда остаются за специалистом.',
    legalTitle: 'Конфиденциальность и правовой статус',
    legalPoints: [
      'Модель работает локально — на серверах клиники. Снимки и данные пациентов не передаются в интернет, во внешние облака или третьим лицам.',
      'Система генерирует шаблон-черновик заключения, а не медицинское заключение. Юридическую силу имеет только документ, проверенный и подписанный врачом.',
      'Если модель сгенерировала текст неточно, врач исправляет его в редакторе и сразу отправляет на печать — без потери времени.',
      'Данные для обучения деперсонализированы: ФИО и идентификаторы пациентов удаляются до обработки.',
    ],
  },
  faq: {
    kicker: 'FAQ',
    h2: 'Частые вопросы',
    items: [
      {
        q: 'WaspMed Draft заменяет врача?',
        a: 'Нет. Система готовит черновик протокола, а клиническое решение и подпись всегда остаются за специалистом. Это ассистент, который снимает рутину набора текста, а не автономный диагност.',
      },
      {
        q: 'Какие исследования поддерживаются?',
        a: 'Сейчас — МРТ и КТ. Модель обучена на 10 000+ размеченных исследованиях с верифицированными протоколами практикующих радиологов; покрытие областей расширяется.',
      },
      {
        q: 'Как это встроится в наш рабочий процесс?',
        a: 'Врач работает в настольном приложении для macOS и Windows: вьювер, AI-черновик и редактор — в одном окне. Интеграция с МИС и PACS настраивается под клинику, чтобы протоколы поступали напрямую в вашу систему.',
      },
      {
        q: 'Что происходит с персональными данными пациентов?',
        a: 'Модель развёртывается локально — в контуре клиники: снимки и данные пациентов не передаются в интернет и третьим лицам. Исследования деперсонализируются, данные шифруются при передаче и хранении.',
      },
      {
        q: 'Насколько точна модель?',
        a: 'Модель ускоряет подготовку документации, а не ставит диагноз: каждый черновик проверяет врач. Метрики качества на реальных кейсах показываем на демо — под ваш профиль исследований.',
      },
      {
        q: 'Сколько занимает внедрение?',
        a: 'Начинаем с пилота на вашем потоке исследований: согласуем шаблоны заключений, подключим интеграции и обучим команду. Сроки зависят от вашей ИТ-инфраструктуры — оценим на первом созвоне.',
      },
      {
        q: 'Сколько это стоит?',
        a: 'Стоимость зависит от числа рабочих мест и потока исследований — рассчитаем под вашу клинику на демо. Для первых клиник пилотный период проходит на специальных условиях.',
      },
    ],
  },
  demo: {
    kicker: 'Демо',
    h2: 'Посмотрите WaspMed Draft в деле',
    p: 'Покажем живой сценарий: загрузка DICOM-исследования, AI-черновик протокола и работа врача в редакторе. 20 минут онлайн — под профиль вашей клиники.',
    points: [
      'Разберём ваш поток исследований',
      'Покажем шаблоны заключений',
      'Обсудим интеграцию с МИС/PACS',
    ],
    form: {
      name: 'Имя',
      namePh: 'Азиз Каримов',
      org: 'Организация',
      orgPh: 'Клиника / центр диагностики',
      email: 'Email',
      emailPh: 'you@clinic.uz',
      phone: 'Телефон',
      phonePh: '+998 90 000 00 00',
      msg: 'Комментарий',
      msgPh: 'Какие исследования описываете чаще всего? Какая МИС/PACS у вас стоит?',
      submit: 'Запросить демо',
      sending: 'Отправляем…',
      okTitle: 'Заявка отправлена!',
      okSub: 'Команда WaspMed Draft свяжется с вами в ближайшее время.',
      again: 'Отправить ещё одну заявку',
      err: 'Не удалось отправить заявку. Попробуйте ещё раз чуть позже.',
      note: 'Заявка сразу попадает команде WaspMed Draft.',
    },
  },
  footer: {
    desc: 'AI-ассистент радиолога: черновик протокола МРТ и КТ за минуту. Финальное решение — всегда за врачом.',
    product: 'Продукт',
    company: 'Компания',
    copyright: '© 2026 WaspMed Draft',
    legal: 'WaspMed Draft — ассистент врача, а не медицинское изделие для постановки диагноза.',
  },
};

export type Dict = typeof ru;

const uz: Dict = {
  themeToggle: 'Mavzuni almashtirish',
  nav: {
    problem: 'Muammo',
    how: 'Yechim',
    features: 'Imkoniyatlar',
    tech: 'Texnologiya',
    faq: 'FAQ',
    forWho: 'Kimlar uchun',
    cta: 'Demo so‘rash',
  },
  hero: {
    pill: 'Radiolog uchun AI-yordamchi · MRT va KT',
    h1a: 'Protokol qoralamasi — ',
    h1accent: 'bir daqiqada',
    h1b: ', yigirma daqiqada emas',
    leadA: 'WaspMed Draft — macOS va Windows uchun mustaqil dastur. Tizim MRT va MSKT apparatlariga to‘g‘ridan-to‘g‘ri ulanadi, tadqiqotni lokal — shifokorning ish stansiyasida tahlil qiladi va protokolning tuzilmali qoralamasini shakllantiradi. Model ',
    leadB: '10 000+ belgilangan MRT va KT tadqiqotlarida',
    leadC: ' o‘qitilgan. Yakuniy so‘z — har doim shifokorniki.',
    ctaDemo: 'Demo so‘rash',
    ctaHow: 'Qanday ishlaydi ↓',
    points: [
      'macOS va Windows uchun dastur',
      'Lokal ishlaydi, ma’lumotlar internetga uzatilmaydi',
      'Protokollar rus va ingliz tillarida',
      'Har bir xulosani shifokor imzolaydi',
    ],
  },
  mockup: {
    time: '42 soniyada tayyor',
    analyzing: 'tadqiqot tahlil qilinmoqda…',
    finding: 'Topilma: L4-L5 churrasi — tasdiqlash',
    verified: '✓ Shifokor tekshirdi: xulosa tasdiqlandi',
    accept: '✓ Qabul qilish',
    edit: '✎ Tahrirlash',
    print: '⎙ Chop etish',
    alt: 'Bel-dumg‘aza umurtqa MRT, sagittal kesim',
    /* real reports in local practice are written in Russian — the demo report stays Russian in the UZ locale */
    conclusionMark: 'ЗАКЛЮЧЕНИЕ',
    lines: [
      'МРТ пояснично-крестцового отдела. Протокол: Т2 sag/ax 4 мм, T1 sag/cor 4 мм, Т2 IRFSE sag 4 мм.',
      'Поясничный лордоз сохранён. Тела позвонков с краевыми заострениями, сигнальные характеристики сохранены.',
      'В замыкательных пластинках и костном мозге смежных тел L4-L5 — зоны низкого МР-сигнала на Т1ВИ и высокого на Т2ВИ (воспаление, выраженный отёк).',
      'Спинной мозг обычной формы, размеров и структуры. Конский хвост без особенностей.',
      'Дугоотростчатые суставы не гипертрофированы. Связки не утолщены.',
      'Высота межпозвонковых дисков снижена. Медианная грыжа диска L4-L5 (5 мм) с компримированием дурального мешка и корешка.',
      'Сагиттальный размер канала на уровне L4 — 10 мм; канал умеренно сужен на уровне грыжи. Межпозвонковые отверстия сужены.',
      'Паравертебральные ткани без патологических сигналов.',
      'ЗАКЛЮЧЕНИЕ: МР-признаки остеохондроза пояснично-крестцового отдела. Изменения в телах L4-L5 по типу Модик-1. Узкий позвоночный канал. Сакрализация L5. Медианная грыжа диска L4-L5. Рекомендована консультация невропатолога.',
    ],
  },
  stats: [
    { num: '10 000+', cap: 'o‘quv datasetidagi belgilangan MRT/KT tadqiqotlari' },
    { num: '< 60 soniya', cap: 'tadqiqotni yuklashdan protokol qoralamasigacha' },
    { num: '8×', cap: 'qo‘lda tavsiflashdan tezroq' },
    { num: '100%', cap: 'xulosalarni shifokor tekshiradi va imzolaydi' },
  ],
  problem: {
    kicker: 'Muammo',
    h2: 'Radiologlar tavsiflash rutinasiga ko‘milib bormoqda',
    intro:
      'Nurli diagnostika hajmi mutaxassislar sonidan tezroq o‘smoqda. Shifokor ish vaqtining katta qismini murakkab holatlar tahliliga emas, bir xildagi protokol matnini terishga sarflaydi.',
    cards: [
      {
        k: '15–20 daqiqa',
        h3: 'Bitta protokol uchun',
        p: 'Rutin MRT yoki KT tadqiqotini qo‘lda tavsiflashga shuncha vaqt ketadi — bir smenada esa o‘nlab tadqiqot ko‘rib chiqiladi.',
      },
      {
        k: 'Kunlab kutish',
        h3: 'Hududlarda kadrlar tanqisligi',
        p: 'Tuman klinikalaridagi tadqiqotlar tavsifni kunlab kutadi: joylarda tor mutaxassislar yetarli emas.',
      },
      {
        k: 'Xatoning narxi',
        h3: 'Charchoq va ortiqcha yuklama',
        p: 'Smena oxirida monoton matn terish klinik ahamiyatga ega topilmani o‘tkazib yuborish xavfini oshiradi.',
      },
    ],
  },
  how: {
    kicker: 'Yechim',
    h2: 'Tadqiqotdan imzolangan protokolgacha — uch qadam',
    intro:
      'WaspMed Draft odatiy ish jarayoniga uzviy integratsiyalashadi: shifokor yagona oynada ishlaydi — seriyani ko‘rib chiqishdan xulosani yuborishgacha.',
    steps: [
      {
        h3: 'Tadqiqotni yuklash',
        p: 'DICOM-seriyalar o‘rnatilgan ko‘ruvchida ochiladi: oynalash, masshtablash, o‘lchashlar. Tadqiqotlar MRT va MSKT apparatlaridan to‘g‘ridan-to‘g‘ri yoki PACSdan avtomatik yuklanadi.',
      },
      {
        h3: 'AI-tahlil va qoralama',
        p: 'Multimodal model ahamiyatli o‘zgarishlarni topadi va soniyalarda klinik shablon bo‘yicha tuzilmali protokol qoralamasini yaratadi.',
      },
      {
        h3: 'Shifokor nazorati',
        p: 'Shifokor qoralamani tahrirlaydi, topilmalarni tasdiqlaydi va xulosani imzolaydi. Tayyor protokol chop etiladi yoki MISga yuboriladi.',
      },
    ],
  },
  features: {
    kicker: 'Imkoniyatlar',
    h2: 'Radiologning butun ish joyi — bitta oynada',
    intro:
      'Bu shunchaki matn generatsiyasi emas: ko‘ruvchi, shablonlar, muharrir va integratsiyalar yaxlit ish jarayoniga birlashtirilgan.',
    items: [
      {
        title: 'O‘rnatilgan DICOM-ko‘ruvchi',
        text: 'Oynalash, masshtablash, o‘lchashlar va seriyalar bo‘ylab navigatsiya — macOS va Windows uchun mustaqil dasturda, alohida PACS-mijozsiz.',
      },
      {
        title: 'Tuzilmali shablonlar',
        text: 'Qoralama klinik shablon bo‘yicha shakllanadi: lokalizatsiya, tavsif, xulosa (impression) — shifokorga odatiy tuzilmada.',
      },
      {
        title: 'Apparatlar, MIS va PACS bilan ulanish',
        text: 'MRT va MSKT apparatlariga to‘g‘ridan-to‘g‘ri ulanish: tadqiqotlar tizimga avtomatik tushadi, tayyor protokol MISga yuboriladi.',
      },
      {
        title: 'Xulosa muharriri',
        text: 'Shifokor har bir topilmani qabul qiladi yoki tahrirlaydi. Yakuniy matn — doim mutaxassis qarori.',
      },
      {
        title: 'Rus va ingliz tillari',
        text: 'Protokollar rus va ingliz tillarida, mahalliy klinik amaliyot shablonlari bilan birga — qo‘shimcha sozlashsiz.',
      },
      {
        title: 'Ma’lumotlar xavfsizligi',
        text: 'Klinika konturida lokal joylashtirish: bemor ma’lumotlari internetga chiqmaydi. Depersonalizatsiya hamda uzatish va saqlashda shifrlash.',
      },
    ],
  },
  audiences: {
    kicker: 'Kimlar uchun',
    h2: 'WaspMed Draft birinchi kundanoq samara beradigan yo‘nalishlar',
    items: [
      {
        title: 'Xususiy klinikalar va diagnostika markazlari',
        text: 'Shtatni kengaytirmasdan bir smenada ko‘proq tadqiqot tavsiflanadi. Navbat qisqaradi — har bir apparatning o‘tkazuvchanligi oshadi.',
      },
      {
        title: 'Hududiy shifoxonalar',
        text: 'Qoralama tadqiqot yakunlanishi bilanoq tayyor bo‘ladi — tor mutaxassis joyida bo‘lmagan taqdirda ham.',
      },
      {
        title: 'Teleradiologiya',
        text: 'Taqsimlangan shifokorlar jamoasi yagona muhitda ishlaydi: tadqiqot, qoralama va muharrir — bitta dasturda.',
      },
      {
        title: 'Skrining dasturlari',
        text: 'Ommaviy tekshiruvlarda tavsiflanmagan tadqiqotlar to‘planib qolmaydi: rutinani model o‘z zimmasiga oladi, nazorat shifokorda qoladi.',
      },
    ],
  },
  tech: {
    kicker: 'Texnologiya',
    h2: 'Model va ma’lumotlar',
    intro:
      'Tizim asosida — nurli tadqiqotlarni tavsiflashning real protokollari va standartlariga moslashtirilgan zamonaviy multimodal model.',
    modelTitle: 'Model',
    model: [
      { b: 'Multimodallik', rest: ' — tasvir, anamnez va tadqiqot metama’lumotlarini bir vaqtda tushunadi' },
      { b: 'Radiologiyaga ixtisoslashuv', rest: ' — MRT/KT klinik protokollarida o‘qitilgan' },
      { b: 'Tuzilmali natija', rest: ' — protokol shablonlari bo‘yicha: lokalizatsiya, tavsif, xulosa (impression)' },
      { b: 'Shifokor nazorat konturida', rest: ' — tizim tashxis emas, qoralama taqdim etadi' },
    ],
    datasetTitle: 'Dataset',
    dataset: [
      { b: '10 000+ tadqiqot', rest: ' — shifokorlarning tasdiqlangan protokollari bilan MRT va KT' },
      { b: 'Amaliyotchi radiologlar belgilagan', rest: ' — o‘qitish va validatsiya uchun «tasvir → xulosa» juftliklari' },
      { b: 'Lokalizatsiya', rest: ' — protokollar rus va ingliz tillarida, mahalliy klinik amaliyot shablonlari' },
      { b: 'Depersonalizatsiya', rest: ' — har bosqichda ma’lumotlar va belgilash sifati nazorati' },
    ],
    disclaimerB: 'Muhim:',
    disclaimer:
      ' WaspMed Draft — shifokorning yordamchisi, o‘rnini bosuvchi emas. Tizim hujjatlar tayyorlashni tezlashtiradi; klinik qaror va imzo doim mutaxassisda qoladi.',
    legalTitle: 'Maxfiylik va huquqiy maqom',
    legalPoints: [
      'Model lokal ishlaydi — klinika serverlarida. Suratlar va bemor ma’lumotlari internetga, tashqi bulutlarga yoki uchinchi shaxslarga uzatilmaydi.',
      'Tizim xulosaning shablon-qoralamasini yaratadi — bu tibbiy xulosa emas. Faqat shifokor tekshirib imzolagan hujjat yuridik kuchga ega.',
      'Model noaniq matn yaratsa, shifokor uni muharrirda to‘g‘rilab, darhol chop etishga yuboradi — vaqt yo‘qotilmaydi.',
      'O‘qitish ma’lumotlari depersonalizatsiya qilingan: bemor F.I.Sh. va identifikatorlari qayta ishlashdan oldin o‘chiriladi.',
    ],
  },
  faq: {
    kicker: 'FAQ',
    h2: 'Ko‘p so‘raladigan savollar',
    items: [
      {
        q: 'WaspMed Draft shifokor o‘rnini bosadimi?',
        a: 'Yo‘q. Tizim protokol qoralamasini tayyorlaydi, klinik qaror va imzo esa doim mutaxassisda qoladi. Bu matn terish rutinasini olib tashlaydigan yordamchi, avtonom diagnost emas.',
      },
      {
        q: 'Qaysi tadqiqotlar qo‘llab-quvvatlanadi?',
        a: 'Hozircha — MRT va KT. Model amaliyotchi radiologlarning tasdiqlangan protokollari bilan 10 000+ belgilangan tadqiqotda o‘qitilgan; qamrov kengayib boradi.',
      },
      {
        q: 'Bu bizning ish jarayonimizga qanday mos tushadi?',
        a: 'Shifokor macOS va Windows uchun mustaqil dasturda ishlaydi: ko‘ruvchi, AI-qoralama va muharrir — bitta oynada. MIS va PACS bilan integratsiya klinikaga moslab sozlanadi, protokollar to‘g‘ridan-to‘g‘ri tizimingizga tushadi.',
      },
      {
        q: 'Bemorlarning shaxsiy ma’lumotlari bilan nima bo‘ladi?',
        a: 'Model lokal joylashtiriladi — klinika konturida: suratlar va bemor ma’lumotlari internetga va uchinchi shaxslarga uzatilmaydi. Tadqiqotlar depersonalizatsiya qilinadi, ma’lumotlar uzatish va saqlashda shifrlanadi.',
      },
      {
        q: 'Model qanchalik aniq?',
        a: 'Model tashxis qo‘ymaydi, hujjat tayyorlashni tezlashtiradi: har bir qoralamani shifokor tekshiradi. Sifat ko‘rsatkichlarini real keyslar asosida demoda ko‘rsatamiz — tadqiqotlaringiz profiliga mos.',
      },
      {
        q: 'Joriy etish qancha vaqt oladi?',
        a: 'Tadqiqotlar oqimingizda pilotdan boshlaymiz: xulosa shablonlarini kelishamiz, integratsiyalarni ulaymiz va jamoani o‘qitamiz. Muddat IT-infratuzilmangizga bog‘liq — birinchi qo‘ng‘iroqda baholaymiz.',
      },
      {
        q: 'Bu qancha turadi?',
        a: 'Narx ish o‘rinlari soni va tadqiqotlar oqimiga bog‘liq — demoda klinikangiz uchun hisoblab beramiz. Birinchi klinikalar uchun pilot davri maxsus shartlarda o‘tadi.',
      },
    ],
  },
  demo: {
    kicker: 'Demo',
    h2: 'WaspMed Draftni amalda ko‘ring',
    p: 'Jonli stsenariyni ko‘rsatamiz: DICOM-tadqiqotni yuklash, protokolning AI-qoralamasi va shifokorning muharrirdagi ishi. Onlayn 20 daqiqa — klinikangiz profiliga mos.',
    points: [
      'Tadqiqotlar oqimingizni tahlil qilamiz',
      'Xulosa shablonlarini ko‘rsatamiz',
      'MIS/PACS bilan integratsiyani muhokama qilamiz',
    ],
    form: {
      name: 'Ism',
      namePh: 'Aziz Karimov',
      org: 'Tashkilot',
      orgPh: 'Klinika / diagnostika markazi',
      email: 'Email',
      emailPh: 'you@clinic.uz',
      phone: 'Telefon',
      phonePh: '+998 90 000 00 00',
      msg: 'Izoh',
      msgPh: 'Ko‘pincha qaysi tadqiqotlarni tavsiflaysiz? Sizda qaysi MIS/PACS o‘rnatilgan?',
      submit: 'Demo so‘rash',
      sending: 'Yuborilmoqda…',
      okTitle: 'Ariza yuborildi!',
      okSub: 'WaspMed Draft jamoasi tez orada siz bilan bog‘lanadi.',
      again: 'Yana bitta ariza yuborish',
      err: 'Arizani yuborib bo‘lmadi. Birozdan so‘ng qayta urinib ko‘ring.',
      note: 'Ariza to‘g‘ridan-to‘g‘ri WaspMed Draft jamoasiga tushadi.',
    },
  },
  footer: {
    desc: 'Radiolog uchun AI-yordamchi: MRT va KT protokoli qoralamasi bir daqiqada. Yakuniy qaror — doim shifokorda.',
    product: 'Mahsulot',
    company: 'Kompaniya',
    copyright: '© 2026 WaspMed Draft',
    legal: 'WaspMed Draft — shifokor yordamchisi, tashxis qo‘yish uchun tibbiy buyum emas.',
  },
};

const en: Dict = {
  themeToggle: 'Toggle theme',
  nav: {
    problem: 'Problem',
    how: 'Solution',
    features: 'Features',
    tech: 'Technology',
    faq: 'FAQ',
    forWho: 'Who it’s for',
    cta: 'Request a demo',
  },
  hero: {
    pill: 'AI assistant for radiologists · MRI & CT',
    h1a: 'A draft report — ',
    h1accent: 'in a minute',
    h1b: ', not twenty',
    leadA: 'WaspMed Draft is a desktop application for macOS and Windows. It connects directly to MRI and MSCT scanners, analyzes the study locally on the physician’s workstation and produces a structured draft report. The model is trained on ',
    leadB: '10,000+ annotated MRI and CT studies',
    leadC: '. The final word always belongs to the physician.',
    ctaDemo: 'Request a demo',
    ctaHow: 'How it works ↓',
    points: [
      'Desktop app for macOS and Windows',
      'Runs locally — no data sent to the internet',
      'Reports in Russian and English',
      'Every report is signed by a physician',
    ],
  },
  mockup: {
    time: 'ready in 42 s',
    analyzing: 'analyzing the study…',
    finding: 'Finding: L4-L5 herniation — confirm',
    verified: '✓ Physician reviewed: report confirmed',
    accept: '✓ Accept',
    edit: '✎ Edit',
    print: '⎙ Print',
    alt: 'Lumbosacral spine MRI, sagittal slice',
    conclusionMark: 'CONCLUSION',
    lines: [
      'Lumbosacral spine MRI. Protocol: T2 sag/ax 4 mm, T1 sag/cor 4 mm, T2 IRFSE sag 4 mm.',
      'Lumbar lordosis is preserved. Vertebral bodies show marginal osteophytes; signal characteristics preserved.',
      'Endplates and bone marrow of the adjacent L4-L5 bodies show low T1 / high T2 signal zones (inflammation, marked edema).',
      'The spinal cord is normal in shape, size and structure. Cauda equina unremarkable.',
      'Facet joints are not hypertrophied. Ligaments are not thickened.',
      'Intervertebral disc height is reduced. Median L4-L5 disc herniation (5 mm) compressing the dural sac and nerve root.',
      'Sagittal canal diameter at L4 — 10 mm; the canal is moderately narrowed at the herniation level. Neural foramina are narrowed.',
      'Paravertebral soft tissues show no pathological signal.',
      'CONCLUSION: MR features of lumbosacral osteochondrosis. Modic type 1 changes in the L4-L5 bodies. Narrow spinal canal. Sacralization of L5. Median L4-L5 disc herniation. Neurologist consultation is recommended.',
    ],
  },
  stats: [
    { num: '10,000+', cap: 'annotated MRI/CT studies in the training dataset' },
    { num: '< 60 sec', cap: 'from study upload to a draft report' },
    { num: '8×', cap: 'faster than writing a routine report by hand' },
    { num: '100%', cap: 'of reports are reviewed and signed by a physician' },
  ],
  problem: {
    kicker: 'Problem',
    h2: 'Radiologists are drowning in routine reporting',
    intro:
      'Imaging volumes are growing faster than the number of specialists. Physicians spend most of a shift not on complex cases but on typing repetitive report text.',
    cards: [
      {
        k: '15–20 min',
        h3: 'Per report',
        p: 'That’s how long a routine MRI or CT description takes by hand — with dozens of studies per shift.',
      },
      {
        k: 'Days of waiting',
        h3: 'Staff shortage in the regions',
        p: 'Studies from district clinics wait days to be read: there aren’t enough subspecialists on site.',
      },
      {
        k: 'Cost of a mistake',
        h3: 'Fatigue and overtime',
        p: 'Monotonous text at the end of a shift raises the risk of missing a clinically significant finding.',
      },
    ],
  },
  how: {
    kicker: 'Solution',
    h2: 'Three steps from image to signed report',
    intro:
      'WaspMed Draft fits into the familiar workflow: the physician stays in one window — from viewing the series to sending the report.',
    steps: [
      {
        h3: 'Upload the study',
        p: 'DICOM series open in the built-in viewer: windowing, zoom, measurements. Studies arrive directly from MRI and MSCT scanners or automatically from PACS.',
      },
      {
        h3: 'AI analysis & draft',
        p: 'A multimodal model detects significant changes and generates a structured draft report from a clinical template in seconds.',
      },
      {
        h3: 'Physician review',
        p: 'The physician edits the draft, confirms findings and signs the report. The final report goes to print or to the HIS.',
      },
    ],
  },
  features: {
    kicker: 'Features',
    h2: 'The radiologist’s entire workspace in one window',
    intro: 'More than text generation: viewer, templates, editor and integrations combined into a single workflow.',
    items: [
      {
        title: 'Built-in DICOM viewer',
        text: 'Windowing, zoom, measurements and series navigation — inside the desktop app for macOS and Windows, no separate PACS client required.',
      },
      {
        title: 'Structured templates',
        text: 'The draft follows a clinical template: localization, description, impression — the way physicians are used to.',
      },
      {
        title: 'Scanner, HIS & PACS connectivity',
        text: 'Direct connection to MRI and MSCT scanners: studies arrive automatically, and finished reports go straight to your HIS.',
      },
      {
        title: 'Report editor',
        text: 'The physician accepts or edits every finding. The final text is always the specialist’s decision.',
      },
      {
        title: 'Russian & English',
        text: 'Reports in two languages and local clinical practice templates — out of the box.',
      },
      {
        title: 'Data security',
        text: 'On-premises deployment inside the clinic’s network: patient data never leaves it. De-identification plus encryption in transit and at rest.',
      },
    ],
  },
  audiences: {
    kicker: 'Who it’s for',
    h2: 'Where WaspMed Draft delivers value from day one',
    items: [
      {
        title: 'Private clinics & diagnostic centers',
        text: 'More studies reported per shift without growing the team. Shorter queues — higher throughput per scanner.',
      },
      {
        title: 'Regional hospitals',
        text: 'A draft appears right after the study — even when no subspecialist is on site.',
      },
      {
        title: 'Teleradiology',
        text: 'A distributed team of physicians works in a single environment: study, draft and editor — in one application.',
      },
      {
        title: 'Screening programs',
        text: 'Mass screening without a reporting backlog: the routine goes to the model, control stays with the physician.',
      },
    ],
  },
  tech: {
    kicker: 'Technology',
    h2: 'Model & data',
    intro:
      'Under the hood is a modern multimodal model adapted to real reporting protocols and standards for imaging studies.',
    modelTitle: 'Model',
    model: [
      { b: 'Multimodality', rest: ' — understands the image, clinical history and study metadata at once' },
      { b: 'Radiology specialization', rest: ' — trained on clinical MRI/CT reports' },
      { b: 'Structured output', rest: ' — follows report templates: localization, description, impression' },
      { b: 'Physician in the loop', rest: ' — the system produces a draft, not a diagnosis' },
    ],
    datasetTitle: 'Dataset',
    dataset: [
      { b: '10,000+ studies', rest: ' — MRI and CT with physician-verified reports' },
      { b: 'Annotated by practicing radiologists', rest: ' — image → report pairs for training and validation' },
      { b: 'Localization', rest: ' — reports in Russian and English, local clinical practice templates' },
      { b: 'De-identification', rest: ' — data privacy and annotation quality control at every stage' },
    ],
    disclaimerB: 'Important:',
    disclaimer:
      ' WaspMed Draft is a physician’s assistant, not a replacement. The system speeds up documentation; the clinical decision and signature always remain with the specialist.',
    legalTitle: 'Privacy & legal status',
    legalPoints: [
      'The model runs on-premises, on the clinic’s own servers. Images and patient data are never sent to the internet, external clouds or third parties.',
      'The system generates a draft report template, not a medical report. Only the document reviewed and signed by a physician has legal force.',
      'If the model gets something wrong, the physician corrects the text in the editor and sends it straight to print — no time lost.',
      'Training data is de-identified: patient names and identifiers are removed before processing.',
    ],
  },
  faq: {
    kicker: 'FAQ',
    h2: 'Frequently asked questions',
    items: [
      {
        q: 'Does WaspMed Draft replace the physician?',
        a: 'No. The system prepares a draft report, while the clinical decision and signature always remain with the specialist. It’s an assistant that removes the routine of typing, not an autonomous diagnostician.',
      },
      {
        q: 'Which studies are supported?',
        a: 'Currently MRI and CT. The model is trained on 10,000+ annotated studies with reports verified by practicing radiologists, and coverage keeps expanding.',
      },
      {
        q: 'How does it fit into our workflow?',
        a: 'The physician works in the desktop application for macOS and Windows: viewer, AI draft and editor in one window. HIS and PACS integration is configured per clinic so reports land directly in your system.',
      },
      {
        q: 'What happens to patients’ personal data?',
        a: 'The model is deployed on-premises, inside the clinic’s network: images and patient data are never sent to the internet or third parties. Studies are de-identified, and data is encrypted in transit and at rest.',
      },
      {
        q: 'How accurate is the model?',
        a: 'The model speeds up documentation rather than making a diagnosis: every draft is reviewed by a physician. We show quality metrics on real cases at the demo — tailored to your study profile.',
      },
      {
        q: 'How long does implementation take?',
        a: 'We start with a pilot on your study flow: agree on report templates, set up integrations and train the team. Timelines depend on your IT infrastructure — we’ll estimate them on the first call.',
      },
      {
        q: 'How much does it cost?',
        a: 'Pricing depends on the number of workstations and your study volume — we’ll calculate it for your clinic at the demo. Early-adopter clinics get special terms for the pilot period.',
      },
    ],
  },
  demo: {
    kicker: 'Demo',
    h2: 'See WaspMed Draft in action',
    p: 'We’ll walk through a live scenario: uploading a DICOM study, an AI draft report and the physician’s work in the editor. 20 minutes online — tailored to your clinic’s profile.',
    points: [
      'We’ll go through your study flow',
      'We’ll show report templates',
      'We’ll discuss HIS/PACS integration',
    ],
    form: {
      name: 'Name',
      namePh: 'Aziz Karimov',
      org: 'Organization',
      orgPh: 'Clinic / diagnostic center',
      email: 'Email',
      emailPh: 'you@clinic.uz',
      phone: 'Phone',
      phonePh: '+998 90 000 00 00',
      msg: 'Comment',
      msgPh: 'Which studies do you describe most often? Which HIS/PACS do you use?',
      submit: 'Request a demo',
      sending: 'Sending…',
      okTitle: 'Request sent!',
      okSub: 'The WaspMed Draft team will get back to you shortly.',
      again: 'Send another request',
      err: 'Couldn’t send the request. Please try again later.',
      note: 'Your request goes straight to the WaspMed Draft team.',
    },
  },
  footer: {
    desc: 'An AI assistant for radiologists: a draft MRI/CT report in a minute. The final decision always belongs to the physician.',
    product: 'Product',
    company: 'Company',
    copyright: '© 2026 WaspMed Draft',
    legal: 'WaspMed Draft is a physician’s assistant, not a medical device for making diagnoses.',
  },
};

export const T: Record<Lang, Dict> = { ru, uz, en };
