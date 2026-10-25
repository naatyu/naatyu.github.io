import { heatTransport, powerPlacement, usefulCapacity } from './hardware-model.js';
import { rangePlayback } from './topic-tools.js';
const n=x=>Number(x.toFixed(3)).toString();
const plot=(label,body)=>`<div class="hardware-plot" tabindex="0" role="region" aria-label="${label}"><svg viewBox="0 0 600 280" role="img" aria-label="${label}">${body}</svg></div>`;
const text=(x,y,value,color='#e1e1ee')=>`<text x="${x}" y="${y}" fill="${color}">${value}</text>`;
const box=(x,y,w,h,label,on=false)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${on?'#713649':'#312735'}" stroke="${on?'#c8dff4':'#796079'}"/>${text(x+12,y+30,label)}`;
export function hardwareHeatBody(flow=120,stage=0){
 const r=heatTransport({powerKW:120,liquidFraction:.75,flowLPM:flow,densityKgL:1,specificHeatKJKgK:4});
 const captions=['Electrical work ends as heat in the rack; assign90kW to liquid and30kW to air.','Cold plates pass heat into the technical coolant; the fluid circulates within this loop.','The CDU heat exchanger transfers heat across a boundary; the two fluids do not mix.','Facility coolant carries heat away to the site heat-rejection system.','Heat rejection and the air-cooled remainder both matter; moving heat is not destroying it.'];
 return plot('Conceptual isolated-loop heat path',box(20,25,135,65,'Rack:120kW',stage===0)+box(205,25,160,65,'Technical loop',stage===1)+box(420,25,160,65,'Facility loop',stage===3)+box(205,150,160,65,'CDU exchanger',stage===2)+box(420,150,160,65,'Heat rejection',stage===4)+box(20,150,135,65,'Air:30kW',stage===4)+`<path d="M155 58H205 M285 90V150 M365 182H400V58H420 M500 90V150 M87 90V150" fill="none" stroke="#c8dff4" stroke-width="3"/><path d="M322 155V210" stroke="#ba859a" stroke-width="4"/>`+text(20,250,'Solid paths:heat transfer roles; not a piping schematic.')+text(209,130,'90kW liquid'))+`<p data-hardware-result>Stage=${stage}/4. ${captions[stage]} Liquid=${n(r.liquidKW)}kW; air=${n(r.airKW)}kW; flow=${flow}L/min; mass flow=${n(r.massKgS)}kg/s; bulk ΔT=${n(r.deltaK)}K.</p><p>Illustrative constant properties:ρ=1kg/L,cₚ=4kJ/(kg·K). No coolant or rack measurement is implied. Changing flow changes bulk temperature rise, not the assigned heat load. This is not a component-temperature or safety model.</p>`;
}
export function hardwarePlacementBody(mode='crowded',site=240){
 const assignment=mode==='balanced'?[0,1]:[0,0];
 const r=powerPlacement({rackKW:[90,90],assignment,branchKW:[120,120],siteKW:site});
 return plot('Two branch capacities and fixed rack assignments',box(200,15,200,55,`Site:${site}kW`)+box(40,105,230,65,`Branch A:${r.loads[0]}/120kW`,r.loads[0]>120)+box(330,105,230,65,`Branch B:${r.loads[1]}/120kW`,r.loads[1]>120)+`<path d="M300 70V85H155V105 M300 85H445V105" fill="none" stroke="#c8dff4" stroke-width="3"/>`+box(40,215,180,50,'Rack1:90kW')+box(380,215,180,50,'Rack2:90kW')+`<path d="M130 215V170 M470 215L${assignment[1]===0?190:470} 170" fill="none" stroke="#ba859a" stroke-width="3"/>`)+`<p data-hardware-result>Assignment=${mode}; site demand=${r.totalKW}kW; site margin=${r.siteMarginKW}kW; A margin=${r.marginsKW[0]}kW; B margin=${r.marginsKW[1]}kW; feasible=${r.feasible?'yes':'no'}.</p><p>${r.feasible?'All three declared inequalities hold. This says nothing about unmodeled cooling or failover.':r.siteMarginKW<0?'The total demand exceeds the site cap; moving racks between branches cannot repair that inequality.':'The site has spare capacity, but Branch A is overloaded. Reassigning rack2 can repair the local inequality.'} These are assigned toy capacities, not electrical installation ratings.</p>`;
}
export function hardwareCapacityBody(uptime=99,productive=80){
 const r=usefulCapacity({installedGPUs:72,intervalHours:24,uptime:uptime/100,productiveFraction:productive/100});
 const widths=[r.usefulGPUHours,r.availableUnusedGPUHours,r.downtimeGPUHours].map(x=>540*x/r.installedGPUHours),colors=['#c8dff4','#ba859a','#665568'];
 let x=30;const bars=widths.map((w,i)=>{const s=`<rect x="${x}" y="60" width="${w}" height="70" fill="${colors[i]}"/>`;x+=w;return s;}).join('');
 return plot('Installed GPU-hours partition into useful, unused and downtime',bars+text(30,35,'72 GPUs ×24h =1728 installed GPU-hours')+text(30,165,`Useful:${n(r.usefulGPUHours)} GPU-h`)+text(30,195,`Available but unused:${n(r.availableUnusedGPUHours)} GPU-h`)+text(30,225,`Downtime:${n(r.downtimeGPUHours)} GPU-h`)+text(30,255,'Color categories also have explicit numerical labels.'))+`<p data-hardware-result>Uptime=${uptime}%; productive fraction of available time=${productive}%; available=${n(r.availableGPUHours)} GPU-h; useful=${n(r.usefulGPUHours)} GPU-h; unused=${n(r.availableUnusedGPUHours)} GPU-h; downtime=${n(r.downtimeGPUHours)} GPU-h.</p><p>Assigned accounting example, not measured uptime, utilization or MFU. Raising productivity does not recover hours when the equipment was unavailable.</p>`;
}
export function hardwareScenes(){return{
 heat:`<div class="topic-scene" data-hardware-lab="heat"><h3>Heat crosses the boundary; the fluids remain separate</h3><label>Technical-loop flow(L/min)<input aria-label="Hardware coolant flow" data-flow type="range" min="30" max="240" step="10" value="120"></label><label>Heat-path stage<input aria-label="Hardware heat-path stage" data-stage type="range" min="0" max="4" step="1" value="0"></label><div class="dense-actions"><button data-play>Play</button><button data-reset>Replay</button></div><div data-output>${hardwareHeatBody()}</div></div>`,
 placement:`<div class="topic-scene" data-hardware-lab="placement"><h3>Spare megawatts are not spare capacity everywhere</h3><label>Rack placement<select aria-label="Hardware rack placement"><option value="crowded">Both racks on A</option><option value="balanced">One rack per branch</option></select></label><label>Site cap(kW)<input aria-label="Hardware site cap" type="range" min="120" max="300" step="10" value="240"></label><div data-output>${hardwarePlacementBody()}</div></div>`,
 capacity:`<div class="topic-scene" data-hardware-lab="capacity"><h3>Installed capacity is not useful capacity</h3><label>Available time(%)<input aria-label="Hardware uptime" data-uptime type="range" min="0" max="100" step="1" value="99"></label><label>Productive fraction of available time(%)<input aria-label="Hardware productive fraction" data-productive type="range" min="0" max="100" step="1" value="80"></label><div data-output>${hardwareCapacityBody()}</div></div>`
};}
export function mountHardwareScenes(article){
 for(const lab of article.querySelectorAll('[data-hardware-lab]')){
  const output=lab.querySelector('[data-output]');
  if(lab.dataset.hardwareLab==='heat'){
   const flow=lab.querySelector('[data-flow]'),stage=lab.querySelector('[data-stage]');
   const draw=()=>{output.innerHTML=hardwareHeatBody(Number(flow.value),Number(stage.value));};
   const playback=rangePlayback(article,lab,draw,10000,stage);
   flow.addEventListener('input',()=>{playback.stop();draw();});
  }else{
   const draw=()=>{output.innerHTML=lab.dataset.hardwareLab==='placement'?hardwarePlacementBody(lab.querySelector('select').value,Number(lab.querySelector('input').value)):hardwareCapacityBody(Number(lab.querySelector('[data-uptime]').value),Number(lab.querySelector('[data-productive]').value));};
   for(const control of lab.querySelectorAll('input,select'))control.addEventListener(control.tagName==='SELECT'?'change':'input',draw);
   draw();
  }
 }
}
