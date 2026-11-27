import BrandLogo from './BrandLogo';
import Link from 'next/link';
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/router';

const links=[['/about','리앙 소개'],['/process','제작 안내'],['/works','제작 갤러리'],['/inquiry','제작 문의']];
export default function SiteHeader(){
 const [open,setOpen]=useState(false);
 const router=useRouter();
 const toggle=useRef(null);
 useEffect(()=>{setOpen(false);},[router.asPath]);
 useEffect(()=>{
  function escape(event){if(event.key==='Escape'){setOpen(false);toggle.current?.focus();}}
  function resize(){if(innerWidth>760)setOpen(false);}
  addEventListener('keydown',escape);addEventListener('resize',resize);
  return()=>{removeEventListener('keydown',escape);removeEventListener('resize',resize);};
 },[]);
 return <header className="site-header">
  <div className="site-header-inner">
   <BrandLogo/>
   <nav className="site-desktop-nav" aria-label="주 메뉴">{links.map(([href,label])=><Link key={href} href={href} aria-current={router.asPath.startsWith(href)?'page':undefined}>{label}</Link>)}</nav>
   <button ref={toggle} type="button" className="site-menu-toggle" aria-label={open?'메뉴 닫기':'메뉴 열기'} aria-expanded={open} aria-controls="site-mobile-menu" onClick={()=>setOpen(value=>!value)}>{open?'닫기':'메뉴'}<span aria-hidden="true">{open?'×':'☰'}</span></button>
  </div>
  <nav id="site-mobile-menu" className="site-mobile-nav" hidden={!open} aria-label="모바일 메뉴">{links.map(([href,label])=><Link key={href} href={href} onClick={()=>setOpen(false)}>{label}</Link>)}</nav>
 </header>;
}
