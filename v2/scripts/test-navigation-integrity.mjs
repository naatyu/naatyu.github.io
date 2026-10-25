import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parse} from 'acorn';
const path=new URL('../prototypes/reviewed-navigation.js',import.meta.url);
const tree=parse(readFileSync(path,'utf8'),{ecmaVersion:'latest',sourceType:'module'});
let checked=0;
function uniqueKeys(object,owner){
  assert.equal(object.type,'ObjectExpression',owner);
  const seen=new Set();
  for(const property of object.properties){
    assert.equal(property.type,'Property',owner+' must use explicit entries');
    assert(!property.computed,owner+' must not compute identities');
    const key=property.key.type==='Literal'?String(property.key.value):property.key.name;
    assert(!seen.has(key),owner+' duplicates '+key);
    seen.add(key);checked++;
    if(property.value.type==='ObjectExpression')uniqueKeys(property.value,owner+'/'+key);
  }
}
for(const statement of tree.body){const declaration=statement.type==='ExportNamedDeclaration'?statement.declaration:statement;if(declaration?.type==='VariableDeclaration')for(const d of declaration.declarations)if(['reviewedNavigation','reviewedFragments'].includes(d.id.name))uniqueKeys(d.init,d.id.name);}
console.log('Reviewed navigation: '+checked+' explicit keys have no duplicate route, fragment or destination fields.');
