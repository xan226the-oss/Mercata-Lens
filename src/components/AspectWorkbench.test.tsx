import {afterEach,it,expect,vi} from 'vitest';
import '@testing-library/jest-dom/vitest';
import {render,screen,within,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {readFileSync} from 'node:fs';
import {ResearchProvider} from '../research/ResearchContext';
import {AspectWorkbench} from './AspectWorkbench';
afterEach(()=>vi.unstubAllGlobals());
it('shows multi-topic evidence, saves validated sentiment corrections and restores base annotations',async()=>{
 vi.stubGlobal('fetch',vi.fn((input:RequestInfo|URL)=>Promise.resolve(new Response(String(input).endsWith('products.csv')?readFileSync('public/demo/products.csv','utf8'):String(input).endsWith('reviews.csv')?readFileSync('public/demo/reviews.csv','utf8'):'{"enabled":false}',{status:200}))));
 render(<ResearchProvider><AspectWorkbench/></ResearchProvider>);
 await screen.findByText('98 aspect entries');
 expect(screen.getByText('70 / 76 annotated reviews')).toBeVisible();
 expect(screen.getByText(/50 reviews: Codex labels confirmed/)).toBeVisible();
 const user=userEvent.setup();
 await user.selectOptions(screen.getByLabelText('Aspect review'),'r005');
 const editor=screen.getByRole('form',{name:'Edit aspect annotations'});
 expect(within(editor).getAllByLabelText(/Sentiment/)).toHaveLength(2);
 expect(within(editor).getByDisplayValue('Shape and opening design')).toBeVisible();
 await user.selectOptions(within(editor).getAllByLabelText(/Sentiment/)[0],'中性');
 expect(within(editor).getByRole('button',{name:'Save aspects'})).toBeDisabled();
 await user.type(within(editor).getByLabelText(/Aspect correction reason/),'Initial appraisal is tentative');
 await user.click(within(editor).getByRole('button',{name:'Save aspects'}));
 await screen.findByText('Current-session manual correction');
 await user.click(screen.getByRole('button',{name:'Restore initial aspects'}));
 await waitFor(()=>expect(within(screen.getByRole('form',{name:'Edit aspect annotations'})).getAllByLabelText(/Sentiment/)[0]).toHaveValue('正面'));
});
it('does not attribute user uploads to the synthetic Codex review set',async()=>{
 vi.stubGlobal('fetch',vi.fn((input:RequestInfo|URL)=>Promise.resolve(new Response(String(input).endsWith('products.csv')?readFileSync('public/demo/products.csv','utf8'):String(input).endsWith('reviews.csv')?readFileSync('public/demo/reviews.csv','utf8'):'{"enabled":false}',{status:200}))));
 const {useResearch}=await import('../research/ResearchContext');
 function Upload(){const {importCsv}=useResearch();return <button onClick={()=>importCsv(readFileSync('public/demo/products.csv','utf8'),readFileSync('public/demo/reviews.csv','utf8'))}>upload same IDs</button>;}
 render(<ResearchProvider><Upload/><AspectWorkbench/></ResearchProvider>);
 await screen.findByText('98 aspect entries');
 await userEvent.click(screen.getByText('upload same IDs'));
 expect(screen.queryByText(/50 reviews: Codex labels confirmed/)).not.toBeInTheDocument();
 expect(screen.getByText(/Uploaded reviews remain local/)).toBeVisible();
 expect(screen.getByText('0 / 76 annotated reviews')).toBeVisible();
});
