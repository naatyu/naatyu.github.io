import {resolveReviewedNote} from './reviewed-navigation.js';

export function readerDestination(value,fragment=''){
  const [slug,...parts]=String(value||'').split('#');
  return resolveReviewedNote(value,fragment)||{slug,anchor:parts.length?parts.join('#'):fragment.replace(/^#/,'')};
}

export function directionURL(view,extra,design,state,metas){
  const destination=extra.slug?readerDestination(extra.slug):null;
  if(destination){
    const reviewed=resolveReviewedNote(extra.slug);
    extra={...extra,slug:destination.slug,...(reviewed?{path:metas.find(n=>n.slug===destination.slug).topicPath}:{})};
  }
  if(design==='desk'&&view==='reader'){
    view='atlas';extra={path:state.path,collection:state.collection,q:state.q,...extra};
  }
  const params=new URLSearchParams({design,view});
  if(extra.path?.length)params.set('path',extra.path.join('/'));
  for(const key of ['slug','collection','q'])if(extra[key])params.set(key,extra[key]);
  return `directions.html?${params}${destination?.anchor?'#'+encodeURIComponent(destination.anchor):''}`;
}
