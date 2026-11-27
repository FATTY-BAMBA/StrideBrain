// Local-only synthetic evidence. Uses the existing Playwright install and a private session file.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE);
const c=JSON.parse(readFileSync(process.env.SB077_SESSION_FILE));
const origin='http://localhost:3477',dir='foundry/tasks/SB-077/evidence/round2';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({channel:'chrome',headless:true});const results=[];
try{for(const role of ['owner','viewer'])for(const locale of ['en','zh-TW'])for(const width of [390,1440]){
 const ctx=await browser.newContext({viewport:{width,height:1000}});await ctx.addCookies([{name:'__Host-stridebrain_demo_session',value:c.cookies[role],domain:'localhost',path:'/',secure:true}]);const p=await ctx.newPage();
 async function inspect(screen,shot=true){
  await p.evaluate(()=>document.fonts.ready);await p.addStyleTag({content:'nextjs-portal{display:none!important}'});
  await p.evaluate(()=>{window.scrollTo(0,0);document.querySelectorAll('*').forEach(e=>{e.scrollLeft=0;e.scrollTop=0})});
  const check=await p.evaluate(()=>{
   const links=[...document.querySelectorAll('main a[href]')].filter(a=>a.getClientRects().length&&getComputedStyle(a).visibility!=='hidden');
   const plain=links.filter(a=>{if(a.matches('[role=tab]')||a.closest('[role=tablist], nav[class*=tabs]')||/button|tab|primary|secondary|quiet|danger|outline/i.test(a.className))return false;const s=getComputedStyle(a),parent=getComputedStyle(a.parentElement);return s.color===parent.color&&!s.textDecorationLine.includes('underline');}).map(a=>({text:a.textContent,href:a.getAttribute('href'),class:a.className}));
   const names=[...document.querySelectorAll('main th[scope=row] a')].map(a=>{const range=document.createRange();range.selectNodeContents(a);const rects=[...a.getClientRects(),...range.getClientRects()].map(r=>({left:r.left,right:r.right,top:r.top,bottom:r.bottom}));return{text:a.textContent,rects,visible:rects.every(r=>r.left>=0&&r.right<=innerWidth+1),height:a.getBoundingClientRect().height};});
   return {plain,names,overflow:document.documentElement.scrollWidth>innerWidth+1};
  });results.push({role,locale,width,screen,...check});
  if(shot){await p.screenshot({path:`${dir}/${role}-${locale}-${screen}-${width}.png`,fullPage:true});if(screen==='comparison'||screen==='quote-open')await p.screenshot({path:`${dir}/${role}-${locale}-${screen}-viewport-${width}.png`});}
 }
 const routes=[['home',''],['decisions','/decisions'],['projects','/projects'],['quotes','/quotes'],['clients','/clients'],['actions','/projects/PRJ-XINYI-026/actions'],['overview','/projects/PRJ-XINYI-026'],['settings','/settings'],['new-job','/projects/new'],['prices','/quotes/prices'],['knowledge','/knowledge'],['customer-care','/customer-care'],['ai-data','/ai-data'],['preview','/preview'],['stridebrain','/stridebrain'],['not-found','/nothing-here']];
 for(const [screen,path]of routes){await p.goto(origin+'/'+locale+path,{waitUntil:'networkidle'});await inspect(screen,['home','projects','quotes','clients','actions','overview','settings','not-found'].includes(screen));if(screen==='clients'&&role==='owner'){const a=p.locator('main th[scope=row] a').first();if(await a.count()){await a.click();await p.waitForLoadState('networkidle');await inspect('client-detail',false);}}}
 await p.goto(origin+'/'+locale+'/projects/PRJ-XINYI-026/compare',{waitUntil:'networkidle'});await inspect('comparison-start',false);
 if(role==='owner'){
  const run=p.getByRole('button',{name:locale==='en'?'Find comparable projects':'尋找類似歷史專案',exact:true});if(await run.count()){await run.click();await p.waitForURL(u=>u.searchParams.has('run'));await p.locator('#review-findings').waitFor();await p.waitForLoadState('networkidle');await inspect('comparison');}
  const evidence=p.getByRole('button',{name:locale==='en'?'See evidence':'查看佐證',exact:true}).first();if(await evidence.count()){await evidence.click();await p.locator('dialog').waitFor();await p.waitForTimeout(200);await p.screenshot({path:`${dir}/owner-${locale}-evidence-${width}.png`});await p.mouse.click(2,2);results.push({role,locale,width,screen:'evidence-outside-click',stillOpen:await p.locator('dialog[open]').count()});await p.keyboard.press('Escape');await p.waitForTimeout(400);}
  const review=p.getByRole('button',{name:locale==='en'?'Create internal review action':'建立內部審查事項',exact:true});if(await review.count()){await review.click();await p.locator('dialog').waitFor();await p.waitForTimeout(200);await p.screenshot({path:`${dir}/owner-${locale}-review-${width}.png`});await p.mouse.click(2,2);results.push({role,locale,width,screen:'review-outside-click',stillOpen:await p.locator('dialog[open]').count()});await p.keyboard.press('Escape');await p.waitForTimeout(400);}
 }
 await p.goto(origin+'/'+locale+'/projects/PRJ-XINYI-026/quote',{waitUntil:'networkidle'});
 if(role==='owner'){
  const panel=p.locator('#quote-comparison');await panel.waitFor();const run=panel.locator(':scope > button');await run.waitFor({state:'visible'});await run.click();await p.waitForFunction(()=>/Current saved comparison|目前有效/.test(document.querySelector('#quote-comparison [role=status]')?.textContent??''));await panel.locator('summary').click();
  const data=await panel.evaluate(e=>({summary:e.querySelector('summary').textContent,visibleFindings:e.querySelectorAll('li a[href*="evidence"]').length,text:e.textContent}));results.push({role,locale,width,screen:'quote-findings',...data});await inspect('quote-open');await panel.locator('summary').focus();await panel.screenshot({path:`${dir}/owner-${locale}-quote-panel-${width}.png`});
 }else await inspect('quote');
 await ctx.close();
}}finally{await browser.close();writeFileSync(dir+'/checks.json',JSON.stringify(results,null,2));}
const failures=results.filter(r=>r.plain?.length||r.overflow||(r.width===390&&r.names?.some(n=>!n.visible||n.height<44))||r.stillOpen===0);console.log(JSON.stringify(failures,null,2));console.log(`Checked ${results.length} screen/interaction states; ${failures.length} failures.`);
if(failures.length)process.exitCode=1;
