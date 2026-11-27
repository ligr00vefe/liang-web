import {neon} from '@neondatabase/serverless';
import {productionSignedIn} from '../../lib/production-admin';

export default async function backup(req,res){
  res.setHeader('Cache-Control','private, no-store');
  if(req.method!=='GET')return res.status(405).end();
  if(!await productionSignedIn(req))return res.status(401).end();
  const sql=neon(process.env.DATABASE_URL);
  const [snapshot]=await sql`SELECT
    now() AS exported_at,
    coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'display_order',display_order,'data',data) ORDER BY display_order) FROM gallery_cases),'[]'::jsonb) AS cases,
    coalesce((SELECT jsonb_agg(jsonb_build_object('id',id,'case_id',case_id,'payload',payload)) FROM gallery_photos),'[]'::jsonb) AS photos`;
  res.setHeader('Content-Disposition','attachment; filename="liang-gallery-backup.json"');
  res.setHeader('X-Content-Type-Options','nosniff');
  res.json(snapshot);
}
