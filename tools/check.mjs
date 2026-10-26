import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const englishPages=[...fs.readdirSync(root).filter(n=>n.endsWith('.html')),...fs.readdirSync(path.join(root,'projects')).filter(n=>n.endsWith('.html')).map(n=>'projects/'+n)];
const pages=englishPages.flatMap(file=>[file,'zh/'+file,'fr/'+file]);
const problems=[];
for(const file of pages){
 const source=fs.readFileSync(path.join(root,file),'utf8');
 const language=file.startsWith('zh/')?'zh-Hans':file.startsWith('fr/')?'fr':'en';
 if(!source.includes('<html lang="'+language+'"'))problems.push(file+': incorrect document language');
 const selector=source.match(/<div class="language-switch"[^>]*>(.*?)<\/div>/s)?.[1]||'';
 const choices=[...selector.matchAll(/<a\b([^>]+)>/g)];
 if(choices.length!==3)problems.push(file+': missing language choices');
 if(choices.filter(choice=>choice[1].includes('aria-current="page"')).length!==1)problems.push(file+': current language must be unique');
 for(const choice of choices){
  const lang=choice[1].match(/data-language="([^"]+)"/)?.[1];
  const href=choice[1].match(/href="([^"]+)"/)?.[1].split('?')[0];
  const original=file.replace(/^(?:zh|fr)\//,'');
  const expected=path.join(root,lang==='en'?original:(lang==='zh-Hans'?'zh/':'fr/')+original);
  if(!href||path.resolve(root,path.dirname(file),href)!==expected)problems.push(file+': language switch changes page');
  if(choice[1].includes('aria-current="page"')&&lang!==language)problems.push(file+': wrong current language');
 }
 if(file.endsWith('projects/computing-footprint.html')&&/himcm|midmcm|15694|竞赛|concours/i.test(source))problems.push(file+': unwanted project context');
 const content=source.replace(/<div class="language-switch"[^>]*>.*?<\/div>/s,'');
 for(const match of content.matchAll(/href="([^"#]+\.html)(?:\?[^"]*)?(?:#[^"]*)?"/g)){
  if(/^https?:/.test(match[1]))continue;
  const target=path.relative(root,path.resolve(root,path.dirname(file),match[1]));
  const targetLanguage=target.startsWith('zh/')?'zh-Hans':target.startsWith('fr/')?'fr':'en';
  if(targetLanguage!==language)problems.push(file+': internal navigation loses the selected language');
 }
 if(/\[(?:Your|FIELD|YEAR)|YOUR NAME|CLASSROOM STARTER|No video is attached/.test(source))problems.push(file+': template placeholder remains');
 for(const match of source.matchAll(/(?:href|src|data-preview-image)="([^"]+)"/g)){
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
new vm.Script(fs.readFileSync(path.join(root,'language-preference.js'),'utf8'),{filename:'language-preference.js'});
if(problems.length){console.error(problems.join('\n'));process.exitCode=1;}
else console.log(`Checked ${pages.length} pages: language routes, document languages, local links, images, anchors, template text, JavaScript syntax.`);
