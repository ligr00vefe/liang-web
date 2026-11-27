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
  <div className="privacy-dialog-content">
   <p className="privacy-intro">리앙 가구는 맞춤가구 제작 문의와 견적 상담을 위해 다음과 같이 개인정보를 수집·이용합니다.</p>
   <table className="privacy-summary"><caption className="sr-only">제작 문의 개인정보 수집·이용 내용</caption><tbody>
    <tr><th scope="row">수집·이용 목적</th><td>맞춤가구 제작 문의 접수, 견적 상담 및 답변 안내</td></tr>
    <tr><th scope="row">수집 항목</th><td><p><b>필수</b> 성함, 연락처, 설치 지역, 문의 내용</p><p><b>선택</b> 희망 일정, 대략적인 크기</p></td></tr>
    <tr><th scope="row">보유·이용 기간</th><td><strong>상담 종료일로부터 6개월</strong><p>보유기간이 지나면 문의 정보를 삭제합니다.</p></td></tr>
    <tr><th scope="row">개인정보 담당자</th><td>리앙 가구 박지훈 대표</td></tr>
   </tbody></table>
   <div className="privacy-consent-note"><h3>동의를 거부할 권리 및 안내</h3><p>개인정보 수집·이용에 동의하지 않을 수 있습니다. 다만 필수 정보에 동의하지 않으면 온라인 문의 접수가 제한됩니다. 선택 항목은 입력하지 않아도 문의할 수 있습니다.</p></div>
   <details className="privacy-details"><summary>개인정보 처리 상세 안내</summary><div>
    <h3>문의 정보의 관리 및 삭제</h3><p>상담 종료일을 기준으로 6개월이 지난 문의는 정기 작업으로 삭제합니다. 이메일 알림과 다운로드 파일 등 별도 사본도 운영자가 같은 보유 기준에 따라 삭제합니다.</p>
    <h3>개인정보 처리 업무의 위탁</h3><table className="privacy-summary"><caption className="sr-only">개인정보 처리 수탁자와 업무</caption><tbody><tr><th scope="row">Netlify</th><td>문의 접수·보관 및 알림 연동</td></tr><tr><th scope="row">Neon</th><td>문의 보유기간 관리 기록 보관</td></tr></tbody></table>
   </div></details>
  </div><div className="privacy-dialog-footer"><button type="button" className="button" onClick={()=>dialog.current.close()}>내용 확인</button></div>
 </dialog>;
}
