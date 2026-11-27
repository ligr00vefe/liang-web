import {productionSignedIn} from '../../lib/production-admin';
import {db,signedIn} from '../../lib/store';
import {retentionSql} from '../../lib/inquiry-retention.mjs';

const formId='6b06f01ae55c7a9a442a9c54';
const fields=['name','phone','area','schedule','size','message'];
const pageSize=20;

function authorized(req) {
  if(process.env.NODE_ENV!=='development') return productionSignedIn(req);
  const connection=db();
  try { return Boolean(signedIn(connection,req)); }
  finally {connection.close();}
}
function publicSubmission(row) {
  const data=Object.fromEntries(fields.map(name=>[name,String(row.data?.[name] ?? '')]));
  return {id:row.id,createdAt:row.created_at,data};
}
async function netlify(path,method='GET') {
  const response=await fetch('https://api.netlify.com/api/v1'+path,{
    method,
    headers:{Authorization:'Bearer '+process.env.NETLIFY_FORMS_TOKEN,Accept:'application/json'},
    signal:AbortSignal.timeout(12000),
    cache:'no-store'
  });
  if(!response.ok) {
    const error=new Error('Netlify request failed');
    error.status=response.status;
    throw error;
  }
  const text=await response.text();
  return text?JSON.parse(text):null;
}
export default async function inquiries(req,res) {
  res.setHeader('Cache-Control','private, no-store');
  res.setHeader('X-Content-Type-Options','nosniff');
  if(!['GET','DELETE','PATCH'].includes(req.method)) {
    res.setHeader('Allow','GET, DELETE, PATCH');
    return res.status(405).end();
  }
  try {
    if(!await authorized(req)) return res.status(401).json({error:'로그인이 만료되었습니다. 다시 로그인해 주세요.'});
    if(!process.env.NETLIFY_FORMS_TOKEN) return res.status(503).json({error:'문의함 연결 설정이 필요합니다. 운영 서버에 NETLIFY_FORMS_TOKEN을 등록해 주세요.'});
    const id=req.query.id;
    if(id!==undefined&&(typeof id!=='string'||!/^[a-f0-9]{24}$/.test(id))) return res.status(400).json({error:'문의 주소를 확인해 주세요.'});
    if(['DELETE','PATCH'].includes(req.method)&&!id) return res.status(400).end();
    if(id) {
      if(['DELETE','PATCH'].includes(req.method)) {
        const protocol=process.env.NODE_ENV==='development'?'http':'https';
        if(req.headers.origin!==protocol+'://'+req.headers.host) return res.status(403).end();
      }
      const result=await netlify('/submissions/'+id);
      const row=Array.isArray(result)?result[0]:result;
      if(!row||row.form_id!==formId) return res.status(404).json({error:'문의를 찾을 수 없습니다.'});
      const sql=retentionSql();
      if(req.method==='PATCH') {
        if(req.body?.action==='verify'){await netlify('/submissions/'+id+'/ham','PUT');return res.json({ok:true});}
        if(!['close','reopen'].includes(req.body?.action))return res.status(400).end();
        if(req.body.action==='reopen')await sql`DELETE FROM inquiry_retention WHERE submission_id=${id}`;
        else await sql`INSERT INTO inquiry_retention(submission_id,closed_at,delete_after) VALUES (${id},now(),now()+interval '6 months') ON CONFLICT(submission_id) DO NOTHING`;
        const [retention]=await sql`SELECT closed_at,delete_after FROM inquiry_retention WHERE submission_id=${id}`;
        return res.json({retention:retention||null});
      }
      if(req.method==='DELETE') {
        await netlify('/submissions/'+id,'DELETE');
        await sql`DELETE FROM inquiry_retention WHERE submission_id=${id}`;
        return res.status(204).end();
      }
      const [retention]=await sql`SELECT closed_at,delete_after FROM inquiry_retention WHERE submission_id=${id}`;
      return res.json({submission:{...publicSubmission(row),retention:retention||null}});
    }
    const state=req.query.state ?? 'verified';
    if(!['verified','spam'].includes(state)) return res.status(400).end();
    const page=Number(req.query.page ?? 1);
    if(!Number.isInteger(page)||page<1||page>10000) return res.status(400).end();
    const rows=await netlify('/forms/'+formId+'/submissions?page='+page+'&per_page='+pageSize+(state==='spam'?'&state=spam':''));
    const sql=retentionSql();const ids=rows.map(row=>row.id);
    const metadata=ids.length?await sql`SELECT submission_id,closed_at,delete_after FROM inquiry_retention WHERE submission_id=ANY(${ids}::text[])`:[];
    return res.json({submissions:rows.map(row=>({...publicSubmission(row),retention:metadata.find(item=>item.submission_id===row.id)||null})),page,hasNext:rows.length===pageSize});
  } catch(error) {
    if(error.status===404) return res.status(404).json({error:'문의를 찾을 수 없습니다.'});
    const setup=[401,403].includes(error.status);
    return res.status(502).json({error:setup?'문의함 접근 권한을 확인해 주세요.':'문의함을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'});
  }
}
