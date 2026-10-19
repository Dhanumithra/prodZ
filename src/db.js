// Tiny IndexedDB key-value store: durable, async, zero dependencies.
let db;
const open=()=>db??=new Promise((ok,no)=>{const r=indexedDB.open('prodz',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
export const get=k=>open().then(d=>new Promise(ok=>{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>ok(q.result);q.onerror=()=>ok()})).catch(()=>{});
export const set=(k,v)=>open().then(d=>new Promise(ok=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=t.onerror=()=>ok()})).catch(()=>{});
