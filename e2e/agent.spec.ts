import { test,expect } from '@playwright/test';
import fs from 'node:fs/promises';

test('three contextual turns with a transport stub, citation focus, correction invalidation and viewport switching',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const requests:any[]=[];
 await page.route('**/api/agent/status',r=>r.fulfill({json:{enabled:true}}));
 await page.route('**/api/agent/chat',async r=>{
  const b=r.request().postDataJSON();requests.push(b);
  await r.fulfill({json:{requestId:b.requestId,revision:b.revision,answer:'这条模拟评论提到内部角落难以清洁，不能据此决定采购。',reviewIds:['r001']}});
 });
 await page.goto('/assistant');await expect(page.getByText(/Model ready/)).toBeVisible();
 for(const [i,question] of ['What cleaning issues occur?','Show the original and limits.','What still needs validation?'].entries()){
  await page.getByLabel('Question',{exact:true}).fill(question);await page.getByRole('button',{name:'Send',exact:true}).click();
  await expect(page.locator('.agent-message-assistant')).toHaveCount(i+1);
 }
 expect(requests.map(r=>r.history.length)).toEqual([0,2,4]);expect(new Set(requests.map(r=>r.revision)).size).toBe(1);
 await page.getByRole('button',{name:'View review r001'}).last().click();await expect(page.getByRole('heading',{name:'Original evidence r001'})).toBeFocused();
 await page.getByRole('checkbox',{name:'Unwanted noise',exact:true}).check();
 await expect(page.getByRole('button',{name:'Apply and recalculate'})).toBeDisabled();
 await page.getByLabel('Correction reason',{exact:true}).fill('Manual test judgment for synthetic demo, not a human accuracy audit.');
 await page.getByRole('button',{name:'Apply and recalculate'}).click();await expect(page.locator('.agent-stale')).toHaveCount(6);
 await fs.mkdir('/tmp/mercata-agent-screens',{recursive:true});
 for(const width of [1440,900,390]){
  await page.setViewportSize({width,height:900});
  if(width<=1024){
   await page.getByRole('tab',{name:'Dialogue',exact:true}).click();await expect(page.getByLabel('Question',{exact:true})).toBeVisible();
   await page.getByRole('tab',{name:'Evidence',exact:true}).click();await expect(page.getByRole('heading',{name:'Original evidence r001'})).toBeVisible();
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.screenshot({path:`/tmp/mercata-agent-screens/assistant-${width}.png`,fullPage:true});
 }
 expect(errors).toEqual([]);
});
test('real page never invents responses when status is disabled',async({page})=>{
 let calls=0;
 await page.route('**/api/agent/status',r=>r.fulfill({json:{enabled:false}}));
 await page.route('**/api/agent/chat',r=>{calls++;return r.abort();});
 await page.goto('/assistant');await expect(page.getByText(/Model is unavailable/)).toBeVisible();
 await page.getByLabel('Question',{exact:true}).fill('cleaning');await expect(page.getByRole('button',{name:'Send',exact:true})).toBeDisabled();
 await expect(page.locator('.agent-message-assistant')).toHaveCount(0);expect(calls).toBe(0);
});
