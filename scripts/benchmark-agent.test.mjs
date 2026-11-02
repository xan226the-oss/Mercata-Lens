import {test} from 'node:test';import assert from 'node:assert/strict';
import {inspectModelResponse,makeRequestPayload} from './benchmark-support.mjs';
test('profile total bound is preserved and generic old ceiling remains',()=>{
 assert.deepEqual(makeRequestPayload({model:'q',max_completion_tokens:1024},{}),{model:'q',max_completion_tokens:1024});
 assert.equal(makeRequestPayload({model:'q'},{}).max_tokens,1024);
 assert.throws(()=>makeRequestPayload({}, {enable_thinking:true},{profile:'qwen-json-nonthinking'}));
});
test('diagnostic keeps only bounded answer fields, not provider credentials or arbitrary fields',()=>{
 const result=inspectModelResponse({secret:'never-save',choices:[{message:{content:JSON.stringify({answer:'评论r001',reviewIds:['r001'],secret:'never-save'})}}]});
 assert.equal(result.containsDigits,true);assert.equal(result.answer,'评论r001');assert.equal(JSON.stringify(result).includes('never-save'),false);
 assert.deepEqual(inspectModelResponse({choices:[{message:{content:'not JSON'}}]}),{jsonParsed:false});
 assert.equal(inspectModelResponse({choices:[{message:{content:JSON.stringify({answer:'a'.repeat(7000),reviewIds:['r001']})}}]}).answer.length,6000);
});
test('provider metadata cannot retain arbitrary strings or nested fields',async()=>{
 const {safeMetadata}=await import('./benchmark-support.mjs');
 const r=safeMetadata({model:'sk-do-not-save',usage:{total_tokens:12,prompt_tokens:-1,completion_tokens:'secret',arbitrary:{key:'secret'},completion_tokens_details:{reasoning_tokens:5,secret:'never'}}},'qwen3.7-plus');
 assert.deepEqual(r,{reportedModel:null,usage:{total_tokens:12,completion_tokens_details:{reasoning_tokens:5}}});
 assert.equal(JSON.stringify(r).includes('secret'),false);
 assert.equal(safeMetadata({model:'qwen3.7-plus'},'qwen3.7-plus').reportedModel,'qwen3.7-plus');
});
test('CLI stops on first HTTP refusal and persists each preceding result without error body',async()=>{
 const {createServer}=await import('node:http');const {spawn}=await import('node:child_process');
 const {mkdtemp,readdir,readFile,rm}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');
 for(const status of [401,429]){
  const dir=await mkdtemp(join(tmpdir(),'mercata-bench-'));let calls=0,checkpointSeen=false;
  const server=createServer(async(req,res)=>{calls++;req.resume();
   if(calls===1){res.setHeader('Content-Type','application/json');res.end(JSON.stringify({model:'test',usage:{total_tokens:1,secret:'do-not-save'},choices:[{message:{content:JSON.stringify({answer:'这条样本提到清洗困难。',reviewIds:['r001']})}}]}));}
   else{const files=await readdir(dir);if(files.length){const data=JSON.parse(await readFile(join(dir,files[0]),'utf8'));checkpointSeen=data.output.length===1;}
    res.writeHead(status);res.end('do-not-save-provider-error');}
  });await new Promise(r=>server.listen(0,'127.0.0.1',r));
  try{
   const child=spawn(process.execPath,['scripts/benchmark-agent.mjs','--live'],{cwd:new URL('..',import.meta.url),env:{MODEL_CALLS_ENABLED:'true',MODEL_NAME:'test',MODEL_API_KEY:'fake-local-only',MODEL_ENDPOINT:`http://127.0.0.1:${server.address().port}/chat`,BENCH_LIVE_APPROVED:'true',BENCH_FREE_ONLY_CONFIRMED:'true',BENCH_RESULT_DIR:dir}});
   let stderr='';child.stderr.on('data',d=>stderr+=d);child.stdout.resume();
   const code=await new Promise(r=>child.on('close',r));assert.equal(code,0,stderr);assert.equal(calls,2);assert.equal(checkpointSeen,true);
   const files=await readdir(dir);const text=await readFile(join(dir,files[0]),'utf8');const data=JSON.parse(text);assert.equal(data.stopped,true);assert.equal(data.output.length,2);assert.equal(text.includes('do-not-save'),false);
  }finally{await new Promise(r=>server.close(r));await rm(dir,{recursive:true,force:true});}
 }
});
