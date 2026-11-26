import {useEffect,useRef,useState} from 'react';

const date=value=>new Date(value).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',dateStyle:'medium',timeStyle:'short'});
const labels={name:'성함',phone:'연락처',area:'설치 지역',schedule:'희망 일정',size:'대략적인 크기',message:'문의 내용'};
export default function InquiryManager() {
  const [rows,setRows]=useState([]);
  const [page,setPage]=useState(1);
  const [next,setNext]=useState(false);
  const [refresh,setRefresh]=useState(0);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [selected,setSelected]=useState(null);
  const [removing,setRemoving]=useState(false);
  const [deleteError,setDeleteError]=useState('');
  const [notice,setNotice]=useState('');
  const dialog=useRef(null);
  useEffect(()=>{
    const controller=new AbortController();
    setLoading(true);setError('');
    fetch('/api/inquiries?page='+page,{signal:controller.signal,cache:'no-store'})
      .then(async response=>{
        const body=await response.json();
        if(!response.ok) throw new Error(body.error || '문의함을 불러오지 못했습니다.');
        if(page>1&&body.submissions.length===0){setPage(page-1);return;}
        setRows(body.submissions);setNext(body.hasNext);
      }).catch(error=>{if(error.name!=='AbortError')setError(error.message);})
      .finally(()=>{if(!controller.signal.aborted)setLoading(false);});
    return ()=>controller.abort();
  },[page,refresh]);
  useEffect(()=>{
    if(selected&&!dialog.current.open) dialog.current.showModal();
  },[selected]);
  async function remove() {
    if(!selected||removing) return;
    setRemoving(true);setDeleteError('');
    try{
      const response=await fetch('/api/inquiries?id='+encodeURIComponent(selected.id),{method:'DELETE'});
      if(!response.ok){
        const body=await response.json();
        throw new Error(body.error || '삭제하지 못했습니다.');
      }
      dialog.current.close();
      setNotice('문의를 삭제했습니다. 알림 이메일 사본은 메일함에서 별도로 삭제해 주세요.');
      setRefresh(value=>value+1);
    }catch(error){setDeleteError(error.message);}
    finally{setRemoving(false);}
  }
  return <>
    <div className="admin-title"><div><h1>제작 문의 관리</h1><p className="muted">홈페이지에서 접수된 제작 문의를 확인하고 관리합니다.</p></div>
      <button className="button outline" disabled={loading} onClick={()=>{setNotice('');setRefresh(value=>value+1);}}>새로고침</button></div>
    <p className="inquiry-notice" role="status">{notice}</p>
    <section className="inquiry-table" aria-label="제작 문의 목록" aria-busy={loading}>
      <div className="inquiry-table-head"><span>접수일</span><span>성함</span><span>설치 지역</span><span>문의 내용</span><span>관리</span></div>
      {loading?<div className="inquiry-empty" role="status">문의를 불러오는 중입니다.</div>:
       error?<div className="inquiry-empty" role="alert"><p>{error}</p><button className="button outline" onClick={()=>setRefresh(value=>value+1)}>다시 불러오기</button></div>:
       rows.length===0?<div className="inquiry-empty">아직 접수된 문의가 없습니다.</div>:
       rows.map(row=><article key={row.id} className="inquiry-row">
        <time dateTime={row.createdAt}>{date(row.createdAt)}</time><strong>{row.data.name||'이름 없음'}</strong><span>{row.data.area||'미입력'}</span>
        <p className="inquiry-excerpt">{row.data.message||'내용 없음'}</p>
        <button className="inquiry-detail-button" onClick={()=>{setSelected(row);setDeleteError('');}}>상세 보기<span className="sr-only"> {row.data.name}님 문의</span></button>
       </article>)}
    </section>
    {!error&&<nav className="inquiry-pagination" aria-label="문의 페이지"><button className="button outline" disabled={loading||page===1} onClick={()=>setPage(page-1)}>이전</button><span>{page} 페이지</span><button className="button outline" disabled={loading||!next} onClick={()=>setPage(page+1)}>다음</button></nav>}
    <dialog className="inquiry-dialog" ref={dialog} onClose={()=>{setSelected(null);setDeleteError('');}} onCancel={event=>{if(removing)event.preventDefault();}}>
      {selected&&<><div className="inquiry-detail-heading"><div><h2>제작 문의 상세</h2><p>{date(selected.createdAt)} 접수</p></div><button type="button" className="button outline" disabled={removing} onClick={()=>dialog.current.close()}>닫기</button></div>
       <dl className="inquiry-fields">{Object.entries(labels).map(([key,label])=><div key={key}><dt>{label}</dt><dd>{selected.data[key]||'미입력'}</dd></div>)}</dl>
       <form onSubmit={event=>{event.preventDefault();remove();}} className="inquiry-delete">
        <label className="checkbox"><input key={selected.id} type="checkbox" required disabled={removing}/><span>이 문의를 영구 삭제하는 데 동의합니다.</span></label>
        <p role="alert">{deleteError}</p><button type="submit" className="button" disabled={removing}>{removing?'삭제 중…':'문의 삭제'}</button>
       </form></>}
    </dialog>
  </>;
}
