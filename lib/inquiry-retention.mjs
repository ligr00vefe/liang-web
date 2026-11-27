import {neon} from '@neondatabase/serverless';
export const inquiryFormId='6b06f01ae55c7a9a442a9c54';
export function retentionSql(){return neon(process.env.DATABASE_URL);}
export async function netlifyRequest(path,method='GET',fetcher=fetch,token=process.env.NETLIFY_FORMS_TOKEN){
 if(!token)throw new Error('Missing Forms token');
 const response=await fetcher('https://api.netlify.com/api/v1'+path,{method,headers:{Authorization:'Bearer '+token,Accept:'application/json'},signal:AbortSignal.timeout(2500),cache:'no-store'});
 if(!response.ok){const error=new Error('Forms request failed');error.status=response.status;throw error;}
 return response.status===204?null:response.json();
}
export async function purgeExpired({sql=retentionSql(),request=netlifyRequest,limit=5}={}){
 // UTC instants; PostgreSQL calendar months clamp month-end correctly.
 const due=await sql`SELECT submission_id FROM inquiry_retention WHERE delete_after<=now() ORDER BY delete_after LIMIT ${limit}`;
 let deleted=0;const started=Date.now();
 for(const {submission_id:id} of due){
  if(Date.now()-started>18000)break;
  try {
   const result=await request('/submissions/'+id);const row=Array.isArray(result)?result[0]:result;
   if(!row||row.form_id!==inquiryFormId)throw new Error('Form ownership mismatch');
   await request('/submissions/'+id,'DELETE');
  }catch(error){if(error.status!==404)throw error;}
  await sql`DELETE FROM inquiry_retention WHERE submission_id=${id}`;deleted++;
 }
 return {deleted};
}
