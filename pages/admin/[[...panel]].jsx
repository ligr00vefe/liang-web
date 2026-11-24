import Head from 'next/head';
import {useState} from 'react';
import {db,cases,signedIn,setupToken} from '../../lib/store';

export async function getServerSideProps({req,query,params}){
 if(process.env.NODE_ENV!=='development'){
  if (params?.panel?.length) return {notFound:true};
  return {props:{mode:'login', ready:false, items:[], id:'', token:'', loginAvailable:false}};
 }
 const conn=db();
 try{
  const ready=Boolean(conn.prepare('SELECT id FROM owner').get());
  const auth=Boolean(signedIn(conn,req));
  const requested=(params?.panel ?? []).join('/');
  const setup=!ready&&requested==='setup'&&query.token===setupToken();
  if(!ready)setupToken();
  const mode=auth?(requested==='editor'?'editor':'list'):setup?'setup':'login';
  return {props:{mode,ready,items:auth?cases(conn):[],id:auth?query.id||'':'',token:setup?query.token:''}};
 }finally{conn.close()}
}
const blank={short:'',category:'카페',products:'',desc:'',material:'',finish:'',condition:'',photos:[],ai:true};
export default function Admin({mode,ready,items,id,token,loginAvailable=true}){
 const [item,setItem]=useState(items.find(x=>x.id===id)||blank);
 const [status,setStatus]=useState('');
 const [busy,setBusy]=useState(false);
 function field(key,value){setItem(current=>({...current,[key]:value}))}
 async function send(body){
  setBusy(true);
  try{
   const response=await fetch('/api/manage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   if(!response.ok)throw Error();
   location.assign('/admin');
  }catch{setStatus('처리할 수 없습니다. 입력 내용과 로그인 상태를 확인해 주세요.');setBusy(false)}
 }
 async function upload(files){
  if(files.length+item.photos.length>10||files.some(f=>f.size>5*1024*1024||!['image/png','image/jpeg','image/webp'].includes(f.type))){setStatus('JPG·PNG·WebP 사진을 장당 5MB 이하, 최대 10장까지 선택해 주세요.');return}
  const photos=await Promise.all(files.map(file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)})));
  field('photos',[...item.photos,...photos]);setStatus('');
 }
 const auth=mode==='login'||mode==='setup';
 return <><Head><title>리앙 가구 관리자</title><meta name="robots" content="noindex"/><link rel="stylesheet" href="/theme.css"/><link rel="stylesheet" href="/sub.css"/></Head><header className="admin-header"><a className="logo" href="/"><img src="/assets/logo_liang_dark.svg" alt="리앙 가구"/></a><span>관리자</span><a href="/works">공개 갤러리 보기</a></header>
 <main className="shell section" style={{maxWidth:auth?460:1000}}>
 {auth?<><h1>{mode==='setup'?'첫 관리자 계정 설정':'관리자 로그인'}</h1><form onSubmit={e=>{e.preventDefault();if(!loginAvailable)return;const data=new FormData(e.currentTarget);if(mode==='setup'&&data.get('password')!==data.get('confirm')){setStatus('비밀번호가 일치하지 않습니다.');return}send({action:mode,token,email:data.get('email'),password:data.get('password')})}}>
 <label>대표 이메일<input type="email" name="email" disabled={!loginAvailable} required/></label><label>비밀번호<input type="password" name="password" disabled={!loginAvailable} autoComplete={mode==='setup'?'new-password':'current-password'} required minLength={mode==='setup'?12:1}/></label>
 {mode==='setup'&&<label>비밀번호 확인<input type="password" name="confirm" required minLength="12"/></label>}
 <button className="button submit" disabled={busy||!loginAvailable}>{mode==='setup'?'관리자 계정 생성':'로그인'}</button></form>{!loginAvailable&&<p role="status">운영 관리자 계정을 준비 중입니다.</p>}{loginAvailable&&!ready&&mode==='login'&&<p>최초 계정은 전달받은 초기 설정 링크에서 생성해 주세요.</p>}</>:
 mode==='list'?<><div className="admin-title"><h1>시공사례 관리</h1><a className="button" href="/admin/editor">새 사례 등록</a></div>{items.map(c=><article className="admin-case" key={c.id}><div className="case-meta"><img src={c.photos[0]} alt=""/><h2>{c.short}</h2></div><span>{c.category}</span><a href={'/admin/editor?id='+c.id}>수정</a><button disabled={busy} onClick={()=>confirm('이 사례를 삭제할까요?')&&send({action:'delete',id:c.id})}>삭제</button></article>)}<button className="text-link" onClick={()=>send({action:'logout'})}>로그아웃</button></>:
 <><h1>{id?'시공사례 수정':'새 사례 등록'}</h1><form className="editor" onSubmit={e=>{e.preventDefault();if(!item.photos.length){setStatus('사진을 선택해 주세요.');return}send({action:'save',item,id})}}>
 <section className="editor-panel"><label>공간<select value={item.category} onChange={e=>field('category',e.target.value)}>{['카페','매장','사무실'].map(v=><option key={v}>{v}</option>)}</select></label>
 {Object.entries({short:'제목',products:'제작 품목',desc:'본문',material:'소재',finish:'마감',condition:'현장 조건'}).map(([key,label])=><label key={key}>{label}<textarea rows={key==='desc'?4:1} value={item[key]||''} required={['short','products','desc'].includes(key)} onChange={e=>field(key,e.target.value)}/></label>)}</section>
 <section className="editor-panel"><h2>사진</h2><label>최대 10장 · 장당 5MB<input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={e=>upload([...e.target.files])}/></label><div className="photo-list">{item.photos.map((src,i)=><div className="photo-item" key={i}><img src={src} alt={'사진 '+(i+1)}/><button type="button" onClick={()=>field('photos',[src,...item.photos.filter((_,n)=>n!==i)])}>{i===0?'대표 사진':'대표로 지정'}</button><button type="button" onClick={()=>field('photos',item.photos.filter((_,n)=>n!==i))}>삭제</button></div>)}</div><label><input type="checkbox" checked={item.ai} onChange={e=>field('ai',e.target.checked)}/> AI 생성 가상 사례</label></section><div className="editor-actions"><a href="/admin" className="button outline">취소</a><button disabled={busy} className="button">저장</button></div></form></>}
 <p role="status">{status}</p></main></>;
}
