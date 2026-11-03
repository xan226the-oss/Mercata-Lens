/** Opt-in live local browser verification. All provider access stays in the gateway. */
import {chromium} from '@playwright/test';
import {fileURLToPath} from 'node:url';
import {mkdir,writeFile} from 'node:fs/promises';
if(process.env.BENCH_LIVE_APPROVED!=='true'||process.env.BENCH_FREE_ONLY_CONFIRMED!=='true'){
 console.error('Live browser verification requires explicit live and free-only confirmation.');process.exit(1);
}
const dir=new URL('../docs/evaluations/agent-pilot/results/',import.meta.url);await mkdir(dir,{recursive:true});
const evidenceDir=new URL('../docs/evidence/',import.meta.url);await mkdir(evidenceDir,{recursive:true});
const stamp=new Date().toISOString().replaceAll(':','-');
const report={model:'deepseek-v4.1-flash',transport:'live browser -> Vite proxy -> gateway -> Bailian',checks:[],requests:[],answers:[],injectedFailure:false,completed:false};
const browser=await chromium.launch({channel:'chrome',headless:true});const page=await browser.newPage({viewport:{width:1440,height:1300}});
let inject=false,providerRequests=0;
await page.route('**/api/agent/chat',async route=>{
 const b=route.request().postDataJSON();
 report.requests.push({question:b.question,revision:b.revision,historyLength:b.history.length,corrections:b.corrections,transport:inject?'injected_local_502':'real_gateway'});
 if(inject){inject=false;report.injectedFailure=true;await route.fulfill({status:502,json:{error:'upstream_unavailable'}});return;}
 if(++providerRequests>6){await route.abort();throw new Error('Browser live call limit exceeded');}await route.continue();
});
function check(value,label){if(!value)throw new Error(label);report.checks.push(label);}
async function send(question,viaRetry=false){
 const before=await page.locator('.agent-message-assistant').count();const t=Date.now();
 if(!viaRetry)await page.getByLabel('Question',{exact:true}).fill(question);
 await page.getByRole('button',{name:viaRetry?'Retry':'Send',exact:true}).click();
 await page.waitForFunction(n=>document.querySelectorAll('.agent-message-assistant').length>n||!!document.querySelector('[role=alert]'),before,{timeout:40000});
 if(await page.getByRole('alert').count())throw new Error('Live answer rejected; no automatic retry');
 const last=page.locator('.agent-message-assistant').last();report.answers.push({question,elapsedMs:Date.now()-t,text:await last.innerText()});
}
try{
 await page.goto('http://127.0.0.1:5173/assistant');await page.getByText(/Model enabled/).waitFor();
 for(const q of ['我们先只讨论模拟评论r001。它描述了什么问题？','刚才说的那个问题，原文是什么依据？不要切换到其他评论。','那这个问题解决后是不是就可以直接进货了？请说明还要验证什么。'])await send(q);
 check(JSON.stringify(report.requests.map(r=>r.historyLength))==='[0,2,4]','Three live turns include current history');
 await page.getByRole('button',{name:'View review r001'}).last().click();
 check(await page.getByRole('heading',{name:'Original evidence r001'}).evaluate(el=>el===document.activeElement),'Citation opens original evidence and moves focus');
 await page.getByRole('checkbox',{name:'Unwanted noise',exact:true}).check();
 check(await page.getByRole('button',{name:'Apply and recalculate'}).isDisabled(),'Correction requires reason');
 await page.getByLabel('Correction reason',{exact:true}).fill('Live acceptance test: intentionally inconsistent noise annotation on a synthetic cleaning review; not human accuracy labeling.');
 await page.getByRole('button',{name:'Apply and recalculate'}).click();
 check(await page.locator('.agent-stale').count()===6,'Correction marks all old turns stale');
 await send('我给r001人工加了噪音标签。请区分人工标签和原文，原文真的说明噪音问题了吗？');
 const corrected=report.requests.at(-1);check(corrected.historyLength===0&&corrected.revision!==report.requests[0].revision&&corrected.corrections[0]?.add.includes('noise'),'Corrected question uses new revision, empty history and annotation');
 const retryQuestion='只根据r001的原文，下一步需要验证什么？';inject=true;
 await page.getByLabel('Question',{exact:true}).fill(retryQuestion);await page.getByRole('button',{name:'Send',exact:true}).click();await page.getByRole('alert').waitFor();
 check(await page.getByLabel('Question',{exact:true}).inputValue()===retryQuestion,'Injected error preserves draft');
 await send(retryQuestion,true);check(report.injectedFailure,'Explicit retry recovers after an injected local error');
 await send('这些评论是不是从Amazon真实采集的，能否代表美国市场用户？');
 check(await page.locator('.agent-message-assistant').last().getByText('System scope notice',{exact:true}).isVisible(),'Data provenance is canonical system notice');
 await page.getByRole('button',{name:'Switch language'}).click();
 const screenshot=new URL(`assistant-deepseek-acceptance-${stamp}.png`,evidenceDir);await page.screenshot({path:fileURLToPath(screenshot),fullPage:true});report.screenshot=fileURLToPath(screenshot);
 report.completed=true;
}catch(e){report.error=e instanceof Error?e.message:'verification_failed';}
finally{report.realGatewayRequests=providerRequests;await writeFile(new URL(`deepseek-browser-${stamp}.json`,dir),JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report,null,2));if(!report.completed)process.exitCode=1;}
