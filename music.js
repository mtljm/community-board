import {registrationUrl,fetchMusicPage,filterMusic} from './music-model.js';
const $=id=>document.getElementById(id);
let items=[],page=0,loaded=false,loading=false,hasMore=false;
function element(tag,text,className){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;}
function link(text,url){const a=element('a',text,'secondary');a.href=url;a.target='_blank';a.rel='noopener noreferrer';return a;}
function renderMusic(){
 const rows=filterMusic(items,$('music-search').value,$('music-state').value);$('music-list').replaceChildren();
 for(const item of rows){
  const card=element('article',undefined,'music-card'),top=element('div',undefined,'music-card-top');
  const heading=element('div');heading.append(element('span',item.state==='closed'?'보관':'MUSIC NOTE','eyebrow'),element('h2',item.title),element('p',item.artist,'music-artist'));
  top.append(heading,element('span','#'+item.number,'music-number'));card.append(top);
  const meta=[item.album,item.year].filter(Boolean).join(' · ');if(meta)card.append(element('p',meta,'music-meta'));
  card.append(element('p',item.comment||'아직 코멘트가 없습니다.','music-comment'));
  const actions=element('div',undefined,'music-card-actions');if(item.url)actions.append(link('감상 링크',item.url));actions.append(link('댓글 '+item.comments+' · 수정',item.urlIssue));card.append(actions);$('music-list').append(card);
 }
 if(!rows.length&&loaded)$('music-list').append(element('p',items.length?'조건에 맞는 음악이 없습니다. 검색어나 상태를 바꿔보세요.':'아직 등록된 음악이 없습니다. 첫 곡과 감상을 남겨보세요.','music-empty'));
 if(loaded)$('music-status').textContent='불러온 음악 '+items.length+'개 · 현재 '+rows.length+'개 표시'+(hasMore?' · 이전 등록은 아래에서 더 불러올 수 있습니다.':'');
 $('music-more').hidden=!hasMore;
}
async function loadMusic(reset=false){
 if(loading)return;loading=true;$('music-refresh').disabled=true;$('music-more').disabled=true;$('music-list').setAttribute('aria-busy','true');$('music-status').textContent='GitHub에 저장된 음악을 불러오는 중입니다…';
 try{const next=reset?1:page+1,result=await fetchMusicPage(next);items=reset?result.items:[...items,...result.items.filter(item=>!items.some(old=>old.number===item.number))];page=next;hasMore=result.hasMore;loaded=true;renderMusic();}
 catch(error){$('music-status').textContent=(error.name==='TimeoutError'?'응답이 늦어지고 있습니다. 잠시 후 다시 시도해 주세요.':error.message)+' 기존에 표시된 목록은 유지됩니다.';if(!loaded){$('music-list').replaceChildren(link('GitHub에서 음악 목록 확인','https://github.com/mtljm/community-board/issues?q=is%3Aissue+author%3Amtljm'));}}
 finally{loading=false;$('music-refresh').disabled=false;$('music-more').disabled=false;$('music-list').removeAttribute('aria-busy');}
}
document.addEventListener('music-open',()=>{if(!loaded)loadMusic(true);});
$('music-new').addEventListener('click',()=>{$('music-editor').hidden=false;$('music-form').elements.title.focus();});
$('music-cancel').addEventListener('click',()=>{$('music-editor').hidden=true;$('music-new').focus();});
$('music-refresh').addEventListener('click',()=>loadMusic(true));$('music-more').addEventListener('click',()=>loadMusic());
$('music-search').addEventListener('input',()=>{if(!loading)renderMusic();});$('music-state').addEventListener('change',()=>{if(!loading)renderMusic();});
$('music-form').addEventListener('submit',event=>{
 event.preventDefault();try{const url=registrationUrl(Object.fromEntries(new FormData(event.target)));const tab=window.open(url,'_blank');if(tab){tab.opener=null;$('music-form-status').textContent='GitHub 등록 화면을 열었습니다. 아직 저장되지 않았습니다. 제출 후 돌아와 목록을 새로고침해 주세요.';}else{$('music-form-status').replaceChildren(document.createTextNode('등록 화면을 열어 마지막 제출을 완료해 주세요. '),link('GitHub 등록 화면 열기',url));}}catch(error){$('music-form-status').textContent=error.message;}
});

if(location.hash==='#music')$('music-open').click();
