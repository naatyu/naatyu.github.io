import path from 'node:path';
export function previewPath(relative,prototypeRoot,imageRoot){
  const image=relative.startsWith('img/'),root=image?imageRoot:prototypeRoot;
  const target=path.resolve(root,image?relative.slice(4):relative);
  return target.startsWith(path.resolve(root)+path.sep)?target:null;
}
