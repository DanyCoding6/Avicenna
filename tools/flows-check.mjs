// Clicks through the main interactive flows in demo mode and asserts the state changes.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
const require = createRequire(execSync('npm root -g').toString().trim() + '/');
const { chromium, devices } = require('playwright');
const base = process.env.BASE || 'http://127.0.0.1:8080/';
const out = process.argv[2] || 'shots';
const browser = await chromium.launch();
const ctx = await browser.newContext({ ...devices['iPhone 14'], serviceWorkers: 'block' });
const page = await ctx.newPage();
const errors = []; page.on('pageerror', (e) => errors.push(e.message)); page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const fails = [];
const check = (name, ok) => { console.log((ok ? 'ok   ' : 'FAIL ') + name); if (!ok) fails.push(name); };
const go = async (h) => { await page.goto(base + '#' + h); await page.waitForTimeout(350); };
const text = async () => (await page.locator('#view').innerText()).replace(/\s+/g, ' ');
const sheetOpen = () => page.locator('#sheet-root[data-open="1"] .sheet');

await go('/programme/coaching');
await page.click('[data-action=book]'); await page.waitForTimeout(400);
await page.screenshot({ path: `${out}/sheet_book.png` });
await sheetOpen().locator('[data-slot]').first().click();
await sheetOpen().locator('[data-action-idx]').click(); await page.waitForTimeout(500);
check('coaching: slot booked', /Both sessions in the diary|2 of 2/.test(await text()) && /Join/.test(await text()));

await go('/programme/curriculum/mod-6');
await page.click('[data-action=toggle-done]'); await page.waitForTimeout(400);
check('curriculum: chapter marked done', /Completed/.test(await text()));
await go('/programme/curriculum'); check('curriculum: progress 5 of 12', /5 of 12/.test(await text()));

await go('/programme/project');
await page.locator('[data-action=toggle-milestone]').nth(1).click(); await page.waitForTimeout(400);
check('project: milestone toggled', /2 of 5/.test(await text()));

await go('/programme/mentorship');
await page.click('[data-action=log]'); await page.waitForTimeout(300);
await sheetOpen().locator('#mm-when').fill('2026-03-03T13:00'); await sheetOpen().locator('#mm-summary').fill('Talked about the summer.');
await sheetOpen().locator('[data-action-idx]').click(); await page.waitForTimeout(400);
check('mentorship: meeting logged', /Talked about the summer/.test(await text()));

await go('/programme/chaplaincy');
await page.click('[data-action=request]'); await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/sheet_chaplaincy.png` });
await sheetOpen().locator('[data-ch=video]').click(); await sheetOpen().locator('#ch-times').fill('Weekday evenings');
await sheetOpen().locator('[data-action-idx]').click(); await page.waitForTimeout(400);
check('chaplaincy: request listed', /Video call/i.test(await text()) && /\bopen\b/i.test(await text()));

await go('/hub/feed');
await page.click('[data-action=compose]'); await page.waitForTimeout(300);
await sheetOpen().locator('[data-kind=win]').click(); await sheetOpen().locator('#post-body').fill('Passed my OSCE. Alhamdulillah.');
await sheetOpen().locator('[data-action-idx]').click(); await page.waitForTimeout(500);
check('feed: post created', /Passed my OSCE/.test(await text()));
const likeBtn = page.locator('[data-action=like]').nth(1); const before = await likeBtn.getAttribute('aria-pressed'); await likeBtn.click(); await page.waitForTimeout(200);
check('feed: like toggled', (await likeBtn.getAttribute('aria-pressed')) !== before);
await go('/post/hp-1'); await page.fill('#comment-form input', 'Happy to help, I did Linklaters.'); await page.press('#comment-form input', 'Enter'); await page.waitForTimeout(400);
check('post: comment added', /Linklaters/.test(await text()));

await go('/hub/space');
await page.click('[data-action=apply]'); await page.waitForTimeout(300);
const d = new Date(); d.setDate(d.getDate() + 3); const iso = d.toISOString().slice(0, 10);
await sheetOpen().locator('#sp-date').fill(iso); await sheetOpen().locator('#sp-purpose').fill('Project rehearsal'); await sheetOpen().locator('#sp-n').fill('3');
await page.screenshot({ path: `${out}/sheet_space.png` });
await sheetOpen().locator('[data-action-idx]').click(); await page.waitForTimeout(500);
check('space: request pending', /Project rehearsal/.test(await text()) && /pending/i.test(await text()));

await go('/hub/scholars');
await page.fill('#dir-q', 'oxford'); await page.waitForTimeout(200);
check('directory: search filters', /Maryam Siddiqui/.test(await text()) && !/Bilal Ahmed/.test(await text()));
await page.fill('#dir-q', ''); await page.click('[data-action=cohort][data-value=alumni]'); await page.waitForTimeout(200);
check('directory: alumni chip', /Fatima Noor/.test(await text()) && !/Maryam/.test(await text()));

await go('/events/e-speaking');
await page.click('[data-action=rsvp][data-status=going]'); await page.waitForTimeout(500);
check('event: rsvp going', /Going/.test(await text()) && /and 3 others going/.test(await text()));
await page.click('[data-action=calendar]'); await page.waitForTimeout(300); await page.screenshot({ path: `${out}/sheet_calendar.png` });
check('event: calendar sheet', /Google Calendar/.test(await page.locator('#sheet-root').innerText()));
await page.keyboard.press('Escape'); await page.waitForTimeout(400);

await go('/opportunities/op-1');
await page.click('[data-action=express]'); await page.waitForTimeout(300);
await sheetOpen().locator('#op-statement').fill('I run a climate group at my mosque and would bring the delegation back to two hundred young people.');
await sheetOpen().locator('[data-action-idx]').click(); await page.waitForTimeout(400);
check('opportunity: interest expressed', /Interest expressed/.test(await text()));

await go('/profile');
await page.fill('input[name=currently]', 'Third year, finally on the wards'); await page.click('#profile-form button[type=submit]'); await page.waitForTimeout(400);
await go('/scholar/s-aisha'); check('profile: currently saved', /finally on the wards/.test(await text()));

await go('/home'); await page.screenshot({ path: `${out}/home_after.png`, fullPage: true });
check('home: reflects bookings', /Both sessions|2 of 2|in the diary/.test(await text()));
await browser.close();
if (errors.length) { console.log('\nCONSOLE ERRORS:'); errors.forEach((e) => console.log(' ', e)); }
if (fails.length || errors.length) process.exit(1);
console.log('\nall flows passed');
