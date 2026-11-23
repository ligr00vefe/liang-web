import {renderToStaticMarkup} from 'react-dom/server';
import {db,cases} from './store';
export function homeGallery(markup){
 const conn=db();
 try{
  const cards=cases(conn).slice(0,3).map((item,index)=><article key={item.id} className={'work reveal work-'+index}>
   <a className="work-open" href={'/works/'+item.id}><div className="photo"><img src={item.photos[0]} alt={item.short}/>{item.ai&&<span className="case-image-note">가상 사례 · AI 생성 이미지</span>}</div><span className="work-arrow" aria-hidden="true">↗</span></a>
   <div className="work-meta"><h3>{item.short}</h3><span className="work-space">{item.category}</span></div><p className="work-products"><b>제작 품목</b> {item.products}</p><p className="work-sub">{item.sub}</p></article>);
  return markup.replace(/<article class="work reveal work-0">[\s\S]*?<article class="work reveal work-2">[\s\S]*?<\/article>/,()=>renderToStaticMarkup(<>{cards}</>)).replace('아래 가상 사례는 AI로 생성한 가구 구성 예시이며, 실제 시공 실적이 아닙니다.','AI 생성 이미지는 가상 사례로 표시했습니다.');
 }finally{conn.close()}
}
