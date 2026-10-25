import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const pages=[...fs.readdirSync(root).filter(n=>n.endsWith('.html')),...fs.readdirSync(path.join(root,'projects')).filter(n=>n.endsWith('.html')).map(n=>'projects/'+n)];
const problems=[];
for(const file of pages){
 const source=fs.readFileSync(path.join(root,file),'utf8');
 if(/\[(?:Your|FIELD|YEAR)|YOUR NAME|CLASSROOM STARTER|No video is attached/.test(source))problems.push(file+': template placeholder remains');
 for(const match of source.matchAll(/(?:href|src)="([^"]+)"/g)){
  const url=match[1].replaceAll('&amp;','&');
  if(/^(https?:|mailto:|data:)/i.test(url))continue;
  const [partWithQuery,anchor]=url.split('#');
  const part=partWithQuery.split('?')[0];
  const target=part?path.resolve(root,path.dirname(file),decodeURIComponent(part)):path.join(root,file);
  if(!fs.existsSync(target)){problems.push(file+': missing '+url);continue;}
  if(anchor&&target.endsWith('.html')){
   const text=fs.readFileSync(target,'utf8');
   if(!text.includes('id="'+anchor+'"'))problems.push(file+': missing anchor '+url);
  }
 }
}
new vm.Script(fs.readFileSync(path.join(root,'script.js'),'utf8'),{filename:'script.js'});
if(problems.length){console.error(problems.join('\n'));process.exitCode=1;}
else console.log(`Checked ${pages.length} pages: local links, images, anchors, template text, JavaScript syntax.`);
