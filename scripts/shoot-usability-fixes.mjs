// 改后版截图：决策页 + 痛点工作台（含命中高亮）+ 助手页（stale 用状态模拟较难，截主界面）
import { chromium } from '@playwright/test';
const browser = await chromium.launch({ executablePath: '/Users/xanthe/Library/Caches/ms-playwright/chromium-1228/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const base = process.argv[2] || 'http://127.0.0.1:5199';
const outDir = process.argv[3] || '/tmp/ml-after';

// 决策页（P0-4 警示横幅 + 数据口径）
await page.goto(base + '/decision', { waitUntil: 'networkidle' });
await page.screenshot({ path: outDir + '/decision.png', fullPage: false });

// 痛点页（P0-5 命中高亮 + P0-1/3 编辑器入口）
await page.goto(base + '/pain-points', { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.screenshot({ path: outDir + '/pain-points-top.png', fullPage: false });
// 滚到评论原文区
const hits = page.locator('.aspect-hits').first();
if (await hits.count()) { await hits.scrollIntoViewIfNeeded(); await page.waitForTimeout(300); await page.screenshot({ path: outDir + '/pain-points-hits.png', fullPage: false }); }
// 滚到编辑器
const editor = page.locator('.aspect-editor__intro').first();
if (await editor.count()) { await editor.scrollIntoViewIfNeeded(); await page.waitForTimeout(300); await page.screenshot({ path: outDir + '/pain-points-editor.png', fullPage: false }); }

await browser.close();
console.log('done:', outDir);
