'use strict';
const rows = {
food: [
['apple','ˈæp.əl','I eat an apple.','яблоко','Я ем яблоко.','алма','Мен алма жеймін.'],
['bread','bred','The bread is fresh.','хлеб','Хлеб свежий.','нан','Нан жаңа піскен.'],
['water','ˈwɔːtə','I drink water.','вода','Я пью воду.','су','Мен су ішемін.'],
['milk','mɪlk','The milk is cold.','молоко','Молоко холодное.','сүт','Сүт салқын.'],
['cheese','tʃiːz','I like cheese.','сыр','Я люблю сыр.','ірімшік','Мен ірімшікті жақсы көремін.'],
['rice','raɪs','We cook rice.','рис','Мы варим рис.','күріш','Біз күріш пісіреміз.'],
['soup','suːp','The soup is hot.','суп','Суп горячий.','сорпа','Сорпа ыстық.'],
['egg','eɡ','This is an egg.','яйцо','Это яйцо.','жұмыртқа','Бұл — жұмыртқа.'],
['fish','fɪʃ','We eat fish.','рыба','Мы едим рыбу.','балық','Біз балық жейміз.'],
['tea','tiː','I drink tea.','чай','Я пью чай.','шай','Мен шай ішемін.']
],
transport: [
['car','kɑː','The car is red.','машина','Машина красная.','автокөлік','Автокөлік қызыл.'],
['bus','bʌs','The bus is here.','автобус','Автобус уже здесь.','автобус','Автобус осында.'],
['train','treɪn','The train is fast.','поезд','Поезд быстрый.','пойыз','Пойыз жылдам.'],
['plane','pleɪn','The plane is in the sky.','самолёт','Самолёт в небе.','ұшақ','Ұшақ аспанда.'],
['bicycle','ˈbaɪsɪkəl','I ride a bicycle.','велосипед','Я еду на велосипеде.','велосипед','Мен велосипед тебемін.'],
['taxi','ˈtæksi','We need a taxi.','такси','Нам нужно такси.','такси','Бізге такси керек.'],
['ship','ʃɪp','The ship is big.','корабль','Корабль большой.','кеме','Кеме үлкен.'],
['boat','bəʊt','The boat is on the lake.','лодка','Лодка на озере.','қайық','Қайық көлде.'],
['motorcycle','ˈməʊtəsaɪkəl','He has a motorcycle.','мотоцикл','У него есть мотоцикл.','мотоцикл','Оның мотоциклі бар.'],
['tram','træm','The tram stops here.','трамвай','Трамвай останавливается здесь.','трамвай','Трамвай осында тоқтайды.']
],
home: [
['house','haʊs','Our house is warm.','дом','Наш дом тёплый.','үй','Біздің үй жылы.'],
['room','ruːm','My room is small.','комната','Моя комната маленькая.','бөлме','Менің бөлмем кішкентай.'],
['door','dɔː','Open the door.','дверь','Открой дверь.','есік','Есікті аш.'],
['window','ˈwɪndəʊ','The window is open.','окно','Окно открыто.','терезе','Терезе ашық.'],
['table','ˈteɪbəl','The book is on the table.','стол','Книга на столе.','үстел','Кітап үстелдің үстінде.'],
['chair','tʃeə','Sit on the chair.','стул','Сядь на стул.','орындық','Орындыққа отыр.'],
['bed','bed','The bed is soft.','кровать','Кровать мягкая.','төсек','Төсек жұмсақ.'],
['lamp','læmp','The lamp is on.','лампа','Лампа включена.','шам','Шам жанып тұр.'],
['mirror','ˈmɪrə','I look in the mirror.','зеркало','Я смотрю в зеркало.','айна','Мен айнаға қараймын.'],
['carpet','ˈkɑːpɪt','The carpet is blue.','ковёр','Ковёр синий.','кілем','Кілем көк.']
],
school: [
['teacher','ˈtiːtʃə','The teacher is here.','учитель','Учитель уже здесь.','мұғалім','Мұғалім осында.'],
['student','ˈstjuːdənt','The student reads a book.','ученик','Ученик читает книгу.','оқушы','Оқушы кітап оқиды.'],
['lesson','ˈlesən','The lesson starts now.','урок','Урок начинается сейчас.','сабақ','Сабақ қазір басталады.'],
['notebook','ˈnəʊtbʊk','My notebook is blue.','тетрадь','Моя тетрадь синяя.','дәптер','Менің дәптерім көк.'],
['pencil','ˈpensəl','I have a pencil.','карандаш','У меня есть карандаш.','қарындаш','Менде қарындаш бар.'],
['ruler','ˈruːlə','The ruler is long.','линейка','Линейка длинная.','сызғыш','Сызғыш ұзын.'],
['backpack','ˈbækpæk','My backpack is heavy.','рюкзак','Мой рюкзак тяжёлый.','арқасөмке','Менің арқасөмкем ауыр.'],
['board','bɔːd','The board is clean.','доска','Доска чистая.','тақта','Тақта таза.'],
['task','tɑːsk','This task is easy.','задание','Это задание лёгкое.','тапсырма','Бұл тапсырма оңай.'],
['classroom','ˈklɑːsruːm','Our classroom is bright.','класс','Наш класс светлый.','сынып','Біздің сынып жарық.']
],
travel: [
['passport','ˈpɑːspɔːt','My passport is here.','паспорт','Мой паспорт здесь.','төлқұжат','Менің төлқұжатым осында.'],
['ticket','ˈtɪkɪt','I have a ticket.','билет','У меня есть билет.','билет','Менде билет бар.'],
['suitcase','ˈsuːtkeɪs','My suitcase is heavy.','чемодан','Мой чемодан тяжёлый.','шабадан','Менің шабаданым ауыр.'],
['hotel','həʊˈtel','The hotel is nearby.','отель','Отель рядом.','қонақүй','Қонақүй жақын жерде.'],
['airport','ˈeəpɔːt','The airport is big.','аэропорт','Аэропорт большой.','әуежай','Әуежай үлкен.'],
['map','mæp','I have a map.','карта','У меня есть карта.','карта','Менде карта бар.'],
['beach','biːtʃ','The beach is beautiful.','пляж','Пляж красивый.','жағажай','Жағажай әдемі.'],
['city','ˈsɪti','This city is beautiful.','город','Этот город красивый.','қала','Бұл қала әдемі.'],
['tourist','ˈtʊərɪst','The tourist takes a photo.','турист','Турист делает фото.','саяхатшы','Саяхатшы суретке түсіреді.'],
['journey','ˈdʒɜːni','Our journey begins today.','путешествие','Наше путешествие начинается сегодня.','сапар','Біздің сапар бүгін басталады.']
],
other: [
['book','bʊk','I read a book.','книга','Я читаю книгу.','кітап','Мен кітап оқимын.'],
['sun','sʌn','The sun is bright.','солнце','Солнце яркое.','күн','Күн жарқырап тұр.'],
['tree','triː','The tree is tall.','дерево','Дерево высокое.','ағаш','Ағаш биік.'],
['cat','kæt','The cat is sleeping.','кот','Кот спит.','мысық','Мысық ұйықтап жатыр.'],
['dog','dɒɡ','The dog is playing.','собака','Собака играет.','ит','Ит ойнап жүр.'],
['flower','ˈflaʊə','The flower is beautiful.','цветок','Цветок красивый.','гүл','Гүл әдемі.'],
['ball','bɔːl','This is my ball.','мяч','Это мой мяч.','доп','Бұл — менің добым.'],
['pen','pen','I have a pen.','ручка','У меня есть ручка.','қалам','Менде қалам бар.'],
['school','skuːl','I go to school.','школа','Я иду в школу.','мектеп','Мен мектепке барамын.'],
['friend','frend','This is my friend.','друг','Это мой друг.','дос','Бұл — менің досым.']
]
};

const categories = {
  food: {name:'Еда', icon:'🍎'}, transport:{name:'Транспорт', icon:'🚌'},
  home:{name:'Дом', icon:'🏡'}, school:{name:'Школа', icon:'📚'},
  travel:{name:'Путешествие', icon:'🧳'}, other:{name:'Другое', icon:'✨'}
};
const languages = ['en','kk','ru'];
const languageNames = {en:'английский', kk:'казахский', ru:'русский'};
const vocabulary = Object.fromEntries(Object.entries(rows).map(([category, entries]) => [category,
  entries.map(r => ({id:r[0], en:{word:r[0], ipa:r[1], example:r[2]},
    ru:{word:r[3], example:r[4]}, kk:{word:r[5], example:r[6]}}))
]));
// Curated sentence tasks: four English, four Kazakh and two Russian per topic.
const sentenceRows = {
  "food": [
    [
      "After lunch, I pick a red ___ from the tree.",
      "apple",
      "bread",
      "cheese"
    ],
    [
      "Every morning, Dad slices fresh ___ for our toast.",
      "bread",
      "water",
      "tea"
    ],
    [
      "Every day, I drink five glasses of ___.",
      "water",
      "bread",
      "cheese"
    ],
    [
      "The farmer gets fresh ___ from the cow every morning.",
      "milk",
      "rice",
      "tea"
    ],
    [
      "Анам бүгін сүттен дәмді ___ жасап, дастарқанға қойды.",
      "ірімшік",
      "нан",
      "күріш"
    ],
    [
      "Әжем бүгін палауға ақ ___ салып, жақсылап араластырды.",
      "күріш",
      "шай",
      "нан"
    ],
    [
      "Түскі асқа анам ет пен көкөністен ыстық ___ пісірді.",
      "сорпа",
      "сүт",
      "ірімшік"
    ],
    [
      "Тауық бүгін ұясына бір ақ ___ салды.",
      "жұмыртқа",
      "алма",
      "нан"
    ],
    [
      "Сегодня дедушка поймал в озере большую ___ для ужина.",
      "рыбу",
      "булку",
      "грушу"
    ],
    [
      "Бабушка заварила в чайнике ароматный ___ с лимоном.",
      "чай",
      "сыр",
      "рис"
    ]
  ],
  "transport": [
    [
      "Our family ___ has four wheels and five seats.",
      "car",
      "bicycle",
      "boat"
    ],
    [
      "The city ___ carries thirty passengers along the road.",
      "bus",
      "bicycle",
      "boat"
    ],
    [
      "The long ___ carries passengers along the railway every morning.",
      "train",
      "taxi",
      "ship"
    ],
    [
      "We watch a passenger ___ fly above the clouds today.",
      "plane",
      "tram",
      "boat"
    ],
    [
      "Мен бүгін екі дөңгелекті ___ теуіп, саябаққа бардым.",
      "велосипед",
      "кеме",
      "ұшақ"
    ],
    [
      "Әкем телефоннан ___ шақырып, жүргізушіге баратын мекенжайымызды айтты.",
      "такси",
      "пойыз",
      "кеме"
    ],
    [
      "Үлкен теңіз ___ жүздеген жолаушыны басқа елге жеткізді.",
      "кемесі",
      "автобусы",
      "трамвайы"
    ],
    [
      "Атам шағын ___ екі ескекпен есіп, көлге шықты.",
      "қайықты",
      "ұшақты",
      "пойызды"
    ],
    [
      "По дороге мчится двухколёсный ___ с громким мотором.",
      "мотоцикл",
      "велосипед",
      "корабль"
    ],
    [
      "По городским рельсам утром идёт ___ с пассажирами.",
      "трамвай",
      "автобус",
      "самолёт"
    ]
  ],
  "home": [
    [
      "Our family lives in a small ___ with a garden.",
      "house",
      "chair",
      "mirror"
    ],
    [
      "My upstairs ___ has four walls and a small window.",
      "room",
      "carpet",
      "lamp"
    ],
    [
      "Please close the front ___ after entering our house.",
      "door",
      "bed",
      "table"
    ],
    [
      "Through the closed ___, I watch birds in our garden.",
      "window",
      "carpet",
      "door"
    ],
    [
      "Біз бүгін асүйдегі ___ басына отырып, кешкі ас іштік.",
      "үстелдің",
      "айнаның",
      "шамның"
    ],
    [
      "Мен сабақта арқалығы бар ___ отырып, тапсырма жаздым.",
      "орындыққа",
      "айнаға",
      "терезеге"
    ],
    [
      "Кешке ұйықтар алдында жұмсақ ___ жатып, көрпемді жамылдым.",
      "төсекке",
      "үстелге",
      "шамға"
    ],
    [
      "Кешке электр ___ қосып, жарықта кітап оқыдым.",
      "шамын",
      "кілемін",
      "есігін"
    ],
    [
      "Утром я вижу своё отражение в ___ над раковиной.",
      "зеркале",
      "ковре",
      "стуле"
    ],
    [
      "Мама постелила на пол мягкий ___ с узорами.",
      "ковёр",
      "стул",
      "дом"
    ]
  ],
  "school": [
    [
      "Our ___ explains the new lesson to thirty children.",
      "teacher",
      "ruler",
      "notebook"
    ],
    [
      "The new ___ sits at his desk and learns English.",
      "student",
      "pencil",
      "board"
    ],
    [
      "Our maths ___ starts at nine and lasts forty minutes.",
      "lesson",
      "backpack",
      "ruler"
    ],
    [
      "I write my homework on the pages of my ___.",
      "notebook",
      "ruler",
      "backpack"
    ],
    [
      "Мен бүгін суретті ___ салып, өшіргішпен бір сызықты өшірдім.",
      "қарындашпен",
      "арқасөмкемен",
      "тақтамен"
    ],
    [
      "Мен түзу сызық сызу үшін ұзын ___ қолдандым.",
      "сызғышты",
      "арқасөмкені",
      "сыныпты"
    ],
    [
      "Мен кітаптарымды ___ салып, оны екі иығыма ілдім.",
      "арқасөмкеге",
      "сызғышқа",
      "қарындашқа"
    ],
    [
      "Мұғалім бүгін бормен үлкен ___ үш сан жазды.",
      "тақтаға",
      "арқасөмкеге",
      "сызғышқа"
    ],
    [
      "На уроке я выполнил сложное ___ из учебника.",
      "задание",
      "рюкзак",
      "карандаш"
    ],
    [
      "Наш просторный ___ вмещает двадцать парт и большую доску.",
      "класс",
      "карандаш",
      "рюкзак"
    ]
  ],
  "travel": [
    [
      "At the border, Dad shows his ___ with his photo.",
      "passport",
      "suitcase",
      "beach"
    ],
    [
      "The conductor checks my ___ before I board the train.",
      "ticket",
      "suitcase",
      "hotel"
    ],
    [
      "I pack clothes in my ___ before our summer trip.",
      "suitcase",
      "ticket",
      "passport"
    ],
    [
      "Our family books a room in a ___ near the sea.",
      "hotel",
      "map",
      "ticket"
    ],
    [
      "Біз ұшаққа отыру үшін таңертең үлкен ___ келдік.",
      "әуежайға",
      "жағажайға",
      "қонақүйге"
    ],
    [
      "Әкем қағаз ___ қарап, қалалар арасындағы жолды тапты.",
      "картаға",
      "билетке",
      "төлқұжатқа"
    ],
    [
      "Біз бүгін құмды ___ барып, теңіз суына шомылдық.",
      "жағажайға",
      "әуежайға",
      "қонақүйге"
    ],
    [
      "Бұл үлкен ___ көптеген көшелер мен биік үйлер бар.",
      "қалада",
      "шабаданда",
      "төлқұжатта"
    ],
    [
      "Приезжий ___ фотографирует памятники и слушает рассказ экскурсовода.",
      "турист",
      "чемодан",
      "паспорт"
    ],
    [
      "Наше двухнедельное ___ по стране началось с поездки в горы.",
      "путешествие",
      "море",
      "полотенце"
    ]
  ],
  "other": [
    [
      "Every evening, I read a ___ with colourful pages.",
      "book",
      "ball",
      "pen"
    ],
    [
      "The bright ___ rises in the east every morning.",
      "sun",
      "cat",
      "flower"
    ],
    [
      "A tall ___ grows wooden branches beside our house.",
      "tree",
      "ball",
      "dog"
    ],
    [
      "Our small ___ meows softly beside the kitchen door.",
      "cat",
      "dog",
      "tree"
    ],
    [
      "Аулада үлкен ___ үріп, үйімізді бөтен адамдардан күзетеді.",
      "ит",
      "мысық",
      "гүл"
    ],
    [
      "Ара бүгін әдемі ___ күлтесіне қонып, нәр жинады.",
      "гүлдің",
      "доптың",
      "қаламның"
    ],
    [
      "Балалар бүгін дөңгелек ___ аяқпен теуіп, қақпаға соқты.",
      "допты",
      "кітапты",
      "қаламды"
    ],
    [
      "Мен бүгін көк сиялы ___ хат жаздым.",
      "қаламмен",
      "доппен",
      "гүлмен"
    ],
    [
      "Каждое утро дети идут в ___ учиться у учителей.",
      "школу",
      "реку",
      "пекарню"
    ],
    [
      "Мой лучший ___ всегда поддерживает меня в трудную минуту.",
      "друг",
      "мяч",
      "цветок"
    ]
  ]
};
const sentenceBank = Object.fromEntries(Object.entries(sentenceRows).map(([category, tasks]) => [category, tasks.map((r,i)=>({id:vocabulary[category][i].id, lang:i<4?'en':i<8?'kk':'ru', text:r[0], answer:r[1], choices:r.slice(1)}))]));

// Local, context-aware help for the English sentence bank. No network dictionary.
const hintWords = Object.fromEntries(Object.values(vocabulary).flat().map(entry =>
  [entry.id, {ipa:entry.en.ipa, kk:entry.kk.word, ru:entry.ru.word}]));
Object.assign(hintWords, {
  above: {"ipa": "əˈbʌv", "kk": "үстінде", "ru": "над"},
  after: {"ipa": "ˈɑːftə", "kk": "кейін", "ru": "после"},
  along: {"ipa": "əˈlɒŋ", "kk": "бойымен", "ru": "вдоль"},
  and: {"ipa": "ənd", "kk": "және", "ru": "и"},
  at: {"ipa": "ət", "kk": "кезінде; тұсында", "ru": "в; у"},
  before: {"ipa": "bɪˈfɔː", "kk": "дейін", "ru": "перед"},
  beside: {"ipa": "bɪˈsaɪd", "kk": "жанында", "ru": "рядом с"},
  birds: {"ipa": "bɜːdz", "kk": "құстарды", "ru": "птиц"},
  board: {"ipa": "bɔːd", "kk": "мінемін", "ru": "сажусь в"},
  books: {"ipa": "bʊks", "kk": "броньдайды", "ru": "бронирует"},
  border: {"ipa": "ˈbɔːdə", "kk": "шекарада", "ru": "границе"},
  branches: {"ipa": "ˈbrɑːntʃɪz", "kk": "бұтақтар", "ru": "ветви"},
  bright: {"ipa": "braɪt", "kk": "жарық", "ru": "яркое"},
  carries: {"ipa": "ˈkæriz", "kk": "тасымалдайды", "ru": "перевозит"},
  checks: {"ipa": "tʃeks", "kk": "тексереді", "ru": "проверяет"},
  children: {"ipa": "ˈtʃɪldrən", "kk": "балаларға", "ru": "детям"},
  city: {"ipa": "ˈsɪti", "kk": "қалалық", "ru": "городской"},
  close: {"ipa": "kləʊz", "kk": "жап", "ru": "закрой"},
  closed: {"ipa": "kləʊzd", "kk": "жабық", "ru": "закрытое"},
  clothes: {"ipa": "kləʊðz", "kk": "киімдерді", "ru": "одежду"},
  clouds: {"ipa": "klaʊdz", "kk": "бұлттар", "ru": "облаками"},
  colourful: {"ipa": "ˈkʌləfəl", "kk": "түрлі түсті", "ru": "красочными"},
  conductor: {"ipa": "kənˈdʌktə", "kk": "жолсерік", "ru": "проводник"},
  cow: {"ipa": "kaʊ", "kk": "сиырдан", "ru": "коровы"},
  dad: {"ipa": "dæd", "kk": "әкем", "ru": "папа"},
  day: {"ipa": "deɪ", "kk": "күн", "ru": "день"},
  desk: {"ipa": "desk", "kk": "партасында", "ru": "партой"},
  drink: {"ipa": "drɪŋk", "kk": "ішемін", "ru": "пью"},
  east: {"ipa": "iːst", "kk": "шығыста", "ru": "востоке"},
  english: {"ipa": "ˈɪŋɡlɪʃ", "kk": "ағылшын тілін", "ru": "английский язык"},
  entering: {"ipa": "ˈentərɪŋ", "kk": "кіргеннен", "ru": "входа"},
  evening: {"ipa": "ˈiːvnɪŋ", "kk": "кеш", "ru": "вечер"},
  every: {"ipa": "ˈevri", "kk": "әр", "ru": "каждый"},
  explains: {"ipa": "ɪkˈspleɪnz", "kk": "түсіндіреді", "ru": "объясняет"},
  family: {"ipa": "ˈfæməli", "kk": "отбасы", "ru": "семья"},
  farmer: {"ipa": "ˈfɑːmə", "kk": "фермер", "ru": "фермер"},
  five: {"ipa": "faɪv", "kk": "бес", "ru": "пять"},
  fly: {"ipa": "flaɪ", "kk": "ұшқанын", "ru": "летит"},
  for: {"ipa": "fə", "kk": "үшін", "ru": "для"},
  forty: {"ipa": "ˈfɔːti", "kk": "қырық", "ru": "сорок"},
  four: {"ipa": "fɔː", "kk": "төрт", "ru": "четыре"},
  fresh: {"ipa": "freʃ", "kk": "жаңа; балғын", "ru": "свежий"},
  from: {"ipa": "frəm", "kk": "…-дан / …-ден", "ru": "с; от"},
  front: {"ipa": "frʌnt", "kk": "алдыңғы", "ru": "входная"},
  garden: {"ipa": "ˈɡɑːdən", "kk": "бақ", "ru": "сад"},
  gets: {"ipa": "ɡets", "kk": "алады", "ru": "получает"},
  glasses: {"ipa": "ˈɡlɑːsɪz", "kk": "стақан", "ru": "стаканы"},
  grows: {"ipa": "ɡrəʊz", "kk": "өсіреді", "ru": "отращивает"},
  has: {"ipa": "hæz", "kk": "бар", "ru": "имеет"},
  his: {"ipa": "hɪz", "kk": "оның; өзінің", "ru": "его; свой"},
  homework: {"ipa": "ˈhəʊmwɜːk", "kk": "үй тапсырмамды", "ru": "домашнее задание"},
  i: {"ipa": "aɪ", "kk": "мен", "ru": "я"},
  in: {"ipa": "ɪn", "kk": "ішінде; …-да / …-де", "ru": "в"},
  kitchen: {"ipa": "ˈkɪtʃɪn", "kk": "асүйдің", "ru": "кухонной"},
  lasts: {"ipa": "lɑːsts", "kk": "созылады", "ru": "длится"},
  learns: {"ipa": "lɜːnz", "kk": "үйренеді", "ru": "изучает"},
  lives: {"ipa": "lɪvz", "kk": "тұрады", "ru": "живёт"},
  long: {"ipa": "lɒŋ", "kk": "ұзын", "ru": "длинный"},
  lunch: {"ipa": "lʌntʃ", "kk": "түскі ас", "ru": "обед"},
  maths: {"ipa": "mæθs", "kk": "математика", "ru": "математики"},
  meows: {"ipa": "miˈaʊz", "kk": "мияулайды", "ru": "мяукает"},
  minutes: {"ipa": "ˈmɪnɪts", "kk": "минут", "ru": "минут"},
  morning: {"ipa": "ˈmɔːnɪŋ", "kk": "таң", "ru": "утро"},
  my: {"ipa": "maɪ", "kk": "менің; өзімнің", "ru": "мой; свой"},
  near: {"ipa": "nɪə", "kk": "жанында", "ru": "рядом с"},
  new: {"ipa": "njuː", "kk": "жаңа", "ru": "новый"},
  nine: {"ipa": "naɪn", "kk": "тоғыз", "ru": "девять"},
  of: {"ipa": "əv", "kk": "…-ның / …-нің", "ru": "связь количества или принадлежности"},
  on: {"ipa": "ɒn", "kk": "үстінде; бетінде", "ru": "на"},
  our: {"ipa": "aʊə", "kk": "біздің", "ru": "наш"},
  pack: {"ipa": "pæk", "kk": "саламын", "ru": "укладываю"},
  pages: {"ipa": "ˈpeɪdʒɪz", "kk": "беттері", "ru": "страницы"},
  passenger: {"ipa": "ˈpæsɪndʒə", "kk": "жолаушыларға арналған", "ru": "пассажирский"},
  passengers: {"ipa": "ˈpæsɪndʒəz", "kk": "жолаушыларды", "ru": "пассажиров"},
  photo: {"ipa": "ˈfəʊtəʊ", "kk": "фотосуреті", "ru": "фотографией"},
  pick: {"ipa": "pɪk", "kk": "үземін", "ru": "срываю"},
  please: {"ipa": "pliːz", "kk": "өтінемін", "ru": "пожалуйста"},
  railway: {"ipa": "ˈreɪlweɪ", "kk": "теміржол", "ru": "железной дороги"},
  read: {"ipa": "riːd", "kk": "оқимын", "ru": "читаю"},
  red: {"ipa": "red", "kk": "қызыл", "ru": "красное"},
  rises: {"ipa": "ˈraɪzɪz", "kk": "шығады", "ru": "восходит"},
  road: {"ipa": "rəʊd", "kk": "жол", "ru": "дороги"},
  sea: {"ipa": "siː", "kk": "теңіз", "ru": "морем"},
  seats: {"ipa": "siːts", "kk": "орын", "ru": "сидений"},
  shows: {"ipa": "ʃəʊz", "kk": "көрсетеді", "ru": "показывает"},
  sits: {"ipa": "sɪts", "kk": "отырады", "ru": "сидит"},
  slices: {"ipa": "ˈslaɪsɪz", "kk": "тілімдеп кеседі", "ru": "нарезает ломтиками"},
  small: {"ipa": "smɔːl", "kk": "кішкентай", "ru": "маленький"},
  softly: {"ipa": "ˈsɒftli", "kk": "ақырын", "ru": "тихо"},
  starts: {"ipa": "stɑːts", "kk": "басталады", "ru": "начинается"},
  summer: {"ipa": "ˈsʌmə", "kk": "жазғы", "ru": "летней"},
  tall: {"ipa": "tɔːl", "kk": "биік", "ru": "высокое"},
  thirty: {"ipa": "ˈθɜːti", "kk": "отыз", "ru": "тридцать"},
  through: {"ipa": "θruː", "kk": "арқылы", "ru": "через"},
  to: {"ipa": "tə", "kk": "…-ға / …-ге", "ru": "кому"},
  toast: {"ipa": "təʊst", "kk": "тост", "ru": "тостов"},
  today: {"ipa": "təˈdeɪ", "kk": "бүгін", "ru": "сегодня"},
  trip: {"ipa": "trɪp", "kk": "сапар", "ru": "поездкой"},
  upstairs: {"ipa": "ˌʌpˈsteəz", "kk": "жоғарғы қабаттағы", "ru": "на верхнем этаже"},
  walls: {"ipa": "wɔːlz", "kk": "қабырға", "ru": "стены"},
  watch: {"ipa": "wɒtʃ", "kk": "бақылаймын", "ru": "наблюдаю"},
  we: {"ipa": "wiː", "kk": "біз", "ru": "мы"},
  wheels: {"ipa": "wiːlz", "kk": "дөңгелек", "ru": "колеса"},
  with: {"ipa": "wɪð", "kk": "…-мен; бар", "ru": "с"},
  wooden: {"ipa": "ˈwʊdən", "kk": "ағаштан жасалған", "ru": "деревянные"},
  write: {"ipa": "raɪt", "kk": "жазамын", "ru": "пишу"}
});
const articleHints = {
  a: {ipa:'ə', note:'Неопределённый артикль: здесь говорится об одном предмете, впервые вводимом в рассказ. Отдельного перевода обычно нет.'},
  an: {ipa:'ən', note:'Неопределённый артикль перед гласным звуком: здесь говорится об одном предмете, впервые вводимом в рассказ. Отдельного перевода обычно нет.'},
  the: {ipa:'ðə', note:'Определённый артикль: здесь имеется в виду конкретный предмет, понятный из ситуации. Отдельного перевода обычно нет.'}
};
// Position-specific meanings; positions count words in the complete sentence, from zero.
const sentenceHintOverrides = {
  food: [
    {1:{kk:'түскі астан',ru:'обеда'},5:{kk:'қызыл',ru:'красное'},6:{kk:'алманы',ru:'яблоко'},9:{kk:'ағаштан',ru:'дерева'},8:{note:'Речь о конкретном дереве, с которого срывают плод. Отдельного перевода обычно нет.'}},
    {2:{kk:'әкем',ru:'папа'},4:{kk:'жаңа піскен',ru:'свежий'},5:{kk:'нанды',ru:'хлеб'},7:{kk:'біздің',ru:'наших'}},
    {5:{note:'Здесь речь о ёмкостях для питья, а не об очках. После числительного в казахском: бес стақан.'},6:{kk:'…-дан / …-ден',ru:'связь количества с содержимым',note:'Связывает меру объёма с содержимым; отдельное слово при переводе обычно не нужно.'},7:{kk:'су',ru:'воду'}},
    {0:{note:'Речь о конкретном фермере в этой ситуации. Отдельного перевода обычно нет.'},3:{kk:'жаңа сауылған',ru:'свежее'},6:{note:'Речь о конкретной корове этого фермера. Отдельного перевода обычно нет.'}}
  ],
  transport: [
    {0:{kk:'біздің',ru:'нашей'},1:{kk:'отбасымыздың',ru:'семьи'},2:{kk:'автокөлігі',ru:'машина'}},
    {0:{note:'Речь о конкретном городском транспорте в этой ситуации. Отдельного перевода обычно нет.'},7:{note:'Речь о дороге, по которой идёт движение. Отдельного перевода обычно нет.'}},
    {0:{note:'Речь о конкретном длинном транспорте в этой ситуации. Отдельного перевода обычно нет.'},6:{note:'Речь о железной дороге, вдоль которой идёт движение. Отдельного перевода обычно нет.'}},
    {1:{kk:'бақылаймыз',ru:'наблюдаем'},7:{note:'Речь об облаках, видимых в небе. Отдельного перевода обычно нет.'}}
  ],
  home: [
    {0:{kk:'біздің',ru:'наша'},2:{kk:'тұрады',ru:'живёт'},5:{kk:'кішкентай',ru:'небольшом'},6:{kk:'үйде',ru:'доме'},8:{note:'Один сад при этом жилище; он впервые упоминается. Отдельного перевода обычно нет.'},9:{kk:'бағы',ru:'садом'}},
    {0:{kk:'менің',ru:'моя'},8:{kk:'кішкентай',ru:'маленькое'}},
    {2:{note:'Речь о конкретном входе в наше жилище. Отдельного перевода обычно нет.'},6:{kk:'кіргеннен',ru:'входа'},7:{kk:'біздің',ru:'наш'},8:{kk:'үйге',ru:'дом'}},
    {1:{note:'Речь о конкретном закрытом предмете, через который смотрят. Отдельного перевода обычно нет.'},3:{kk:'терезе',ru:'окно'},8:{kk:'біздің',ru:'нашем'},9:{kk:'бақта',ru:'саду'}}
  ],
  school: [
    {3:{note:'Речь о конкретном новом учебном материале. Отдельного перевода обычно нет.'},5:{kk:'сабақты',ru:'урок'},8:{kk:'балаға',ru:'детям'}},
    {0:{note:'Речь о конкретном новом человеке в классе. Отдельного перевода обычно нет.'},4:{phrase:'at his desk',kk:'өз партасында',ru:'за своей партой'},5:{phrase:'at his desk',kk:'өз партасында',ru:'за своей партой'},6:{phrase:'at his desk',kk:'өз партасында',ru:'за своей партой'}},
    {0:{kk:'біздің',ru:'наш'},4:{phrase:'at nine',kk:'сағат тоғызда',ru:'в девять часов'},5:{phrase:'at nine',kk:'сағат тоғызда',ru:'в девять часов'}},
    {2:{kk:'өзімнің',ru:'своё'},5:{note:'Речь о конкретных страницах, на которых пишут. Отдельного перевода обычно нет.'},6:{kk:'беттеріне',ru:'страницах'},7:{kk:'…-ның / …-нің',ru:'связь принадлежности',note:'Показывает, чему принадлежат страницы; не переводится отдельным словом.'},8:{kk:'өзімнің',ru:'моей'},9:{kk:'дәптерімнің',ru:'тетради'}}
  ],
  travel: [
    {0:{phrase:'at the border',kk:'шекарада',ru:'на границе'},1:{note:'Речь о границе, которую пересекают в этой поездке. Отдельного перевода обычно нет.'},2:{phrase:'at the border',kk:'шекарада',ru:'на границе'},5:{kk:'өзінің',ru:'свой'},6:{kk:'төлқұжатын',ru:'паспорт'},8:{kk:'өзінің',ru:'своей'}},
    {5:{kk:'…-ғанға дейін',ru:'перед тем как'},0:{note:'Речь о конкретном проводнике в этой поездке. Отдельного перевода обычно нет.'},4:{kk:'билетімді',ru:'билет'},8:{note:'Речь о конкретном поезде, в который садятся. Отдельного перевода обычно нет.'}},
    {3:{kk:'…-ға / …-ге',ru:'в',note:'Здесь обозначает, куда укладывают вещи.'},4:{kk:'өзімнің',ru:'свой'},5:{kk:'шабаданыма',ru:'чемодан'},7:{kk:'біздің',ru:'нашей'}},
    {0:{kk:'біздің',ru:'наша'},3:{note:'Речь об одном номере для проживания, который впервые упоминается. Отдельного перевода обычно нет.'},4:{kk:'бөлмені',ru:'номер'},5:{kk:'…-да / …-де',ru:'в'},7:{kk:'қонақүйде',ru:'отеле'},9:{note:'Речь о море рядом с местом отдыха. Отдельного перевода обычно нет.'}}
  ],
  other: [
    {5:{kk:'кітап',ru:'книгу'},7:{kk:'түрлі түсті',ru:'красочными'},8:{kk:'беттері',ru:'страницами'}},
    {0:{note:'Определённый артикль: речь об объекте, который в этой ситуации считается единственным. Отдельного перевода обычно нет.'},4:{phrase:'in the east',kk:'шығыста',ru:'на востоке'},5:{ipa:'ði',note:'Речь о стороне света; перед гласным звуком east артикль произносится /ði/. Отдельного перевода обычно нет.'},6:{phrase:'in the east',kk:'шығыста',ru:'на востоке'}},
    {1:{kk:'биік',ru:'высокое'},4:{kk:'ағаш',ru:'деревянные',note:'Здесь описывается материал живых ветвей.'},5:{kk:'бұтақтар',ru:'ветви'},7:{kk:'біздің',ru:'нашим'},8:{kk:'үйіміздің',ru:'домом'}},
    {6:{note:'Речь о конкретной двери кухни в этом доме. Отдельного перевода обычно нет.'},8:{kk:'есігінің',ru:'дверью'}}
  ]
};
function sentenceParts(task, answered=false) {
  const text=answered?task.text.replace('___',task.answer):task.text;
  const category=Object.keys(sentenceBank).find(category=>sentenceBank[category].includes(task));
  const overrides=sentenceHintOverrides[category]?.[sentenceBank[category]?.indexOf(task)] || {};
  const words=task.text.toLowerCase().match(/___|[a-z]+/g)||[];
  const phrases={day:['күн сайын','каждый день'],morning:['күн сайын таңертең','каждое утро'],evening:['күн сайын кешке','каждый вечер']};
  let position=0;
  return (text.match(/___|[A-Za-z]+(?:['’][A-Za-z]+)*|[^A-Za-z_]+/g)||[]).map(text=>{
    if(text==='___') {position++;return {text};}
    if(!/^[A-Za-z]/.test(text) || task.lang!=='en') return {text};
    const index=position++,key=text.toLowerCase();
    const hint={...(articleHints[key]||hintWords[key]),...overrides[index],word:text};
    // These phrases never include the blank in the current bank.
    const previous=words[index-1],next=words[index+1];
    if(key==='every' || previous==='every') {
      const unit=key==='every'?next:key;
      if(phrases[unit]) Object.assign(hint,{phrase:`every ${unit}`,kk:phrases[unit][0],ru:phrases[unit][1]});
    }
    if(key==='the' && !hint.note.startsWith('Определённый артикль')) hint.note=`Определённый артикль: ${hint.note}`;
    if(key==='a' && !hint.note.startsWith('Неопределённый артикль')) hint.note=`Неопределённый артикль: ${hint.note}`;
    return {text,hint};
  });
}

const storageKey = 'slovarium.category';
function shuffle(items, random = Math.random) {
  const result = [...items];
  for (let i=result.length-1;i>0;i--) {
    const j=Math.floor(random()*(i+1));
    [result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}
class WordGame {
  constructor(random = Math.random) { this.random=random; this.phase='home'; this.category=null; }
  start(category) {
    if (!Object.hasOwn(vocabulary, category)) return;
    this.unlocked=false; this.sentenceGame=null;
    this.firstTryCorrect=0; this.errors=0;
    this.category=category; this.deck=shuffle(vocabulary[category],this.random); this.index=0; this.newCard();
  }
  newCard() {
    this.source=languages[Math.floor(this.random()*languages.length)];
    this.targets=shuffle(languages.filter(l=>l!==this.source),this.random);
    this.stage=0; this.stageErrors=0; this.cardFeedback=null; this.prepare();
  }
  prepare() {
    const others=shuffle(vocabulary[this.category].filter(e=>e.id!==this.entry.id),this.random).slice(0,2);
    this.options=shuffle([this.entry,...others],this.random); this.phase='question'; this.correct=null;
  }
  get entry() { return this.deck[this.index]; }
  get target() { return this.targets[this.stage]; }
  answer(id) {
    if(this.phase!=='question' || !this.options.some(e=>e.id===id)) return;
    this.correct=id===this.entry.id;
    if(this.correct) {
      if(this.stageErrors===0) this.firstTryCorrect++;
    } else {
      this.errors++; this.stageErrors++;
    }
    this.cardFeedback={target:this.target,correct:this.correct};
    if(this.correct && this.stage===0) { this.stage=1; this.stageErrors=0; this.prepare(); return; }
    this.phase='feedback';
  }
  advance() {
    if(this.phase!=='feedback') return;
    if(!this.correct) { this.options=shuffle(this.options,this.random); this.phase='question'; this.correct=null; this.cardFeedback=null; return; }
    if(this.index===this.deck.length-1) { this.phase='complete'; this.unlocked=this.firstTryCorrect>=16; return; }
    this.index++; this.newCard();
  }
  startSentences() {
    if(!this.unlocked || !['complete','sentence-complete'].includes(this.phase)) return;
    this.sentenceGame=new SentenceGame(sentenceBank[this.category],this.random);
    this.phase='sentences';
  }
  home() { this.phase='home'; this.unlocked=false; this.sentenceGame=null; }
}
class SentenceGame {
  constructor(tasks, random=Math.random) {
    this.random=random; this.deck=shuffle(tasks,random); this.index=0;
    this.firstTryCorrect=0; this.errors=0; this.taskErrors=0; this.prepare();
  }
  get task() { return this.deck[this.index]; }
  prepare() { this.options=shuffle(this.task.choices,this.random); this.phase='question'; this.correct=null; }
  answer(value) {
    if(this.phase!=='question' || !this.options.includes(value)) return;
    this.correct=value===this.task.answer;
    if(this.correct) { if(this.taskErrors===0) this.firstTryCorrect++; }
    else { this.errors++; this.taskErrors++; }
    this.phase='feedback';
  }
  advance() {
    if(this.phase!=='feedback') return;
    if(!this.correct) { this.prepare(); return; }
    if(this.index===this.deck.length-1) { this.phase='complete'; return; }
    this.index++; this.taskErrors=0; this.prepare();
  }

}
function loadCategory(storage) {
  try { const id=storage.getItem(storageKey); return Object.hasOwn(categories,id)?id:null; } catch { return null; }
}
function saveCategory(storage, id) { try { storage.setItem(storageKey,id); } catch { /* Browser storage may be disabled. */ } }

function wordWithIPA(variant) {
  return variant.word + (variant.ipa ? ` /${variant.ipa}/` : '');
}

function createSentenceHelp(doc, view, sentence, tip) {
  let active=null, hovered=null, overTip=false, focused=null, pinned=false, timer=null;
  function cancelClose() { view.clearTimeout(timer); }
  function close() {
    cancelClose();
    if(active) active.removeAttribute('aria-describedby');
    active=null; hovered=null; overTip=false; focused=null; pinned=false;
    tip.hidden=true; tip.replaceChildren();
  }
  function position() {
    if(!active || tip.hidden) return;
    const edge=8,gap=8,anchor=active.getBoundingClientRect();
    const width=doc.documentElement.clientWidth,height=view.innerHeight;
    tip.style.maxHeight=`${Math.max(44,height-edge*2)}px`;
    const box=tip.getBoundingClientRect();
    const left=Math.max(edge,Math.min(anchor.left+anchor.width/2-box.width/2,width-box.width-edge));
    let top=anchor.top-box.height-gap;
    if(top<edge) top=anchor.bottom+gap;
    top=Math.max(edge,Math.min(top,height-box.height-edge));
    tip.style.left=`${left}px`;tip.style.top=`${top}px`;
  }
  function show(button,hint) {
    cancelClose();
    if(active===button && !tip.hidden) return;
    close();active=button;
    function line(text,lang) {
      const p=doc.createElement('p');p.textContent=text;
      if(lang) p.lang=lang;
      tip.append(p);
    }
    line(`${hint.word} /${hint.ipa}/`,'en');
    if(hint.phrase) line(`Сочетание: ${hint.phrase}`);
    if(hint.kk) line(`Қазақша: ${hint.kk}`,'kk');
    if(hint.ru) line(`Русский: ${hint.ru}`,'ru');
    if(hint.phrase) line(`Пояснение: перевод относится ко всему сочетанию ${hint.phrase}.`);
    if(hint.note) line(`Пояснение: ${hint.note}`);
    button.setAttribute('aria-describedby',tip.id);
    tip.hidden=false;position();
  }
  function scheduleClose() {
    cancelClose();
    timer=view.setTimeout(()=>{
      if(!hovered && !overTip && !focused && !pinned) close();
    },180);
  }
  function render(task,answered) {
    close();
    sentence.replaceChildren();
    if(task.lang!=='en') {sentence.textContent=answered?task.text.replace('___',task.answer):task.text;return;}
    for(const part of sentenceParts(task,answered)) {
      if(!part.hint) {sentence.append(doc.createTextNode(part.text));continue;}
      const button=doc.createElement('button');
      button.type='button';button.className='sentence-word';button.lang='en';button.textContent=part.text;
      let pointerKind=null, wasOpen=false;
      button.addEventListener('pointerdown',event=>{
        pointerKind=event.pointerType;wasOpen=active===button && !tip.hidden;
      });
      button.addEventListener('pointerenter',event=>{
        if(event.pointerType==='touch') return;
        show(button,part.hint);hovered=button;cancelClose();
      });
      button.addEventListener('pointerleave',event=>{
        if(event.pointerType==='touch') return;
        if(hovered===button) hovered=null;
        scheduleClose();
      });
      button.addEventListener('focus',()=>{
        if(pointerKind) return;
        show(button,part.hint);focused=button;
      });
      button.addEventListener('blur',()=>{
        pointerKind=null;
        if(focused===button) focused=null;
        scheduleClose();
      });
      button.addEventListener('click',()=>{
        // Pointerdown runs before focus: touch focus must not toggle the first tap closed.
        if(pointerKind==='touch' || pointerKind==='pen') {
          if(wasOpen) close();
          else {show(button,part.hint);pinned=true;}
        } else if(!pointerKind) {show(button,part.hint);focused=button;}
        else {show(button,part.hint);hovered=button;}
        pointerKind=null;
      });
      sentence.append(button);
    }
  }
  tip.addEventListener('pointerenter',event=>{
    if(event.pointerType==='touch') return;
    overTip=true;cancelClose();
  });
  tip.addEventListener('pointerleave',event=>{
    if(event.pointerType==='touch') return;
    overTip=false;scheduleClose();
  });
  doc.addEventListener('pointerdown',event=>{
    if(active && !active.contains(event.target) && !tip.contains(event.target)) close();
  });
  doc.addEventListener('keydown',event=>{
    if(event.key==='Escape' && active) {event.preventDefault();close();}
  });
  view.addEventListener('resize',position);
  view.addEventListener('scroll',position,true);
  return {render,close};
}

function mount() {
  const game=new WordGame();
  const $=id=>document.getElementById(id);
  const sentenceHelp=createSentenceHelp(document,window,$('sentence-text'),$('word-tooltip'));
  let saved=null;
  try { saved=loadCategory(window.localStorage); } catch { /* Access itself can throw. */ }
  const grid=$('categories');
  for(const [id,category] of Object.entries(categories)) {
    const button=document.createElement('button');button.className='category';button.dataset.category=id;
    const icon=document.createElement('span');icon.className='icon';icon.textContent=category.icon;icon.setAttribute('aria-hidden','true');
    const title=document.createElement('strong');title.textContent=category.name;
    const count=document.createElement('span');count.className='muted';count.textContent='10 понятий · 3 языка';
    button.append(icon,title,count);button.addEventListener('click',()=>start(id));grid.append(button);
  }
  function start(id) {
    game.start(id);saved=id;
    try { saveCategory(window.localStorage,id); } catch { /* Keep the session usable. */ }
    render();
  }
  function render() {
    sentenceHelp.close();
    const home=game.phase==='home',sentenceMode=game.phase==='sentences'||game.phase==='sentence-complete';
    const complete=game.phase==='complete'||game.phase==='sentence-complete';
    $('sentence-exercise').hidden=!sentenceMode||complete;
    $('exercise').hidden=home||complete||sentenceMode;
    $('home').hidden=!home;$('lesson').hidden=home;$('exercise').hidden=home||complete||sentenceMode;$('complete').hidden=!complete;
    grid.querySelectorAll('button').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.category===saved));});
    if(home) { $('home-title').focus();return; }
    $('topic').textContent=categories[game.category].name;
    $('progress-bar').max=sentenceMode?10:20;
    $('progress').textContent=complete?'10 из 10 понятий':`Слово ${game.index+1} из 10 · этап ${game.stage+1} из 2`;
    $('progress-bar').value=complete?20:game.index*2+game.stage;
    if(complete) {
      const score=sentenceMode?game.sentenceGame:game,total=sentenceMode?10:20;
      $('complete-title').textContent=sentenceMode?'Предложения пройдены':'Набор пройден';
      $('complete-note').textContent=sentenceMode?'Все 10 предложений пройдены!':'Все 10 понятий — на трёх языках. Отличная работа!';
      $('unlock-message').hidden=sentenceMode||game.unlocked;
      $('to-sentences').hidden=sentenceMode||!game.unlocked;
      $('restart').textContent=sentenceMode?'Повторить предложения':'Повторить набор';
      $('progress').textContent=sentenceMode?'10 из 10 предложений':'10 из 10 понятий';
      $('progress-bar').value=total;
      $('first-try-result').textContent=`Верно с первой попытки: ${score.firstTryCorrect} из ${total}`;
      $('errors-result').textContent=`Ошибок: ${score.errors}`;
      $('complete-title').focus();return;
    }
    if(sentenceMode) {
      const sg=game.sentenceGame,task=sg.task,awaiting=sg.phase==='question';
      $('progress').textContent=`Предложение ${sg.index+1} из 10`;
      $('progress-bar').value=sg.index;
      $('sentence-language').textContent=languageNames[task.lang];
      sentenceHelp.render(task,!awaiting);
      $('sentence-text').lang=task.lang;
      $('sentence-result').textContent=awaiting?'':sg.correct?'Верно!':'Попробуй ещё раз';
      $('sentence-options').replaceChildren(); $('sentence-options').hidden=!awaiting;
      if(awaiting) for(const value of sg.options) {
        const button=document.createElement('button');button.className='option';button.lang=task.lang;button.textContent=value;
        button.addEventListener('click',()=>{sg.answer(value);render();});$('sentence-options').append(button);
      }
      $('sentence-advance').hidden=awaiting;
      $('sentence-advance').textContent=sg.correct?'Следующее предложение':'Повторить';
      if(awaiting) $('sentence-text').focus();else $('sentence-advance').focus();
      return;
    }
    const entry=game.entry[game.source],feedback=game.cardFeedback;
    const awaitingAnswer=game.phase==='question';
    $('source-language').textContent=languageNames[game.source];
    $('word').textContent=entry.word;$('word').lang=game.source;
    $('ipa').textContent=entry.ipa?`/${entry.ipa}/`:'';$('ipa').hidden=!entry.ipa;
    $('example').textContent=entry.example;$('example').lang=game.source;
    $('prompt').textContent=`Выбери перевод на ${languageNames[game.target]}`;
    $('stage-source').textContent=awaitingAnswer?`${wordWithIPA(entry)} · ${languageNames[game.source]}`:'';
    $('flip-card').classList.toggle('flipped',Boolean(feedback));
    $('front').setAttribute('aria-hidden',String(Boolean(feedback)));$('back').setAttribute('aria-hidden',String(!feedback));
    $('translation').textContent=feedback?game.entry[feedback.target].word:'';$('translation').lang=feedback?feedback.target:game.target;
    const translated=game.entry[feedback?feedback.target:game.target];
    $('translation-ipa').textContent=feedback&&translated.ipa?`/${translated.ipa}/`:'';
    $('translation-ipa').hidden=!feedback||!translated.ipa;
    $('result').textContent=feedback?(feedback.correct?'Верно!':'Попробуй ещё раз'):'';
    $('back').classList.toggle('incorrect',Boolean(feedback)&&!feedback.correct);
    const options=$('options');options.replaceChildren();options.hidden=!awaitingAnswer;
    if(awaitingAnswer) for(const item of game.options) {
      const button=document.createElement('button');button.className='option';button.lang=game.target;button.textContent=wordWithIPA(item[game.target]);
      button.addEventListener('click',()=>{game.answer(item.id);render();});options.append(button);
    }
    $('advance').hidden=awaitingAnswer;
    $('prompt').hidden=!awaitingAnswer;
    $('advance').textContent=!game.correct?'Повторить':'Следующее слово';
    if(awaitingAnswer) $('prompt').focus();else $('advance').focus();
  }
  $('back-home').addEventListener('click',()=>{game.home();render();});
  $('complete-home').addEventListener('click',()=>{game.home();render();});
  $('restart').addEventListener('click',()=>{
    if(game.phase==='sentence-complete') { game.startSentences();render(); } else start(game.category);
  });
  $('to-sentences').addEventListener('click',()=>{game.startSentences();render();});
  $('sentence-advance').addEventListener('click',()=>{
    game.sentenceGame.advance();
    if(game.sentenceGame.phase==='complete') game.phase='sentence-complete';
    render();
  });
  $('advance').addEventListener('click',()=>{game.advance();render();});
  if(saved) start(saved);else render();
}
if(typeof module!=='undefined' && module.exports) module.exports={sentenceParts,createSentenceHelp,sentenceBank,SentenceGame,vocabulary,categories,languages,WordGame,shuffle,loadCategory,saveCategory,storageKey};
if(typeof document!=='undefined') mount();
