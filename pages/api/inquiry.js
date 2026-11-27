import settings from '../../content/site-settings.json';
import {mkdir,appendFile} from 'node:fs/promises';
export default async function inquiry(req,res) {
  if(process.env.NODE_ENV !== 'development') return res.status(404).end();
  if(!settings.inquiryEnabled||!settings.privacyApproved)return res.status(503).json({error:'inquiries-paused'});
  if(req.method !== 'POST') return res.status(405).end();
  const fields=['name','phone','area','schedule','size','message'];
  const data=Object.fromEntries(fields.map(key=>[key,String(req.body[key]||'').trim()]));
  if(!req.body.privacy || !data.name || !data.phone || !data.area || !data.message || Object.values(data).some(value=>value.length>3000)) return res.status(400).end();
  await mkdir('.local',{recursive:true});
  await appendFile('.local/inquiries.jsonl',JSON.stringify({...data,received:new Date().toISOString()})+'\n');
  res.status(201).end();
}
