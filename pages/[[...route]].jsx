import fs from 'node:fs';
import path from 'node:path';
import Head from 'next/head';
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
export async function getServerSideProps({params}) {
  const route=(params.route || []).join('/');
  if (!Object.hasOwn(pages,route)) return {notFound:true};
  const [name,title]=pages[route];
  const markup=fs.readFileSync(path.join(process.cwd(),'content',name+'.html'),'utf8');
  return {props:{name,title,markup:name === 'main' ? await homeGallery(markup) : markup}};
}
export default function PublicPage({name,title,markup}) {
  return <><Head><title>{title} | 리앙 가구</title><link rel="stylesheet" href="/theme.css"/><link rel="stylesheet" href={name==='main'?'/main.css':'/sub.css'}/></Head>
    <div dangerouslySetInnerHTML={{__html:markup}}/>
    <script defer src={name==='main'?'/main.js':'/public.js'}/>
  </>;
}
