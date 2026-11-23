const toggle = document.querySelector('.menu-button');
toggle?.addEventListener('click', () => {
  const menu = document.querySelector('.mobile-nav');
  menu.hidden = !menu.hidden;
  toggle.setAttribute('aria-expanded', String(!menu.hidden));
});
document.querySelector('.inquiry-form')?.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const status = form.querySelector('.form-status');
  const button = form.querySelector('button[type=submit]');
  button.disabled = true;
  const local = ['localhost','127.0.0.1'].includes(location.hostname);
  try {
    const response = await fetch(local ? '/api/inquiry' : '/forms.html', {
      method:'POST', body:new URLSearchParams(new FormData(form))
    });
    if (!response.ok) throw Error();
    form.reset();
    status.textContent = local ? '로컬 서버에 테스트 문의가 접수되었습니다.' : '제작 문의가 접수되었습니다.';
  } catch {
    status.textContent = '문의가 접수되지 않았습니다. 잠시 후 다시 시도해 주세요.';
  } finally { button.disabled = false; }
});
