import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {importResearchCsv} from '../data/csvImport';
import {annotationsFor,summarizeAspects,aspectPainPoints,validateAnnotations} from './aspects';
const result=importResearchCsv(readFileSync('public/demo/products.csv','utf8'),readFileSync('public/demo/reviews.csv','utf8'));
if(!result.ok)throw Error('fixture');
const dataset={...result.dataset,sourceKind:'demo' as const};
describe('aspect sentiment evidence',()=>{
 it('loads approved multifacet labels, without importing demo annotations into uploads or changed texts',()=>{
  const r=dataset.reviews.find(r=>r.reviewId==='r005')!;
  expect(annotationsFor(dataset,r).map(a=>[a.topic,a.sentiment])).toEqual([['外形与开口设计','正面'],['清洗便利性','负面']]);
  expect(annotationsFor({...dataset,sourceKind:'user_upload'},r)).toEqual([]);
  expect(annotationsFor(dataset,{...r,reviewText:'different'})).toEqual([]);
 });
 it('counts unique reviews per topic/sentiment separately from annotation entries',()=>{
  const r=dataset.reviews[0];const base=annotationsFor(dataset,r);
  const d={...dataset,reviews:[r]};
  const summary=summarizeAspects(d,{[r.reviewId]:{annotations:[...base,{...base[0],evidence:'Hard to clean',reason:'different context'}],reason:'test'}});
  expect(summary.annotatedReviewCount).toBe(1);expect(summary.aspectCount).toBe(3);
  expect(summary.topics.find(t=>t.topic==='清洗便利性')?.negative).toBe(1);
  expect(aspectPainPoints(d).find(t=>t.id==='hard_to_clean')?.matchedReviewCount).toBe(1);
 });
 it('rejects catchall topics, invented quotes, duplicate exact facets and invalid sentiment',()=>{
  const good={topic:'清洗便利性',sentiment:'负面',evidence:'Hard to clean',reason:'explicit'};
  expect(validateAnnotations([good],'Hard to clean.')).toBe(true);
  expect(validateAnnotations([{...good,topic:'其他'}],'Hard to clean.')).toBe(false);
  expect(validateAnnotations([{...good,evidence:'no noise'}],'Hard to clean.')).toBe(false);
  expect(validateAnnotations([good,good],'Hard to clean.')).toBe(false);
  expect(validateAnnotations([{...good,sentiment:'mixed'}],'Hard to clean.')).toBe(false);
 });
 it('does not count mixed acceptance as neutral or untagged reviews as negative',()=>{
  const r=dataset.reviews.find(r=>r.reviewId==='r055')!;
  expect(annotationsFor(dataset,r).map(a=>a.sentiment)).toEqual(['正面','负面']);
  const summary=summarizeAspects({...dataset,reviews:[r]});
  expect(summary.topics.find(t=>t.topic==='宠物接受度')).toMatchObject({positive:1,negative:1,neutral:0,reviewCount:1});
 });
});
it('keeps the approved catalog and every shipped annotation grounded in its own source',async()=>{
 const {default:demo}=await import('../annotations/demo-aspects.json');
 const {default:runtimeTaxonomy}=await import('../annotations/taxonomy.json');
 const approved=JSON.parse(readFileSync('docs/evidence/topic-sentiment-taxonomy-2026-11-04.json','utf8'));
 expect(runtimeTaxonomy.labels.map(t=>[t.name,t.group,t.definition])).toEqual(approved.labels.map((t:{name:string;group:string;definition:string})=>[t.name,t.group,t.definition]));
 expect(demo.records).toHaveLength(76);
 for(const row of demo.records)expect(validateAnnotations(row.annotations,row.text),row.reviewId).toBe(true);
 const first=demo.records.filter(r=>r.userConfirmed);
 expect(first).toHaveLength(50);expect(first.flatMap(r=>r.annotations)).toHaveLength(72);
});
