import PrivacyPolicyContent from './PrivacyPolicyContent';
import {useEffect,useRef} from 'react';
import {useRouter} from 'next/router';

export default function PrivacyModal(){
 const dialog=useRef(null);const router=useRouter();
 useEffect(()=>{
  if(router.asPath.startsWith('/admin'))return;
  const element=dialog.current;let previousOverflow=null;
  function open(){if(!element.open){if(previousOverflow===null)previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';element.showModal();}}
  function close(){if(!element.open){document.body.style.overflow=previousOverflow??'';previousOverflow=null;}}
  function click(event){if(event.target.closest('[data-privacy-open]')){event.preventDefault();open();}}
  function change(event){if(event.target.matches('input[name="privacy"]')&&event.target.checked)open();}
  document.addEventListener('click',click);document.addEventListener('change',change);element.addEventListener('close',close);
  if(router.query.privacy==='1')open();
  return()=>{document.removeEventListener('click',click);document.removeEventListener('change',change);element.removeEventListener('close',close);if(element.open){element.close();close();}};
 },[router.asPath,router.query.privacy]);
 if(router.asPath.startsWith('/admin'))return null;
 return <dialog ref={dialog} className="privacy-dialog" aria-labelledby="privacy-title" onClick={event=>{if(event.target===event.currentTarget){const r=event.currentTarget.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)event.currentTarget.close();}}}>
  <div className="privacy-dialog-header"><div><p>리앙 가구</p><h2 id="privacy-title">개인정보처리방침</h2></div><button type="button" aria-label="개인정보 안내 닫기" onClick={()=>dialog.current.close()}>×</button></div>
  <div className="privacy-dialog-content"><PrivacyPolicyContent/>
  </div><div className="privacy-dialog-footer"><button type="button" className="button" onClick={()=>dialog.current.close()}>내용 확인</button></div>
 </dialog>;
}
