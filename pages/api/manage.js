import crypto from 'node:crypto';
import {db,signedIn,digest,setupToken} from '../../lib/store';
export const config={api:{bodyParser:{sizeLimit:'72mb'}}};
export default function handler(req,res){
  if(process.env.NODE_ENV!=='development')return res.status(503).end();
  if(req.method!=='POST'||req.headers.origin!=='http://'+req.headers.host)return res.status(403).end();
  const conn=db();
  try{
    const {action,email,password,token,item,id}=req.body;
    const owner=conn.prepare('SELECT * FROM owner').get();
    if(action==='setup'||action==='login'){
      if(typeof email!=='string'||typeof password!=='string'||password.length>256)return res.status(400).end();
      if(action==='setup'){
        if(owner||!token||token!==setupToken()||password.length<12||!/^\S+@\S+\.\S+$/.test(email))return res.status(403).end();
        const salt=crypto.randomBytes(16).toString('hex');
        conn.prepare('INSERT INTO owner VALUES(1,?,?,?)').run(email.trim().toLowerCase(),salt,crypto.scryptSync(password,salt,64).toString('hex'));
      }else if(!owner||email.trim().toLowerCase()!==owner.email||!crypto.timingSafeEqual(crypto.scryptSync(password,owner.salt,64),Buffer.from(owner.hash,'hex')))return res.status(403).end();
      const session=crypto.randomBytes(32).toString('hex');
      conn.prepare('INSERT INTO sessions VALUES(?,?)').run(digest(session),Date.now()+8*3600000);
      res.setHeader('Set-Cookie','liang_session='+session+'; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800');
    }else{
      if(!signedIn(conn,req))return res.status(401).end();
      if(action==='logout'){
        conn.prepare('DELETE FROM sessions WHERE token=?').run(digest(req.cookies.liang_session));
        res.setHeader('Set-Cookie','liang_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
      }else if(action==='delete')conn.prepare('DELETE FROM cases WHERE id=?').run(id);
      else if(action==='save'){
        if(!item||!item.short?.trim()||!item.desc?.trim()||!item.products?.trim()||!['카페','매장','사무실'].includes(item.category)||!Array.isArray(item.photos)||!item.photos.length||item.photos.length>10)return res.status(400).end();
        if(item.photos.some(src=>typeof src!=='string'||src.length>6990540||!(/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(src)||/^\/assets\/[\w.-]+\.png$/.test(src))))return res.status(400).end();
        const key=id||crypto.randomUUID();
        if(id&&!conn.prepare('SELECT id FROM cases WHERE id=?').get(id))return res.status(404).end();
        conn.prepare('INSERT OR REPLACE INTO cases VALUES(?,?)').run(key,JSON.stringify({...item,id:key}));
      }else return res.status(400).end();
    }
    return res.json({ok:true});
  }finally{conn.close()}
}
