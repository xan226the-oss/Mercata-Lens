import { afterEach,it,expect,vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { render,screen,waitFor,act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fs from 'node:fs';
import { ResearchProvider,useResearch } from '../research/ResearchContext';
import { LanguageProvider } from '../app/LanguageContext';
import { AgentWorkspace } from './AgentWorkspace';
const csv=(name:string)=>fs.readFileSync(new URL('../../public/demo/'+name,import.meta.url),'utf8');
let enabled=true;
let handler:(b:any)=>Promise<Response>;
function setup(){
 vi.stubGlobal('fetch',vi.fn(async(input:RequestInfo|URL,init?:RequestInit)=>{
  const url=String(input);
  if(url.endsWith('products.csv'))return new Response(csv('products.csv'));
  if(url.endsWith('reviews.csv'))return new Response(csv('reviews.csv'));
  if(url.endsWith('/status'))return new Response(JSON.stringify({enabled}));
  return handler(JSON.parse(String(init?.body)));
 }));
 function Mutator(){const r=useResearch();return <button onClick={()=>r.applyReviewCorrection('r001',{add:['noise'],remove:[],reason:'test'})}>change revision</button>;}
 render(<LanguageProvider><ResearchProvider><AgentWorkspace/><Mutator/></ResearchProvider></LanguageProvider>);
 return userEvent.setup();
}
const reply=(b:any)=>new Response(JSON.stringify({answer:'这条模拟样本提到清洗困难。',reviewIds:['r001'],requestId:b.requestId,revision:b.revision}));
afterEach(()=>{vi.unstubAllGlobals();enabled=true;});
it('disabled model never sends a question and leaves evidence available',async()=>{
 enabled=false;const user=setup();await screen.findByText(/Model is unavailable/);
 await user.type(screen.getByLabelText('Question'),'cleaning');expect(screen.getByRole('button',{name:'Send'})).toBeDisabled();
 expect((await screen.findAllByText(/Hard to clean/))[0]).toBeInTheDocument();
});
it('shows a verified reply and opens the cited original',async()=>{
 handler=async b=>reply(b);const user=setup();await screen.findByText(/Model enabled/);
 await user.type(screen.getByLabelText('Question'),'cleaning');await user.click(screen.getByRole('button',{name:'Send'}));
 await screen.findByText('这条模拟样本提到清洗困难。');await user.click(screen.getByRole('button',{name:'View review r001'}));
 await waitFor(()=>expect(screen.getByRole('heading',{name:'Original evidence r001'})).toHaveFocus());
});
it('rejects stale replies after a correction even when transport ignores abort',async()=>{
 let resolve!:(r:Response)=>void;let request:any;
 handler=b=>{request=b;return new Promise(r=>{resolve=r;});};const user=setup();await screen.findByText(/Model enabled/);
 await user.type(screen.getByLabelText('Question'),'cleaning');await user.click(screen.getByRole('button',{name:'Send'}));
 await user.click(screen.getByRole('button',{name:'change revision'}));
 await act(async()=>resolve(reply(request)));
 expect(screen.queryByText('这条模拟样本提到清洗困难。')).not.toBeInTheDocument();
 await waitFor(()=>expect(screen.getByRole('button',{name:'Send'})).toBeEnabled());
});
it('preserves draft and offers retry after failure',async()=>{
 handler=async()=>new Response(JSON.stringify({error:'upstream_unavailable'}),{status:502});const user=setup();await screen.findByText(/Model enabled/);
 await user.type(screen.getByLabelText('Question'),'cleaning');await user.click(screen.getByRole('button',{name:'Send'}));
 await screen.findByRole('button',{name:'Retry'});expect(screen.getByLabelText('Question')).toHaveValue('cleaning');
});
it('blocks fabricated citations',async()=>{
 handler=async b=>new Response(JSON.stringify({answer:'unsafe answer',reviewIds:['fake'],requestId:b.requestId,revision:b.revision}));
 const user=setup();await screen.findByText(/Model enabled/);await user.type(screen.getByLabelText('Question'),'cleaning');await user.click(screen.getByRole('button',{name:'Send'}));
 await screen.findByRole('alert');expect(screen.queryByText('unsafe answer')).not.toBeInTheDocument();
});
it('supports arrow-key navigation between the narrow-screen content tabs',async()=>{
 const user=setup();await screen.findByText(/Model enabled/);
 const dialogue=screen.getByRole('tab',{name:'Dialogue'});dialogue.focus();await user.keyboard('{ArrowRight}');
 expect(screen.getByRole('tab',{name:'Evidence'})).toHaveFocus();
 expect(screen.getByRole('tab',{name:'Evidence'})).toHaveAttribute('aria-selected','true');
});
it('invalidates dialogue when a new aspect sentiment correction is saved and sends the replacement',async()=>{
 let sent:any;handler=async b=>{sent=b;return reply(b);};
 const user=setup();await screen.findByText(/Model enabled/);
 await user.type(screen.getByLabelText('Question'),'解释 r001');await user.click(screen.getByRole('button',{name:'Send'}));
 await screen.findByText('这条模拟样本提到清洗困难。');
 const sentiment=await screen.findByLabelText('Sentiment 1');
 await user.selectOptions(sentiment,'中性');
 await user.type(screen.getByLabelText('Aspect correction reason'),'tentative');
 await user.click(screen.getByRole('button',{name:'Save aspects'}));
 await screen.findByText(/This explanation is stale/);
 await user.type(screen.getByLabelText('Question'),'继续');await user.click(screen.getByRole('button',{name:'Send'}));
 await waitFor(()=>expect(sent.aspectCorrections?.[0]?.annotations[0]?.sentiment).toBe('中性'));
 expect(sent.history).toHaveLength(0);
});
