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
    if(this.index===this.deck.length-1) { this.phase='complete'; return; }
    this.index++; this.newCard();
  }
  home() { this.phase='home'; }
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
    const home=game.phase==='home',complete=game.phase==='complete';
    $('home').hidden=!home;$('lesson').hidden=home;$('exercise').hidden=home||complete;$('complete').hidden=!complete;
    grid.querySelectorAll('button').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.category===saved));});
    if(home) { $('home-title').focus();return; }
    $('topic').textContent=categories[game.category].name;
    $('progress').textContent=complete?'10 из 10 понятий':`Слово ${game.index+1} из 10 · этап ${game.stage+1} из 2`;
    $('progress-bar').value=complete?20:game.index*2+game.stage;
    if(complete) {
      $('first-try-result').textContent=`Верно с первой попытки: ${game.firstTryCorrect} из 20`;
      $('errors-result').textContent=`Ошибок: ${game.errors}`;
      $('complete-title').focus();return;
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
  $('restart').addEventListener('click',()=>start(game.category));
  $('advance').addEventListener('click',()=>{game.advance();render();});
  if(saved) start(saved);else render();
}
if(typeof module!=='undefined' && module.exports) module.exports={vocabulary,categories,languages,WordGame,shuffle,loadCategory,saveCategory,storageKey};
if(typeof document!=='undefined') mount();
