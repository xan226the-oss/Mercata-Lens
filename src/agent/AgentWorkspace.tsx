import {AspectEditor} from '../components/AspectEditor';
import {annotationsFor,aspectPainPoints,ASPECT_REVISION} from '../domain/aspects';
import { useEffect,useMemo,useRef,useState } from 'react';
import { useResearch } from '../research/ResearchContext';
import { useLanguage } from '../app/LanguageContext';
import { classifyReview,type PainPointCorrection } from '../domain/painPoints';
import { PAIN_POINT_IDS,PAIN_POINT_RULES,PAIN_POINT_RULESET_VERSION,type PainPointId } from '../domain/painPointRules';
import { verifyReply,type Message } from './contract';
import './agent.css';

/** A separate session layer: original deterministic analyses remain unchanged. */
export function AgentWorkspace(){
 const {dataset,corrections,applyReviewCorrection,aspectOverrides,applyAspectOverride}=useResearch();
 const {language}=useLanguage();const zh=language==='zh';const t=(cn:string,en:string)=>zh?cn:en;
 const [capability,setCapability]=useState<'checking'|'ready'|'disabled'|'offline'>('checking');
 const [statusKey,setStatusKey]=useState(0);
 const [draft,setDraft]=useState('');const [messages,setMessages]=useState<Message[]>([]);
 const [pending,setPending]=useState(false);const [error,setError]=useState<string|null>(null);
 const [selectedId,setSelectedId]=useState('');const [tab,setTab]=useState<'dialogue'|'evidence'>('dialogue');
 const [legacyDirty,setLegacyDirty]=useState(false);const [aspectDirty,setAspectDirty]=useState(false);const dirty=legacyDirty||aspectDirty;
 const evidenceHeading=useRef<HTMLHeadingElement>(null);const citationOrigin=useRef<HTMLButtonElement|null>(null);
 const active=useRef<{id:string;revision:string;controller:AbortController}|null>(null);
 const revision=useMemo(()=>crypto.randomUUID(),[dataset,corrections,aspectOverrides]);
 const currentRevision=useRef(revision);currentRevision.current=revision;
 const summaries=useMemo(()=>dataset?aspectPainPoints(dataset,aspectOverrides):[],[dataset,corrections,aspectOverrides]);
 const selected=dataset?.reviews.find(r=>r.reviewId===selectedId)??dataset?.reviews[0]??null;
 const classification=selected?classifyReview(selected,corrections):null;
 const canSend=capability==='ready'&&dataset?.sourceKind==='demo'&&!pending&&!dirty&&draft.trim().length>0&&draft.length<=2000;
 useEffect(()=>{
  const controller=new AbortController();setCapability('checking');
  fetch('/api/agent/status',{signal:controller.signal}).then(async r=>{if(!r.ok)throw new Error();const b=await r.json();if(!controller.signal.aborted)setCapability(b.enabled===true?'ready':'disabled');}).catch(()=>{if(!controller.signal.aborted)setCapability('offline');});
  return ()=>controller.abort();
 },[statusKey]);
 // Invalidate immediately on research changes; late requests cannot replace current results.
 useEffect(()=>{
  active.current?.controller.abort();active.current=null;setPending(false);setError(null);setLegacyDirty(false);setAspectDirty(false);
  return ()=>{active.current?.controller.abort();active.current=null;};
 },[revision]);
 async function send(){
  if(!canSend||active.current||!dataset)return;
  const question=draft.trim(),id=crypto.randomUUID(),sentRevision=revision,controller=new AbortController();
  active.current={id,revision:sentRevision,controller};setPending(true);setError(null);
  const timer=setTimeout(()=>controller.abort(),35000);
  try {
   const response=await fetch('/api/agent/chat',{method:'POST',signal:controller.signal,headers:{'Content-Type':'application/json','X-Mercata-Agent':'1'},body:JSON.stringify({question,requestId:id,revision:sentRevision,sourceKind:dataset.sourceKind,history:messages.filter(m=>m.revision===sentRevision).slice(-12).map(m=>({role:m.role,content:m.content})),aspectCorrections:Object.entries(aspectOverrides).map(([reviewId,c])=>({reviewId,...c,source:c.source??'manual'})),corrections:Object.entries(corrections).map(([reviewId,c])=>({reviewId,...c}))})});
   if(active.current?.id!==id||currentRevision.current!==sentRevision)return;
   if(!response.ok){const b=await response.json().catch(()=>({}));throw new Error(b.error==='unverified_response'?'unverified_response':b.error==='model_not_configured'?'model_not_configured':'request_failed');}
   const result=verifyReply(await response.json(),id,sentRevision,new Set(dataset.reviews.map(r=>r.reviewId)));
   if(active.current?.id!==id||currentRevision.current!==sentRevision)return;
   setMessages(old=>[...old,{id:id+'-user',role:'user',content:question,revision:sentRevision,reviewIds:[]},{id,role:'assistant',content:result.answer,revision:sentRevision,reviewIds:result.reviewIds,scopeNotice:result.scopeNotice}]);setDraft('');
  }catch(e){if(active.current?.id===id&&currentRevision.current===sentRevision){const code=e instanceof Error?e.message:'request_failed';setError(code);if(code==='model_not_configured')setCapability('disabled');}}
  finally{clearTimeout(timer);if(active.current?.id===id){active.current=null;setPending(false);}}
 }
 function openEvidence(id:string,button:HTMLButtonElement){if(dirty&&id!==selected?.reviewId)return;citationOrigin.current=button;setSelectedId(id);setTab('evidence');requestAnimationFrame(()=>evidenceHeading.current?.focus());}
 function returnToCitation(){setTab('dialogue');requestAnimationFrame(()=>{if(citationOrigin.current?.isConnected)citationOrigin.current.focus();else document.getElementById('agent-question')?.focus();});}
 return <section className="agent-workspace">
  <div className="agent-intro"><span className="section-kicker">Mercata Lens</span><h1>{t('研究助手','Research assistant')}</h1><p>{t('边追问，边核对原文。模型解释需要人工抽查，不替代经营决策。','Ask questions alongside original evidence. Human review is required; no purchasing advice.')}</p></div>
  <p className="agent-boundary">{t('美国 · 宠物饮水机','US · Cat water fountain')} · {dataset?.sourceKind==='demo'?t('模拟数据','Synthetic demo'):t('当前数据','Current data')} · {dataset?.products.length??0} {t('个商品','products')} · {dataset?.reviews.length??0} {t('条评论，不是销量','reviews, not sales')} · {t('规则版本','Ruleset')} {PAIN_POINT_RULESET_VERSION} · {t('主题版本','Aspects')} {ASPECT_REVISION}</p>
  <div className="agent-status" role="status">{capability==='checking'?t('检查模型状态……','Checking model status…'):capability==='ready'?t('模型调用已启用；当前仅分析内置模拟样本，发送时检查服务可用性。','Model enabled; built-in demo only. Availability is checked on send.'):capability==='disabled'?t('对话暂不可用，可继续查看规则分析。','Model is unavailable. Rule analysis remains available.'):t('未连接本地对话服务，可继续查看规则分析。','Local gateway is offline. Rule analysis remains available.')} <button onClick={()=>setStatusKey(v=>v+1)} disabled={pending}>{t('检查连接','Check connection')}</button></div>
  {dataset?.sourceKind==='user_upload'&&<p role="status">{t('本批模型功能不发送上传数据；请使用内置演示研究测试对话。','Uploaded data is not sent to the model. Use the built-in demo for dialogue.')}</p>}
  <details className="agent-rules"><summary>{t('查看当前负面主题汇总','Current negative aspect summary')}</summary><p>{t('程序统计，不代表市场需求。','Program-calculated sample signals, not market demand.')}</p><ul>{summaries.map(s=><li key={s.id}>{zh?s.labelZh:s.labelEn}: {s.matchedReviewCount} / {s.reviewDenominator}</li>)}</ul></details>
  <div className="agent-tabs" role="tablist" aria-label={t('研究内容','Research content')}>{(['dialogue','evidence'] as const).map(value=><button role="tab" id={'agent-tab-'+value} aria-controls={'agent-panel-'+value} aria-selected={tab===value} tabIndex={tab===value?0:-1} key={value} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?'dialogue':e.key==='End'?'evidence':value==='dialogue'?'evidence':'dialogue';setTab(next);document.getElementById('agent-tab-'+next)?.focus();}}} onClick={()=>setTab(value)}>{value==='dialogue'?t('对话','Dialogue'):t('证据','Evidence')}</button>)}</div>
  <div className="agent-columns">
   <section id="agent-panel-dialogue" aria-labelledby="agent-tab-dialogue" className={'agent-pane '+(tab==='dialogue'?'agent-pane-active':'')}>
    <h2>{t('任务对话','Task dialogue')}</h2><p className="agent-stage-note">{t('先确认范围与数据，再讨论偏好、风险、可解决性与验证事项。此版本尚未实现自主六状态编排。','Confirm scope and data, then examine preferences, risks, solvability and validation. Autonomous six-state orchestration is not implemented.')}</p>
    <div className="agent-messages" aria-live="polite">{messages.length===0&&<p>{t('可以询问这批评论中的体验问题，再打开引用核验。未启用模型时不会生成回答。','Ask about experiences in the current sample, then inspect citations. No answer is generated while the model is disabled.')}</p>}{messages.map(m=><article key={m.id} className={'agent-message agent-message-'+m.role}><strong>{m.role==='user'?t('你','You'):m.scopeNotice?t('系统范围说明','System scope notice'):t('模型解释','Model explanation')}</strong><p>{m.content}</p>{m.revision!==revision?<p className="agent-stale">{m.role==='assistant'?t('研究数据或标签已变更，此解释已失效。','Research data or labels changed. This explanation is stale.'):t('此问题属于上一版研究范围。','This question belongs to an earlier research revision.')}</p>:m.reviewIds.map(id=><button key={id} disabled={dirty&&id!==selected?.reviewId} onClick={e=>openEvidence(id,e.currentTarget)}>{t('查看评论 ','View review ')+id}</button>)}</article>)}</div>
    <form onSubmit={e=>{e.preventDefault();void send();}}><label htmlFor="agent-question">{t('问题','Question')}</label><textarea id="agent-question" maxLength={2000} value={draft} onChange={e=>setDraft(e.target.value)} readOnly={pending} rows={3}/><div className="agent-send"><button type="submit" disabled={!canSend}>{pending?t('处理中……','Processing…'):t('发送','Send')}</button><span>{draft.length} / 2000</span></div></form>
    {pending&&<p role="status">{t('正在分析，回答需通过引用校验后显示。','Processing; the answer will appear after citation checks.')}</p>}
    {error&&<div role="alert"><p>{error==='unverified_response'?t('结果未能核验，未展示该回答。','The result could not be verified and was not displayed.'):t('本次请求未完成，输入和研究数据已保留。','Request did not complete. Your input and research data were preserved.')}</p>{capability==='ready'&&<button disabled={!canSend} onClick={()=>void send()}>{t('重试','Retry')}</button>}</div>}
   </section>
   <section id="agent-panel-evidence" aria-labelledby="agent-tab-evidence" className={'agent-pane '+(tab==='evidence'?'agent-pane-active':'')}>
    <h2 ref={evidenceHeading} tabIndex={-1}>{t('原文证据 ','Original evidence ')}{selected?.reviewId??''}</h2>
    <label htmlFor="agent-review">{t('选择评论','Select review')}</label><select id="agent-review" value={selected?.reviewId??''} disabled={dirty} onChange={e=>setSelectedId(e.target.value)}>{dataset?.reviews.map(r=><option key={r.reviewId} value={r.reviewId}>{r.reviewId} · {r.productId}</option>)}</select>
    {selected&&classification?<><p>{selected.productId} · {selected.rating} {t('星','stars')} · {selected.reviewDate??t('日期未知','Unknown date')}</p><blockquote>{selected.reviewText}</blockquote>{classification.correction&&<p>{t('上次修改原因：','Last correction reason: ')}{classification.correction.reason}</p>}<p className="agent-source">{t('原文来源','Original source')}: {selected.sourceUrl}</p><AspectEditor key={'aspects'+revision+selected.reviewId} initial={annotationsFor(dataset!,selected,aspectOverrides)} text={selected.reviewText} zh={zh} onDirty={setAspectDirty} onSave={c=>applyAspectOverride(selected.reviewId,c)}/><p>{t('以下为旧规则修正，仅用于历史对照，不改变新版主题统计。','Legacy rule corrections below are for historical comparison and do not change aspect statistics.')}</p><CorrectionEditor key={revision+selected.reviewId} zh={zh} initial={classification.effectiveLabels} automatic={classification.automaticLabels} onDirty={setLegacyDirty} onApply={c=>applyReviewCorrection(selected.reviewId,c)}/></>:<p>{t('尚无有效评论。','No active review.')}</p>}
    <button onClick={returnToCitation}>{t('返回对话','Return to dialogue')}</button><p className="agent-limit">{t('模拟评论不是真实消费者反馈。引用存在不代表模型解释已获证实；请核对原文。纠错仅在当前会话保留。','Synthetic reviews are not real consumer feedback. Existing citations do not prove semantic support; inspect the original. Corrections last for this session only.')}</p>
   </section>
  </div>
 </section>;
}
function CorrectionEditor({zh,initial,automatic,onDirty,onApply}:{zh:boolean;initial:PainPointId[];automatic:PainPointId[];onDirty:(v:boolean)=>void;onApply:(c:PainPointCorrection)=>boolean}){
 const [labels,setLabels]=useState(initial);const [reason,setReason]=useState('');
 const changed=PAIN_POINT_IDS.some(id=>initial.includes(id)!==labels.includes(id));
 const dirty=changed||reason!=='';
 useEffect(()=>{onDirty(dirty);},[dirty,onDirty]);
 return <fieldset className="agent-correction"><legend>{zh?'人工修正标签':'Correct labels'}</legend>{PAIN_POINT_RULES.map(rule=><label key={rule.id}><input type="checkbox" checked={labels.includes(rule.id)} onChange={e=>setLabels(old=>e.target.checked?[...old,rule.id]:old.filter(id=>id!==rule.id))}/>{zh?rule.labelZh:rule.labelEn}</label>)}<label htmlFor="agent-reason">{zh?'修改原因':'Correction reason'}</label><textarea id="agent-reason" rows={2} maxLength={1000} value={reason} onChange={e=>setReason(e.target.value)}/><button disabled={!changed||!reason.trim()} onClick={()=>onApply({add:labels.filter(id=>!automatic.includes(id)),remove:automatic.filter(id=>!labels.includes(id)),reason:reason.trim()})}>{zh?'应用并重算':'Apply and recalculate'}</button><button disabled={!dirty} onClick={()=>{setLabels(initial);setReason('');}}>{zh?'取消修改':'Cancel changes'}</button>{dirty&&<p role="status">{zh?'请应用或取消修改后再切换评论或发送问题。':'Apply or cancel changes before changing reviews or sending.'}</p>}</fieldset>;
}
