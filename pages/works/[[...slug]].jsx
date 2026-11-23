import fs from 'node:fs';
import Head from 'next/head';
import {db,cases} from '../../lib/store';

export async function getServerSideProps({params}){
 const conn=db();
 try{
  const items=cases(conn);
  const id=params.slug?.[0]||null;
  if((params.slug||[]).length>1||id&&!items.some(c=>c.id===id))return {notFound:true};
  const source=fs.readFileSync('content/works.html','utf8');
  return {props:{items:id?items.filter(c=>c.id===id):items,id,header:source.match(/<header.*?<\/header>/s)[0],footer:source.match(/<section class="cta".*$/s)[0]}};
 }finally{conn.close()}
}
function Photo({item,src,styleName=''}){
 return <figure className={'photo '+styleName}><img src={src} alt={item.short}/>{item.ai&&<figcaption>가상 사례 · AI 생성 이미지 / 실제 시공 사진 아님</figcaption>}</figure>;
}
export default function Gallery({items,id,header,footer}){
 const item=items[0];
 const title=id?item.short:'공간마다, 다른 쓰임.';
 return <><Head><title>{title} | 리앙 가구</title><link rel="stylesheet" href="/theme.css"/><link rel="stylesheet" href="/sub.css"/></Head><div dangerouslySetInnerHTML={{__html:header}}/>
 <main><section className="shell intro"><p className="eyebrow">{id?item.category+' 맞춤가구':'제작 갤러리'}</p><h1>{id?title:<>공간마다,<br/>다른 쓰임.</>}</h1><p className="intro-desc">{id?item.products:'가구가 놓일 자리부터 작은 디테일까지. 공간에 맞춘 제작 방향을 살펴보세요.'}</p></section>
 {id?<><Photo item={item} src={item.photos[0]} styleName="shell detail-hero"/><section className="shell split section"><div><h2>{item.short}</h2><p className="body-copy">{item.desc}</p></div><dl className="specs">{Object.entries({products:'제작 품목',material:item.ai?'소재 예시':'소재',finish:'마감 방향',condition:'현장 확인 항목'}).filter(([key])=>item[key]).map(([key,label])=><div key={key}><dt>{label}</dt><dd>{item[key]}</dd></div>)}</dl></section>{item.photos.slice(1).map((src,i)=><Photo key={i} item={item} src={src} styleName="shell secondary-image"/>)}<div className="shell detail-actions"><a href="/works">갤러리 목록</a><a href="/inquiry" className="button">제작 문의하기</a></div></>:<section className="shell work-grid">{items.length===0&&<p>등록된 사례가 없습니다.</p>}{items.map(c=><a className="case-card" key={c.id} href={'/works/'+c.id}><Photo item={c} src={c.photos[0]}/><div className="case-heading"><h2>{c.short}</h2><span className="tag">{c.category}</span></div><p>{c.products}</p></a>)}</section>}</main><div dangerouslySetInnerHTML={{__html:footer}}/><script defer src="/public.js"/></>;
}
