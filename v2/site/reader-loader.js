// Keep cached HTML synchronous, but give cached and network failures the same
// recovery path. Only the latest request may change a connected reading pane.
export function createReaderLoader({isConnected,onLoading,onReady,onError}){
  let revision=0;
  const current=id=>id===revision&&isConnected();
  return function load(read){
    const id=++revision;
    const fail=error=>{if(current(id))onError(error);};
    const ready=html=>{if(current(id)){try{onReady(html);}catch(error){fail(error);}}};
    try{
      const content=read();
      if(content&&typeof content.then==='function'){
        if(current(id))onLoading();
        return Promise.resolve(content).then(ready,fail);
      }
      ready(content);
    }catch(error){fail(error);}
  };
}
