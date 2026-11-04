/** Bounded, opt-in synthetic-data regression. Existing annotations are development references, not independent gold. */
import {readConfig,runTag} from '../server/agent.mjs';
import {readDiagnostic,safeMetadata} from './benchmark-support.mjs';
import demo from '../src/annotations/demo-aspects.json' with {type:'json'};
import {writeFile,mkdir} from 'node:fs/promises';
const live=process.argv.includes('--live');
if(!live){console.log(JSON.stringify({live:false,plannedCalls:76,source:'synthetic_demo',freeOnly:true,noRetries:true,note:'Requires explicit live approval and previously verified free-only stop protection.'}));process.exit(0);}
const config=readConfig();
if(!config.enabled||config.profile!=='bailian-json-nonthinking'||process.env.BENCH_LIVE_APPROVED!=='true'||process.env.BENCH_FREE_ONLY_CONFIRMED!=='true')throw Error('Live configuration, free-only confirmation and approval required');
const dir=new URL('../docs/evaluations/aspect-pilot/',import.meta.url);await mkdir(dir,{recursive:true});
const file=new URL(new Date().toISOString().replaceAll(':','-')+'.json',dir);
const output=[];let calls=0,stopped=false;
const save=()=>writeFile(file,JSON.stringify({model:config.model,scope:'76 synthetic comments, 50 user-confirmed Codex development references + 26 Codex supplemental references; NOT independent human validation',calls,stopped,output},null,2)+'\n');
for(const record of demo.records){
 let usage=null,httpStatus=null;const start=performance.now();
 try{
  const result=await runTag({sourceKind:'demo',reviewId:record.reviewId,requestId:'aspect-'+record.reviewId},config,async(url,opts)=>{
   if(++calls>76)throw Error('call_limit');
   const r=await fetch(url,opts);httpStatus=r.status;
   if(r.ok){const d=await readDiagnostic(r);if(d)usage=safeMetadata(d,config.model).usage;}
   return r;
  });
  const pairs=arr=>[...new Set(arr.map(a=>a.topic+'|'+a.sentiment))].sort();
  const expected=pairs(record.annotations),actual=pairs(result.annotations);
  output.push({reviewId:record.reviewId,elapsedMs:Math.round(performance.now()-start),contractPassed:true,annotations:result.annotations,referencePairs:expected,actualPairs:actual,missingPairs:expected.filter(x=>!actual.includes(x)),additionalPairs:actual.filter(x=>!expected.includes(x)),exactPairAgreement:JSON.stringify(expected)===JSON.stringify(actual),usage,humanReview:'PENDING'});
 }catch(e){stopped=true;output.push({reviewId:record.reviewId,elapsedMs:Math.round(performance.now()-start),contractPassed:false,httpStatus,error:['unverified_response','upstream_failed','upstream_unavailable'].includes(e.message)?e.message:'request_failed',usage});}
 await save();console.log(JSON.stringify({reviewId:record.reviewId,passed:output.at(-1).contractPassed,elapsedMs:output.at(-1).elapsedMs}));
 if(stopped)break;
}
await save();console.log(JSON.stringify({resultFile:file.pathname,calls,stopped,contractPass:output.filter(x=>x.contractPassed).length,pairAgreement:output.filter(x=>x.exactPairAgreement).length,note:'Agreement with development reference, not accuracy'}));
