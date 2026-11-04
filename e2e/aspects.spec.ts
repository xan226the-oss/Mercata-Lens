import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';
test('aspect workbench supports multiple sentiments, grounded model replacement, restore and narrow screens',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/agent/status',r=>r.fulfill({json:{enabled:true}}));
 let calls=0;
 await page.route('**/api/agent/tag',async r=>{calls++;const b=r.request().postDataJSON();await r.fulfill({json:{...b,annotations:[{topic:'外形与开口设计',sentiment:'中性',evidence:'wide bowl sounds nice',reason:'Tentative appraisal, requires review'},{topic:'清洗便利性',sentiment:'负面',evidence:'a pain to clean',reason:'Explicit complaint'}]}});});
 await page.goto('/pain-points');await expect(page.getByText('98 aspect entries',{exact:true})).toBeVisible();
 await page.getByRole('combobox',{name:'Aspect review',exact:true}).selectOption('r005');
 await expect(page.getByRole('combobox',{name:'Sentiment 1',exact:true})).toHaveValue('正面');
 await expect(page.getByRole('combobox',{name:'Sentiment 2',exact:true})).toHaveValue('负面');
 await page.getByRole('button',{name:'Retag this review with model',exact:true}).click();
 await expect(page.getByText('Model labels, pending review',{exact:true})).toBeVisible();expect(calls).toBe(1);
 await expect(page.getByRole('combobox',{name:'Sentiment 1',exact:true})).toHaveValue('中性');
 await page.getByRole('button',{name:'Restore initial aspects',exact:true}).click();
 await expect(page.getByRole('combobox',{name:'Sentiment 1',exact:true})).toHaveValue('正面');
 await page.getByRole('button',{name:'Switch language'}).click();
 await fs.mkdir('/tmp/mercata-aspects-screens',{recursive:true});
 for(const width of [1440,900,390]){
  await page.setViewportSize({width,height:900});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.screenshot({path:`/tmp/mercata-aspects-screens/aspects-${width}.png`,fullPage:true});
 }
 expect(errors).toEqual([]);
});
