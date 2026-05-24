const USER_KEY = 'revision_portal_current_user';
const UNITS = [
  {id:'brotherGsB4U1Progress', key:'progress_brother_p6_gs_b4_u1_', total:86},
  {id:'brotherGsB5U1Progress', key:'progress_brother_p6_gs_b5_u1_', total:83},
  {id:'brotherGsB5U2Progress', key:'progress_brother_p6_gs_b5_u2_', total:82},
  {id:'brotherGsB6U2Progress', key:'progress_brother_p6_gs_b6_u2_', total:89},
  {id:'humU6Progress', key:'progress_sister_p4_hum_u6_', total:120},
  {id:'humU7Progress', key:'progress_sister_p4_hum_u7_', total:94},
  {id:'humU8Progress', key:'progress_sister_p4_hum_u8_', total:200},
  {id:'sciU6Progress', key:'progress_sister_p4_sci_u6_', total:65},
  {id:'sciU7Progress', key:'progress_sister_p4_sci_u7_', total:91}
];
function canonicalUser(u){
  if(u === 'childA') return 'brother';
  if(u === 'childB') return 'sister';
  return (u === 'brother' || u === 'sister') ? u : 'sister';
}
let currentUser = canonicalUser(localStorage.getItem(USER_KEY) || 'sister');
localStorage.setItem(USER_KEY, currentUser);
function label(user){return (user === 'brother' || user === 'childA') ? '哥哥' : '妹妹'}
function setUser(user){
  user = canonicalUser(user);
  currentUser = user;
  localStorage.setItem(USER_KEY, user);
  document.querySelectorAll('[data-user]').forEach(btn=>btn.classList.toggle('active', btn.dataset.user===user));
  document.querySelectorAll('[data-set-user]').forEach(link=>{ link.onclick = () => localStorage.setItem(USER_KEY, canonicalUser(link.dataset.setUser || currentUser)); });
  renderProgress();
}
function getProgress(unit, user){ try{return JSON.parse(localStorage.getItem(unit.key + user) || '{}')}catch(e){return {}} }
function renderProgress(){
  UNITS.forEach(unit=>{
    const box=document.getElementById(unit.id); if(!box) return;
    const p=getProgress(unit,currentUser);
    const records=Object.entries(p).filter(([k])=>k.startsWith('page_')).map(([,v])=>v);
    const done=records.length, correct=records.filter(r=>r.correct===true).length, wrong=records.filter(r=>r.correct===false).length, open=records.filter(r=>r.correct===null).length;
    const rate=done?Math.round(correct/done*100):0;
    box.innerHTML=`<b>${label(currentUser)}的進度</b><br>已做：${done} / ${unit.total} 頁｜答對：${correct}｜答錯：${wrong}${open?`｜待自評：${open}`:''}｜答對率：${rate}%`;
  });
}
document.querySelectorAll('[data-user]').forEach(btn=>btn.addEventListener('click',()=>setUser(btn.dataset.user)));
setUser(currentUser);
