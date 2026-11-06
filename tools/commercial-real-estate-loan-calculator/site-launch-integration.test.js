"use strict";
/* Full Leva GitHub Pages production-preview integration test.
 * Serves the repository over localhost as a static site, so /-rooted
 * navigation, CSS and script URLs behave like levaventures.com.
 * Does not contact, modify or publish the live site. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const http=require("node:http");
const path=require("node:path");
const {chromium}=require("playwright");
const root=path.resolve(__dirname,"../..");
const routes=[
  {path:"/",name:"Home",title:/Leva Ventures/i},
  {path:"/insights/",name:"Insights",title:/Leva Insights/},
  {path:"/tools/commercial-real-estate-loan-calculator/share/",name:"Share calculator",title:/Share Our Free Commercial Real Estate Loan Calculator/},
   {path:"/accessibility/",name:"Accessibility",title:/Accessibility.*Leva Ventures/},
  {path:"/tools/commercial-real-estate-loan-calculator/",name:"Calculator",title:/Commercial Real Estate Loan Calculator/},
  {path:"/insights/how-to-prepare-real-estate-opportunity-private-capital/",name:"Capital preparation",title:/How to Prepare a Real Estate Opportunity/},
  {path:"/insights/how-to-finance-investment-property-private-capital/",name:"Investment property",title:/How to Finance an Investment Property/},
  {path:"/insights/commercial-real-estate-acquisition-financing-debt-equity-hybrid/",name:"Debt equity hybrid",title:/Commercial Real Estate Acquisition Financing/},
  {path:"/insights/commercial-real-estate-refinance-gap-analysis/",name:"Refinance gap analysis",title:/Commercial Real Estate Refinance Gaps/},
  {path:"/insights/value-add-commercial-real-estate-acquisition-financing/",name:"Value-add acquisition",title:/Value-Add Commercial Real Estate Acquisition Financing/},
  {path:"/insights/private-capital-real-estate-development-financing/",name:"Development capital",title:/Private Capital for Real Estate Development/}
];
const media={".html":"text/html; charset=utf-8",".js":"application/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".xml":"application/xml; charset=utf-8",".txt":"text/plain; charset=utf-8",".svg":"image/svg+xml",".png":"image/png",".jpg":"image/jpeg"};
const source=new URL("https://levaventures.com");
function localPath(url){
 const u=new URL(url,"http://localhost");
 if(!/^\/[a-zA-Z0-9._~/%+-]*$/.test(u.pathname))return null;
 const file=path.resolve(root,"."+decodeURIComponent(u.pathname).replace(/\/$/,"/index.html"));
 if(!file.startsWith(root+path.sep))return null;
 return fs.existsSync(file)&&fs.statSync(file).isFile()?file:null;
}
const server=http.createServer((req,res)=>{
 const f=localPath(req.url||"/");
 if(!f){res.writeHead(404,{"content-type":"text/plain"});res.end("Not found");return;}
 res.writeHead(200,{"content-type":media[path.extname(f)]||"application/octet-stream","cache-control":"no-store"});
 fs.createReadStream(f).pipe(res);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
 const port=server.address().port;
 const origin="http://127.0.0.1:"+port;
 const browser=await chromium.launch({headless:true});
 const issues=[],pageErrors=[];
 try{
 const xml=fs.readFileSync(path.join(root,"sitemap.xml"),"utf8");
 const entry=[...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map(x=>x[1]);
 assert.equal(entry.length,routes.length,"Every public landing page should be in the sitemap");
 assert.equal(new Set(entry).size,entry.length,"No duplicate sitemap URLs");
 for(const r of routes)assert.ok(entry.includes("https://levaventures.com"+r.path),"Sitemap missing "+r.path);
 assert.ok(!xml.includes("/previews/"),"Do not submit development previews for indexing");
 const robots=fs.readFileSync(path.join(root,"robots.txt"),"utf8");
 assert.match(robots,/Sitemap:\s*https:\/\/levaventures\.com\/sitemap\.xml/i);
 assert.ok(!/Disallow:\s*\/$/.test(robots),"Public site blocked for crawlers");
 const previews=fs.readdirSync(path.join(root,"previews")).filter(f=>f.endsWith(".html"));
 assert.ok(previews.length>=5);
 for(const filename of previews){
  const html=fs.readFileSync(path.join(root,"previews",filename),"utf8");
  assert.match(html,/<meta name="robots" content="noindex,nofollow">/i,"Draft preview should be noindex: "+filename);
 }
 const context=await browser.newContext({viewport:{width:1380,height:900}});
 await context.route(/^https?:\/\/(fonts\.googleapis\.com|fonts\.gstatic\.com|challenges\.cloudflare\.com)\//,route=>route.abort());
 const page=await context.newPage();
 page.on("pageerror",e=>pageErrors.push(String(e)));
 const allInternal=new Set();
 for(const r of routes){
  const response=await page.goto(origin+r.path,{waitUntil:"domcontentloaded"});
  assert.equal(response.status(),200,"HTTP 200 for "+r.name);
  await page.locator("body").waitFor({state:"visible"});
  assert.match(await page.title(),r.title,"Page title "+r.name);
  const canonical=await page.locator('link[rel="canonical"]').getAttribute("href");
  assert.equal(canonical,"https://levaventures.com"+r.path,"Canonical URL "+r.name);
  const description=await page.locator('meta[name="description"]').getAttribute("content");
  assert.ok(description?.length>=45,"Meaningful SEO description "+r.name);
  assert.equal(await page.locator("h1").count(),1,"One H1 per page: "+r.name);
  assert.equal(await page.locator('meta[name="robots"][content*="noindex"]').count(),0,"Production page must be indexable: "+r.name);
  const anchors=await page.locator("a[href]").evaluateAll(list=>list.map(a=>a.getAttribute("href")));
  for(const a of anchors){
    if(a.startsWith("/")&&!a.startsWith("//")){
      const clean=a.split("#")[0].split("?")[0];
      if(clean)allInternal.add(clean);
      if(!clean)continue;
      const f=localPath(clean);
      if(!f)issues.push(r.name+" references missing local link "+a);
    }
  }
  const scripts=await page.locator('script[type="application/ld+json"]').allTextContents();
  for(const script of scripts)assert.doesNotThrow(()=>JSON.parse(script),"Valid JSON-LD "+r.name);
  console.log("PAGE",r.name,canonical,description.length,anchors.length,"links",scripts.length,"JSON-LD");
 }
 assert.deepEqual(issues,[],"All root-relative site links should resolve");
 assert.ok(allInternal.has("/tools/commercial-real-estate-loan-calculator/"));
 for(const p of ["/","/insights/","/insights/how-to-prepare-real-estate-opportunity-private-capital/","/insights/how-to-finance-investment-property-private-capital/","/insights/commercial-real-estate-acquisition-financing-debt-equity-hybrid/","/insights/commercial-real-estate-refinance-gap-analysis/","/insights/value-add-commercial-real-estate-acquisition-financing/","/insights/private-capital-real-estate-development-financing/"]){
  await page.goto(origin+p,{waitUntil:"domcontentloaded"});
  assert.ok(await page.locator('a[href="/tools/commercial-real-estate-loan-calculator/"]').count()>0,"Findable calculator link on "+p);
 }
 for(const width of [1380,390,320]){
  await page.setViewportSize({width,height:850});
  await page.goto(origin+"/",{waitUntil:"domcontentloaded"});
  const home=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  if(home.scroll>home.client+4){
   const outliers=await page.evaluate(()=>[...document.body.querySelectorAll("*")].map(el=>{
     const rect=el.getBoundingClientRect();const css=getComputedStyle(el);
     return {tag:el.tagName,className:typeof el.className==="string"?el.className.slice(0,100):"",right:Math.round(rect.right),left:Math.round(rect.left),width:Math.round(rect.width),position:css.position,overflowX:css.overflowX};
   }).filter(o=>o.right>innerWidth+6&&o.left<innerWidth).sort((a,b)=>b.right-a.right).slice(0,15));
   console.log("MOBILE OVERFLOW DIAGNOSTICS",width,JSON.stringify(outliers));
  }
  assert.ok(home.scroll<=home.client+4,"Homepage horizontal overflow at "+width+" "+JSON.stringify(home));
  assert.ok(await page.locator(".finance-tool-feature a[href='/tools/commercial-real-estate-loan-calculator/']").isVisible(),"Home spotlight visible "+width);
  await page.goto(origin+"/insights/",{waitUntil:"domcontentloaded"});
  const blog=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,client:document.documentElement.clientWidth}));
  assert.ok(blog.scroll<=blog.client+4,"Insights horizontal overflow at "+width+" "+JSON.stringify(blog));
  assert.ok(await page.locator(".calculator-insights-feature a[href='/tools/commercial-real-estate-loan-calculator/']").isVisible(),"Insights spotlight visible "+width);
  console.log("RESPONSIVE",width,"home",JSON.stringify(home),"Insights",JSON.stringify(blog));
 }
 await page.setViewportSize({width:1366,height:900});
 await page.goto(origin+"/tools/commercial-real-estate-loan-calculator/",{waitUntil:"domcontentloaded"});
 await page.waitForFunction(()=>document.querySelector("#loan-payment").textContent!=="—");
 assert.match(await page.locator("#loan-payment").textContent(),/^\$/);
 await page.locator("#tab-refi").click();
 await page.waitForFunction(()=>document.querySelectorAll("#capital-stack-table tbody tr").length===4);
 assert.match(await page.locator("#capital-stack-uses").textContent(),/^\$/);
 assert.match(await page.locator("#capital-stack-gap").textContent(),/^\$/);
 const transcript=await page.locator("#capital-stack-transcript").count();
 assert.equal(transcript,1);
 assert.deepEqual(pageErrors,[],"No page script errors during site navigation");
 // Capture verifiable static production-style preview images for launch approval.
 const outputDir=path.join(root,"preview-artifacts");
 fs.mkdirSync(outputDir,{recursive:true});
 for(const capture of [
   {route:"/",name:"leva-homepage-launch-desktop.png",width:1366,height:850},
   {route:"/insights/",name:"leva-insights-launch-desktop.png",width:1366,height:850},
   {route:"/tools/commercial-real-estate-loan-calculator/",name:"leva-calculator-launch-desktop.png",width:1366,height:850},
   {route:"/",name:"leva-homepage-launch-mobile.png",width:390,height:844},
   {route:"/insights/",name:"leva-insights-launch-mobile.png",width:390,height:844}
 ]){
   await page.setViewportSize({width:capture.width,height:capture.height});
   await page.goto(origin+capture.route,{waitUntil:"domcontentloaded"});
   if(capture.route.includes("calculator"))await page.waitForFunction(()=>document.querySelector("#loan-payment").textContent!=="—");
   await page.screenshot({path:path.join(outputDir,capture.name),fullPage:true,animations:"disabled"});
   console.log("LAUNCH PREVIEW",capture.name);
 }
 console.log("PRODUCTION-PREVIEW INTEGRATION PASSED; links, SEO, sitemap, JSON-LD, desktop/mobile and calculator");
 await context.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
