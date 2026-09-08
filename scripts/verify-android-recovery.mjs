// Runs against an explicitly selected, already-paired QA store. Never resets credentials.
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createApp } from '../server/app.js';
const [adb, directory, serial = 'emulator-5554'] = process.argv.slice(2);
if (!adb || !directory) throw new Error('Usage: node scripts/verify-android-recovery.mjs ADB QA_STORE [SERIAL]');
let backend, server, holdPublish=false;
async function start() {
  backend = await createApp({ directory });
  server=createServer((req,res)=>{
    if(holdPublish&&req.method==='POST'&&req.url==='/api/native/clipboard/publish'){
      req.resume();res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:{code:'QA_TEMPORARY_OUTAGE',message:'Temporary QA transport interruption',details:{}}}));return;
    }
    backend.app(req,res);
  }).listen(4173,'0.0.0.0');
  await new Promise((resolve, reject) => {server.once('listening', resolve);server.once('error', reject);});
  server.on('request',(req,res)=>{const begin=Date.now();res.on('finish',()=>{if(res.statusCode>=400||Date.now()-begin>1000)console.log('HOST response:',req.method,req.url.split('?')[0],res.statusCode,Date.now()-begin+'ms');});});
}
async function stop() { backend.events.close();server.closeAllConnections();await new Promise(resolve => server.close(resolve)); }
async function instrument(mode){
const child=spawn(adb,['-s',serial,'shell','am','instrument','-w','-e','serverUrl','http://10.0.2.2:4173','-e',mode,'true','dev.venturis.clippy.test/dev.venturis.clippy.ClipboardFlowTest']);
let output='', restart=Promise.resolve(), restarted=false;
child.stdout.on('data',chunk=>{
  const text=chunk.toString();process.stdout.write(text);output+=text;
  if(output.includes('HOLD_PUBLISH_FOR_PROCESS_RESTART'))holdPublish=true;
  if(!restarted&&output.includes('RESTART_BACKEND_NOW')){
    restarted=true;restart=(async()=>{await stop();await new Promise(r=>setTimeout(r,3000));await start();console.log('HOST: same-store backend restarted');})();
  }
});
child.stderr.pipe(process.stderr);
const timeout=setTimeout(()=>child.kill(),540000);
try {
  const code=await new Promise((resolve,reject)=>{child.once('exit',resolve);child.once('error',reject);});await restart;
  if(code!==0 || /FAIL|INSTRUMENTATION_FAILED/.test(output) || !output.includes('OK (')) throw new Error('Android recovery failed; see metadata-only output above.');
} finally {clearTimeout(timeout);}
}
await start();
try{
  await instrument('recovery');
  // Instrumentation completion terminates the target process. The next run reloads real encrypted state.
  holdPublish=false;await instrument('resumeOutbox');
}finally{await stop();}
