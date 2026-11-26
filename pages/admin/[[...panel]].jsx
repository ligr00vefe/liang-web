import Head from 'next/head';
import InquiryManager from '../../components/InquiryManager';
import {useState} from 'react';
import {db,cases,signedIn,setupToken} from '../../lib/store';

import {adminState,productionSignedIn} from '../../lib/production-admin';
import {readGallery} from '../../lib/gallery';

export async function getServerSideProps({req,res,query,params}){
 res.setHeader('Cache-Control','private, no-store');
 if(process.env.NODE_ENV!=='development'){
  const requested=(params?.panel ?? []).join('/');
  if (!['','editor','setup','inquiries'].includes(requested)) return {notFound:true};
  const state=await adminState();
  const auth=await productionSignedIn(req);
  if(['editor','inquiries'].includes(requested)&&!auth) return {redirect:{destination:'/admin',permanent:false}};
  if(requested==='setup'&&(!state.invite||state.ready)) return {notFound:true};
  const mode=requested==='setup'?'setup':auth?(requested==='editor'?'editor':requested==='inquiries'?'inquiries':'list'):'login';
  return {props:{mode,ready:state.ready,items:auth?await readGallery():[],id:auth&&typeof query.id==='string'?query.id:'',token:'',loginAvailable:state.ready||mode==='setup',production:true}};
 }
  const conn=db();
 try{
  const ready=Boolean(conn.prepare('SELECT id FROM owner').get());
  const auth=Boolean(signedIn(conn,req));
  const requested=(params?.panel ?? []).join('/');
  const setup=!ready&&requested==='setup'&&query.token===setupToken();
  if(!ready)setupToken();
  const mode=auth?(requested==='editor'?'editor':requested==='inquiries'?'inquiries':'list'):setup?'setup':'login';
  return {props:{mode,ready,items:auth?cases(conn):[],id:auth?query.id||'':'',token:setup?query.token:''}};
 }finally{conn.close()}
}
async function encodePhoto(file) {
 const bitmap=await createImageBitmap(file);
 try {
  const canvas=document.createElement('canvas');
  for (const max of [1600, 1200, 900, 650]) {
   const scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
   canvas.width=Math.max(1,Math.round(bitmap.width*scale));
   canvas.height=Math.max(1,Math.round(bitmap.height*scale));
   canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
   const encoded=canvas.toDataURL('image/webp',0.78);
   if (encoded.startsWith('data:image/webp;') && encoded.length<=360000) return encoded;
  }
  throw new Error('Photo exceeds upload budget');
 } finally {bitmap.close()}
}
const blank={short:'',category:'카페',products:'',desc:'',material:'',finish:'',condition:'',photos:[],ai:true};
export default function Admin({mode,ready,items,id,token,loginAvailable=true,production=false}){
 const [item,setItem]=useState(items.find(x=>x.id===id)||blank);
 const [status,setStatus]=useState('');
 const [busy,setBusy]=useState(false);
 function field(key,value){setItem(current=>({...current,[key]:value}))}
 async function send(body){
  setBusy(true);
  try{
   const response=await fetch('/api/manage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
   if(!response.ok){
    const details=await response.json().catch(()=>null);
    setStatus(details?.error || '처리할 수 없습니다. 입력 내용과 로그인 상태를 확인해 주세요.');
    setBusy(false);
    return;
   }
   location.assign('/admin');
  }catch{setStatus('처리할 수 없습니다. 입력 내용과 로그인 상태를 확인해 주세요.');setBusy(false)}
 }
 async function upload(files){
  if(files.length+item.photos.length>10||files.some(f=>f.size>5*1024*1024||!['image/png','image/jpeg','image/webp'].includes(f.type))){setStatus('JPG·PNG·WebP 사진을 장당 5MB 이하, 최대 10장까지 선택해 주세요.');return}
  try {
  const photos=production?await Promise.all(files.map(encodePhoto)):await Promise.all(files.map(file=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(file)})));
  field('photos',[...item.photos,...photos]);setStatus('');
  } catch {setStatus('사진을 변환하지 못했습니다. 다른 사진을 선택해 주세요.');}
 }
 const auth=mode==='login'||mode==='setup';
 return <><Head><title>리앙 가구 관리자</title><meta name="robots" content="noindex"/><link rel="stylesheet" href="/theme.css"/><link rel="stylesheet" href="/sub.css"/><link rel="stylesheet" href="/admin.css"/></Head><header className="admin-header"><a className="logo" href="/"><img src="/assets/logo_liang_dark.svg" alt="리앙 가구"/></a><span>관리자</span><a href="/works">공개 갤러리 보기</a></header>
 <div className={auth?'':'admin-console'}>
 {!auth&&<aside className="console-sidebar"><div><p className="eyebrow">리앙 가구 관리</p><nav aria-label="관리자 메뉴"><a href="/admin" aria-current={mode!=='inquiries'?'page':undefined}>시공사례 관리</a><a href="/admin/inquiries" aria-current={mode==='inquiries'?'page':undefined}>제작 문의 관리</a></nav></div><div className="console-account"><p>대표 관리자</p><button className="button outline" disabled={busy} onClick={()=>send({action:'logout'})}>로그아웃</button></div></aside>}
 <main className={auth?"shell section":"shell admin-workspace"} style={{maxWidth:auth?460:1200}}>
 {auth?<><h1>{mode==='setup'?'첫 관리자 계정 설정':'관리자 로그인'}</h1><form onSubmit={e=>{e.preventDefault();if(!loginAvailable){setStatus('받은 초기 설정 링크에서 관리자 비밀번호를 먼저 설정해 주세요.');return;}const data=new FormData(e.currentTarget);if(mode==='setup'&&data.get('password')!==data.get('confirm')){setStatus('비밀번호가 일치하지 않습니다.');return}send({action:mode,token:production&&mode==='setup'?location.hash.slice(1):token,email:data.get('email'),password:data.get('password')})}}>
 <label>대표 이메일<input type="email" name="email" required/></label><label>비밀번호<input type="password" name="password" autoComplete={mode==='setup'?'new-password':'current-password'} required minLength={mode==='setup'?12:1}/></label>
 {mode==='setup'&&<label>비밀번호 확인<input type="password" name="confirm" required minLength="12"/></label>}
 <button className="button submit" disabled={busy}>{mode==='setup'?'관리자 계정 생성':'로그인'}</button></form>{!loginAvailable&&<p role="status">처음 접속하나요? 전달받은 초기 설정 링크에서 비밀번호를 정해 주세요.</p>}{loginAvailable&&!ready&&mode==='login'&&<p>최초 계정은 전달받은 초기 설정 링크에서 생성해 주세요.</p>}</>:
 mode==='inquiries'?<InquiryManager/>:
 mode==='list'?<><div className="admin-title"><h1>시공사례 관리</h1><a className="button" href="/admin/editor">새 사례 등록</a></div><div className="management-head"><span>시공사례</span><span>공간</span><span>수정</span><span>삭제</span></div>{items.map(c=><article className="admin-case" key={c.id}><div className="case-meta"><img src={c.photos[0]} alt=""/><h2>{c.short}</h2></div><span>{c.category}</span><a href={'/admin/editor?id='+c.id}>수정</a><button disabled={busy} onClick={()=>confirm('이 사례를 삭제할까요?')&&send({action:'delete',id:c.id})}>삭제</button></article>)}</>:
 <><h1>{id?'시공사례 수정':'새 사례 등록'}</h1><form className="editor compact-editor" onSubmit={e=>{e.preventDefault();if(!item.photos.length){setStatus('사진을 선택해 주세요.');return}send({action:'save',item,id})}}>
 <section className="editor-panel"><label>공간<select value={item.category} onChange={e=>field('category',e.target.value)}>{['카페','매장','사무실'].map(v=><option key={v}>{v}</option>)}</select></label>
 {Object.entries({short:'제목',products:'제작 품목',desc:'본문',material:'소재',finish:'마감',condition:'현장 조건'}).map(([key,label])=><label key={key} className={key==='desc'?'field-wide':''}>{label}{key==='desc'?<textarea rows={3} maxLength={3000} value={item[key]||''} required onChange={e=>field(key,e.target.value)}/>:<input maxLength={{short:100,products:250,material:250,finish:250,condition:500}[key]} value={item[key]||''} required={['short','products'].includes(key)} onChange={e=>field(key,e.target.value)}/>}</label>)}</section>
 <section className="editor-panel photo-panel">
 <div className="photo-panel-heading"><h2>사진</h2><span>{item.photos.length}/10장</span></div>
 <p className="photo-help">JPG · PNG · WebP / 장당 5MB 이하</p>
 <div className={'photo-picker '+(item.photos.length?'has-photos':'')+(item.photos.length>2?' many-photos':'')+(item.photos.length>5?' dense-photos':'')}>
  {item.photos.map((src,i)=><div className={'photo-tile '+(i===0?'cover-photo':'')} key={i}>
   <img src={src} alt={'선택한 사진 '+(i+1)}/>
   {i===0&&<span className="cover-label">대표 사진</span>}
   <div className="photo-tile-actions">
    {i>0&&<button type="button" onClick={()=>field('photos',[src,...item.photos.filter((_,n)=>n!==i)])}>대표로 지정</button>}
    <button type="button" aria-label={(i+1)+'번째 사진 삭제'} onClick={()=>field('photos',item.photos.filter((_,n)=>n!==i))}>삭제</button>
   </div>
  </div>)}
  {item.photos.length<10&&<label className="photo-add">
   <span className="photo-add-icon" aria-hidden="true">+</span>
   <strong>{item.photos.length?'사진 추가':'사진 선택'}</strong>
   {!item.photos.length&&<span>최대 10장까지 등록할 수 있어요</span>}
   <input type="file" aria-label="사진 선택" accept="image/png,image/jpeg,image/webp" multiple onChange={e=>{upload([...e.target.files]);e.target.value='';}}/>
  </label>}
 </div>
 <div className="ai-setting"><label className="checkbox"><input type="checkbox" checked={item.ai} onChange={e=>field('ai',e.target.checked)}/><span>AI 이미지 표시</span></label>
 <p>체크하면 공개 사진에 ‘가상 사례 · AI 생성 이미지’ 안내가 표시됩니다.</p></div>
</section><div className="editor-actions"><a href="/admin" className="button outline">취소</a><button disabled={busy} className="button">저장</button></div></form></>}
 <p role="status">{status}</p></main></div></>;
}
