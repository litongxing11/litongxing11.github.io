import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync(new URL('../language-preference.js',import.meta.url),'utf8');
function visit(url,preferred,{blocked=false,base='https://example.com/'}={}){
 const state={redirect:null,preferred,enhanced:false};
 const context={URL,document:{currentScript:{src:base+'language-preference.js?v=test'},documentElement:{classList:{add(){state.enhanced=true;}}}},window:{location:{href:url,replace(value){state.redirect=value;}}},localStorage:{getItem(){if(blocked)throw new Error('Storage unavailable');return state.preferred;},setItem(key,value){if(blocked)throw new Error('Storage unavailable');state.preferred=value;}}};
 vm.runInNewContext(source,context);
 return state;
}
assert.equal(visit('https://example.com/',null).redirect,null);
assert.equal(visit('https://example.com/projects/computing-footprint.html?v=2#findings-title','fr').redirect,'https://example.com/fr/projects/computing-footprint.html?v=2#findings-title');
assert.equal(visit('https://example.com/','zh-Hans').redirect,'https://example.com/zh/index.html');
assert.equal(visit('https://example.com/index.html','en').redirect,null);
const chinese=visit('https://example.com/zh/projects/differential-privacy.html','fr');
assert.equal(chinese.redirect,null);
assert.equal(chinese.preferred,'zh-Hans');
const french=visit('https://example.com/fr/index.html','zh-Hans');
assert.equal(french.redirect,null);
assert.equal(french.preferred,'fr');
assert.equal(visit('https://example.com/index.html','fr',{blocked:true}).redirect,null);
assert.equal(visit('https://example.com/assets/documents/paper.pdf','fr').redirect,null);
assert.equal(visit('https://example.com/portfolio/projects/medicine-ai.html','fr',{base:'https://example.com/portfolio/'}).redirect,'https://example.com/portfolio/fr/projects/medicine-ai.html');
assert.equal(visit('https://example.com/index.html','unknown').redirect,null);
console.log('Verified remembered languages, explicit choices, project anchors, blocked storage, document URLs, and preview subdirectories.');
