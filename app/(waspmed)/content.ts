/**
 * Content of the WaspMed clinic-system landing in its three languages.
 * Screens are numbered on the page in the order they appear here, so a
 * screen can be added or moved without renumbering the rest.
 */
import type { IconId } from './icons';
import type { StaticImageData } from 'next/image';
import financeDashboard from './shots/finance-dashboard.jpg';
import queueDisplay from './shots/queue-display.jpg';
import labSystem from './shots/lab-system.jpg';
import reception from './shots/reception.jpg';
import medicalRecord from './shots/medical-record.jpg';
import treatmentTemplates from './shots/treatment-templates.jpg';
import labResults from './shots/lab-results.jpg';
import dicomViewer from './shots/dicom-viewer.jpg';
import aiReportDraft from './shots/ai-report-draft.jpg';
import reportLetterhead from './shots/report-letterhead.jpg';
import wards from './shots/wards.jpg';
import expenses from './shots/expenses.jpg';
import attendance from './shots/attendance.jpg';
import telegramBot from './shots/telegram-bot.jpg';

export const LANGS = ['uz', 'ru', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export type Text = Record<Lang, string>;

const t = (ru: string, uz: string, en: string): Text => ({ ru, uz, en });

export interface Shot {
  image: StaticImageData;
  /** Alt text, and the caption under the screenshot in the full-size view. */
  caption: Text;
}

export interface Screen {
  title: Text;
  lead: Text;
  checks: Text[];
  shot: Shot;
  /** A link under the checklist to a page about this part of the product. */
  more?: { href: string; label: Text };
}

export interface Department {
  icon: IconId;
  name: Text;
  screens: Screen[];
}

export const TITLES = t(
  'WaspMed — система управления клиникой',
  'WaspMed — клиникани бошқариш тизими',
  'WaspMed — clinic management system',
);

/** The radiology part of WaspMed has its own page. */
export const DRAFT_HREF = '/draft';

export const NAV = [
  { href: '#tour', label: t('Продукт', 'Маҳсулот', 'Product') },
  { href: '#modules', label: t('Модули', 'Модуллар', 'Modules') },
  { href: '#security', label: t('Безопасность', 'Хавфсизлик', 'Security') },
  { href: '#launch', label: t('Внедрение', 'Жорий этиш', 'Onboarding') },
  { href: '#faq', label: t('Вопросы', 'Саволлар', 'FAQ') },
  { href: DRAFT_HREF, label: t('WaspMed Draft', 'WaspMed Draft', 'WaspMed Draft') },
];

export const REQUEST_DEMO = t('Запросить демо', 'Демо сўраш', 'Request a demo');

const shot = (image: StaticImageData, caption: Text): Shot => ({ image, caption });

export const HERO = {
  badge: t('Работает в действующей клинике каждый день', 'Ҳар куни амалдаги клиникада ишлаяпти', 'Running daily in a working clinic'),
  lead: t(
    'WaspMed соединяет регистратуру, врачей, лабораторию, диагностику, стационар, кассу и персонал в одной системе. Директор видит деньги и загрузку клиники в реальном времени.',
    'WaspMed рўйхатхона, шифокорлар, лаборатория, диагностика, стационар, касса ва ходимларни битта тизимга бирлаштиради. Директор пул оқими ва клиника юкламасини реал вақтда кўради.',
    'WaspMed connects reception, doctors, the lab, diagnostics, inpatient care, the cash desk and staff in one system. The director sees revenue and clinic load in real time.',
  ),
  seeProduct: t('Смотреть продукт', 'Маҳсулотни кўриш', 'See the product'),
  fine: [
    t('Веб и Android', 'Веб ва Android', 'Web and Android'),
    t('Облако, без своего сервера', 'Булутда, ўз серверисиз', 'Cloud-based, no server of your own'),
    t('Интерфейс на узбекском', 'Интерфейс ўзбек тилида', 'Interface in Uzbek'),
  ],
  main: shot(financeDashboard, t('Финансовая панель директора', 'Директорнинг молиявий панели', "Director's financial dashboard")),
  right: shot(labSystem, t('Лабораторная система', 'Лаборатория тизими', 'Laboratory system')),
};

export const METRICS = [
  { value: '1 000+', label: t('пациентов в базе', 'бемор базада', 'patients in the database') },
  { value: '66', label: t('сотрудников в системе', 'ходим тизимда', 'staff in the system') },
  { value: '35', label: t('палат на трёх этажах', 'палата уч қаватда', 'wards on three floors') },
  { value: '22', label: t('роли с отдельными экранами', 'рол, ҳар бирининг ўз экрани', 'roles, each with its own screen') },
];
export const METRICS_NOTE = t(
  'Данные пилотной клиники на сентябрь 2026 года',
  'Пилот клиника маълумотлари, 2026 йил сентябрь',
  'Pilot clinic data, September 2026',
);

export const INTEGRATIONS = {
  title: t('Интеграции', 'Интеграциялар', 'Integrations'),
  items: [
    t('Hikvision', 'Hikvision', 'Hikvision'),
    t('Telegram', 'Telegram', 'Telegram'),
    t('Payme', 'Payme', 'Payme'),
    t('Click', 'Click', 'Click'),
    t('Google', 'Google', 'Google'),
    t('DICOM · OHIF', 'DICOM · OHIF', 'DICOM · OHIF'),
    t('МКБ-10', 'МКБ-10', 'ICD-10'),
    t('Excel · PDF', 'Excel · PDF', 'Excel · PDF'),
  ],
};

export const WHY = {
  eyebrow: t('Зачем', 'Нима учун', 'Why'),
  title: t(
    'Одна система вместо тетрадей, Excel и мессенджеров',
    'Дафтар, Excel ва мессенжерлар ўрнига битта тизим',
    'One system instead of notebooks, Excel and messengers',
  ),
  sub: t(
    'Клиника теряет деньги там, где данные переходят из рук в руки. WaspMed убирает эти стыки.',
    'Клиника маълумот қўлдан қўлга ўтадиган жойда пул йўқотади. WaspMed шу узилишларни йўқотади.',
    'A clinic loses money wherever data is handed from one person to another. WaspMed removes those handoffs.',
  ),
  before: {
    title: t('Обычно', 'Одатда', 'Usually'),
    items: [
      t(
        'Касса, стационар и врачи ведут учёт отдельно, итог сводят вручную',
        'Касса, стационар ва шифокорлар ҳисобни алоҳида юритади, якун қўлда чиқарилади',
        'The cash desk, inpatient unit and doctors keep separate records, and totals are merged by hand',
      ),
      t(
        'Процедуры и дни в палате теряются и не попадают в счёт',
        'Процедуралар ва палатадаги кунлар йўқолиб, ҳисобга тушмайди',
        'Procedures and ward days get lost and never reach the bill',
      ),
      t(
        'Возвраты и скидки проходят без подтверждения руководителя',
        'Қайтариш ва чегирмалар раҳбар тасдиғисиз ўтади',
        'Refunds and discounts go through without management approval',
      ),
      t('Опоздания и смены сотрудников считают на бумаге', 'Кечикиш ва сменалар қоғозда ҳисобланади', 'Lateness and shifts are tracked on paper'),
      t('Директор узнаёт выручку только в конце дня', 'Директор тушумни фақат кун охирида билади', 'The director learns the revenue only at the end of the day'),
    ],
  },
  after: {
    title: t('С WaspMed', 'WaspMed билан', 'With WaspMed'),
    items: [
      t(
        'Каждое назначение врача сразу становится строкой в кассе',
        'Шифокорнинг ҳар бир тайинлови дарҳол кассада қатор бўлади',
        "Every doctor's order instantly becomes a line at the cash desk",
      ),
      t(
        'Счёт стационара считается по фактическим дням и сеансам',
        'Стационар ҳисоби ҳақиқий кунлар ва сеанслар бўйича чиқади',
        'The inpatient bill is calculated from actual days and sessions',
      ),
      t(
        'Возвраты, скидки и авансы идут через подтверждение директора',
        'Қайтариш, чегирма ва аванслар директор тасдиғидан ўтади',
        "Refunds, discounts and advances require the director's approval",
      ),
      t('Давомат приходит с терминалов распознавания лиц', 'Давомат юзни таниш терминалларидан келади', 'Attendance comes from face recognition terminals'),
      t('Выручка, расходы и прибыль видны в реальном времени', 'Тушум, харажат ва фойда реал вақтда кўринади', 'Revenue, expenses and profit are visible in real time'),
    ],
  },
};

export const TOUR = {
  eyebrow: t('Продукт', 'Маҳсулот', 'Product'),
  title: t('Путь пациента от регистрации до выписки', 'Бемор йўли: рўйхатдан чиқаришгача', 'The patient journey from registration to discharge'),
  sub: t(
    'Все экраны сняты в рабочей системе. Выберите отдел, нажмите на скриншот, чтобы открыть его в полном размере.',
    'Барча экранлар ишлаётган тизимдан олинган. Бўлимни танланг, тўлиқ ўлчамда очиш учун расмни босинг.',
    'All screens are taken from the live system. Pick a department and click a screenshot to open it full size.',
  ),
};

/** A screen whose screenshot caption is its own title. */
const screen = (title: Text, lead: Text, checks: Text[], image: StaticImageData): Screen => ({
  title,
  lead,
  checks,
  shot: shot(image, title),
});

export const DEPARTMENTS: Department[] = [
  {
    icon: 'reception',
    name: t('Регистратура', 'Рўйхатхона', 'Reception'),
    screens: [
      screen(
        t('Регистратура и список пациентов', 'Рўйхатхона ва беморлар рўйхати', 'Reception and patient list'),
        t(
          'Ресепшн находит любого пациента за секунды и сразу видит его статус.',
          'Ресепшн исталган беморни сониялар ичида топади ва ҳолатини дарҳол кўради.',
          'Reception finds any patient in seconds and sees their status at once.',
        ),
        [
          t('Поиск по имени, фамилии и телефону', 'Исм, фамилия ва телефон бўйича қидирув', 'Search by first name, last name and phone'),
          t(
            'Фильтры: амбулатория, стационар, ожидают заселения, похожие ФИО',
            'Фильтрлар: амбулатор, стационар, жойлаштириш кутилмоқда, ўхшаш Ф.И.Ш.',
            'Filters: outpatient, inpatient, awaiting admission, similar names',
          ),
          t('Палата, койка и остаток дней прямо в строке', 'Палата, койка ва қолган кунлар қаторнинг ўзида', 'Ward, bed and days remaining right in the row'),
          t('Карта, оплата и счёт в один клик', 'Карта, тўлов ва ҳисоб бир босишда', 'Record, payment and bill in one click'),
          t('Кассовая смена с номером и числом чеков', 'Касса сменаси рақами ва чеклар сони билан', 'Cash shift with its number and receipt count'),
        ],
        reception,
      ),
    ],
  },
  {
    icon: 'steth',
    name: t('Врач', 'Шифокор', 'Doctor'),
    screens: [
      screen(
        t('Электронная медицинская карта', 'Электрон тиббий карта', 'Electronic medical record'),
        t(
          'Приём проходит в четыре шага, и ни одно поле не теряется.',
          'Қабул тўрт босқичда ўтади, бирорта майдон йўқолмайди.',
          'A visit takes four steps, and no field gets lost.',
        ),
        [
          t(
            'Жалобы, анамнез болезни и жизни, общий осмотр',
            'Шикоятлар, касаллик ва ҳаёт анамнези, умумий кўрик',
            'Complaints, medical and life history, general examination',
          ),
          t('Витальные показатели с расчётом ИМТ', 'Витал кўрсаткичлар, ТВИ авто ҳисоби билан', 'Vital signs with automatic BMI'),
          t('Дополнительные обследования и AI-анализ', 'Қўшимча текширувлар ва AI таҳлил', 'Additional examinations and AI analysis'),
          t('Итоговый диагноз по МКБ-10', 'МКБ-10 бўйича якуний ташхис', 'Final diagnosis coded in ICD-10'),
          t('Голосовая диктовка вместо набора текста', 'Матн териш ўрнига овозли диктовка', 'Voice dictation instead of typing'),
        ],
        medicalRecord,
      ),
      screen(
        t('Шаблоны планов лечения', 'Даволаш режаси шаблонлари', 'Treatment plan templates'),
        t(
          'Типовой план лечения применяется одной кнопкой.',
          'Намунавий даволаш режаси бир тугма билан қўлланади.',
          'A standard treatment plan is applied with one button.',
        ),
        [
          t(
            'Лекарства и процедуры с числом сеансов и временем',
            'Дори ва процедуралар, сеанслар сони ва вақти билан',
            'Medications and procedures with session counts and times',
          ),
          t('Амбулатория или стационар с числом дней', 'Амбулатор ёки стационар, кунлар сони билан', 'Outpatient or inpatient with the number of days'),
          t('Поиск по диагнозу, лекарству или процедуре', 'Ташхис, дори ёки процедура бўйича қидирув', 'Search by diagnosis, medication or procedure'),
          t('Свои шаблоны и шаблоны коллег', 'Ўз шаблонлари ва ҳамкасблар шаблонлари', "Your own templates and your colleagues' templates"),
        ],
        treatmentTemplates,
      ),
    ],
  },
  {
    icon: 'flask',
    name: t('Лаборатория', 'Лаборатория', 'Laboratory'),
    screens: [
      screen(
        t('Лабораторная информационная система', 'Лаборатория ахборот тизими', 'Laboratory information system'),
        t(
          'Лаборант видит очередь заказов и статус оплаты каждого анализа.',
          'Лаборант буюртмалар навбатини ва ҳар бир таҳлилнинг тўлов ҳолатини кўради.',
          'The lab technician sees the order queue and the payment status of every test.',
        ),
        [
          t('Новые, в работе и готовые за сегодня', 'Янги, жараёнда ва бугун тайёр бўлганлар', 'New, in progress and completed today'),
          t('Среднее время выполнения анализа', 'Таҳлил бажарилишининг ўртача вақти', 'Average turnaround time'),
          t('Отметка неоплаченных заказов', 'Тўланмаган буюртмалар белгиси', 'Unpaid orders are flagged'),
          t('Взятие образца и пакетная обработка', 'Намуна олиш ва тўплам билан ишлаш', 'Sample collection and batch processing'),
        ],
        labSystem,
      ),
      screen(
        t('Ввод результатов с нормами', 'Натижаларни нормалар билан киритиш', 'Result entry with reference ranges'),
        t(
          'Каждый показатель подсказан нормой, пропустить поле нельзя.',
          'Ҳар бир кўрсаткич ёнида нормаси бор, майдонни ўтказиб юбориб бўлмайди.',
          'Every value shows its reference range, and no field can be skipped.',
        ),
        [
          t('Нормы и единицы у каждого показателя', 'Ҳар бир кўрсаткичда норма ва ўлчов бирлиги', 'Reference range and units for every value'),
          t('Счётчик заполненных полей', 'Тўлдирилган майдонлар ҳисоблагичи', 'Counter of completed fields'),
          t('Уникальный код заказа', 'Буюртманинг ноёб коди', 'Unique order code'),
          t('Готовый PDF уходит пациенту в Telegram', 'Тайёр PDF беморга Telegram орқали юборилади', 'The finished PDF goes to the patient in Telegram'),
        ],
        labResults,
      ),
    ],
  },
  {
    icon: 'scan',
    name: t('Диагностика', 'Диагностика', 'Diagnostics'),
    screens: [
      screen(
        t('МРТ и DICOM-просмотрщик', 'МРТ ва DICOM кўрувчи', 'MRI and DICOM viewer'),
        t(
          'Снимки открываются в браузере без отдельной программы.',
          'Тасвирлар алоҳида дастурсиз браузерда очилади.',
          'Images open in the browser with no separate software.',
        ),
        [
          t('Серии снимков и переключение срезов', 'Тасвир сериялари ва кесимларни алмаштириш', 'Image series and slice navigation'),
          t('Окно и уровень, панорамирование, масштаб', 'Ойна ва даража, суриш, масштаб', 'Window and level, pan, zoom'),
          t('Открытие в OHIF для расширенной работы', 'Кенгайтирилган иш учун OHIF да очиш', 'Opens in OHIF for advanced work'),
          t('AI помогает составить черновик заключения', 'AI хулоса қораламасини тузишга ёрдам беради', 'AI helps draft the report'),
        ],
        dicomViewer,
      ),
      {
        ...screen(
          t('AI-черновик заключения рентгенолога', 'Рентгенолог хулосасининг AI қораламаси', 'AI draft of the radiology report'),
          t(
            'Система читает все срезы КТ или МРТ и пишет протокол по шаблону клиники. Врач проверяет и подписывает.',
            'Тизим КТ ёки МРТнинг барча кесимларини ўқийди ва клиника шаблони бўйича протокол ёзади. Шифокор текширади ва имзолайди.',
            'The system reads every CT or MRI slice and writes the report in the clinic’s template. The doctor reviews and signs it.',
          ),
          [
            t(
              'Все срезы серии и реконструкции в трёх плоскостях',
              'Сериянинг барча кесимлари ва уч текисликдаги реконструкциялар',
              'Every slice of the series plus reconstructions in three planes',
            ),
            t('18 шаблонов протоколов МСКТ и МРТ', 'МСКТ ва МРТ учун 18 та протокол шаблони', '18 CT and MRI report templates'),
            t(
              'Находки отмечены на снимке, клик открывает нужный срез',
              'Топилмалар тасвирда белгиланган, босилса керакли кесим очилади',
              'Findings are marked on the image; a click opens the right slice',
            ),
            t(
              'Размеры в миллиметрах по данным DICOM, а не на глаз',
              'Ўлчамлар кўз билан эмас, DICOM маълумотлари бўйича миллиметрда',
              'Sizes in millimetres from the DICOM data, not by eye',
            ),
            t(
              'Учитывает жалобы, вопрос врача и прошлое заключение',
              'Шикоятлар, шифокор саволи ва олдинги хулосани ҳисобга олади',
              'Uses the complaints, the referring question and the prior report',
            ),
          ],
          aiReportDraft,
        ),
        more: {
          href: DRAFT_HREF,
          label: t('Подробнее о WaspMed Draft', 'WaspMed Draft ҳақида батафсил', 'More about WaspMed Draft'),
        },
      },
      screen(
        t('Протокол на бланке клиники', 'Клиника бланкасидаги протокол', 'Report on the clinic letterhead'),
        t(
          'Врач правит текст в редакторе, и протокол сразу уходит в печать или PDF.',
          'Шифокор матнни муҳаррирда тузатади, протокол дарҳол чоп этишга ёки PDF га чиқади.',
          'The doctor edits the text in the editor and the report goes straight to print or PDF.',
        ),
        [
          t('Описание по разделам и отдельное заключение', 'Бўлимлар бўйича тавсиф ва алоҳида хулоса', 'Findings by section and a separate conclusion'),
          t('Правка текста и голосовая диктовка', 'Матнни таҳрирлаш ва овозли диктовка', 'Text editing and voice dictation'),
          t('Печать и PDF на бланке с подписью врача', 'Шифокор имзоси билан бланкада чоп этиш ва PDF', 'Print and PDF on letterhead with the doctor’s signature'),
          t('Сравнение черновика AI с протоколом врача', 'AI қораламасини шифокор протоколи билан солиштириш', 'AI draft compared with the doctor’s own report'),
          t('Окончательное заключение всегда ставит врач', 'Якуний хулосани доим шифокор беради', 'The final conclusion is always the doctor’s'),
        ],
        reportLetterhead,
      ),
    ],
  },
  {
    icon: 'bed',
    name: t('Стационар', 'Стационар', 'Inpatient'),
    screens: [
      screen(
        t('Палаты и койки', 'Палаталар ва койкалар', 'Wards and beds'),
        t(
          'Карта палат по этажам показывает, кто где лежит и сколько дней осталось.',
          'Қаватлар бўйича палаталар харитаси ким қаерда ётганини ва неча кун қолганини кўрсатади.',
          'A floor-by-floor ward map shows who is where and how many days remain.',
        ),
        [
          t('Занятость каждой койки и загрузка палаты', 'Ҳар бир койка бандлиги ва палата юкламаси', 'Occupancy of every bed and ward load'),
          t('Цена за сутки с уходом и без', 'Кунлик нарх, парвариш билан ва парваришсиз', 'Daily price with and without care'),
          t('Ответственная медсестра и удобства', 'Масъул ҳамшира ва қулайликлар', 'Responsible nurse and amenities'),
          t(
            'Бронь, перевод и выписка со счётом по фактическим дням',
            'Брон, кўчириш ва ҳақиқий кунлар бўйича ҳисоб билан чиқариш',
            'Booking, transfer and discharge billed by actual days',
          ),
        ],
        wards,
      ),
    ],
  },
  {
    icon: 'chart',
    name: t('Финансы', 'Молия', 'Finance'),
    screens: [
      screen(
        t('Финансовая панель директора', 'Директорнинг молиявий панели', "Director's financial dashboard"),
        t(
          'Выручка, чистая прибыль и все расходы на одном экране.',
          'Тушум, соф фойда ва барча харажатлар битта экранда.',
          'Revenue, net profit and all expenses on one screen.',
        ),
        [
          t(
            'Выручка, возвраты, скидки, расходы, зарплата, доля врача',
            'Тушум, қайтариш, чегирма, харажат, маош, шифокор улуши',
            "Revenue, refunds, discounts, expenses, payroll, doctor's share",
          ),
          t(
            'Наличные и карта раздельно, включая Payme и Click',
            'Нақд ва карта алоҳида, Payme ва Click билан',
            'Cash and card shown separately, including Payme and Click',
          ),
          t('Динамика по часам и доли направлений', 'Соатлар бўйича динамика ва йўналишлар улуши', 'Hourly trend and share by service line'),
          t('Z-отчёт смены в PDF и Excel', 'Смена Z-ҳисоботи PDF ва Excel да', 'Shift Z-report in PDF and Excel'),
        ],
        financeDashboard,
      ),
      screen(
        t('Расходы с анализом', 'Харажатлар таҳлили', 'Expense analytics'),
        t(
          'Каждый расход привязан к категории и сравнивается с прошлым периодом.',
          'Ҳар бир харажат тоифага боғланган ва олдинги давр билан таққосланади.',
          'Every expense has a category and is compared with the previous period.',
        ),
        [
          t('Расходы по дням и средний расход в день', 'Кунлар бўйича харажат ва кунлик ўртача', 'Expenses by day and the daily average'),
          t('Сравнение категорий с прошлым периодом', 'Тоифаларни олдинги давр билан таққослаш', 'Categories compared with the previous period'),
          t('Крупнейшая статья расходов видна сразу', 'Энг катта харажат моддаси дарҳол кўринади', 'The largest expense item is visible at once'),
        ],
        expenses,
      ),
    ],
  },
  {
    icon: 'clock',
    name: t('Персонал', 'Ходимлар', 'Staff'),
    screens: [
      screen(
        t('Давомат через Hikvision', 'Hikvision орқали давомат', 'Attendance via Hikvision'),
        t(
          'Терминалы распознавания лиц передают приходы и уходы в систему.',
          'Юзни таниш терминаллари келиш ва кетишни тизимга узатади.',
          'Face recognition terminals send check-ins and check-outs to the system.',
        ),
        [
          t('Кто на работе, кто опоздал, кто отсутствует', 'Ким ишда, ким кечикди, ким йўқ', 'Who is at work, who is late, who is absent'),
          t('Посещаемость за день и за месяц', 'Кунлик ва ойлик давомат', 'Attendance for the day and the month'),
          t('График в две смены и зарплата по часам', 'Икки сменали жадвал ва соатбай маош', 'Two-shift schedule and hourly payroll'),
          t('Уведомления о приходе и уходе в Telegram', 'Келиш ва кетиш ҳақида Telegram хабарлари', 'Check-in and check-out notifications in Telegram'),
        ],
        attendance,
      ),
    ],
  },
  {
    icon: 'bell',
    name: t('Коммуникации', 'Алоқа', 'Communication'),
    screens: [
      screen(
        t('Telegram-бот клиники', 'Клиниканинг Telegram боти', 'Clinic Telegram bot'),
        t(
          'Руководитель сам выбирает, какие события получать.',
          'Раҳбар қайси хабарларни олишни ўзи танлайди.',
          'Managers choose which events they receive.',
        ),
        [
          t('Оплаты, возвраты, лаборатория, операционный блок', 'Тўловлар, қайтаришлар, лаборатория, операцион блок', 'Payments, refunds, laboratory, operating block'),
          t('Вызов медсестры и тревожные состояния', 'Ҳамшира чақируви ва ножўя ҳолатлар', 'Nurse calls and critical conditions'),
          t('Ежедневный отчёт и Z-отчёт с PDF', 'Кунлик ҳисобот ва PDF билан Z-ҳисобот', 'Daily report and Z-report with PDF'),
          t('Пациентам напоминания о лекарствах и визитах', 'Беморларга дори ва ташриф эслатмалари', 'Medication and visit reminders for patients'),
        ],
        telegramBot,
      ),
      screen(
        t('Табло электронной очереди', 'Электрон навбат таблоси', 'Electronic queue display'),
        t(
          'Экран в холле показывает, кто на приёме и кто следующий.',
          'Холлдаги экран ким қабулда ва ким кейинги эканини кўрсатади.',
          'The lobby screen shows who is being seen and who is next.',
        ),
        [
          t('Номер талона и фамилия крупным шрифтом', 'Талон рақами ва фамилия йирик ҳарфларда', 'Ticket number and surname in large type'),
          t('Голосовой вызов в кабинет', 'Кабинетга овозли чақирув', 'Voice call to the room'),
          t('Отдельная очередь по отделениям', 'Бўлимлар бўйича алоҳида навбат', 'A separate queue for each department'),
          t('Реклама клиники между вызовами', 'Чақирувлар орасида клиника рекламаси', 'Clinic advertising between calls'),
        ],
        queueDisplay,
      ),
    ],
  },
];

export const MODULES = {
  eyebrow: t('Модули', 'Модуллар', 'Modules'),
  title: t('18 модулей в одной подписке', 'Битта обунада 18 та модул', '18 modules in one subscription'),
  sub: t(
    'Клиника включает только то, что ей нужно. Данные между модулями связаны автоматически.',
    'Клиника фақат керакли модулларни ёқади. Модуллар орасидаги маълумот автоматик боғланади.',
    'A clinic turns on only what it needs. Data flows between modules automatically.',
  ),
  items: [
    {
      icon: 'reception',
      title: t('Регистратура и касса', 'Рўйхатхона ва касса', 'Reception and cash desk'),
      text: t(
        'Запись по календарю, шесть способов оплаты, чеки, возвраты с подтверждением.',
        'Календар бўйича ёзиш, олти тўлов усули, чеклар, тасдиқ билан қайтариш.',
        'Calendar booking, six payment methods, receipts, approved refunds.',
      ),
    },
    {
      icon: 'steth',
      title: t('Кабинет врача', 'Шифокор кабинети', "Doctor's workspace"),
      text: t(
        'Медкарта в четыре шага, МКБ-10, шаблоны лечения, направления.',
        'Тўрт босқичли тиббий карта, МКБ-10, даволаш шаблонлари, йўлланмалар.',
        'Four-step medical record, ICD-10, treatment templates, referrals.',
      ),
    },
    {
      icon: 'spark',
      title: t('AI-ассистенты', 'AI ёрдамчилар', 'AI assistants'),
      text: t(
        'AI-анализ для врача, AI-чат директора по данным клиники, диктовка.',
        'Шифокор учун AI таҳлил, директор учун клиника маълумотлари бўйича AI чат, диктовка.',
        'AI analysis for doctors, an AI chat over clinic data for the director, dictation.',
      ),
    },
    {
      icon: 'approve',
      title: t('Подтверждения', 'Тасдиқлашлар', 'Approvals'),
      text: t(
        'Диагнозы, скидки, возвраты и авансы утверждает директор, в том числе пачкой.',
        'Ташхис, чегирма, қайтариш ва авансларни директор тасдиқлайди, бирданига бир нечтасини ҳам.',
        'The director approves diagnoses, discounts, refunds and advances, including in bulk.',
      ),
    },
    {
      icon: 'bed',
      title: t('Стационар', 'Стационар', 'Inpatient'),
      text: t(
        'Заселение, бронь коек, обходы, журнал медсестры, выписка с эпикризом.',
        'Жойлаштириш, койка брони, обходлар, ҳамшира журнали, эпикриз билан чиқариш.',
        'Admission, bed booking, rounds, nursing log, discharge with summary.',
      ),
    },
    {
      icon: 'hand',
      title: t('Процедурные кабинеты', 'Процедура кабинетлари', 'Procedure rooms'),
      text: t(
        'Сеансы по плану, списание материалов в граммах, KPI специалиста.',
        'Режа бўйича сеанслар, материалларни граммда ҳисобдан чиқариш, мутахассис KPI.',
        'Planned sessions, materials written off in grams, specialist KPIs.',
      ),
    },
    {
      icon: 'scalpel',
      title: t('Операционный блок', 'Операцион блок', 'Operating block'),
      text: t(
        'Залы, расписание операций, чек-лист ВОЗ, показатели блока.',
        'Заллар, операциялар жадвали, ЖССТ чек-листи, блок кўрсаткичлари.',
        'Theatres, surgery schedule, WHO checklist, block metrics.',
      ),
    },
    {
      icon: 'flask',
      title: t('Лаборатория', 'Лаборатория', 'Laboratory'),
      text: t(
        'Заказы, пакетная обработка, бланки с нормами, PDF в Telegram.',
        'Буюртмалар, тўплам билан ишлаш, нормали бланклар, Telegram га PDF.',
        'Orders, batch processing, forms with reference ranges, PDF to Telegram.',
      ),
    },
    {
      icon: 'scan',
      title: t('Диагностика', 'Диагностика', 'Diagnostics'),
      text: t(
        'МРТ, КТ, рентген, УЗИ, функциональная диагностика, DICOM, AI-черновик заключения.',
        'МРТ, КТ, рентген, УЗИ, функционал диагностика, DICOM, хулосанинг AI қораламаси.',
        'MRI, CT, X-ray, ultrasound, functional diagnostics, DICOM, AI report drafts.',
      ),
    },
    {
      icon: 'pill',
      title: t('Аптека и склад', 'Дорихона ва омбор', 'Pharmacy and stock'),
      text: t(
        'Центральный склад с НДС, раздача по филиалам и этажам, аптечная касса.',
        'ҚҚС билан марказий омбор, филиал ва қаватларга тарқатиш, дорихона кассаси.',
        'Central stock with VAT, distribution to branches and floors, pharmacy till.',
      ),
    },
    {
      icon: 'soup',
      title: t('Кухня', 'Ошхона', 'Kitchen'),
      text: t(
        'Склад продуктов, меню и учёт порций для стационара.',
        'Маҳсулотлар омбори, меню ва стационар учун порция ҳисоби.',
        'Food stock, menu and portion tracking for inpatients.',
      ),
    },
    {
      icon: 'wallet',
      title: t('Зарплата', 'Маош', 'Payroll'),
      text: t(
        'Оклад, часовая ставка, процент врача, бонусы партнёров, авансы.',
        'Оклад, соатбай ставка, шифокор фоизи, ҳамкор бонуслари, аванслар.',
        "Salary, hourly rate, doctor's percentage, partner bonuses, advances.",
      ),
    },
    {
      icon: 'clock',
      title: t('Давомат', 'Давомат', 'Attendance'),
      text: t(
        'Терминалы Hikvision, график смен, опоздания, данные для зарплаты.',
        'Hikvision терминаллари, смена жадвали, кечикишлар, маош учун маълумот.',
        'Hikvision terminals, shift schedule, lateness, data for payroll.',
      ),
    },
    {
      icon: 'chart',
      title: t('Отчёты', 'Ҳисоботлар', 'Reports'),
      text: t(
        'Z-отчёт, процедуры, расходы, благотворительность, Excel и PDF.',
        'Z-ҳисобот, процедуралар, харажатлар, хайрия, Excel ва PDF.',
        'Z-report, procedures, expenses, charity, Excel and PDF.',
      ),
    },
    {
      icon: 'bell',
      title: t('Уведомления', 'Хабарномалар', 'Notifications'),
      text: t(
        'Telegram-бот, SMS, голосовой вызов на табло, голосовой агент.',
        'Telegram бот, SMS, таблода овозли чақирув, овозли агент.',
        'Telegram bot, SMS, voice calls on the display, voice agent.',
      ),
    },
    {
      icon: 'phone',
      title: t('Приложение пациента', 'Бемор иловаси', 'Patient app'),
      text: t(
        'Вход по SMS или Google, анализы, запись, напоминания.',
        'SMS ёки Google орқали кириш, таҳлиллар, ёзилиш, эслатмалар.',
        'Sign in by SMS or Google, test results, booking, reminders.',
      ),
    },
    {
      icon: 'tablet',
      title: t('Android для персонала', 'Ходимлар учун Android', 'Android for staff'),
      text: t(
        'Директор, врач, медсёстры и санитары работают с планшета.',
        'Директор, шифокор, ҳамширалар ва санитарлар планшетда ишлайди.',
        'The director, doctors, nurses and orderlies work from a tablet.',
      ),
    },
    {
      icon: 'building',
      title: t('Сети и филиалы', 'Тармоқ ва филиаллар', 'Networks and branches'),
      text: t(
        'Головная клиника и филиалы в одной системе.',
        'Бош клиника ва филиаллар битта тизимда.',
        'The main clinic and its branches in one system.',
      ),
    },
  ] satisfies { icon: IconId; title: Text; text: Text }[],
};

export const ROLES = {
  eyebrow: t('Роли', 'Роллар', 'Roles'),
  title: t('У каждого сотрудника свой рабочий экран', 'Ҳар бир ходимнинг ўз иш экрани', 'Every employee has their own workspace'),
  sub: t(
    'Доступ ограничен ролью. Один сотрудник может совмещать несколько ролей в одном меню.',
    'Кириш рол билан чекланган. Битта ходим бир нечта ролни битта менюда бирлаштира олади.',
    'Access is limited by role. One employee can combine several roles in a single menu.',
  ),
  groups: [
    {
      icon: 'crown',
      title: t('Руководство', 'Раҳбарият', 'Management'),
      roles: [
        t('Суперадмин сети', 'Тармоқ суперадмини', 'Network super admin'),
        t('Директор', 'Директор', 'Director'),
        t('Администратор', 'Администратор', 'Administrator'),
        t('Бухгалтер', 'Бухгалтер', 'Accountant'),
      ],
    },
    {
      icon: 'steth',
      title: t('Клиника', 'Клиника', 'Clinical'),
      roles: [
        t('Врач', 'Шифокор', 'Doctor'),
        t('Специалист', 'Мутахассис', 'Specialist'),
        t('Главная медсестра', 'Бош ҳамшира', 'Head nurse'),
        t('Медсестра', 'Ҳамшира', 'Nurse'),
        t('Старший санитар', 'Катта санитар', 'Senior orderly'),
        t('Санитар', 'Санитар', 'Orderly'),
      ],
    },
    {
      icon: 'flask',
      title: t('Диагностика', 'Диагностика', 'Diagnostics'),
      roles: [
        t('Лаборант', 'Лаборант', 'Lab technician'),
        t('Зав. лабораторией', 'Лаборатория мудири', 'Lab manager'),
        t('МРТ / КТ', 'МРТ / КТ', 'MRI / CT'),
        t('Рентген', 'Рентген', 'X-ray'),
        t('УЗИ', 'УЗИ', 'Ultrasound'),
        t('Функциональная диагностика', 'Функционал диагностика', 'Functional diagnostics'),
      ],
    },
    {
      icon: 'reception',
      title: t('Сервис', 'Хизмат', 'Service'),
      roles: [
        t('Ресепшн', 'Ресепшн', 'Receptionist'),
        t('Кассир', 'Кассир', 'Cashier'),
        t('Фармацевт', 'Фармацевт', 'Pharmacist'),
        t('Кассир аптеки', 'Дорихона кассири', 'Pharmacy cashier'),
        t('Центральная аптека', 'Марказий дорихона', 'Central pharmacy'),
        t('Повар', 'Ошпаз', 'Cook'),
      ],
    },
  ] satisfies { icon: IconId; title: Text; roles: Text[] }[],
};

export const SECURITY = {
  eyebrow: t('Безопасность', 'Хавфсизлик', 'Security'),
  title: t('Медицинские и финансовые данные под контролем', 'Тиббий ва молиявий маълумотлар назорат остида', 'Medical and financial data under control'),
  sub: t(
    'Кто что видит и кто что сделал, записано в системе.',
    'Ким нимани кўриши ва ким нима қилгани тизимда ёзилган.',
    'Who sees what and who did what is recorded in the system.',
  ),
  items: [
    {
      icon: 'lock',
      title: t('Доступ по ролям', 'Роллар бўйича кириш', 'Role-based access'),
      text: t(
        'Правила базы данных закрывают чужие клиники и чужие разделы на уровне сервера.',
        'Маълумотлар базаси қоидалари бошқа клиника ва бўлимларни сервер даражасида ёпади.',
        'Database rules block other clinics and other sections at the server level.',
      ),
    },
    {
      icon: 'shield',
      title: t('Ключи на сервере', 'Калитлар серверда', 'Keys stay on the server'),
      text: t(
        'Токены Telegram, SMS и AI хранятся на сервере и не попадают в браузер.',
        'Telegram, SMS ва AI токенлари серверда сақланади, браузерга тушмайди.',
        'Telegram, SMS and AI tokens are stored on the server and never reach the browser.',
      ),
    },
    {
      icon: 'approve',
      title: t('Журнал действий', 'Амаллар журнали', 'Action log'),
      text: t(
        'Видно, кто принял оплату, кто оформил возврат и кто дал лекарство пациенту.',
        'Ким тўлов қабул қилгани, ким қайтариш расмийлаштиргани ва ким беморга дори бергани кўринади.',
        'You can see who took a payment, who issued a refund and who gave a patient their medication.',
      ),
    },
    {
      icon: 'cloud',
      title: t('Облачная инфраструктура', 'Булут инфратузилмаси', 'Cloud infrastructure'),
      text: t(
        'Система работает на Google Firebase. Свой сервер в клинике не нужен.',
        'Тизим Google Firebase да ишлайди. Клиникада ўз сервери керак эмас.',
        'The system runs on Google Firebase. The clinic needs no server of its own.',
      ),
    },
  ] satisfies { icon: IconId; title: Text; text: Text }[],
};

export const LAUNCH = {
  eyebrow: t('Внедрение', 'Жорий этиш', 'Onboarding'),
  title: t('Как клиника переходит на WaspMed', 'Клиника WaspMed га қандай ўтади', 'How a clinic moves to WaspMed'),
  steps: [
    {
      title: t('Знакомство', 'Танишув', 'Discovery'),
      text: t(
        'Разбираем процессы клиники и выбираем нужные модули.',
        'Клиника жараёнларини ўрганамиз ва керакли модулларни танлаймиз.',
        "We map the clinic's processes and choose the modules it needs.",
      ),
    },
    {
      title: t('Настройка', 'Созлаш', 'Setup'),
      text: t(
        'Заводим услуги, цены, палаты, сотрудников и роли.',
        'Хизматлар, нархлар, палаталар, ходимлар ва ролларни киритамиз.',
        'We enter services, prices, wards, staff and roles.',
      ),
    },
    {
      title: t('Обучение', 'Ўқитиш', 'Training'),
      text: t(
        'Каждая роль учится на своём экране на реальных задачах.',
        'Ҳар бир рол ўз экранида реал вазифаларда ўрганади.',
        'Each role learns on its own screen with real tasks.',
      ),
    },
    {
      title: t('Запуск', 'Ишга тушириш', 'Go-live'),
      text: t(
        'Клиника работает в системе, мы на связи и дорабатываем.',
        'Клиника тизимда ишлайди, биз алоқадамиз ва такомиллаштирамиз.',
        'The clinic works in the system while we stay in touch and keep improving it.',
      ),
    },
  ],
};

export const FAQ = {
  eyebrow: t('Вопросы', 'Саволлар', 'FAQ'),
  title: t('Частые вопросы', 'Кўп бериладиган саволлар', 'Frequently asked questions'),
  items: [
    {
      q: t('Нужен ли клинике свой сервер?', 'Клиникага ўз сервери керакми?', 'Does the clinic need its own server?'),
      a: t(
        'Нет. Система работает в облаке Google Firebase. Сотрудникам нужен только браузер или Android-приложение.',
        'Йўқ. Тизим Google Firebase булутида ишлайди. Ходимларга фақат браузер ёки Android илова керак.',
        'No. The system runs in the Google Firebase cloud. Staff only need a browser or the Android app.',
      ),
    },
    {
      q: t('На каких устройствах работает система?', 'Тизим қайси қурилмаларда ишлайди?', 'Which devices does it run on?'),
      a: t(
        'На компьютере в любом современном браузере, на планшете и на телефоне с Android. Табло очереди работает на любом экране с браузером.',
        'Компьютерда исталган замонавий браузерда, планшетда ва Android телефонда. Навбат таблоси браузери бор исталган экранда ишлайди.',
        'On a computer in any modern browser, on a tablet and on an Android phone. The queue display runs on any screen with a browser.',
      ),
    },
    {
      q: t('Можно ли подключить несколько филиалов?', 'Бир нечта филиални улаш мумкинми?', 'Can several branches be connected?'),
      a: t(
        'Да. Головная клиника и филиалы работают в одной системе. Директор видит все филиалы вместе или каждый отдельно.',
        'Ҳа. Бош клиника ва филиаллар битта тизимда ишлайди. Директор барча филиалларни бирга ёки ҳар бирини алоҳида кўради.',
        'Yes. The main clinic and its branches work in one system. The director sees all branches together or each one separately.',
      ),
    },
    {
      q: t('На каком языке интерфейс?', 'Интерфейс қайси тилда?', 'What language is the interface in?'),
      a: t(
        'Интерфейс на узбекском языке кириллицей. Медицинская терминология и МКБ-10 даны так, как привыкли врачи.',
        'Интерфейс ўзбек тилида, кирилл ёзувида. Тиббий атамалар ва МКБ-10 шифокорлар ўрганган шаклда берилган.',
        'The interface is in Uzbek, in Cyrillic script. Medical terminology and ICD-10 appear the way doctors are used to.',
      ),
    },
    {
      q: t('Какие способы оплаты принимает касса?', 'Касса қайси тўлов усулларини қабул қилади?', 'Which payment methods does the cash desk accept?'),
      a: t(
        'Наличные, карта, Payme, Click, QR-код и оплата по договору. Z-отчёт смены разбивает выручку по каждому способу.',
        'Нақд, карта, Payme, Click, QR-код ва шартнома бўйича тўлов. Смена Z-ҳисоботи тушумни ҳар бир усул бўйича ажратади.',
        'Cash, card, Payme, Click, QR code and payment by contract. The shift Z-report breaks revenue down by method.',
      ),
    },
    {
      q: t('Кто отвечает за заключение, написанное AI?', 'AI ёзган хулоса учун ким жавоб беради?', 'Who is responsible for a report written by AI?'),
      a: t(
        'Врач. AI готовит черновик протокола, врач сверяет его со снимками, исправляет и подписывает. На бланке так и написано: окончательное заключение ставит врач.',
        'Шифокор. AI протокол қораламасини тайёрлайди, шифокор уни тасвирлар билан солиштиради, тузатади ва имзолайди. Бланкада ҳам шундай ёзилган: якуний хулосани шифокор беради.',
        'The doctor. The AI prepares a draft report; the doctor checks it against the images, corrects it and signs it. The letterhead says so too: the final conclusion is the doctor’s.',
      ),
    },
    {
      q: t('Что получает пациент?', 'Бемор нима олади?', 'What does the patient get?'),
      a: t(
        'Приложение с входом по SMS или Google, результаты анализов в PDF, напоминания о лекарствах и повторных визитах в Telegram.',
        'SMS ёки Google орқали кириладиган илова, PDF шаклидаги таҳлил натижалари, дори ва қайта ташриф ҳақида Telegram эслатмалари.',
        'An app with sign-in by SMS or Google, test results in PDF, and Telegram reminders about medication and follow-up visits.',
      ),
    },
  ],
};

export const CONTACT = {
  eyebrow: t('Демо', 'Демо', 'Demo'),
  title: t('Посмотрите WaspMed на данных вашей клиники', 'WaspMed ни ўз клиникангиз маълумотларида кўринг', "See WaspMed on your own clinic's data"),
  text: t(
    'Покажем систему вживую и подберём набор модулей под ваши процессы.',
    'Тизимни жонли кўрсатамиз ва жараёнларингизга мос модуллар тўпламини танлаймиз.',
    'We will show the system live and pick the set of modules that fits your processes.',
  ),
  seeAgain: t('Ещё раз посмотреть продукт', 'Маҳсулотни яна кўриш', 'See the product again'),
};

export const FOOTER = t(
  '© 2026 WaspMed. Система управления клиникой.',
  '© 2026 WaspMed. Клиникани бошқариш тизими.',
  '© 2026 WaspMed. Clinic management system.',
);
