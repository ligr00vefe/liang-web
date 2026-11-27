import {ADMIN_PATH} from '../lib/admin-path';
import {useState} from 'react';

export default function AccountSettings({email}) {
  const [message,setMessage]=useState('');
  const [busy,setBusy]=useState(false);
  const [done,setDone]=useState(false);
  async function submit(event) {
    event.preventDefault();
    const form=event.currentTarget;
    const data=new FormData(form);
    if(data.get('next')!==data.get('confirm')){setMessage('새 비밀번호가 일치하지 않습니다.');return;}
    setBusy(true);setMessage('');
    try{
      const response=await fetch('/api/manage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'change-password',currentPassword:data.get('current'),newPassword:data.get('next'),newEmail:data.get('email')})});
      const body=await response.json().catch(()=>null);
      if(!response.ok)throw new Error(body?.error || '계정 정보를 변경하지 못했습니다.');
      form.reset();setDone(true);
    }catch(error){setMessage(error.message);}
    finally{setBusy(false);}
  }
  return <><div className="admin-title"><div><h1>계정 설정</h1><p className="muted">대표 관리자 이메일과 비밀번호를 직접 변경합니다.</p></div></div>
    {done?<section className="account-panel"><h2>계정 정보를 변경했습니다.</h2><p>기존 로그인은 모두 종료됐습니다. 변경한 계정으로 다시 로그인해 주세요.</p><a className="button" href={ADMIN_PATH}>다시 로그인</a></section>:
    <form className="account-panel" onSubmit={submit}>
      <label>관리자 이메일<input type="email" name="email" defaultValue={email} autoComplete="username" required maxLength={254}/></label>
      <label>현재 비밀번호<input type="password" name="current" autoComplete="current-password" required maxLength={256}/></label>
      <label>새 비밀번호<input type="password" name="next" autoComplete="new-password" required minLength={12} maxLength={256}/><small>12자 이상으로 입력해 주세요.</small></label>
      <label>새 비밀번호 확인<input type="password" name="confirm" autoComplete="new-password" required minLength={12} maxLength={256}/></label>
      <p>변경하면 이 브라우저를 포함한 모든 관리자 로그인이 종료됩니다.</p>
      <button className="button" disabled={busy}>{busy?'변경 중…':'계정 정보 변경'}</button>
      <p role="alert">{message}</p>
    </form>}
  </>;
}
