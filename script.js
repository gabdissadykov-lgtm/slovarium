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

function mount() {
  const game=new WordGame();
  const $=id=>document.getElementById(id);
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
      $('sentence-text').textContent=awaiting?task.text:task.text.replace('___',task.answer);
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
if(typeof module!=='undefined' && module.exports) module.exports={sentenceBank,SentenceGame,vocabulary,categories,languages,WordGame,shuffle,loadCategory,saveCategory,storageKey};
if(typeof document!=='undefined') mount();
