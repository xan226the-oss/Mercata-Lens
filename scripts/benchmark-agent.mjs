/** Small evaluation driver. Default mode never calls a model; product code is unchanged. */
import { mkdir,writeFile } from 'node:fs/promises';
import {resolve,sep} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { readConfig,runModel,validateRequest } from '../server/agent.mjs';
import {makeRequestPayload,inspectModelResponse,readDiagnostic,safeMetadata} from './benchmark-support.mjs';
import allCases from '../docs/evaluations/agent-pilot/cases.json' with {type:'json'};
const live=process.argv.includes('--live');
const config=readConfig();
const probe=process.argv.includes('--probe');
const evidenceSix=process.argv.includes('--evidence-six');
const suite=evidenceSix?allCases.filter(c=>['T03','T04','T05','T09','T10','T11'].includes(c.id)):allCases;
const cases=probe?suite.slice(0,1):suite;
const rounds=probe?1:2;
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
const output=[];let calls=0,stopped=false,promptHash=null;
const options=JSON.parse(process.env.BENCH_REQUEST_OPTIONS_JSON??'{}');
// Validate conflicts before making any external request.
makeRequestPayload({},options,config);
const dir=process.env.BENCH_RESULT_DIR?pathToFileURL(resolve(process.env.BENCH_RESULT_DIR)+sep):new URL('../docs/evaluations/agent-pilot/results/',import.meta.url);await mkdir(dir,{recursive:true});
const stamp=new Date().toISOString().replaceAll(':','-');
const resultFile=new URL(`${stamp}.json`,dir);
const save=()=>writeFile(resultFile,JSON.stringify({model:config.model,profile:config.profile??'',promptHash,suite:evidenceSix?'evidence-six':'pilot-twelve',requestOptions:options,probe,calls,stopped,output,scope:'synthetic demo; not market evidence; semantic judgments pending'},null,2));

for(let repeat=1;repeat<=rounds;repeat++){
 let history=[];
 for(const c of cases){
  if(c.id!=='T10'&&c.id!=='T11')history=[];
  if((c.id==='T10'||c.id==='T11')&&history.length===0){output.push({caseId:c.id,repeat,status:'SKIPPED',reason:'Previous turn failed; not a valid contextual test',humanReview:'PENDING'});await save();console.log(JSON.stringify({caseId:c.id,repeat,status:'SKIPPED'}));continue;}
  const requestId=`${c.id}-${repeat}`,revision=`pilot-${repeat}-${c.id==='T12'?'corrected':'base'}`;
  const body={question:c.question,sourceKind:'demo',history,requestId,revision,corrections:c.corrections??[]};
  const started=performance.now();let usage=null,reportedModel=null,httpStatus=null,diagnostic=null,inputReviewIds=[],sentHistoryLength=0;
  const limitedFetch=async(url,opts)=>{
   if(++calls>limit)throw new Error('Call limit reached');
   const payload=makeRequestPayload(JSON.parse(opts.body),options,config);
   inputReviewIds=JSON.parse(payload.messages.at(-1).content).reviews.map(r=>r.reviewId);sentHistoryLength=payload.messages.length-2;
   promptHash=createHash('sha256').update(payload.messages[0].content).digest('hex');
   const response=await fetch(url,{...opts,body:JSON.stringify(payload)});httpStatus=response.status;
   if(!response.ok)stopped=true;
   if(response.ok){const data=await readDiagnostic(response);if(data){({usage,reportedModel}=safeMetadata(data,config.model));diagnostic=inspectModelResponse(data);}}
   return response;
  };
  try{
   const result=await runModel(body,config,limitedFetch);
   const missingExpectedIds=(c.expectedIds??[]).filter(id=>!result.reviewIds.includes(id));
   output.push({caseId:c.id,repeat,configuredModel:config.model,reportedModel,elapsedMs:Math.round(performance.now()-started),contractPassed:true,inputReviewIds,sentHistoryLength,missingExpectedIds,answer:result.answer,reviewIds:result.reviewIds,scopeNotice:result.scopeNotice,usage,humanReview:'PENDING',rubric:c.rubric});
   if(c.id==='T09'||c.id==='T10')history=[...history,{role:'user',content:c.question},{role:'assistant',content:result.answer}];
  }catch(e){output.push({caseId:c.id,repeat,configuredModel:config.model,elapsedMs:Math.round(performance.now()-started),contractPassed:false,error:['unverified_response','upstream_failed','upstream_unavailable'].includes(e.message)?e.message:'request_failed',usage,httpStatus,diagnostic,inputReviewIds,sentHistoryLength,humanReview:'PENDING'});history=[];}
  await save();const last=output.at(-1);console.log(JSON.stringify({caseId:c.id,repeat,elapsedMs:last.elapsedMs,contractPassed:last.contractPassed,error:last.error,httpStatus}));
  if(stopped)break;
 }
 if(stopped)break;
}
await save();
console.log(JSON.stringify({resultFile:resultFile.pathname,calls,stopped,profile:config.profile??'',contractPassed:output.filter(r=>r.contractPassed).length,humanReview:'PENDING',note:'No automatic suitability winner; review semantics and provider usage before selecting.'},null,2));
