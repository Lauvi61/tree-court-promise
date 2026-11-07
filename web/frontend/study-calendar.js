const weekdays=['一','二','三','四','五','六','日'];
const dayKey=date=>date.toISOString().slice(0,10);
const todayKey=()=>dayKey(new Date(Date.now()+8*3600000));
const monthDate=(month,offset=0)=>{
 const [year,index]=month.split('-').map(Number);
 return new Date(Date.UTC(year,index-1+offset,1));
};
const monthKey=date=>dayKey(date).slice(0,7);
const secondsOn=(days,key)=>Math.max(0,days[key]||0);

function duration(seconds,compact=false){
 if(seconds<=0)return compact?'':'0 秒';
 if(seconds<1)return compact?'<1秒':'不足 1 秒';
 const rounded=Math.floor(seconds),hours=Math.floor(rounded/3600);
 const minutes=Math.floor(rounded/60)%60,remainder=rounded%60;
 if(compact)return hours?`${hours}时${minutes?minutes+'分':''}`:minutes?`${minutes}分`:`${remainder}秒`;
 return [hours&&`${hours} 小时`,minutes&&`${minutes} 分钟`,remainder&&`${remainder} 秒`].filter(Boolean).join(' ');
}

export function createStudyCalendar(readDays){
 let host,month,selected;
 function mount(target){
  host=target;
  const today=todayKey();
  month??=today.slice(0,7);
  selected??=today;
  host.innerHTML=`<div class="study-calendar-heading">
   <div><h2 id="study-calendar-title">学习打卡日历</h2><p class="muted small">按北京时间汇总已记录的有效学习与自习时长。</p></div>
   <div class="study-calendar-nav" aria-label="切换月份">
    <button type="button" class="button light" data-calendar-month="-1" aria-label="上个月">‹</button>
    <button type="button" class="button light" data-calendar-month="today">今天</button>
    <button type="button" class="button light" data-calendar-month="1" aria-label="下个月">›</button>
   </div>
  </div>
  <div class="study-calendar-summary"><h3 data-calendar-label></h3><p data-calendar-summary></p></div>
  <div class="study-calendar-grid" data-calendar-grid></div>
  <p class="study-calendar-detail" data-calendar-detail aria-live="polite"></p>`;
  host.onclick=event=>{
   const control=event.target.closest('button');
   if(!control)return;
   if(control.dataset.calendarDay){
    selected=control.dataset.calendarDay;
    refresh();
    host.querySelector(`[data-calendar-day="${selected}"]`)?.focus({preventScroll:true});
   }else if(control.dataset.calendarMonth){
    const today=todayKey();
    const change=control.dataset.calendarMonth;
    month=change==='today'?today.slice(0,7):monthKey(monthDate(month,Number(change)));
    selected=month===today.slice(0,7)?today:`${month}-01`;
    refresh();
   }
  };
  refresh();
 }

 function refresh(){
  if(!host?.isConnected)return;
  const today=todayKey(),days=readDays();
  const first=monthDate(month),next=monthDate(month,1);
  const length=Math.round((next-first)/86400000);
  const offset=(first.getUTCDay()+6)%7;
  const records=Array.from({length},(_,i)=>{
   const key=`${month}-${String(i+1).padStart(2,'0')}`;
   return {key,seconds:secondsOn(days,key)};
  });
  const total=records.reduce((sum,record)=>sum+record.seconds,0);
  host.querySelector('[data-calendar-label]').textContent=`${first.getUTCFullYear()} 年 ${first.getUTCMonth()+1} 月`;
  host.querySelector('[data-calendar-summary]').textContent=`${records.filter(record=>record.seconds>0).length} 天打卡 · 累计 ${duration(total)}`;
  host.querySelector('[data-calendar-month="1"]').disabled=month>=today.slice(0,7);
  const grid=host.querySelector('[data-calendar-grid]');
  const focused=grid.contains(document.activeElement)?document.activeElement.dataset.calendarDay:null;
  grid.innerHTML=weekdays.map(name=>`<span class="study-calendar-weekday">周${name}</span>`).join('')
   +'<span aria-hidden="true"></span>'.repeat(offset)
   +records.map(({key,seconds},i)=>`<button type="button" data-calendar-day="${key}" class="study-calendar-day${seconds>0?' studied':''}" aria-label="${key} ${seconds?duration(seconds):'无学习记录'}" aria-pressed="${selected===key}"${key===today?' aria-current="date"':''}><span>${i+1}</span><small>${duration(seconds,true).replace('<','&lt;')||'—'}</small></button>`).join('');
  if(focused)grid.querySelector(`[data-calendar-day="${focused}"]`)?.focus({preventScroll:true});
  const seconds=secondsOn(days,selected);
  host.querySelector('[data-calendar-detail]').textContent=`${selected===today?'今天':selected} · ${seconds>0?`学习 ${duration(seconds)}`:'暂无学习记录'}`;
 }

 return {mount,refresh};
}
