import {useEffect,useState} from 'react';
import {TOPICS,validateAnnotations,type AspectAnnotation,type AspectOverride} from '../domain/aspects';
export function AspectEditor({initial,text,zh,onSave,onDirty}:{initial:AspectAnnotation[];text:string;zh:boolean;onSave:(value:AspectOverride)=>boolean;onDirty?:(dirty:boolean)=>void}){
 const t=(cn:string,en:string)=>zh?cn:en;
 const [draft,setDraft]=useState(()=>initial.map(a=>({...a})));
 const [reason,setReason]=useState('');const [message,setMessage]=useState('');
 const dirty=JSON.stringify(draft)!==JSON.stringify(initial)||reason!=='';
 useEffect(()=>{onDirty?.(dirty);return ()=>onDirty?.(false);},[dirty,onDirty]);
 function update(index:number,patch:Partial<AspectAnnotation>){setDraft(old=>old.map((a,i)=>i===index?{...a,...patch}:a));setMessage('');}
 return <form className="aspect-editor" aria-label="Edit aspect annotations" onSubmit={e=>{e.preventDefault();if(!reason.trim()||!validateAnnotations(draft,text))return;const ok=onSave({annotations:draft,reason,source:'manual'});if(ok){setReason('');setMessage(t('已保存本轮修正。','Saved current-session correction.'));}}}>
  {/* 2026-11-18 usability P0-1: prominent header naming the edit action — 3/5 participants could not
      find this form because it read as passive reference material, not an editable panel. */}
  <div className="aspect-editor__intro">
   <h3>{t('修正此评论的标签','Correct labels for this review')}</h3>
   <p className="aspect-editor__hint">{t('在此直接修改下方条目；保存需填写原因，保存后相关解释将自动失效并待重算。','Edit the entries below directly; saving requires a reason. After saving, related explanations are invalidated and await recalculation.')}</p>
   <p>{t('原文片段须逐字摘取。相同标签可按不同情境分别记录；正负混合不等于中性。','Quotes must be verbatim. Separate contexts may share a topic; mixed sentiment is not neutral.')}</p>
  </div>
  {draft.map((a,i)=><fieldset key={i}><legend>{t('条目','Aspect')} {i+1}</legend>
   <label>{t('具体标签','Topic')} {i+1}<select value={a.topic} onChange={e=>update(i,{topic:e.target.value})}>{TOPICS.map(topic=><option value={topic.name} key={topic.name}>{zh?topic.name:topic.en}</option>)}</select></label>
   <label>{t('情感','Sentiment')} {i+1}<select value={a.sentiment} onChange={e=>update(i,{sentiment:e.target.value as AspectAnnotation['sentiment']})}><option value="正面">{t('正面','Positive')}</option><option value="负面">{t('负面','Negative')}</option><option value="中性">{t('中性','Neutral')}</option></select></label>
   <label>{t('支持原文','Verbatim evidence')} {i+1}<textarea value={a.evidence} maxLength={2000} onChange={e=>update(i,{evidence:e.target.value})}/></label>
   <label>{t('判定说明与情境','Reason and context')} {i+1}<textarea value={a.reason} maxLength={1000} onChange={e=>update(i,{reason:e.target.value})}/></label>
   <button type="button" className="text-button" onClick={()=>setDraft(old=>old.filter((_,n)=>n!==i))}>{t('移除条目','Remove aspect')} {i+1}</button>
  </fieldset>)}
  <button type="button" disabled={draft.length>=24} onClick={()=>setDraft(old=>[...old,{topic:TOPICS[0].name,sentiment:'中性',evidence:'',reason:''}])}>{t('增加主题条目','Add aspect')}</button>
  {!validateAnnotations(draft,text)&&<p role="alert">{t('请检查标签、情感、原文片段及说明；不接受完全重复的条目。','Check topics, sentiments, verbatim quotes and reasons; exact duplicates are not accepted.')}</p>}
  {/* 2026-11-18 usability P0-3: required-reason field now carries a visible hint; U2 failed
      twice on the silent requirement and abandoned the task. */}
  <label>{t('本轮修正原因（必填）','Aspect correction reason (required)')}<textarea value={reason} maxLength={1000} placeholder={t('例如：原文说的是一般耐用性，不能归为水泵寿命。必填，说明为何修正。','E.g. the text mentions general durability, not pump lifetime. Required: explain why this correction.')} onChange={e=>setReason(e.target.value)}/></label>
  <div className="aspect-actions"><button type="submit" disabled={!dirty||!reason.trim()||!validateAnnotations(draft,text)}>{t('保存主题情感','Save aspects')}</button><button type="button" disabled={!dirty} onClick={()=>{setDraft(initial.map(a=>({...a})));setReason('');setMessage('');}}>{t('撤销草稿','Reset aspect draft')}</button></div>
  {message&&<p role="status">{message}</p>}
 </form>;
}
