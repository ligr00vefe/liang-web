import {purgeExpired} from '../../lib/inquiry-retention.mjs';
export default async () => {
 try {const result=await purgeExpired();console.log(JSON.stringify({task:'inquiry-retention',...result}));return new Response(null,{status:204});}
 catch {console.error('Inquiry retention failed. Check database and Forms access; retry on next run.');throw new Error('Inquiry retention cleanup failed');}
};
// Every hour at minute 15 (UTC); Korea also at minute 15. Up to 5 records per run.
export const config={schedule:'15 * * * *'};
