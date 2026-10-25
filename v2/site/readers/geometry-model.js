function valid(v){return Array.isArray(v)&&v.length>0&&v.every(Number.isFinite);}
export function norm(v){if(!valid(v))throw new Error('Invalid vector');return Math.hypot(...v);}
export function normalize(v){norm(v);const scale=Math.max(...v.map(Math.abs));if(scale===0)throw new Error('Zero vector has no direction');const scaled=v.map(x=>x/scale),n=Math.hypot(...scaled);return scaled.map(x=>x/n);}
export function inner(a,b){if(!valid(a)||!valid(b)||a.length!==b.length)throw new Error('Mismatched vectors');return a.reduce((s,x,i)=>s+x*b[i],0);}
export function cross(a,b){if(!valid(a)||!valid(b)||a.length!==3||b.length!==3)throw new Error('3D vectors required');return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
export function orientation(a,b,c){if([a,b,c].some(v=>!valid(v)||v.length!==2))throw new Error('2D points required');return (b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);}
export function areaFrame(degrees){if(!Number.isFinite(degrees))throw new Error('Invalid angle');const rad=degrees*Math.PI/180,a=[2,0,0],b=[3*Math.cos(rad),3*Math.sin(rad),0],signed=cross(a,b)[2],cosine=inner(normalize(a),normalize(b));return {a,b,signed,area:Math.abs(signed),triangle:Math.abs(signed)/2,dot:inner(a,b),cosine,unitDistanceSquared:2-2*cosine};}
