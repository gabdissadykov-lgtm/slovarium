const state = {language:'en', category:'food', index:0};
const labels = {food:'Еда', transport:'Транспорт', home:'Дом', school:'Школа', travel:'Путешествие', other:'Другое'};
const languages = {en:'English', ru:'Русский', kk:'Қазақша'};
const cards = document.getElementById('cards');
const panel = document.getElementById('practice-panel');
const next = document.getElementById('next');
function render() {
  document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', b.dataset.lang === state.language));
  document.querySelectorAll('[data-category]').forEach(b => b.setAttribute('aria-pressed', b.dataset.category === state.category));
  document.getElementById('category-title').textContent = labels[state.category];
  document.getElementById('set-description').textContent = `${languages[state.language]} · набор из 10 слов`;
  cards.replaceChildren(...vocabulary[state.category][state.language].map((entry,i) => {
    const card = document.createElement('article'); card.className='card'; card.lang=state.language;
    const top = document.createElement('div'); top.className='card-top';
    const word = document.createElement('h3'); word.className='word'; word.textContent=entry.word;
    const number = document.createElement('span'); number.className='card-number'; number.textContent=String(i+1).padStart(2,'0');
    top.append(word,number); card.append(top);
    if(entry.transcription){const phonetic=document.createElement('p');phonetic.className='transcription';phonetic.textContent=`/${entry.transcription}/`;card.append(phonetic);}
    const example=document.createElement('p');example.className='example';example.textContent=entry.example;card.append(example);return card;
  }));
  panel.hidden=true; cards.hidden=false;
}
function showQuestion(){
  const entry=vocabulary[state.category][state.language][state.index];
  document.getElementById('progress').textContent=`Карточка ${state.index+1} из 10`;
  // The clue omits the target word, including inflected forms in Russian and Kazakh.
  const tokens=entry.example.split(' ');
  const stem=entry.word.toLocaleLowerCase().slice(0,Math.min(3,entry.word.length));
  document.getElementById('clue').textContent=tokens.map(t=>t.toLocaleLowerCase().includes(stem)?'______':t).join(' ');
  document.getElementById('clue').lang=state.language;
  const answer=document.getElementById('answer');answer.textContent=entry.word+(entry.transcription?` /${entry.transcription}/`:'');answer.lang=state.language;answer.hidden=true;
  document.getElementById('reveal').hidden=false;next.hidden=true;
  next.textContent=state.index===9?'Завершить набор':'Следующая карточка';
}
document.querySelectorAll('[data-lang]').forEach(b=>b.addEventListener('click',()=>{state.language=b.dataset.lang;render();}));
document.querySelectorAll('[data-category]').forEach(b=>b.addEventListener('click',()=>{state.category=b.dataset.category;render();}));
document.getElementById('practice').addEventListener('click',()=>{state.index=0;panel.hidden=false;cards.hidden=true;showQuestion();});
document.getElementById('close-practice').addEventListener('click',render);
document.getElementById('reveal').addEventListener('click',()=>{document.getElementById('answer').hidden=false;document.getElementById('reveal').hidden=true;next.hidden=false;});
next.addEventListener('click',()=>{if(state.index===9){render();return;}state.index++;showQuestion();});
render();
