/**
 * Topic × sentiment workbench: AI initial labels, user confirmation and overrides.
 * Documentation pass 2026-11-12.
 */

import {useEffect,useMemo,useRef,useState} from 'react';
import {useResearch} from '../research/ResearchContext';
import {useLanguage} from '../app/LanguageContext';
import {annotationsFor,aspectProvenance,coverageNote,summarizeAspects,validateAnnotations,ASPECT_REVISION} from '../domain/aspects';
import {AspectEditor} from './AspectEditor';
import './aspects.css';

export function AspectWorkbench(){
 const {dataset,aspectOverrides,applyAspectOverride,clearAspectOverride}=useResearch();
 const {language}=useLanguage();const zh=language==='zh';const t=(cn:string,en:string)=>zh?cn:en;
 const [id,setId]=useState('');const [topic,setTopic]=useState('');const [sentiment,setSentiment]=useState('');
 const [dirty,setDirty]=useState(false);const [enabled,setEnabled]=useState(false);const [pending,setPending]=useState(false);const [error,setError]=useState('');
 const revision=useMemo(()=>({}),[dataset,aspectOverrides]);const current=useRef(revision);current.current=revision;
 const request=useRef<AbortController|null>(null);
 useEffect(()=>{let mounted=true;fetch('/api/agent/status',{signal:AbortSignal.timeout(5000)}).then(r=>r.ok?r.json():null).then(v=>{if(mounted)setEnabled(v?.enabled===true);}).catch(()=>{});return()=>{mounted=false;};},[]);
 useEffect(()=>{request.current?.abort();request.current=null;setPending(false);setError('');setDirty(false);return()=>request.current?.abort();},[revision]);
 if(!dataset)return <p>{t('等待评论数据。','Waiting for review data.')}</p>;
 const summary=summarizeAspects(dataset,aspectOverrides);
 const filtered=dataset.reviews.filter(r=>annotationsFor(dataset,r,aspectOverrides).some(a=>(!topic||a.topic===topic)&&(!sentiment||a.sentiment===sentiment))||(!topic&&!sentiment));
 const review=filtered.find(r=>r.reviewId===id)??filtered[0];
 const annotations=review?annotationsFor(dataset,review,aspectOverrides):[];
 const origin=review?aspectProvenance(dataset,review,aspectOverrides):'unannotated';
 const sourceText={codex_user_confirmed:t('Codex初标，用户整体确认','Codex labels, user confirmed'),codex_pending:t('Codex补标，待用户复核','Additional Codex labels, pending review'),manual:t('本会话人工修正','Current-session manual correction'),model:t('模型初标，待复核','Model labels, pending review'),unannotated:t('尚无主题标注','No aspect annotations')};
 async function tag(){
  if(!review||!dataset||!enabled||pending||dirty||dataset.sourceKind!=='demo')return;
  const c=new AbortController();request.current=c;const sent=revision,reviewId=review.reviewId;setPending(true);setError('');
  const requestId=crypto.randomUUID();const timer=setTimeout(()=>c.abort(),35000);
  try{
   const r=await fetch('/api/agent/tag',{method:'POST',signal:c.signal,headers:{'Content-Type':'application/json','X-Mercata-Agent':'1'},body:JSON.stringify({sourceKind:'demo',reviewId,requestId})});
   if(!r.ok)throw Error('failed');const value=await r.json();
   if(c.signal.aborted||current.current!==sent)return;
   if(value.requestId!==requestId||value.reviewId!==reviewId||!validateAnnotations(value.annotations,review.reviewText))throw Error('invalid');
   applyAspectOverride(reviewId,{annotations:value.annotations,reason:'Model aspect classification; pending semantic review',source:'model'});
  }catch{if(!c.signal.aborted&&current.current===sent)setError(t('打标未完成，未改动当前标注。不会自动重试。','Tagging failed; current annotations preserved. No automatic retry.'));}
  finally{clearTimeout(timer);if(request.current===c){request.current=null;setPending(false);}}
 }
 return <section className="aspect-workbench" aria-label={t('主题情感工作台','Aspect sentiment workbench')}>
  <header><span className="section-kicker">{ASPECT_REVISION}</span><h2>{t('评论主题与情感','Review topics and sentiment')}</h2><p>{t('每个主题单独判断正面、负面或中性，并保留原文依据。','Each aspect has its own positive, negative or neutral sentiment and original evidence.')}</p></header>
  <div className="aspect-metrics"><strong>{summary.annotatedReviewCount} / {summary.reviewCount} {t('条评论已有标注','annotated reviews')}</strong><strong>{summary.aspectCount} {t('个主题情感条目','aspect entries')}</strong><span>{t('19个标签 · 9个主题组','19 topics · 9 groups')}</span></div>
  <p>{dataset.sourceKind==='demo'?t('初始50条评论：Codex标注经用户整体确认；其余26条由Codex补查。目录未覆盖或主题不具体时可无标签；空白不表示中性或没有问题。','50 reviews: Codex labels confirmed by the user; 26 additional reviews checked by Codex. Uncovered or nonspecific content may remain untagged; blank is not neutral or problem-free.'):t('上传评论仅在本地使用，不套用演示标注，不发送给云端模型；可按原文逐条人工标注。','Uploaded reviews remain local, do not inherit demo annotations, and are not sent to the model. Annotate them manually using the original text.')}</p>
  <p>{t('以下为每个标签涉及的去重评论数；跨标签或跨情感不可相加。','Counts below are unique reviews per topic and sentiment; do not add across topics or sentiments.')} {dataset.sourceKind==='demo'?t('内置模拟样本，非真实市场数据。','Built-in synthetic sample, not real market data.'):t('上传来源未经本平台独立核实。','Upload sources have not been independently verified.')}</p>
  <div className="aspect-table-scroll"><table><caption>{t('主题情感统计','Aspect sentiment statistics')}</caption><thead><tr>{[t('主题组 / 标签','Group / topic'),t('涉及评论','Reviews'),t('正面','Positive'),t('负面','Negative'),t('中性','Neutral')].map(h=><th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{summary.topics.map(row=><tr key={row.topic}><th scope="row"><small>{row.group}</small><button disabled={dirty||pending} onClick={()=>setTopic(row.topic)}>{zh?row.topic:row.en}</button></th><td>{row.reviewCount}</td><td>{row.positive}</td><td>{row.negative}</td><td>{row.neutral}</td></tr>)}</tbody></table></div>
  <div className="aspect-filters"><label>{t('主题筛选','Filter topic')}<select value={topic} disabled={dirty||pending} onChange={e=>setTopic(e.target.value)}><option value="">{t('全部主题','All topics')}</option>{summary.topics.map(row=><option key={row.topic} value={row.topic}>{zh?row.topic:row.en}</option>)}</select></label><label>{t('情感筛选','Filter sentiment')}<select value={sentiment} disabled={dirty||pending} onChange={e=>setSentiment(e.target.value)}><option value="">{t('全部情感','All sentiments')}</option><option value="正面">{t('正面','Positive')}</option><option value="负面">{t('负面','Negative')}</option><option value="中性">{t('中性','Neutral')}</option></select></label>
  <label>{t('选择评论','Aspect review')}<select value={review?.reviewId??''} disabled={dirty||pending} onChange={e=>setId(e.target.value)}>{filtered.map(r=><option key={r.reviewId} value={r.reviewId}>{r.reviewId} · {r.productId}</option>)}</select></label></div>
  {review?<article><h3>{review.reviewId} · {review.productId}</h3><blockquote>{review.reviewText}</blockquote><p>{sourceText[origin]}</p>{coverageNote(dataset,review)&&<p className="aspect-gap">{t('覆盖说明：','Coverage note: ')}{coverageNote(dataset,review)}</p>}
  <button onClick={()=>void tag()} disabled={!enabled||dataset.sourceKind!=='demo'||pending||dirty}>{pending?t('正在打标……','Tagging…'):t('用模型重新打标此评论','Retag this review with model')}</button><p>{t('仅主动点击时调用；仅内置模拟数据。模型初标仍需语义复核，失败不自动重试。','Calls only on click, built-in synthetic data only. Model output still needs semantic review; failures are not retried automatically.')}</p>{error&&<p role="alert">{error}</p>}
  {aspectOverrides[review.reviewId]&&<button disabled={dirty||pending} onClick={()=>clearAspectOverride(review.reviewId)}>{t('恢复初始标注','Restore initial aspects')}</button>}
  <AspectEditor key={review.reviewId+JSON.stringify(annotations)} initial={annotations} text={review.reviewText} zh={zh} onDirty={setDirty} onSave={value=>applyAspectOverride(review.reviewId,value)}/></article>:<p>{t('当前筛选没有评论。','No reviews match these aspect filters.')}</p>}
 </section>;
}
