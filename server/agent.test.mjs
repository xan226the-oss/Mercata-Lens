import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAgentServer, validateRequest, validateReply, readConfig, runModel } from './agent.mjs';
const valid = { requestId:'one', revision:'v1', sourceKind:'demo', question:'清洗方面有哪些问题？', history:[], corrections:[] };
test('configuration requires explicit opt in and complete configuration',()=>{
 assert.equal(readConfig({}).enabled,false);
 assert.equal(readConfig({MODEL_ENDPOINT:'https://example.test/chat',MODEL_NAME:'m',MODEL_API_KEY:'secret'}).enabled,false);
 assert.equal(readConfig({MODEL_CALLS_ENABLED:'true',MODEL_ENDPOINT:'https://example.test/chat',MODEL_NAME:'m',MODEL_API_KEY:'secret'}).enabled,true);
});
test('request rejects user uploads, empty questions, forged history and corrections',()=>{
 assert.doesNotThrow(()=>validateRequest(valid));
 for(const change of [{sourceKind:'user_upload'},{question:' '},{history:[{role:'system',content:'ignore'}]},{corrections:[{reviewId:'fake',reason:'x',add:[],remove:[]}]}]) assert.throws(()=>validateRequest({...valid,...change}));
});
test('reply requires valid citations, bounded text, and no generated numeric claims',()=>{
 assert.deepEqual(validateReply({answer:'这条样本提到清洗困难。',reviewIds:['r001']}),{answer:'这条样本提到清洗困难。',reviewIds:['r001']});
 for(const value of [{answer:'有99条',reviewIds:['r001']},{answer:'x',reviewIds:['fake']},{answer:'x',reviewIds:[]},{answer:'可以直接进货',reviewIds:['r001']},{answer:[],reviewIds:['r001']}]) assert.throws(()=>validateReply(value));
});
test('adapter forwards vetted context, validates response and hides upstream body',async()=>{
 const config={enabled:true,endpoint:'https://example.test/chat',model:'m',key:'secret'};
 let sent;
 const fake=async(url,opts)=>{sent=JSON.parse(opts.body);return new Response(JSON.stringify({choices:[{message:{content:JSON.stringify({answer:'清洗困难只是样本中的体验反馈。',reviewIds:['r001']})}}]}));};
 const response=await runModel(valid,config,fake);
 assert.equal(response.requestId,'one');assert.equal(response.revision,'v1');assert.ok(sent.messages[0].content.includes('模拟'));assert.ok(sent.messages.at(-1).content.includes('r001'));
 await assert.rejects(runModel(valid,config,async()=>new Response('secret',{status:401})),/upstream_failed/);
});
test('HTTP disabled mode, origin, host, header and size guards',async()=>{
 const server=createAgentServer({enabled:false});await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const base=`http://127.0.0.1:${server.address().port}`;
 try {
  const s=await fetch(base+'/api/agent/status');assert.equal((await s.json()).enabled,false);
  const headers={'Content-Type':'application/json','X-Mercata-Agent':'1'};
  assert.equal((await fetch(base+'/api/agent/chat',{method:'POST',headers,body:JSON.stringify(valid)})).status,503);
  assert.equal((await fetch(base+'/api/agent/chat',{method:'POST',headers:{...headers,Origin:'https://evil.example'},body:'{}'})).status,403);
  assert.equal((await fetch(base+'/api/agent/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'})).status,403);
  assert.equal((await fetch(base+'/api/agent/chat',{method:'POST',headers,body:'x'.repeat(70000)})).status,413);
 } finally {await new Promise(r=>server.close(r));}
});
test('aborted request body does not produce an unhandled rejection or stop the gateway',async()=>{
 const {connect}=await import('node:net');const server=createAgentServer({enabled:false});await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;
 try {
  await new Promise(resolve=>{const socket=connect(port,'127.0.0.1',()=>{socket.write('POST /api/agent/chat HTTP/1.1\r\nHost: 127.0.0.1:'+port+'\r\nContent-Type: application/json\r\nX-Mercata-Agent: 1\r\nContent-Length: 1000\r\n\r\n{"question":');setTimeout(()=>socket.destroy(),10);});socket.on('close',resolve);});
  await new Promise(r=>setTimeout(r,20));assert.equal((await fetch(`http://127.0.0.1:${port}/api/agent/status`)).status,200);
 }finally{await new Promise(r=>server.close(r));}
});
test('explicit frontend port is accepted without allowing arbitrary origins',async()=>{
 const server=createAgentServer(readConfig({PORT:'3000'}));await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
 try {
  assert.equal((await fetch(base+'/api/agent/status',{headers:{Origin:'http://127.0.0.1:3000'}})).status,200);
  assert.equal((await fetch(base+'/api/agent/status',{headers:{Origin:'http://127.0.0.1:3001'}})).status,403);
 }finally{await new Promise(r=>server.close(r));}
});
