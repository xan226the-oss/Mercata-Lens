/** Evaluation-only helpers: never retain provider headers, errors or arbitrary fields. */
export function makeRequestPayload(payload,options={},config={}){
 if(config.profile==='qwen-json-nonthinking'&&(options.enable_thinking===true||options.thinking))throw new Error('Profile options conflict');
 const result={...payload};
 if(result.max_completion_tokens===undefined)result.max_tokens=1024;
 if(options.thinking)result.thinking=options.thinking;
 if(typeof options.enable_thinking==='boolean')result.enable_thinking=options.enable_thinking;
 return result;
}
export function inspectModelResponse(data){
 let value;try{value=JSON.parse(data.choices[0].message.content);}catch{return {jsonParsed:false};}
 const answer=typeof value?.answer==='string'?value.answer.slice(0,6000):null;
 const reviewIds=Array.isArray(value?.reviewIds)?value.reviewIds.filter(x=>typeof x==='string').slice(0,12).map(x=>x.slice(0,100)):[];
 return {jsonParsed:true,answer,reviewIds,containsDigits:typeof answer==='string'&&/[0-9０-９]/u.test(answer)};
}
export async function readDiagnostic(response){
 const reader=response.clone().body?.getReader();if(!reader)return null;
 const parts=[];let size=0;
 try{while(true){const {value,done}=await reader.read();if(done)break;size+=value.byteLength;if(size>100000){void reader.cancel();return null;}parts.push(value);}return JSON.parse(Buffer.concat(parts).toString('utf8'));}catch{return null;}
}
export function safeMetadata(data,configuredModel){
 const numberKeys=['prompt_tokens','completion_tokens','total_tokens'];
 const detailKeys=['cached_tokens','reasoning_tokens','text_tokens'];
 const clean=(obj,keys)=>Object.fromEntries(keys.filter(k=>Number.isSafeInteger(obj?.[k])&&obj[k]>=0).map(k=>[k,obj[k]]));
 const usage=clean(data?.usage,numberKeys);
 for(const key of ['prompt_tokens_details','completion_tokens_details']){const detail=clean(data?.usage?.[key],detailKeys);if(Object.keys(detail).length)usage[key]=detail;}
 return {reportedModel:typeof configuredModel==='string'&&configuredModel.length<=100&&data?.model===configuredModel?configuredModel:null,usage:Object.keys(usage).length?usage:null};
}
