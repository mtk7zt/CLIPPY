import { test as base, expect } from '@playwright/test';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createApp } from '../server/app.js';

const test = base.extend({
  backend: async ({}, use) => {
    const directory = await mkdtemp(join(tmpdir(), 'clippy-browser-'));
    const backend = await createApp({ directory });
    const server = backend.app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    const url = `http://127.0.0.1:${server.address().port}`;
    const api = async (path, method='GET', data, headers={}) => {
      const r=await fetch(url+'/api'+path,{method,headers:{'Content-Type':'application/json',...headers},body:data===undefined?undefined:JSON.stringify(data)});
      const body=await r.json();expect(r.ok,JSON.stringify(body)).toBeTruthy();return body.data ?? body;
    };
    await use({...backend,url,api});
    backend.events.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));await rm(directory,{recursive:true,force:true});
  },
});
async function open(page, backend) { await page.goto(backend.url);await expect(page.getByRole('heading',{name:'Device overview'})).toBeVisible();await expect(page.locator('[data-device="local"]')).toBeVisible(); }
async function nav(page,name) { await page.getByRole('navigation',{name:'Primary navigation'}).filter({visible:true}).getByRole('button',{name,exact:true}).click(); }

test('Android service restrictions and receipt stages stay distinct during live updates',async({page,backend})=>{
  const d=await backend.api('/native/devices/register','POST',{name:'Background Android',platform:'android',capabilities:['clipboard']});
  const auth={'X-Clippy-Device-Id':d.device.id,Authorization:`Bearer ${d.deviceToken}`};
  await backend.api(`/pairing/${d.pairing.id}/approve`,'POST',{code:d.pairing.code});
  const status={enabled:true,serviceRunning:true,clipboardAccess:'restricted',state:'active',androidVersion:36};
  await backend.api('/native/sync/status','POST',status,auth);await open(page,backend);
  await expect(page.locator('[data-android-sync]')).toContainText('Background reads restricted');
  await nav(page,'Clipboard');await page.getByLabel('Write a clip').fill('Receipt stages');await page.getByRole('button',{name:'Save clip',exact:true}).click();
  const row=page.locator('.clip-row').filter({hasText:'Receipt stages'});await expect(row).toContainText('Waiting for Android');
  const pending=await backend.api('/native/clipboard/pending','GET',undefined,auth);
  await expect(row).toContainText('Sent to Android');await expect(row).not.toContainText('Acknowledged');
  await backend.api(`/native/clipboard/${pending.find(c=>c.text==='Receipt stages').id}/ack`,'POST',{},auth);
  await expect(row).toContainText('Acknowledged by Android');
  await backend.api('/native/sync/status','POST',{...status,enabled:false,serviceRunning:false,state:'disabled'},auth);
  await expect(page.locator('[data-android-sync]')).toContainText('Sync paused');
  await expect(row).toContainText('Acknowledged by Android');
});

test('dashboard, all views, native pairing, receipts and clipboard actions',async({page,backend})=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',message=>{if(message.type()==='error' && !/status of (400|422)/.test(message.text()))errors.push(message.text());});
  await open(page,backend);await expect(page).toHaveTitle(/Clippy/);await expect(page.locator('body')).not.toContainText('Internal Server Error');
  await page.getByRole('button',{name:'Show development examples'}).click();await expect(page.locator('.toast')).toContainText('No physical device');
  await page.getByLabel('IP address or host').fill('qa-device.local');await page.getByRole('button',{name:'Save host',exact:true}).click();await expect(page.locator('.device-row').filter({hasText:'qa-device.local'})).toBeVisible();
  const registration=await backend.api('/native/devices/register','POST',{name:'QA Android',platform:'android',capabilities:['clipboard']});
  const pairing=page.locator(`[data-pairing="${registration.pairing.id}"]`);
  await expect(pairing).toBeVisible();await pairing.getByLabel('Code shown on Android').fill('xxxx');await pairing.getByRole('button',{name:'Approve and trust'}).click();await expect(page.locator('.toast')).toContainText('does not match');
  await pairing.getByLabel('Code shown on Android').fill(registration.pairing.code);await pairing.getByRole('button',{name:'Approve and trust'}).click();await expect(pairing).toContainText('approved');
  const auth={'X-Clippy-Device-Id':registration.device.id,Authorization:`Bearer ${registration.deviceToken}`};
  await nav(page,'Clipboard');await page.getByLabel('Write a clip').fill('Browser clipboard QA');await page.getByRole('button',{name:'Save clip',exact:true}).click();
  const row=page.locator('.clip-row').filter({hasText:'Browser clipboard QA'});await expect(row).toContainText('Waiting for Android');
  const pending=await backend.api('/native/clipboard/pending','GET',undefined,auth);const clip=pending.find(c=>c.text==='Browser clipboard QA');
  await backend.api(`/native/clipboard/${clip.id}/ack`,'POST',{},auth);await expect(row).toContainText('Acknowledged');
  await page.context().grantPermissions(['clipboard-read','clipboard-write']);await row.getByRole('button',{name:'Copy clip'}).click();expect(await page.evaluate(()=>navigator.clipboard.readText())).toBe('Browser clipboard QA');
  await row.getByRole('button',{name:'Pin',exact:true}).click();await expect(row.getByRole('button',{name:'Unpin'})).toBeVisible();
  const exported=page.waitForEvent('download');await page.getByRole('button',{name:'Export file',exact:true}).click();expect((await exported).suggestedFilename()).toBe('clippy-clipboard.json');
  await row.getByRole('button',{name:'Archive',exact:true}).click();await expect(row).toHaveCount(0);await page.locator('[data-show-archive]').click();await expect(row).toBeVisible();
  await row.getByRole('button',{name:'Delete',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.getByRole('button',{name:'Cancel',exact:true})).toBeFocused();await page.keyboard.press('Escape');await expect(row).toBeVisible();
  await row.getByRole('button',{name:'Delete',exact:true}).click();await page.getByRole('button',{name:'Continue',exact:true}).click();await expect(row).toHaveCount(0);
  for(const name of ['Activity','Notifications','Messages','Settings','About']){await nav(page,name);await expect(page.locator('h1')).toBeVisible();}
  await nav(page,'Devices');await page.locator('[data-device="local"]').getByRole('button',{name:'Details & capabilities'}).click();await expect(page.getByRole('heading',{name:/Device detail/})).toBeVisible();
  expect(errors).toEqual([]);
});

test('file input upload, download bytes, queued cancellation and failed retry',async({page,backend})=>{
  await open(page,backend);await nav(page,'Files');
  const bytes=Buffer.from('Verified browser upload\n'.repeat(10000));
  await page.getByLabel('Upload local file').setInputFiles({name:'qa-upload.txt',mimeType:'text/plain',buffer:bytes});
  const row=page.locator('.file-row').filter({hasText:'qa-upload.txt'});await expect(row).toContainText('Uploaded locally');await expect(row).toContainText('SHA-256');
  const download=await page.request.get(await row.getByRole('link',{name:'Download'}).getAttribute('href').then(p=>backend.url+p));expect(await download.body()).toEqual(bytes);
  const queued=await backend.api('/transfers','POST',{name:'qa-cancel.txt',size:1});
  const cancelled=page.locator('.file-row').filter({hasText:'qa-cancel.txt'});await cancelled.getByRole('button',{name:'Cancel',exact:true}).click();await expect(cancelled).toContainText('cancelled');
  const failed=await backend.api('/transfers','POST',{name:'qa-retry.txt',size:3});
  const wrong=new FormData();wrong.append('file',new Blob(['too long']),'qa-retry.txt');await fetch(backend.url+`/api/transfers/${failed.id}/upload`,{method:'POST',body:wrong});
  const retry=page.locator('.file-row').filter({hasText:'qa-retry.txt'});await expect(retry).toContainText('failed');
  const chooser=page.waitForEvent('filechooser');await retry.getByRole('button',{name:'Retry',exact:true}).click();await (await chooser).setFiles({name:'qa-retry.txt',mimeType:'text/plain',buffer:Buffer.from('yes')});await expect(retry).toContainText('Uploaded locally');
  expect((await backend.api('/transfers')).some(t=>t.status==='delivered')).toBe(false);
});

test('SSE refresh and outage recovery preserve focus, draft, search and scroll',async({page,backend})=>{
  await open(page,backend);await nav(page,'Clipboard');
  await page.getByLabel('Write a clip').fill('Unsubmitted draft');await page.getByLabel('Search clipboard history').fill('design');
  const scroll=await page.locator('.workspace-scroll').evaluate(el=>{el.scrollTop=210;return el.scrollTop;});
  await backend.api('/clipboard','POST',{text:'Design SSE update'});
  await expect(page.locator('.clip-row').filter({hasText:'Design SSE update'})).toHaveCount(1);
  await expect(page.getByLabel('Search clipboard history')).toBeFocused();await expect(page.getByLabel('Write a clip')).toHaveValue('Unsubmitted draft');
  expect(await page.locator('.workspace-scroll').evaluate(el=>el.scrollTop)).toBe(scroll);
  backend.events.close();await expect(page.getByRole('alert')).toContainText('Reconnecting');
  await expect(page.getByRole('alert')).toHaveCount(0,{timeout:15000});
  await expect(page.getByLabel('Search clipboard history')).toHaveValue('design');
  await page.route('**/api/**',route=>route.abort());await page.evaluate(()=>window.dispatchEvent(new Event('offline')));await expect(page.getByRole('alert')).toContainText('offline');
  await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.getByRole('alert')).toContainText('backend unavailable');
  await page.unroute('**/api/**');await page.getByRole('button',{name:'Retry',exact:true}).click();await expect(page.getByRole('alert')).toHaveCount(0);await expect(page.getByLabel('Write a clip')).toHaveValue('Unsubmitted draft');
});

for(const width of [1440,820,390])test(`responsive ${width}, themes and keyboard`,async({page,backend})=>{
  await page.setViewportSize({width,height:900});await open(page,backend);
  expect(await page.locator('.workspace-scroll').evaluate(el=>el.scrollWidth<=el.clientWidth+1)).toBe(true);
  if(width<761)await expect(page.locator('.bottom-nav')).toBeVisible();else await expect(page.locator('.sidebar')).toBeVisible();
  await nav(page,'Settings');await page.getByRole('button',{name:'Frosted Suite',exact:true}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','light');
  await page.getByRole('switch',{name:'Allow clipboard'}).click();await nav(page,'Clipboard');await expect(page.getByText('Permission required: enable clipboard in Settings.')).toBeVisible();await expect(page.getByRole('button',{name:'Save clip',exact:true})).toBeDisabled();
  await nav(page,'Settings');await page.getByRole('switch',{name:'Allow clipboard'}).click();await page.getByRole('button',{name:'Venturis Calm',exact:true}).click();
  await nav(page,'Devices');await page.keyboard.press('Tab');expect(await page.evaluate(()=>document.activeElement.tagName)).not.toBe('BODY');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.screenshot({path:join(tmpdir(),`clippy-web-${width}.png`)});
});

test('real throttled upload progress, active cancellation and drag/drop',async({page,backend})=>{
  await open(page,backend);await nav(page,'Files');
  const cdp=await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:10,downloadThroughput:1024*1024,uploadThroughput:16384});
  await page.getByLabel('Upload local file').setInputFiles({name:'qa-active.txt',mimeType:'text/plain',buffer:Buffer.alloc(512*1024,65)});
  const active=page.locator('.file-row').filter({hasText:'qa-active.txt'});
  await expect(active.getByRole('progressbar')).toBeVisible();
  await expect.poll(()=>active.getByRole('progressbar').getAttribute('value')).not.toBe('0');
  await active.getByRole('button',{name:'Cancel',exact:true}).click();await expect(active).toContainText('cancelled');
  await cdp.send('Network.emulateNetworkConditions',{offline:false,latency:0,downloadThroughput:-1,uploadThroughput:-1});
  const dropped=await page.evaluateHandle(()=>{const data=new DataTransfer();data.items.add(new File(['dragged bytes'],'qa-drop.txt',{type:'text/plain'}));return data;});
  await page.locator('[data-drop-zone]').dispatchEvent('drop',{dataTransfer:dropped});
  await expect(page.locator('.file-row').filter({hasText:'qa-drop.txt'})).toContainText('Uploaded locally');
});
