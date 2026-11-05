/** Read-only frozen rubric evaluation; default zero calls. */
import {readConfig,runModel,validateRequest} from '../server/agent.mjs';
import {readDiagnostic,safeMetadata} from './benchmark-support.mjs';
import oldCases from '../docs/evaluations/evidence-boundary/cases-2026-11-04.json' with {type:'json'};
import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const cases=process.argv.includes('--new-cases')?(await import('../docs/evaluations/evidence-boundary/cases-2026-11-05-new.json',{with:{type:'json'}})).default:oldCases;
const config=readConfig(),live=process.argv.includes('--live');
for(const c of cases)validateRequest({sourceKind:'demo',question:c.question,requestId:c.id,revision:'boundary-frozen',history:[],corrections:[]});
if(!live){console.log(JSON.stringify({externalCalls:0,plannedCalls:cases.length,rubricFrozen:true}));process.exit(0);}
if(!config.enabled||process.env.BENCH_LIVE_APPROVED!=='true'||process.env.BENCH_FREE_ONLY_CONFIRMED!=='true')throw Error('Explicit approval, free-only confirmation and configured model required');
const dir=new URL('../docs/evaluations/evidence-boundary/',import.meta.url);await mkdir(dir,{recursive:true});
const file=new URL(new Date().toISOString().replaceAll(':','-')+'.json',dir);const output=[];let calls=0,stopped=false;
const save=()=>writeFile(file,JSON.stringify({model:config.model,calls,stopped,scope:'new question formulations on existing synthetic development data; not independent human validation',output},null,2)+'\n');
for(const c of cases){const start=performance.now();let usage=null,httpStatus=null,promptHash=null,inputIds=[];
 try{const reply=await runModel({sourceKind:'demo',question:c.question,requestId:c.id,revision:'boundary-frozen',history:[],corrections:[]},config,async(url,opts)=>{
  if(++calls>12)throw Error('limit');const payload=JSON.parse(opts.body);promptHash=createHash('sha256').update(payload.messages[0].content).digest('hex');inputIds=JSON.parse(payload.messages.at(-1).content).reviews.map(r=>r.reviewId);
  const r=await fetch(url,opts);httpStatus=r.status;if(r.ok){const d=await readDiagnostic(r);if(d)usage=safeMetadata(d,config.model).usage;}return r;
 });output.push({...c,...reply,contractPassed:true,elapsedMs:Math.round(performance.now()-start),usage,promptHash,inputIds,scopePassed:reply.reviewIds.every(id=>c.allowedIds.includes(id)),semanticReview:'PENDING'});
 }catch(e){stopped=true;output.push({id:c.id,contractPassed:false,error:['upstream_failed','upstream_unavailable','unverified_response'].includes(e.message)?e.message:'request_failed',httpStatus,elapsedMs:Math.round(performance.now()-start),usage});}
 await save();console.log(JSON.stringify({id:c.id,passed:output.at(-1).contractPassed}));if(stopped)break;
}await save();console.log(JSON.stringify({resultFile:file.pathname,calls,stopped}));
