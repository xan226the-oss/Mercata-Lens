import demo from '../annotations/demo-aspects.json';
import {TOPICS,ASPECT_REVISION,validateAnnotations,type AspectAnnotation} from '../annotations/validate.mjs';
import {summarizePainPoints,type PainPointSummary} from './painPoints';
import type {PainPointId} from './painPointRules';
import type {ResearchDataset,ReviewRecord} from './types';
/**
 * Multi-aspect topic × sentiment domain (2026-11-04).
 * Same review may carry several topics with independent, even opposite
 * sentiments per object/time. Mixed valence is a display state, not a
 * saveable sentiment value. Aligns with server/agent.mjs TOPICS contract.
 * Documentation pass 2026-11-12.
 */

export {TOPICS,ASPECT_REVISION,validateAnnotations};
export type {AspectAnnotation};
export interface AspectOverride {annotations:AspectAnnotation[];reason:string;source?:'manual'|'model'}
export type AspectOverrides=Record<string,AspectOverride>;
const records=new Map(demo.records.map(r=>[r.reviewId,r]));
export function aspectProvenance(dataset:ResearchDataset,review:ReviewRecord,overrides:AspectOverrides={}){
 if(overrides[review.reviewId])return overrides[review.reviewId].source==='model'?'model':'manual';
 const r=records.get(review.reviewId);
 return dataset.sourceKind==='demo'&&r?.text===review.reviewText?(r.userConfirmed?'codex_user_confirmed':'codex_pending'):'unannotated';
}
export function coverageNote(dataset:ResearchDataset,review:ReviewRecord){
 const r=records.get(review.reviewId);return dataset.sourceKind==='demo'&&r?.text===review.reviewText?r.coverageNote:'';
}
export function annotationsFor(dataset:ResearchDataset,review:ReviewRecord,overrides:AspectOverrides={}):AspectAnnotation[]{
 const override=overrides[review.reviewId];
 if(override?.reason.trim()&&validateAnnotations(override.annotations,review.reviewText))return override.annotations.map(a=>({...a}));
 const r=records.get(review.reviewId);
 if(dataset.sourceKind!=='demo'||r?.text!==review.reviewText)return [];
 return r.annotations.map(a=>({...a,sentiment:a.sentiment as AspectAnnotation['sentiment']}));
}
export function summarizeAspects(dataset:ResearchDataset,overrides:AspectOverrides={}){
 const rows=dataset.reviews.map(review=>({review,annotations:annotationsFor(dataset,review,overrides)}));
 return {revision:ASPECT_REVISION,reviewCount:rows.length,annotatedReviewCount:rows.filter(r=>r.annotations.length).length,aspectCount:rows.reduce((n,r)=>n+r.annotations.length,0),topics:TOPICS.map(t=>{
  const selected=rows.filter(r=>r.annotations.some(a=>a.topic===t.name));
  const count=(s:AspectAnnotation['sentiment'])=>selected.filter(r=>r.annotations.some(a=>a.topic===t.name&&a.sentiment===s)).length;
  return {...t,topic:t.name,reviewCount:selected.length,positive:count('正面'),negative:count('负面'),neutral:count('中性')};
 })};
}
const negativeGroups:Record<PainPointId,string[]>={
 hard_to_clean:['清洗便利性','积污残留','气味表现','内部结构与可达性','拆装便利性'],
 noise:['运行噪声','振动与异响'],leakage:['密封防漏'],pump_lifetime:['水泵寿命','水泵运行稳定性'],
 filter_cost:['滤芯支出','滤芯更换频率','滤芯购买便利性','滤芯包装收纳'],capacity:['储水容量','补水频率'],pet_acceptance:['宠物接受度'],
};
/** Legacy seven-group contract for existing opportunity/decision functions; negatives only. */
export function aspectPainPoints(dataset:ResearchDataset,overrides:AspectOverrides={}):PainPointSummary[]{
 return summarizePainPoints({...dataset,reviews:[]}).map(base=>{
  const selected=dataset.reviews.filter(r=>annotationsFor(dataset,r,overrides).some(a=>a.sentiment==='负面'&&negativeGroups[base.id].includes(a.topic)));
  const productIds=[...new Set(selected.map(r=>r.productId))];
  return {...base,rulesetVersion:ASPECT_REVISION,labelEn:base.id==='filter_cost'?'Negative filter maintenance feedback':base.id==='pump_lifetime'?'Negative pump operation feedback':base.labelEn,labelZh:base.id==='filter_cost'?'滤芯维护负面反馈':base.id==='pump_lifetime'?'水泵运行负面反馈':base.labelZh,matchedReviewCount:selected.length,reviewDenominator:dataset.reviews.length,reviewFraction:dataset.reviews.length?selected.length/dataset.reviews.length:null,productIds,productCount:productIds.length,evidence:selected.map(r=>({...r,automaticMatches:[],manuallyAdded:aspectProvenance(dataset,r,overrides)==='manual',correctionReason:overrides[r.reviewId]?.reason??null}))};
 });
}
