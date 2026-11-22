export const REPOSITORY='mtljm/community-board';
export const OWNER='mtljm';
export const MARKER='<!-- community-board:music:v1 -->';
const fields=[['title','곡명'],['artist','아티스트'],['album','앨범'],['year','발매 연도'],['url','감상 링크'],['comment','코멘트']];
export function safeLink(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:'';}catch{return '';}}
export function validateMusic(input){
 const result={};
 for(const [key] of fields){const value=input[key];result[key]=typeof value==='string'?value.trim():'';}
 for(const key of ['title','artist'])if(!result[key])throw Error('곡명과 아티스트를 입력해 주세요.');
 for(const key of ['title','artist','album'])if(result[key].length>100||/[\r\n]/.test(result[key]))throw Error('곡명·아티스트·앨범은 각각 한 줄, 100자 이내로 입력해 주세요.');
 if(result.year&&!/^\d{4}$/.test(result.year))throw Error('발매 연도는 네 자리 숫자로 입력해 주세요.');
 if(result.url&&(result.url.length>500||!safeLink(result.url)))throw Error('감상 링크는 로그인 정보가 없는 https:// 주소를 입력해 주세요.');
 if(result.comment.length>600)throw Error('코멘트는 600자 이내로 입력해 주세요.');
 return result;
}
export function issueBody(input){const item=validateMusic(input);return MARKER+'\n\n'+fields.map(([key,label])=>'### '+label+'\n'+(item[key]||'_없음_')).join('\n\n');}
export function registrationUrl(input){
 const item=validateMusic(input),url=new URL('https://github.com/'+REPOSITORY+'/issues/new');
 url.searchParams.set('template','music.md');url.searchParams.set('title','[음악] '+item.title+' — '+item.artist);url.searchParams.set('body',issueBody(item));
 if(url.href.length>8000)throw Error('등록 주소가 너무 길어요. 코멘트나 링크를 조금 줄여 주세요.');
 return url.href;
}
export function parseMusicIssue(issue){
 if(!issue||issue.pull_request||issue.user?.login!==OWNER||!Number.isSafeInteger(issue.number)||issue.number<=0||typeof issue.body!=='string'||!issue.body.trimStart().startsWith(MARKER))return null;
 const body=issue.body.replace(/\r\n/g,'\n').trimStart().slice(MARKER.length);const values={};let position=0;
 for(let i=0;i<fields.length;i++){
  const [key,label]=fields[i],heading='### '+label+'\n',start=body.indexOf(heading,position);
  if(start<0)return null;
  const end=i+1<fields.length?body.indexOf('\n\n### '+fields[i+1][1]+'\n',start+heading.length):body.length;
  if(end<0)return null;
  const value=body.slice(start+heading.length,end).trim();values[key]=value==='_없음_'?'':value;position=end;
 }
 try{return {...validateMusic(values),number:issue.number,state:issue.state==='closed'?'closed':'open',comments:Number.isSafeInteger(issue.comments)?Math.max(0,issue.comments):0,updatedAt:issue.updated_at,urlIssue:'https://github.com/'+REPOSITORY+'/issues/'+issue.number};}catch{return null;}
}
export function filterMusic(items,query,state){const q=query.trim().toLocaleLowerCase();return items.filter(item=>(state==='all'||item.state===state)&&[item.title,item.artist,item.album,item.comment].join(' ').toLocaleLowerCase().includes(q));}
export async function fetchMusicPage(page=1,fetcher=fetch){
 if(!Number.isSafeInteger(page)||page<1)throw Error('잘못된 페이지입니다.');
 const response=await fetcher('https://api.github.com/repos/'+REPOSITORY+'/issues?state=all&sort=created&direction=desc&per_page=100&page='+page,{headers:{Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(15000),cache:'no-store'});
 if(!response.ok)throw Error(response.status===403||response.status===429?'GitHub 조회 한도에 도달했습니다. 잠시 후 다시 시도하거나 GitHub에서 목록을 확인해 주세요.':'음악 목록을 불러오지 못했습니다. 연결을 확인하고 다시 시도해 주세요.');
 const issues=await response.json();if(!Array.isArray(issues))throw Error('목록 응답 형식을 확인할 수 없습니다.');
 return {items:issues.map(parseMusicIssue).filter(Boolean),hasMore:issues.length===100};
}
