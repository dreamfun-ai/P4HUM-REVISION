const PAGES = window.PAGE_DATA;
let zoomMode = localStorage.getItem('sister_p4_hum_u6_zoom') || 'fit';
let pdfHeightMode = localStorage.getItem('sister_p4_hum_u6_pdf_height') || 'medium';
let user = localStorage.getItem('revision_portal_current_user') || 'sister';
let idx = 0, view = 'all', typeFilter = 'all';
const $ = id => document.getElementById(id);
function key(){ return 'progress_sister_p4_hum_u6_' + user; }
function load(){ try{return JSON.parse(localStorage.getItem(key())||'{}')}catch(e){return{}} }
function save(p){ localStorage.setItem(key(), JSON.stringify(p)); }
function pageId(pg){ return 'page_' + pg.page; }
function getState(pg){ return load()[pageId(pg)] || {}; }
function setState(pg,s){ let p=load(); p[pageId(pg)]={...(p[pageId(pg)]||{}),...s,ts:new Date().toISOString()}; p.last=pageId(pg); save(p); }
function normArr(a){ return [...(a||[])].map(String).filter(Boolean).sort().join('|'); }
function activePages(){ return PAGES.filter(p=>p.exercises&&p.exercises.length); }
function filtered(){ let arr=PAGES.slice(), p=load(); if(view==='wrong') arr=arr.filter(pg=>p[pageId(pg)]?.correct===false); if(view==='unfinished') arr=arr.filter(pg=>pg.exercises?.length&&!p[pageId(pg)]); if(typeFilter!=='all') arr=arr.filter(pg=>pg.typeLabel===typeFilter); return arr.length?arr:PAGES; }
function currentArray(){ return filtered(); }
function current(){ let arr=currentArray(); if(idx>=arr.length) idx=0; return arr[idx]; }
function initTypes(){ let types=['all',...new Set(PAGES.map(p=>p.typeLabel).filter(Boolean))]; $('typeFilter').innerHTML=types.map(t=>`<option value="${t}">${t==='all'?'全部題型':t}</option>`).join(''); }
function shortType(t){ return (t||'').replace('題','').replace('看圖','圖'); }
function renderGrid(){ let p=load(), arr=currentArray(), active=activePages(), done=active.filter(pg=>p[pageId(pg)]).length, wrong=active.filter(pg=>p[pageId(pg)]?.correct===false).length; $('stats').innerHTML=`全部 ${PAGES.length} 頁｜需作答 ${active.length} 頁｜已做 ${done} 頁｜錯題 ${wrong} 頁`; $('grid').innerHTML=arr.map((pg,i)=>{ let s=p[pageId(pg)], cls=!pg.exercises?.length?'skip':(s?(s.correct===true?'ok':s.correct===false?'bad':'open'):''), mark=!pg.exercises?.length?'—':(s?(s.correct===true?'✅':s.correct===false?'❌':'✍️'):'⬜'); return `<button class="qcell ${cls} ${i===idx?'active':''}" onclick="idx=${i};render()">${mark}<br>P${pg.page}<br>${shortType(pg.typeLabel)}</button>` }).join(''); }
function render(){ applyZoom(); let pg=current(); $('qTitle').textContent=`PDF 第 ${pg.page} 頁`; $('qMeta').textContent=`${pg.typeLabel||'其他頁'}｜本頁 ${pg.exercises?.length||0} 題`; $('pageImg').src=`pages/page-${String(pg.page).padStart(3,'0')}.jpg`; $('pageImg').onload=()=>renderMasks(pg.page); renderMasks(pg.page); renderLast(pg); renderAnswer(pg); $('feedback').style.display='none'; renderGrid(); }
function renderLast(pg){ let s=getState(pg); if(!s.ts){ $('lastState').textContent=pg.exercises?.length?'尚未作答':'本頁不用作答'; return; } let mark=s.correct===true?'✅ 上次答對':s.correct===false?'❌ 上次答錯':'✍️ 已作答／待自評'; $('lastState').textContent=`${mark}｜${new Date(s.ts).toLocaleString()}`; }
function renderAnswer(pg){ if(!pg.exercises||!pg.exercises.length){ $('pageNotice').innerHTML='本頁題型暫不做互動答題，可只作閱讀。'; $('answerArea').innerHTML=''; return; } $('pageNotice').innerHTML='完成本頁後按「提交本頁」。選擇題及選項式題型會自動判分；簡答／問答等會顯示參考答案，請自行標記掌握程度。'; $('answerArea').innerHTML=pg.exercises.map((ex,ei)=>renderExercise(ex,ei)).join(''); }
function esc(s){ return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }
function renderMasks(pageNum){ const layer=$('maskLayer'); if(!layer) return; const masks=(window.PAGE_MASKS||{})[String(pageNum)] || (window.PAGE_MASKS||{})[pageNum] || []; layer.innerHTML=masks.map(m=>`<div class="answerMask" style="left:${m.x}%;top:${m.y}%;width:${m.w}%;height:${m.h}%"></div>`).join(''); }

function cleanRef(ref){ return String(ref||'').replace(/\[--|--\]/g,'').replace(/^答案[:：]?/,'').trim(); }
function splitVals(val){ return String(val||'').replace(/。$/,'').replace(/[（）()][^（）()]*[）)]/g,'').split(/[、,，\/／或]+/).map(x=>x.trim()).filter(Boolean); }
function parseRefMap(ref){
  ref=cleanRef(ref);
  const map={}; let m;
  const re=/(\d+|[A-Z])\s*[\.．、]\s*([^；;]+)/g;
  while((m=re.exec(ref))){ map[m[1]]=splitVals(m[2]); }
  if(Object.keys(map).length) return map;
  if(/[A-Z]\s*[→>]/.test(ref)) return {__order: ref.match(/[A-Z]/g)||[]};
  return {};
}
function optionKeysFromQuestion(q, fallback){ const keys=[...String(q||'').matchAll(/(?:^|\s)([A-Z])\s*[\.．]/g)].map(m=>m[1]); const uniq=[...new Set(keys)]; return uniq.length?uniq:(fallback||['A','B','C','D']); }
function numberedKeysFromQuestion(q, fallback){ const keys=[...String(q||'').matchAll(/(?:^|\s)(\d+)\s*[\.．]/g)].map(m=>m[1]); const uniq=[...new Set(keys)].filter(x=>Number(x)<30); return uniq.length?uniq:(fallback||[]); }
function exLabel(ex){ return String(ex.typeLabel || (current&&current().typeLabel) || ''); }
function isCloze(ex){ return /供詞填充/.test(exLabel(ex)); }
function isPair(ex){ return /配對/.test(exLabel(ex)); }
function isClassify(ex){ return /分類/.test(exLabel(ex)); }
function isOrder(ex){ return /排序/.test(exLabel(ex)); }
function isLookTf(ex){ return /看圖判斷/.test(exLabel(ex)); }
function isOpenText(ex){ return /簡答|問答|生活情境|個案分析/.test(exLabel(ex)); }
function isStructured(ex){ return isCloze(ex)||isPair(ex)||isClassify(ex)||isOrder(ex)||isLookTf(ex); }
function getWordBank(ex, map){
  let q=String(ex.question||'');
  let before = q.split(/\b1\s*[\.．、]/)[0];
  let words = before.split(/\s+/).map(x=>x.trim()).filter(x=>x && x.length>1 && !/^H4b/.test(x));
  Object.values(map||{}).flat().forEach(v=>{ if(v && !words.includes(v)) words.push(v); });
  return [...new Set(words)];
}
function renderCloze(ex,ei){
  const map=parseRefMap(ex.reference); const bank=getWordBank(ex,map);
  const keys=Object.keys(map).filter(k=>/^\d+$/.test(k));
  if(!keys.length) return `<textarea class="openAns" data-kind="open" data-e="${ei}" placeholder="在這裏輸入答案。提交後會顯示參考答案，自行核對。"></textarea>`;
  return keys.map(n=>{ const slots=Math.max(1,(map[n]||[]).length); const selects=Array.from({length:slots},(_,j)=>`<select data-kind="cloze" data-e="${ei}" data-n="${n}" data-slot="${j}"><option value="">請選擇</option>${bank.map(w=>`<option value="${esc(w)}">${esc(w)}</option>`).join('')}</select>`).join(' '); return `<div class="subrow"><b>第 ${n} 題／空：</b>${selects}</div>`; }).join('');
}
function renderPair(ex,ei){
  const map=parseRefMap(ex.reference); const nKeys=Object.keys(map).filter(k=>/^\d+$/.test(k)); const optKeys=optionKeysFromQuestion(ex.question, [...new Set(Object.values(map).flat())].filter(x=>/^[A-Z]$/.test(x)));
  return nKeys.map(n=>{ const multi=(map[n]||[]).length>1; const input=multi?'checkbox':'radio'; return `<div class="subrow"><b>${n}：</b>${optKeys.map(k=>`<label class="miniChoice"><input type="${input}" name="pair_${ei}_${n}" data-kind="pair" data-e="${ei}" data-n="${n}" value="${k}">${k}</label>`).join('')}</div>`; }).join('');
}
function renderClassify(ex,ei){
  const map=parseRefMap(ex.reference); const catKeys=Object.keys(map).filter(k=>/^\d+$/.test(k)); const optKeys=optionKeysFromQuestion(ex.question, [...new Set(Object.values(map).flat())].filter(x=>/^[A-Z]$/.test(x)));
  if(!catKeys.length) return renderPair(ex,ei);
  return optKeys.map(k=>`<div class="subrow"><b>${k} 分到：</b><select data-kind="classify" data-e="${ei}" data-opt="${k}"><option value="">請選擇分類</option>${catKeys.map(c=>`<option value="${c}">${c}</option>`).join('')}</select></div>`).join('');
}
function renderOrder(ex,ei){
  const map=parseRefMap(ex.reference);
  if(map.__order){ const keys=optionKeysFromQuestion(ex.question,map.__order); const len=map.__order.length; return Array.from({length:len},(_,i)=>`<div class="subrow"><b>第 ${i+1} 位：</b><select data-kind="orderSeq" data-e="${ei}" data-pos="${i}"><option value="">請選擇</option>${keys.map(k=>`<option value="${k}">${k}</option>`).join('')}</select></div>`).join(''); }
  const optKeys=Object.keys(map).filter(k=>/^[A-Z]$/.test(k));
  if(optKeys.length){ const max=Math.max(...Object.values(map).flat().map(x=>parseInt(x,10)).filter(Boolean), optKeys.length); return optKeys.map(k=>`<div class="subrow"><b>${k} 是第幾？</b><select data-kind="orderMap" data-e="${ei}" data-opt="${k}"><option value="">請選擇</option>${Array.from({length:max},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('')}</select></div>`).join(''); }
  const ref=Object.values(map).flat(); const keys=optionKeysFromQuestion(ex.question,ref); const len=ref.length||keys.length; return Array.from({length:len},(_,i)=>`<div class="subrow"><b>第 ${i+1} 位：</b><select data-kind="orderSeq" data-e="${ei}" data-pos="${i}"><option value="">請選擇</option>${keys.map(k=>`<option value="${k}">${k}</option>`).join('')}</select></div>`).join('');
}
function tfValFromSymbol(s){ s=String(s||''); if(/[✓✔√對]/.test(s)) return 'true'; if(/[✗✘×錯]/.test(s)) return 'false'; return ''; }
function renderLookTf(ex,ei){
  const map=parseRefMap(ex.reference); const keys=Object.keys(map).filter(k=>/^[A-Z]$/.test(k)); const optKeys=keys.length?keys:optionKeysFromQuestion(ex.question,['A','B','C','D']);
  return optKeys.map(k=>`<div class="subrow"><b>${k}：</b><label class="miniChoice"><input type="radio" name="tf_${ei}_${k}" data-kind="tfmulti" data-e="${ei}" data-opt="${k}" value="true">✅ 對</label><label class="miniChoice"><input type="radio" name="tf_${ei}_${k}" data-kind="tfmulti" data-e="${ei}" data-opt="${k}" value="false">❌ 錯</label></div>`).join('');
}
function renderExercise(ex,ei){
  let html=`<div class="exercise"><h3>${ei+1}. ${ex.id}｜${ex.typeLabel}</h3>`;
  if(ex.question) html+=`<div class="qtext">${esc(ex.question)}</div>`;
  if(ex.type==='choice' && ex.options && ex.options.length){ const inputType=ex.multi?'checkbox':'radio'; html+=ex.options.map(o=>`<label class="choice"><input type="${inputType}" name="choice_${ei}" data-kind="choice" data-e="${ei}" value="${o.key}"><b>${o.key}.</b> ${esc(o.text)}</label>`).join(''); }
  else if(isCloze(ex)){ html+=renderCloze(ex,ei); }
  else if(isClassify(ex)){ html+=renderClassify(ex,ei); }
  else if(isPair(ex)){ html+=renderPair(ex,ei); }
  else if(isOrder(ex)){ html+=renderOrder(ex,ei); }
  else if(isLookTf(ex) || ex.type==='tf_single'){ html+=renderLookTf(ex,ei); }
  else { html+=`<textarea class="openAns" data-kind="open" data-e="${ei}" placeholder="在這裏輸入答案。提交後會顯示參考答案，自行核對。"></textarea>`; }
  return html+'</div>';
}
function collectExercise(ex,ei){
  if(ex.type==='choice' && ex.options && ex.options.length) return [...document.querySelectorAll(`[data-kind="choice"][data-e="${ei}"]:checked`)].map(x=>x.value);
  if(isCloze(ex)){ const out={}; document.querySelectorAll(`[data-kind="cloze"][data-e="${ei}"]`).forEach(el=>{ (out[el.dataset.n]||(out[el.dataset.n]=[]))[Number(el.dataset.slot)]=el.value; }); return out; }
  if(isPair(ex)){ const out={}; document.querySelectorAll(`[data-kind="pair"][data-e="${ei}"]:checked`).forEach(el=>{ (out[el.dataset.n]||(out[el.dataset.n]=[])).push(el.value); }); return out; }
  if(isClassify(ex)){ const out={}; document.querySelectorAll(`[data-kind="classify"][data-e="${ei}"]`).forEach(el=>{ if(el.value) (out[el.value]||(out[el.value]=[])).push(el.dataset.opt); }); return out; }
  if(isOrder(ex)){ let a=[...document.querySelectorAll(`[data-kind="orderSeq"][data-e="${ei}"]`)].sort((x,y)=>Number(x.dataset.pos)-Number(y.dataset.pos)).map(el=>el.value); if(a.length) return {__order:a}; const out={}; document.querySelectorAll(`[data-kind="orderMap"][data-e="${ei}"]`).forEach(el=>{out[el.dataset.opt]=[el.value]}); return out; }
  if(isLookTf(ex) || ex.type==='tf_single'){ const out={}; document.querySelectorAll(`[data-kind="tfmulti"][data-e="${ei}"]:checked`).forEach(el=>{out[el.dataset.opt]=[el.value]}); return out; }
  let x=document.querySelector(`[data-kind="open"][data-e="${ei}"]`); return x?x.value.trim():'';
}
function checkExercise(ex,ans){
  if(ex.type==='choice' && ex.options && ex.options.length) return normArr(ans)===normArr(ex.answer||[]);
  if(isCloze(ex)){ const ref=parseRefMap(ex.reference); const keys=Object.keys(ref).filter(k=>/^\d+$/.test(k)); if(!keys.length) return null; return keys.every(k=>normArr((ans&&ans[k])||[])===normArr(ref[k]||[])); }
  if(isPair(ex) || isClassify(ex)){ const ref=parseRefMap(ex.reference); const keys=Object.keys(ref).filter(k=>/^\d+$/.test(k)); if(!keys.length) return null; return keys.every(k=>normArr((ans&&ans[k])||[])===normArr(ref[k]||[])); }
  if(isOrder(ex)){ const ref=parseRefMap(ex.reference); if(ref.__order) return ((ans&&ans.__order)||[]).join('|')===ref.__order.join('|'); const optKeys=Object.keys(ref).filter(k=>/^[A-Z]$/.test(k)); if(optKeys.length) return optKeys.every(k=>normArr((ans&&ans[k])||[])===normArr(ref[k]||[])); return null; }
  if(isLookTf(ex) || ex.type==='tf_single'){ const ref=parseRefMap(ex.reference); const keys=Object.keys(ref).filter(k=>/^[A-Z]$/.test(k)); if(!keys.length) return null; return keys.every(k=>((ans&&ans[k]&&ans[k][0])||'')===tfValFromSymbol((ref[k]||[])[0])); }
  return null;
}

function isExerciseAnswered(ex, ei){
  if(ex.type==='choice' && ex.options && ex.options.length){
    return document.querySelectorAll(`[data-kind="choice"][data-e="${ei}"]:checked`).length > 0;
  }
  if(isCloze(ex)){
    const els=[...document.querySelectorAll(`[data-kind="cloze"][data-e="${ei}"]`)];
    if(!els.length){
      const t=document.querySelector(`[data-kind="open"][data-e="${ei}"]`);
      return !!(t && t.value.trim());
    }
    return els.every(el=>String(el.value||'').trim() !== '');
  }
  if(isPair(ex)){
    const map=parseRefMap(ex.reference);
    const nKeys=Object.keys(map).filter(k=>/^\d+$/.test(k));
    if(!nKeys.length){
      const t=document.querySelector(`[data-kind="open"][data-e="${ei}"]`);
      return !!(t && t.value.trim());
    }
    return nKeys.every(n=>document.querySelectorAll(`[data-kind="pair"][data-e="${ei}"][data-n="${n}"]:checked`).length > 0);
  }
  if(isClassify(ex)){
    const els=[...document.querySelectorAll(`[data-kind="classify"][data-e="${ei}"]`)];
    if(!els.length) return isExerciseAnswered({...ex, typeLabel:'配對題'}, ei);
    return els.every(el=>String(el.value||'').trim() !== '');
  }
  if(isOrder(ex)){
    const seq=[...document.querySelectorAll(`[data-kind="orderSeq"][data-e="${ei}"]`)];
    if(seq.length){
      const vals=seq.map(el=>String(el.value||'').trim());
      return vals.every(Boolean) && new Set(vals).size === vals.length;
    }
    const mapEls=[...document.querySelectorAll(`[data-kind="orderMap"][data-e="${ei}"]`)];
    if(mapEls.length){
      const vals=mapEls.map(el=>String(el.value||'').trim());
      return vals.every(Boolean) && new Set(vals).size === vals.length;
    }
    const t=document.querySelector(`[data-kind="open"][data-e="${ei}"]`);
    return !!(t && t.value.trim());
  }
  if(isLookTf(ex) || ex.type==='tf_single'){
    const map=parseRefMap(ex.reference);
    const keys=Object.keys(map).filter(k=>/^[A-Z]$/.test(k));
    const optKeys=keys.length?keys:optionKeysFromQuestion(ex.question,['A','B','C','D']);
    return optKeys.every(k=>document.querySelector(`[data-kind="tfmulti"][data-e="${ei}"][data-opt="${k}"]:checked`));
  }
  const t=document.querySelector(`[data-kind="open"][data-e="${ei}"]`);
  return !!(t && t.value.trim());
}
function incompleteList(pg){
  const missing=[];
  (pg.exercises||[]).forEach((ex,ei)=>{ if(!isExerciseAnswered(ex,ei)) missing.push(`第 ${ei+1} 題`); });
  return missing;
}

function ansText(ex){ if(ex.type==='choice') return (ex.answer||[]).join('、')+(ex.reference?`｜${ex.reference}`:''); if(isLookTf(ex)||ex.type==='tf_single') return ex.reference||'請參考 PDF 原答案'; return ex.reference||'請參考 PDF 原答案'; }
function submit(){ let pg=current(); if(!pg.exercises?.length){ feedback('info','本頁不用作答。'); return; } let missing=incompleteList(pg); if(missing.length){ feedback('bad',`<b>請先完成本頁所有題目，才可以提交。</b><br>尚未完成：${missing.join('、')}<br><small>完成後再按「提交本頁」，才會顯示參考答案。</small>`); return; } let results=[], anyOpen=false, allAutoCorrect=true, answers={}; pg.exercises.forEach((ex,ei)=>{ let ans=collectExercise(ex,ei); answers[ex.id]=ans; let ok=checkExercise(ex,ans); if(ok===null){ anyOpen=true; results.push({ex,ok:null}); }else{ if(!ok) allAutoCorrect=false; results.push({ex,ok}); } }); let finalCorrect=anyOpen?null:allAutoCorrect; setState(pg,{answered:true,correct:finalCorrect,answers}); let html=''; html+=anyOpen?'<b>已記錄本頁作答。請對照參考答案後自行標記。</b>':(finalCorrect?'<b>✅ 本頁全部答對！</b>':'<b>❌ 本頁有題目未答對。</b>'); results.forEach((r,i)=>{ html+=`<div class="ref"><b>${i+1}. ${r.ex.id}</b>${r.ok===true?' ✅':r.ok===false?' ❌':''}<br><b>參考答案：</b>${esc(ansText(r.ex))}</div>`; }); if(anyOpen) html+=`<div class="actions"><button onclick="markOpen(true)">本頁我答對了 ✅</button><button onclick="markOpen(false)">本頁我未掌握 ❌</button></div>`; feedback(finalCorrect===true?'ok':finalCorrect===false?'bad':'info',html); renderGrid(); renderLast(pg); }
function markOpen(v){ let pg=current(); setState(pg,{correct:v}); feedback(v?'ok':'bad',v?'✅ 已標記本頁答對':'❌ 已加入錯題重溫'); renderGrid(); renderLast(pg); }
function feedback(cls,html){ let f=$('feedback'); f.className='feedback '+cls; f.innerHTML=html; f.style.display='block'; }
$('submitBtn').onclick=submit;
$('clearBtn').onclick=()=>{ let pg=current(),p=load(); delete p[pageId(pg)]; save(p); render(); };
$('nextBtn').onclick=()=>{ idx=Math.min(idx+1,currentArray().length-1); render(); };
$('prevBtn').onclick=()=>{ idx=Math.max(idx-1,0); render(); };
$('btnAll').onclick=()=>{ view='all'; idx=0; render(); };
$('btnWrong').onclick=()=>{ view='wrong'; idx=0; render(); };
$('btnUnfinished').onclick=()=>{ view='unfinished'; idx=0; render(); };
$('btnContinue').onclick=()=>{ let p=load(), id=p.last; view='all'; typeFilter='all'; $('typeFilter').value='all'; let pos=PAGES.findIndex(pg=>pageId(pg)===id); idx=pos>=0?pos:0; render(); };
$('userSelect').value=user; $('userSelect').onchange=e=>{ user=e.target.value; localStorage.setItem('revision_portal_current_user',user); idx=0; render(); };
$('typeFilter').onchange=e=>{ typeFilter=e.target.value; idx=0; render(); };
function applyZoom(){ const viewer=$('viewer'); if(!viewer) return; viewer.classList.remove('compact','large','pdfSmall','pdfMedium','pdfLarge'); if(zoomMode==='small') viewer.classList.add('compact'); if(zoomMode==='large') viewer.classList.add('large'); viewer.classList.add(pdfHeightMode==='small'?'pdfSmall':pdfHeightMode==='large'?'pdfLarge':'pdfMedium'); }
function setZoom(z){ zoomMode=z; localStorage.setItem('sister_p4_hum_u6_zoom',z); applyZoom(); }
function setPdfHeight(h){ pdfHeightMode=h; localStorage.setItem('sister_p4_hum_u6_pdf_height',h); applyZoom(); }
$('zoomSmall').onclick=()=>setZoom('small'); $('zoomFit').onclick=()=>setZoom('fit'); $('zoomLarge').onclick=()=>setZoom('large'); $('heightSmall').onclick=()=>setPdfHeight('small'); $('heightMedium').onclick=()=>setPdfHeight('medium'); $('heightLarge').onclick=()=>setPdfHeight('large'); initTypes(); render();
