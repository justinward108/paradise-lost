import {readdir,mkdir,readFile,writeFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const destination=process.argv[2];
if(!destination)throw new Error('Specify the reviewed platform paradise-engine directory');
for(const pkg of ['sim','content']){
 const source=resolve(root,'packages',pkg,'src'),out=resolve(destination,pkg);await mkdir(out,{recursive:true});
 for(const name of (await readdir(source)).filter(n=>n.endsWith('.ts'))){
  let code=stripTypeScriptTypes(await readFile(resolve(source,name),'utf8'));
  code=code.replaceAll("'@paradise-lost/sim'","'../sim/index.mjs'").replace(/(['"])(\.\.?\/[^'"]+)\.ts\1/g,'$1$2.mjs$1');
  await writeFile(resolve(out,name.replace(/\.ts$/,'.mjs')),code);
 }
}
console.log('Exported simulation and content; run platform world tests before release.');
