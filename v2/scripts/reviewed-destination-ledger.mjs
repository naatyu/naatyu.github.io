// Structural reconciliation only. A rendered anchor does not prove coverage.
export function auditReviewedDestinationLedger(plan, reviewed, pages) {
  const errors=[];
  let valid=0;
  const sources=new Map();
  const entries=new Map();
  const report=(source,reason)=>errors.push({source,reason});
  for(const source of plan.sourceLedger){
    if(sources.has(source.source))report(source.source,'duplicate source ledger identity');
    sources.set(source.source,source);
  }
  for(const entry of reviewed.entries){
    if(entries.has(entry.source))report(entry.source,'duplicate reviewed identity');
    entries.set(entry.source,entry);
    const source=sources.get(entry.source);
    if(!source||!source.publicBody)report(entry.source,'reviewed identity is not a retained source');
  }
  for(const source of plan.sourceLedger){
    if(!source.publicBody){
      if(Object.hasOwn(source,'reviewedPrimaryDestination'))report(source.source,'retired source has a content-preserving destination');
      continue;
    }
    const before=errors.length;
    const entry=entries.get(source.source);
    if(!entry)report(source.source,'retained source lacks private route review');
    else {
      if(source.sha256!==entry.sha256||source.originalRoute!==entry.originalRoute)report(source.source,'reviewed source identity or fingerprint differs');
      if(source.reviewedPrimaryDestination!==entry.destination)report(source.source,'reviewed destination differs from private route review');
    }
    const destination=source.reviewedPrimaryDestination;
    const match=typeof destination==='string'&&destination.match(/^\/atlas\/([^?#]+)#([^?#]+)$/);
    if(!match)report(source.source,'reviewed destination must name an atlas section');
    else if(!pages.get(match[1])?.ids.has(match[2]))report(source.source,'reviewed destination section is not rendered');
    if(errors.length===before)valid++;
  }
  return {validReviewedPrimaryDestinations:valid,reviewedPrimaryDestinationErrors:errors};
}
