/** Opt-in real browser + isolated real gateway; max three model calls, no retries. */
import {chromium} from '@playwright/test';
import {readConfig,createAgentServer} from '../server/agent.mjs';
import {writeFile,readFile,mkdir} from 'node:fs/promises';
const config=readConfig();
if(!config.enabled||process.env.BENCH_LIVE_APPROVED!=='true'||process.env.BENCH_FREE_ONLY_CONFIRMED!=='true')throw Error('Live/free-only approval required');
const dir=new URL('../docs/evaluations/evidence-boundary/',import.meta.url);await mkdir(dir,{recursive:true});
const file=new URL('browser-flow-'+new Date().toISOString().replaceAll(':','-')+'.json',dir);
const report={transport:'browser -> Vite page with real HTTP routing to isolated gateway -> configured provider',calls:0,requests:[],answers:[],checks:[],completed:false};
const server=createAgentServer(config);await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1000}});
const check=(v,label)=>{if(!v)throw Error(label);report.checks.push(label);};
try{
 await page.route('**/api/agent/status',async r=>{const response=await r.fetch({url:base+'/api/agent/status'});await r.fulfill({response});});
 await page.route('**/api/agent/chat',async r=>{if(++report.calls>3){await r.abort();return;}const b=r.request().postDataJSON();report.requests.push({historyLength:b.history.length,revision:b.revision,aspectCorrections:b.aspectCorrections});const response=await r.fetch({url:base+'/api/agent/chat',timeout:35000,maxRetries:0});await r.fulfill({response});});
 await page.goto('http://127.0.0.1:5173/assistant');await page.getByText(/Model enabled/).waitFor();
 async function send(q){const n=await page.locator('.agent-message-assistant').count();await page.getByLabel('Question',{exact:true}).fill(q);await page.getByRole('button',{name:'Send',exact:true}).click();await page.waitForFunction(n=>document.querySelectorAll('.agent-message-assistant').length>n||!!document.querySelector('[role=alert]'),n,{timeout:40000});check(await page.getByRole('alert').count()===0,'No request error for turn '+(n+1));const text=await page.locator('.agent-message-assistant').last().innerText();check(text.includes('【数据范围：内置模拟样本，不代表真实市场】'),'Program provenance on turn '+(n+1));report.answers.push(text);}
 await send('只解释r001中的清洗反馈。');await send('刚才那条原文能支持什么，还缺什么？');
 check(report.requests[1].historyLength===2,'Second turn carries current history');
 await page.getByRole('button',{name:'View review r001'}).last().click();check(await page.getByRole('heading',{name:'Original evidence r001'}).evaluate(el=>el===document.activeElement),'Citation focuses original evidence');
 await page.getByRole('combobox',{name:'Sentiment 1',exact:true}).selectOption('中性');
 check(await page.getByRole('button',{name:'Save aspects'}).isDisabled(),'Blank correction reason cannot save');
 await page.getByLabel('Aspect correction reason',{exact:true}).fill('Browser acceptance test only, not independent human judgment.');await page.getByRole('button',{name:'Save aspects',exact:true}).click();
 check(await page.locator('.agent-stale').count()===4,'Both earlier turns invalidated');
 await send('继续解释r001，区分当前注释和原文事实。');
 check(report.requests[2].historyLength===0,'New revision clears old history');
 check(report.requests[2].aspectCorrections[0].annotations[0].sentiment==='中性','New aspect correction forwarded');
 await page.getByRole('link',{name:'Decision & validation plan',exact:true}).click();await page.getByRole('heading',{name:'Decision & validation plan',exact:true}).waitFor();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Download JSON',exact:true}).click();const artifact=await download;const snapshot=JSON.parse(await readFile(await artifact.path(),'utf8'));
 check(snapshot.rulesetVersion==='2026-11-04-r3','Export uses current aspect revision');const record=snapshot.aspectSnapshot.records.find(r=>r.reviewId==='r001');
 check(record.source==='manual'&&record.annotations[0].sentiment==='中性','Export includes same corrected aspect and source');
 check(snapshot.aspectSnapshot.records.length===76,'Export retains all review snapshots');report.completed=true;
}catch(e){report.error=String(e.message).slice(0,800);process.exitCode=1;}finally{await writeFile(file,JSON.stringify(report,null,2)+'\n');await browser.close();await new Promise(r=>server.close(r));console.log(JSON.stringify({file:file.pathname,calls:report.calls,completed:report.completed,error:report.error}));}
