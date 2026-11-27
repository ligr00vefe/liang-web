import {renderToStaticMarkup} from 'react-dom/server';
import settings from '../content/site-settings.json';

export const inquiryEnabled=settings.inquiryEnabled;

function ContactLinks() {
  const phone=settings.phone?.replace(/[^+0-9]/g,'');
  const kakao=settings.kakaoUrl && /^https:\/\/(pf|open)\.kakao\.com\//.test(settings.kakaoUrl);
  if(!phone&&!kakao)return null;
  return <div className="footer-contact">
    {phone&&<a href={'tel:'+phone}>전화 상담 {settings.phone}</a>}
    {kakao&&<a href={settings.kakaoUrl} target="_blank" rel="noopener noreferrer">카카오톡 상담</a>}
  </div>;
}
export function prepareContent(markup) {
  const contact=renderToStaticMarkup(<ContactLinks/>);
  let content=markup.replace(/<header\b[\s\S]*?<\/header>/g,'')
    .replace(/<div class="menu-panel"[\s\S]*?<\/nav><small>[\s\S]*?<\/small><\/div><\/div>/,'');
  if(!inquiryEnabled)content=content
    .replace(/<form name="inquiry"[\s\S]*?<\/form>/,
      '<section class="inquiry-paused" role="status"><h2>온라인 문의 접수가 일시 중지되어 있습니다.</h2><p>문의 접수를 위한 안내를 정비하고 있습니다. 준비가 완료되면 다시 이용하실 수 있습니다.</p></section>')
    .replace('<p class="muted small">필수 항목만 작성해도 문의할 수 있습니다.<br>보내주신 연락처로 상담을 이어갑니다.</p>','');
  if(!content.includes('href="/privacy"')&&!content.includes('data-privacy-open'))content=content.replace(/(<div class="footer-bottom">[\s\S]*?)(<\/div>)/,'$1<button type="button" class="privacy-footer-button" data-privacy-open>개인정보 처리 안내</button>$2');
  return content.replace(/<a\b[^>]*href="\/privacy"[^>]*>[\s\S]*?<\/a>/g,'<button type="button" class="privacy-footer-button" data-privacy-open>개인정보 처리 안내</button>')
    .replace('<div class="footer-bottom">',contact+'<div class="footer-bottom">');
}
