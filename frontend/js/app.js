// frontend/js/app.js — Shared layout, auth check, utilities
window.App = {
  user: null,

  // หน้าที่สงวนสำหรับ HR เท่านั้น — แผนกพิมพ์ URL ตรงก็จะถูก redirect
  HR_ONLY: ['dashboard.html', 'summary-ot.html', 'bus-schedule.html'],

  async init(pageTitle, pageSubtitle){
    try{
      const r = await fetch('/api/auth/me');
      const d = await r.json();
      if(!d.success){ location.href='/login.html'; return false; }
      this.user = d.user;

      // ป้องกันแผนกเข้าหน้า HR
      const curPage = location.pathname.split('/').pop();
      if(this.user.role !== 'hr' && this.HR_ONLY.includes(curPage)){
        location.href = '/pages/ot-entry.html';
        return false;
      }

      this._renderShell(pageTitle||'Dashboard', pageSubtitle||'');
      return true;
    }catch{ location.href='/login.html'; return false; }
  },

  _renderShell(title, subtitle){
    const u  = this.user;
    const hr = u.role==='hr';
    const av = u.display_name.charAt(0).toUpperCase();
    const cur= location.pathname.split('/').pop();

    const navLink=(href,icon,label)=>{
      const on = cur===href ? 'bg-white/20 text-white font-semibold' : 'text-slate-300 hover:bg-white/10 hover:text-white';
      return `<a href="/pages/${href}" class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${on}">
        <i class="${icon} w-5 text-center shrink-0"></i><span>${label}</span></a>`;
    };

    document.body.insertAdjacentHTML('afterbegin',`
      <aside id="sidebar" class="fixed top-0 left-0 h-full w-64 z-40 flex flex-col bg-gradient-to-b from-slate-900 via-slate-900 to-blue-950 shadow-2xl">
        <div class="px-5 py-5 border-b border-white/10 flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shrink-0"><i class="fas fa-industry text-white text-lg"></i></div>
          <div><p class="font-bold text-white text-lg leading-none">P.M Food</p><p class="text-blue-300 text-xs mt-0.5">OT Management</p></div>
        </div>
        <div class="mx-4 mt-4 px-3 py-3 bg-white/10 rounded-xl flex items-center gap-2.5">
          <div class="w-9 h-9 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">${av}</div>
          <div class="overflow-hidden min-w-0">
            <p class="text-white text-sm font-semibold truncate leading-none">${u.display_name}</p>
            <p class="text-blue-300 text-xs mt-0.5">${hr?'HR / Admin':u.dept_name||'แผนก'}</p>
          </div>
        </div>
        <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p class="text-blue-400/60 text-[10px] font-bold uppercase tracking-widest px-3 mb-2 mt-1">เมนูหลัก</p>
          ${hr ? navLink('dashboard.html','fas fa-chart-pie','Dashboard') : ''}
          ${navLink('ot-entry.html','fas fa-pen-to-square','ลงข้อมูล OT')}
          ${hr ? navLink('summary-ot.html','fas fa-table-list','รวมจำนวน OT') : ''}
          ${hr ? navLink('bus-schedule.html','fas fa-bus','ตารางแจ้งสายรถ') : ''}
          ${hr ? `<div class="pt-3">
            <p class="text-blue-400/60 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">Export</p>
            <button onclick="App.exportExcel()" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-green-300 hover:bg-white/10 hover:text-green-200 transition-all">
              <i class="fas fa-file-excel w-5 text-center"></i><span>Export Excel</span></button>
            <button onclick="App.exportPDF()" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-300 hover:bg-white/10 hover:text-red-200 transition-all">
              <i class="fas fa-file-pdf w-5 text-center"></i><span>Export PDF</span></button>
          </div>` : ''}
        </nav>
        <div class="p-4 border-t border-white/10">
          <button onclick="App.logout()" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all">
            <i class="fas fa-right-from-bracket w-5 text-center"></i><span>ออกจากระบบ</span></button>
        </div>
      </aside>
      <div id="overlay" class="hidden fixed inset-0 bg-black/50 z-30 lg:hidden" onclick="App.closeSidebar()"></div>
      <div class="lg:ml-64 min-h-screen flex flex-col bg-gray-50">
        <header class="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
          <div class="flex items-center gap-3 px-4 py-3">
            <button onclick="App.toggleSidebar()" class="lg:hidden p-2 rounded-lg hover:bg-gray-100 text-gray-600"><i class="fas fa-bars text-xl"></i></button>
            <div class="min-w-0">
              <h2 id="pageTitle" class="text-lg font-bold text-slate-800 leading-none truncate">${title}</h2>
              <p id="pageSubtitle" class="text-xs text-slate-400 mt-0.5">${subtitle}</p>
            </div>
            <div class="flex items-center gap-2 ml-auto shrink-0">
              <div class="hidden sm:flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                <i class="fas fa-calendar-day text-blue-500 text-sm"></i>
                <input type="date" id="globalDate" class="text-sm text-slate-700 bg-transparent outline-none w-32">
              </div>
              <div class="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-1.5">
                <div class="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs text-white font-bold shrink-0">${av}</div>
                <span class="text-sm font-medium text-blue-700 hidden sm:block max-w-[100px] truncate">${u.display_name}</span>
              </div>
            </div>
          </div>
        </header>
        <main class="flex-1 p-4 md:p-6" id="pageContent"></main>
      </div>
    `);

    const dateEl = document.getElementById('globalDate');
    dateEl.value = new Date().toISOString().split('T')[0];
    dateEl.addEventListener('change', ()=>{ if(window._onDateChange) window._onDateChange(dateEl.value); });
    this._initSidebar();
  },

  _initSidebar(){
    const update=()=>{
      const sb=document.getElementById('sidebar');
      if(!sb) return;
      if(window.innerWidth>=1024){ sb.style.transform=''; sb.dataset.open='1'; }
      else{ sb.style.transform='translateX(-100%)'; sb.dataset.open='0'; }
    };
    update();
    window.addEventListener('resize',update);
  },
  toggleSidebar(){
    const sb=document.getElementById('sidebar');
    const ov=document.getElementById('overlay');
    const open=sb.dataset.open==='1';
    sb.style.transform=open?'translateX(-100%)':'';
    sb.dataset.open=open?'0':'1';
    ov.classList.toggle('hidden',open);
  },
  closeSidebar(){
    const sb=document.getElementById('sidebar');
    sb.style.transform='translateX(-100%)';
    sb.dataset.open='0';
    document.getElementById('overlay').classList.add('hidden');
  },

  getDate(){ return document.getElementById('globalDate')?.value||new Date().toISOString().split('T')[0]; },
  async logout(){
    if(!confirm('ต้องการออกจากระบบ?')) return;
    await fetch('/api/auth/logout',{method:'POST'});
    location.href='/login.html';
  },
  exportExcel(){ window.open(`/api/export/excel?date=${this.getDate()}`,'_blank'); },
  exportPDF()  { window.open(`/api/export/pdf?date=${this.getDate()}`,'_blank');   },

  toast(msg,type='success'){
    const col={success:'bg-green-500',error:'bg-red-500',warning:'bg-amber-500',info:'bg-blue-500'};
    const ico={success:'fa-circle-check',error:'fa-circle-xmark',warning:'fa-triangle-exclamation',info:'fa-circle-info'};
    const t=document.createElement('div');
    t.className=`fixed top-4 right-4 z-[9999] ${col[type]} text-white text-sm font-medium px-5 py-3 rounded-xl shadow-xl flex items-center gap-2 translate-x-[120%] transition-transform duration-300`;
    t.innerHTML=`<i class="fas ${ico[type]}"></i><span>${msg}</span>`;
    document.body.appendChild(t);
    requestAnimationFrame(()=>t.style.transform='translateX(0)');
    setTimeout(()=>{ t.style.transform='translateX(120%)'; setTimeout(()=>t.remove(),300); },3000);
  },
  loading(show=true){
    let el=document.getElementById('_ld');
    if(show&&!el){
      el=document.createElement('div'); el.id='_ld';
      el.className='fixed inset-0 bg-black/30 z-[9998] flex items-center justify-center backdrop-blur-[2px]';
      el.innerHTML='<div class="bg-white rounded-2xl px-7 py-5 flex items-center gap-3 shadow-2xl"><div class="w-7 h-7 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div><span class="text-slate-700 font-semibold">กำลังโหลด...</span></div>';
      document.body.appendChild(el);
    } else if(!show&&el) el.remove();
  },
  dateThLong(d){
    try{ return new Date(d+'T00:00:00').toLocaleDateString('th-TH',{year:'numeric',month:'long',day:'numeric'}); }
    catch{ return d; }
  }
};
