import { describe,it,expect } from 'vitest';
import { verifyReply } from './contract';
describe('agent response boundary',()=>{
 it('requires current request, revision and existing citations',()=>{
  const raw={requestId:'a',revision:'v',answer:'样本提示清洗困难。',reviewIds:['r001']};
  expect(verifyReply(raw,'a','v',new Set(['r001']))).toEqual(raw);
  for(const patch of [{requestId:'old'},{revision:'old'},{reviewIds:['fake']},{answer:'有99条'},{reviewIds:[]}])expect(()=>verifyReply({...raw,...patch},'a','v',new Set(['r001']))).toThrow();
 });
});
