import fs from 'node:fs';
import path from 'node:path';
import Head from 'next/head';
import SiteHeader from '../components/SiteHeader';
import {homeGallery} from '../lib/home-gallery';

const pages = {
  '': ['main','서울·경기 맞춤가구 제작·설치'],
  about: ['about','리앙 소개'], process: ['process','제작 안내'],
  works: ['works','제작 갤러리'], inquiry: ['inquiry','제작 문의'],
  privacy: ['privacy','개인정보 안내'],
  'works/cafe': ['work-cafe','맞춤 카운터'],
  'works/store': ['work-store','진열대'],
  'works/office': ['work-office','회의 테이블과 수납장']
};
export async function getServerSideProps({params,res}) {
  const route=(params.route || []).join('/');
  if (!Object.hasOwn(pages,route)) return {notFound:true};
  const [name,title]=pages[route];
  if(route && !route.startsWith('works'))res.setHeader('Cache-Control','public, s-maxage=3600, stale-while-revalidate=86400');
  const markup=fs.readFileSync(path.join(process.cwd(),'content',name+'.html'),'utf8');
  const content=markup.replace(/<header\b[\s\S]*?<\/header>/g,'').replace(/<div class="menu-panel"[\s\S]*?<\/nav><small>[\s\S]*?<\/small><\/div><\/div>/,'');
  return {props:{name,title,markup:name === 'main' ? await homeGallery(content) : content}};
}
export default function PublicPage({name,title,markup}) {
  return <><Head><title>{title} | 리앙 가구</title></Head>
    <div className={name==='main'?'public-main':'public-sub'}><SiteHeader/><div key={name} dangerouslySetInnerHTML={{__html:markup}}/></div>

  </>;
}
