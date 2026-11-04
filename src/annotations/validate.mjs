import taxonomy from './taxonomy.json' with {type:'json'};
export const TOPICS=taxonomy.labels;
export const SENTIMENTS=['正面','负面','中性'];
export const ASPECT_REVISION=taxonomy.revision;
/** Structural grounding only. A verbatim quote does not establish semantic correctness. */
export function validateAnnotations(value,text){
 if(!Array.isArray(value)||value.length>24||typeof text!=='string')return false;
 const keys=new Set();
 for(const a of value){
  if(!a||!TOPICS.some(t=>t.name===a.topic)||!SENTIMENTS.includes(a.sentiment)||typeof a.evidence!=='string'||!a.evidence.trim()||a.evidence.length>2000||!text.includes(a.evidence)||typeof a.reason!=='string'||!a.reason.trim()||a.reason.length>1000)return false;
  const key=JSON.stringify([a.topic,a.sentiment,a.evidence]);if(keys.has(key))return false;keys.add(key);
 }
 return true;
}
