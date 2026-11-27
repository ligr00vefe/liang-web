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
  <div className="privacy-dialog-header"><div><p>리앙 가구</p><h2 id="privacy-title">개인정보 수집·이용 안내</h2></div><button type="button" aria-label="개인정보 안내 닫기" onClick={()=>dialog.current.close()}>×</button></div>
  <div className="privacy-dialog-content"><p>리앙 가구는 맞춤가구 제작 상담과 문의 응대를 위해 아래 정보를 수집·이용합니다.</p>
   <dl><div><dt>운영 주체·담당자</dt><dd>리앙 가구 · 박지훈 대표</dd></div>
   <div><dt>이용 목적</dt><dd>제작 가능 여부 확인, 견적 상담 및 문의 응대</dd></div>
   <div><dt>수집 항목</dt><dd>필수: 성함, 연락처, 설치 지역, 문의 내용<br/>선택: 희망 일정, 대략적인 크기</dd></div>
   <div className="privacy-retention"><dt>보유·이용 기간</dt><dd><strong>상담 종료일로부터 6개월</strong><p>상담 중에는 문의 응대에 이용하며, 상담 종료 처리일로부터 6개월이 지나면 Netlify에 저장된 문의 원문과 종료 기록을 정기 작업으로 삭제합니다.</p></dd></div>
   <div><dt>파기 방법</dt><dd>전자 정보를 삭제합니다. 알림 이메일과 다운로드 파일 등 별도 사본은 운영자가 같은 보유 기준에 따라 별도로 삭제합니다.</dd></div>
   <div><dt>처리 서비스</dt><dd>Netlify Forms를 통해 문의를 접수·저장합니다. 상담 종료일과 삭제 예정일은 Neon DB에서 관리하며, 알림이 설정된 경우 담당자 이메일로 전달됩니다.</dd></div>
   <div><dt>동의 거부 권리</dt><dd>동의를 거부할 수 있습니다. 필수 정보 수집·이용에 동의하지 않으면 온라인 문의를 접수할 수 없습니다. 선택 항목을 비워도 문의할 수 있습니다.</dd></div></dl>
  </div><div className="privacy-dialog-footer"><button type="button" className="button" onClick={()=>dialog.current.close()}>내용 확인</button></div>
 </dialog>;
}
