import PrivacyModal from '../components/PrivacyModal';
import '../styles/privacy.css';
import {useEffect,useState} from 'react';
import {useRouter} from 'next/router';
import '../public/theme.css';
import '../styles/public-main.css';
import '../styles/public-sub.css';
import '../public/navigation.css';
import '../styles/layout.css';

export default function App({Component,pageProps}){
 const router=useRouter();
 const [navigating,setNavigating]=useState(false);
 useEffect(()=>{
  const start=()=>setNavigating(true);
  const done=()=>setNavigating(false);
  router.events.on('routeChangeStart',start);
  router.events.on('routeChangeComplete',done);
  router.events.on('routeChangeError',done);
  return()=>{router.events.off('routeChangeStart',start);router.events.off('routeChangeComplete',done);router.events.off('routeChangeError',done);};
 },[router]);
 useEffect(()=>{
  function navigate(event){
   if(event.defaultPrevented||event.button!==0||event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||location.pathname.startsWith('/admin'))return;
   const target=event.target.closest('a[href],button[data-inquiry]');
   if(!target||target.target||target.hasAttribute('download'))return;
   const url=new URL(target.hasAttribute('data-inquiry')?'/inquiry':target.href,location.href);
   if(url.origin!==location.origin||url.pathname.startsWith('/admin')||url.pathname.endsWith('.html')||(url.pathname===location.pathname&&url.hash))return;
   event.preventDefault();
   router.push(url.pathname+url.search+url.hash).catch(()=>location.assign(url.href));
  }
  document.addEventListener('click',navigate);
  return()=>document.removeEventListener('click',navigate);
 },[router]);
 useEffect(()=>{
  const form=document.querySelector('.inquiry-form');
  async function submit(event){
   event.preventDefault();
   const button=form.querySelector('button[type=submit]'),status=form.querySelector('.form-status');
   button.disabled=true;
   try{
    const local=['localhost','127.0.0.1'].includes(location.hostname);
    const response=await fetch(local?'/api/inquiry':form.action,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams(new FormData(form))});
    if(!response.ok)throw Error();
    form.reset();status.textContent=local?'로컬 서버에 테스트 문의가 접수되었습니다.':'제작 문의가 접수되었습니다.';
   }catch{status.textContent='문의가 접수되지 않았습니다. 잠시 후 다시 시도해 주세요.';}
   finally{button.disabled=false;}
  }
  form?.addEventListener('submit',submit);
  return()=>form?.removeEventListener('submit',submit);
 },[router.asPath]);
 return <><Component {...pageProps}/><PrivacyModal/>{navigating&&<div className="navigation-feedback" role="status"><div className="navigation-progress"/><span>페이지를 불러오고 있습니다.</span></div>}</>;
}
