import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {onlineMean,meanDistribution,foldSplits,proportionComparison} from '../prototypes/readers/statistics-model.js';
import {statisticsMeta,statisticsReader,statisticsSections} from '../prototypes/readers/statistics.js';
import {readerMetas,readerAliases,renderDenseReader} from '../prototypes/readers/index.js';
import {reviewedNavigation} from '../prototypes/reviewed-navigation.js';
import {rank} from '../prototypes/search.js';
const close=(a,b)=>assert(Math.abs(a-b)<1e-9,`${a} != ${b}`);
// Independently compare the displayed Welford recurrence with centered sums.
let varianceCases=0,ewmaCases=0,covarianceCases=0;
for(let n=1;n<=6;n++)for(let code=0;code<3**n;code++){
  let digits=code;const xs=Array.from({length:n},()=>{const x=[-3,0,4][digits%3];digits=Math.floor(digits/3);return x;});
  let Q=0,M2=0;
  xs.forEach((x,i)=>{const count=i+1,delta=x-Q;Q+=delta/count;M2+=delta*(x-Q);
    const prefix=xs.slice(0,count),mean=prefix.reduce((s,v)=>s+v,0)/count;
    const centered=prefix.reduce((s,v)=>s+(v-mean)**2,0);
    close(Q,mean);close(M2,centered);if(count>1)close(M2/(count-1),centered/(count-1));
  });varianceCases++;
  for(const alpha of [.1,.5,1])for(const initial of [-2,3]){
    let Q=initial;for(const x of xs)Q+=alpha*(x-Q);
    const weighted=(1-alpha)**n*initial+xs.reduce((s,x,i)=>s+alpha*(1-alpha)**(n-1-i)*x,0);
    close(Q,weighted);ewmaCases++;
  }
}
// A shared finite latent variable induces correlated coordinates. Direct
// variance of their average must agree with the sum of all covariances.
for(let n=1;n<=4;n++)for(let code=0;code<3**n;code++){
  let digits=code;const coefficients=Array.from({length:n},()=>{const c=[-2,0,3][digits%3];digits=Math.floor(digits/3);return c;});
  const latent=[-1,1,4],weights=[1/6,2/6,3/6],outcomes=latent.map(z=>coefficients.map((c,i)=>c*z+i));
  const means=coefficients.map((_,i)=>outcomes.reduce((s,row,j)=>s+weights[j]*row[i],0));
  const average=outcomes.map(row=>row.reduce((s,x)=>s+x,0)/n),mean=average.reduce((s,x,i)=>s+weights[i]*x,0);
  const direct=average.reduce((s,x,i)=>s+weights[i]*(x-mean)**2,0);
  let sum=0;for(let i=0;i<n;i++)for(let j=0;j<n;j++)sum+=outcomes.reduce((s,row,k)=>s+weights[k]*(row[i]-means[i])*(row[j]-means[j]),0);
  close(direct,sum/n**2);covarianceCases++;
}
let multiplicityCases=0;
for(let n=1;n<=10;n++)for(const alpha of [0,.05,.5,1]){
  let any=0;for(let mask=1;mask<2**n;mask++){let probability=1;for(let j=0;j<n;j++)probability*=mask&(1<<j)?alpha:1-alpha;any+=probability;}
  close(any,1-(1-alpha)**n);assert(any<=n*alpha+1e-9);multiplicityCases++;
}
close(1-.95**20,.6415140775914581);
console.log(`Statistics equations: ${varianceCases} centered-variance sequences, ${ewmaCases} explicit EWMA sums, ${covarianceCases} finite joint distributions and ${multiplicityCases} exhaustive familywise-error cases pass.`);
assert.deepEqual(onlineMean([10,20,30,40]),[10,15,20,25]);const values=[3,-7,12,4,-1];onlineMean(values).forEach((v,i)=>close(v,values.slice(0,i+1).reduce((a,b)=>a+b)/(i+1)));assert.throws(()=>onlineMean([]));
for(let n=1;n<=64;n++)for(const p of [.2,.5,.8]){const f=meanDistribution(n,p);close(f.masses.reduce((a,b)=>a+b),1);close(f.bins.reduce((a,b)=>a+b),1);assert(f.bins.every(v=>v>=0));close(f.masses.reduce((s,m,k)=>s+m*k/n,0),p);close(f.masses.reduce((s,m,k)=>s+m*(k/n-p)**2,0),p*(1-p)/n);close(f.se,Math.sqrt(p*(1-p)/n));}close(meanDistribution(16).se,.1);close(meanDistribution(64).se,.05);assert.throws(()=>meanDistribution(0));assert.throws(()=>meanDistribution(65));
assert.deepEqual(foldSplits(10,3).map(f=>f.test.length),[4,3,3]);assert.deepEqual(foldSplits(10,5).map(f=>f.test),[[0,1],[2,3],[4,5],[6,7],[8,9]]);for(let n=2;n<=30;n++)for(let k=2;k<=n;k++){const folds=foldSplits(n,k),held=folds.flatMap(f=>f.test);assert.equal(held.length,n);assert.equal(new Set(held).size,n);for(const f of folds){assert(f.train.every(v=>!f.test.includes(v)));assert.equal(f.train.length+f.test.length,n);}}assert.throws(()=>foldSplits(10,1));assert.throws(()=>foldSplits(2,3));
const ab=proportionComparison(1000,10000,1100,10000);close(ab.pool,.105);close(ab.delta,.01);close(ab.z,.01/Math.sqrt(.105*.895*.0002));close(ab.se,Math.sqrt((.1*.9+.11*.89)/10000));assert(ab.interval[0]>0&&ab.interval[1]>.01);assert.equal(proportionComparison(0,10,0,10).z,null);assert.throws(()=>proportionComparison(11,10,1,10));
// Exhaust all small count pairs. Recover Bernoulli variances directly from
// their two possible outcomes, rather than repeating the p*(1-p) expression.
let proportionCases=0;
for(let nc=1;nc<=8;nc++)for(let nt=1;nt<=8;nt++)for(let sc=0;sc<=nc;sc++)for(let st=0;st<=nt;st++){
  const f=proportionComparison(sc,nc,st,nt),g=proportionComparison(st,nt,sc,nc);
  const variance=(s,n)=>((n-s)*(s/n)**2+s*(1-s/n)**2)/n;
  close(f.se**2,variance(sc,nc)/nc+variance(st,nt)/nt);
  close(f.pooledSe**2,variance(sc+st,nc+nt)*(1/nc+1/nt));
  close(f.delta,-g.delta);close(f.interval[0],-g.interval[1]);
  if(f.z===null)assert.equal(g.z,null);else close(f.z,-g.z);
  proportionCases++;
}
for(const s of [0,10]){const f=proportionComparison(s,10,s,10);assert.equal(f.z,null);assert.deepEqual(f.interval,[0,0]);}
// Published NIST example: sample 1 is treatment for this function's orientation.
const nist=proportionComparison(11,30,8,40);
close(nist.delta,-1/6);assert(Math.abs(nist.interval[0]-(-.37904))<1e-5);assert(Math.abs(nist.interval[1]-.04570)<1e-5);
console.log(`Statistics proportions: ${proportionCases} finite count pairs, both degenerate boundaries and the published NIST Wald example pass.`);
const catalog=JSON.parse(await readFile(new URL('../prototypes/catalog.json',import.meta.url),'utf8')),notes=[...readerMetas,...catalog.notes.filter(n=>!readerAliases.includes(n.slug)&&!reviewedNavigation[n.slug])],html=statisticsReader(s=>'directions.html?slug='+s),ids=[...html.matchAll(/ id="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);for(const [id]of statisticsSections)assert(ids.includes(id),id);for(const slug of [...html.matchAll(/slug=([^"#]+)/g)].map(m=>m[1]))assert(notes.some(n=>n.slug===slug),slug);assert(renderDenseReader(statisticsMeta.slug,s=>s));for(const query of ['cross-validation','standard error','EWMA','power'])assert(rank(notes,query).some(r=>r.note===statisticsMeta),query);
for(const term of ['Wald interval becomes [0,0]','pooled-test statistic is undefined','Neither result establishes equal population rates','do not repair a failed approximation by clipping','NIST compares Wald and adjusted intervals'])assert(html.includes(term),term);
assert(!html.includes('Complete originals'));assert(!/slug=(ai|systems)\//.test(html));
assert.equal((html.match(/class="inline-math"/g)||[]).length,12);
assert.equal((html.match(/<math /g)||[]).length,22);
assert(!html.includes('${'));
const escapeTex=s=>s.replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
for(const tex of [String.raw`nQ_n=(n-1)Q_{n-1}+x_n`,String.raw`\alpha\in(0,1]`,String.raw`Q_n=Q_{n-1}+\alpha(x_n-Q_{n-1})`,String.raw`\operatorname{Var}(\bar X)=\frac1{n^2}\sum_{i=1}^n\sum_{j=1}^n\operatorname{Cov}(X_i,X_j)`,String.raw`\sigma/\sqrt n`,String.raw`\beta=0.2`,String.raw`\hat p_c,\hat p_t`,String.raw`\hat\delta=\hat p_t-\hat p_c`,String.raw`H_0:p_t=p_c`,String.raw`z_{1-\beta}\approx0.84`,String.raw`1-0.95^{20}\approx64\%`,String.raw`\alpha/20`]){
  // Sigma/sqrt is one inline object; the list includes all mathematical
  // annotations rather than relying solely on a count.
  assert(html.includes(`<annotation encoding="application/x-tex">${escapeTex(tex)}</annotation>`),tex);
}
assert(html.includes(String.raw`M_{2,n}&amp;=M_{2,n-1}+\delta_n(x_n-Q_n)`));
for(const term of ['Update the mean before updating M2','Sample variance needs at least two observations','extreme differences and rounding','Positive cross-covariances','without requiring independence'])assert(html.includes(term),term);
for(const source of Object.keys(reviewedNavigation).filter(s=>reviewedNavigation[s].slug==='math/statistics'))assert(!notes.some(n=>n.slug===source));
console.log('Statistics: online means, 192 exact binomial distributions, fold partitions/held-out coverage through n=30, pooled/unpooled A/B arithmetic, boundaries, links, anchors and search pass.');
