import {randomBytes, scryptSync} from 'node:crypto';

const password = await new Promise((resolve, reject) => {
  if (!process.stdin.isTTY) return reject(new Error('터미널에서 실행해 주세요.'));
  process.stdout.write('관리자 비밀번호 (12자 이상, 입력 숨김): ');
  process.stdin.setRawMode(true);
  process.stdin.setEncoding('utf8');
  process.stdin.resume();
  let input = '';
  process.stdin.on('data', chunk => {
    for (const char of chunk) {
      if (char === '\u0003') process.exit(130);
      if (char === '\r' || char === '\n') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write('\n');
        return resolve(input);
      }
      if (char === '\u007f' || char === '\b') input = input.slice(0, -1);
      else input += char;
    }
  });
});
if (password.length < 12 || password.length > 256) throw new Error('12~256자를 입력해 주세요.');
const salt = randomBytes(16);
console.log(salt.toString('hex') + ':' + scryptSync(password, salt, 64).toString('hex'));
