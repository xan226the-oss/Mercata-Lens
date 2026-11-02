import { describe,it,expect } from 'vitest';
import { verifyReply } from './contract';
describe('agent response boundary',()=>{
 it('requires current request, revision and existing citations',()=>{
  const raw={requestId:'a',revision:'v',answer:'样本提示清洗困难。',reviewIds:['r001']};
  expect(verifyReply(raw,'a','v',new Set(['r001']))).toEqual(raw);
  for(const patch of [{requestId:'old'},{revision:'old'},{reviewIds:['fake']},{answer:'有99条'},{reviewIds:[]}])expect(()=>verifyReply({...raw,...patch},'a','v',new Set(['r001']))).toThrow();
 });
});
it('only accepts canonical system scope notices without review citations',()=>{
 const canonical='这些数据是项目内置的模拟演示样本，并非从真实平台采集，不能代表美国市场消费者。';
 const raw={requestId:'a',revision:'v',answer:canonical,reviewIds:[],scopeNotice:'demo_provenance'};
 expect(verifyReply(raw,'a','v',new Set())).toEqual(raw);
 for(const patch of [{answer:'模型编造的无引用结论'},{scopeNotice:'unknown'},{reviewIds:['r001']}])expect(()=>verifyReply({...raw,...patch},'a','v',new Set(['r001']))).toThrow();
});
