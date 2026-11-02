/** Small evaluation driver. Default mode never calls a model; product code is unchanged. */
import { mkdir,writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { readConfig,runModel,validateRequest } from '../server/agent.mjs';
import cases from '../docs/evaluations/agent-pilot/cases.json' with {type:'json'};
const live=process.argv.includes('--live');
const config=readConfig();
const rounds=2;
const limit=24;
const total=cases.length*rounds;
for(const c of cases)validateRequest({question:c.question,history:[],sourceKind:'demo',requestId:c.id,revision:'preflight',corrections:c.corrections??[]});
if(total>limit)throw new Error('Call count exceeds pilot limit');
if(!live){
 console.log(JSON.stringify({mode:'preflight_only',cases:cases.length,repeats:rounds,plannedCallsPerModel:total,externalCalls:0,modelResults:'NOT_RUN'},null,2));
 process.exit(0);
}
if(process.env.BENCH_FREE_ONLY_CONFIRMED!=='true')throw new Error('Free-only policy: verify model quota and provider-side no-paid-fallback protection before running. This flag is an attestation, not a billing guard.');
if(process.env.BENCH_LIVE_APPROVED!=='true'||!config.enabled)throw new Error('Live run requires configured model, explicit call enablement and BENCH_LIVE_APPROVED=true after user budget authorization.');
const output=[];let calls=0;
for(let repeat=1;repeat<=rounds;repeat++){
 let history=[];
 for(const c of cases){
  if(c.id!=='T10'&&c.id!=='T11')history=[];
  if((c.id==='T10'||c.id==='T11')&&history.length===0){output.push({caseId:c.id,repeat,status:'SKIPPED',reason:'Previous turn failed; not a valid contextual test',humanReview:'PENDING'});continue;}
  const requestId=`${c.id}-${repeat}`,revision=`pilot-${repeat}-${c.id==='T12'?'corrected':'base'}`;
  const body={question:c.question,sourceKind:'demo',history,requestId,revision,corrections:c.corrections??[]};
  const started=performance.now();let usage=null,reportedModel=null;
  const limitedFetch=async(url,opts)=>{
   if(++calls>limit)throw new Error('Call limit reached');
   const payload=JSON.parse(opts.body);
   // An output ceiling bounds each call; compatibility must be checked per provider.
   payload.max_tokens=1024;
   const options=JSON.parse(process.env.BENCH_REQUEST_OPTIONS_JSON??'{}');
   if(options.thinking)payload.thinking=options.thinking;
   if(typeof options.enable_thinking==='boolean')payload.enable_thinking=options.enable_thinking;
   const response=await fetch(url,{...opts,body:JSON.stringify(payload)});
   if(response.ok){try{const data=await response.clone().json();usage=data.usage??null;reportedModel=data.model??null;}catch{/* runModel handles malformed response */}}
   return response;
  };
  try{
   const result=await runModel(body,config,limitedFetch);
   const missingExpectedIds=(c.expectedIds??[]).filter(id=>!result.reviewIds.includes(id));
   output.push({caseId:c.id,repeat,configuredModel:config.model,reportedModel,elapsedMs:Math.round(performance.now()-started),contractPassed:true,missingExpectedIds,answer:result.answer,reviewIds:result.reviewIds,usage,humanReview:'PENDING',rubric:c.rubric});
   if(c.id==='T09'||c.id==='T10')history=[...history,{role:'user',content:c.question},{role:'assistant',content:result.answer}];
  }catch(e){output.push({caseId:c.id,repeat,configuredModel:config.model,elapsedMs:Math.round(performance.now()-started),contractPassed:false,error:['unverified_response','upstream_failed','upstream_unavailable'].includes(e.message)?e.message:'request_failed',usage,humanReview:'PENDING'});history=[];}
 }
}
const dir=new URL('../docs/evaluations/agent-pilot/results/',import.meta.url);await mkdir(dir,{recursive:true});
const stamp=new Date().toISOString().replaceAll(':','-');
await writeFile(new URL(`${stamp}.json`,dir),JSON.stringify({model:config.model,calls,output,scope:'synthetic demo; not market evidence; semantic judgments pending'},null,2));
console.log(JSON.stringify({calls,contractPassed:output.filter(r=>r.contractPassed).length,humanReview:'PENDING',note:'No automatic suitability winner; review semantics and provider usage before selecting.'},null,2));
