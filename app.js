
const S={
  data:null,
  active:new Set(),
  query:"",
  type:"all",
  view:"dashboard",
  favorites:new Set(JSON.parse(localStorage.getItem("fav")||"[]")),
  completed:new Set(JSON.parse(localStorage.getItem("done")||"[]")),
  weekOffset:0
};

const $=q=>document.querySelector(q);
const $$=q=>[...document.querySelectorAll(q)];
const MONTHS=["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const WD=["D","S","T","Q","Q","S","S"];
const DAY_MS=86400000;
const TYPE_META={
  assessment:{name:"Avaliações",color:"#7c3aed"},
  gd:{name:"GDs",color:"#2563eb"},
  ambulatory:{name:"Ambulatórios",color:"#dc2626"},
  class:{name:"Aulas / ATs",color:"#ea580c"}
};

function d(s){return new Date(s+"T12:00:00")}
function fmt(s){const x=d(s);return `${String(x.getDate()).padStart(2,"0")}/${String(x.getMonth()+1).padStart(2,"0")}`}
function dateKey(s){const [y,m,day]=s.split("-").map(Number);return Date.UTC(y,m-1,day)}
function todayKey(){const n=new Date();return Date.UTC(n.getFullYear(),n.getMonth(),n.getDate())}
function calendarDaysUntil(s){return Math.round((dateKey(s)-todayKey())/DAY_MS)}
function endKey(e){return dateKey(e.end||e.date)}
function isPast(e){return endKey(e)<todayKey()}
function isCurrent(e){return dateKey(e.date)<=todayKey()&&endKey(e)>=todayKey()}
function end(e){return d(e.end||e.date)}
function id(e){return `${e.disc}|${e.date}|${e.label}`}
function disc(k){return S.data.disciplines[k]}

function isUnconfirmed(e){
  return /a confirmar|base 2025|data provável|não publicado|checar c\/ coordenação/i.test(e.label+" "+(e.time||""));
}
function eventKind(e){
  const t=(e.label+" "+(e.time||"")).toLowerCase();
  if(/ambulatório|ambulatorial|triagem|consulta/.test(t))return"ambulatory";
  if(/\bgd\b|gd\d|gd\+/.test(t))return"gd";
  if(/prova|av1|av2|av3|av4|av6|modular|exame especial|atividade integradora|avaliativo|avaliação parcial|avaliação final|salto triplo|semana de provas/.test(t))return"assessment";
  return"class";
}
function classify(e){return isUnconfirmed(e)?"pending":eventKind(e)}

function visible(e){
  if(!S.active.has(e.disc))return false;
  if(S.type!=="all"&&e.type!==S.type)return false;
  const h=(disc(e.disc).name+" "+e.label+" "+(e.time||"")).toLowerCase();
  return !S.query||h.includes(S.query);
}
function days(e){
  const a=[];let key=dateKey(e.date),last=endKey(e);
  while(key<=last){a.push(new Date(key).toISOString().slice(0,10));key+=DAY_MS}
  return a;
}
function save(){
  localStorage.setItem("fav",JSON.stringify([...S.favorites]));
  localStorage.setItem("done",JSON.stringify([...S.completed]));
}
function toast(t){
  const x=$("#toast");if(!x)return;
  x.textContent=t;x.classList.add("show");setTimeout(()=>x.classList.remove("show"),1600);
}
function futureEvents(list=S.data.events){
  return list.filter(e=>!isPast(e)).sort((a,b)=>dateKey(a.date)-dateKey(b.date));
}
function nextEvent(list=S.data.events){
  return futureEvents(list)[0]||null;
}
function countdownText(e){
  if(!e)return {number:"—",unit:"sem eventos"};
  if(isCurrent(e))return {number:"HOJE",unit:e.end&&e.end!==e.date?"em andamento":"é hoje"};
  const n=Math.max(0,calendarDaysUntil(e.date));
  return {number:String(n),unit:n===1?"dia faltando":"dias faltando"};
}
function setView(view){
  S.view=view;
  $$(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  $$(".view").forEach(v=>v.classList.toggle("active",v.id===view));
}

function shell(){
  return `<div class="shell">
    <div class="sticky">
      <section class="hero">
        <div>
          <div class="eyebrow">${S.data.meta.subtitle}</div>
          <h1>${S.data.meta.title}</h1>
          <div class="sub">Dashboard com gráficos, contagens precisas, calendário, semana, agenda e exportação para iPhone · V6 Mobile</div>
        </div>
        <div id="countdown" class="countdown"></div>
      </section>
      <div class="controls">
        <input id="search" class="ctrl search" placeholder="Buscar prova, GD, AT, tema ou disciplina…">
        <select id="type" class="ctrl">
          <option value="all">Todos os tipos</option>
          <option value="assessment">Provas e avaliações</option>
          <option value="gd">GDs</option>
          <option value="ambulatory">Ambulatórios/consultas</option>
          <option value="class">Aulas/ATs</option>
          <option value="pending">A confirmar</option>
        </select>
        <button id="theme" class="ctrl btn">🌙 Tema</button>
        <button id="icsAll" class="ctrl btn">📅 ICS completo</button>
        <button id="icsDisc" class="ctrl btn primary">🎨 ICS por matéria</button>
      </div>
      <div class="nav">
        ${[
          ["dashboard","Dashboard"],["calendar","Calendário"],["week","Semana"],
          ["timeline","Agenda"],["disciplines","Disciplinas"],["favorites","Favoritos"],["settings","Configurações"]
        ].map(([k,v])=>`<button data-view="${k}" class="${k==="dashboard"?"active":""}">${v}</button>`).join("")}
      </div>
    </div>
    <main>
      ${["dashboard","calendar","week","timeline","disciplines","favorites","settings"]
        .map((v,i)=>`<section id="${v}" class="view ${i===0?"active":""}"></section>`).join("")}
    </main>
    <div class="footer">${S.data.meta.version} · calendário acadêmico pessoal</div>
  </div>
  <div id="drawer" class="drawer">
    <div class="backdrop"></div>
    <aside class="sheet">
      <div class="sheet-head"><h2 id="drawerTitle"></h2><button class="close">×</button></div>
      <div id="drawerBody"></div>
    </aside>
  </div>`;
}

function renderCountdown(){
  // Contagem geral: sempre considera todas as disciplinas, independentemente dos filtros.
  const e=nextEvent(S.data.events.filter(x=>x.disc!=="GERAL"));
  const c=countdownText(e);
  const box=$("#countdown");
  if(!e){
    box.innerHTML="<div><div class='cd-title'>Sem eventos futuros 🎉</div></div>";
    return;
  }
  box.innerHTML=`
    <div><div class="cd-num">${c.number}</div><div class="cd-unit">${c.unit}</div></div>
    <div>
      <div class="cd-title">${disc(e.disc).icon||""} ${disc(e.disc).name} — ${e.label}</div>
      <div class="cd-meta">${fmt(e.date)}${e.time?" · "+e.time:""}${e.end?" · até "+fmt(e.end):""}</div>
    </div>`;
}

function legend(){
  return `<div class="legend">${Object.entries(S.data.disciplines).map(([k,v])=>
    `<button data-disc="${k}" class="${S.active.has(k)?"":"off"}">
      <span class="dot" style="background:${v.color}"></span>${v.short||v.name}
    </button>`).join("")}</div>`;
}

function row(e){
  const fav=S.favorites.has(id(e)),done=S.completed.has(id(e));
  return `<div class="trow">
    <div class="tdate">${fmt(e.date)}</div>
    <div class="tdot" style="background:${disc(e.disc).color}"></div>
    <div class="tcard ${done?"completed":""}">
      <button class="done" data-done="${encodeURIComponent(id(e))}" title="Marcar concluído">${done?"✅":"☐"}</button>
      <button class="fav" data-fav="${encodeURIComponent(id(e))}" title="Favoritar">${fav?"⭐":"☆"}</button>
      <b>${disc(e.disc).icon||""} ${disc(e.disc).name} — ${e.label}</b>
      <small>${e.time||""}${e.end?" · até "+fmt(e.end):""}</small>
    </div>
  </div>`;
}
function rows(list){return list.length?`<div class="timeline">${list.map(row).join("")}</div>`:"<div class='empty'>Nenhum evento.</div>"}

function heavyWeeks(events){
  const map={};
  events.filter(e=>eventKind(e)==="assessment").forEach(e=>{
    const x=d(e.date),day=(x.getDay()+6)%7;
    x.setDate(x.getDate()-day);
    const key=x.toISOString().slice(0,10);
    (map[key]??=[]).push(e);
  });
  return Object.entries(map).sort((a,b)=>b[1].length-a[1].length).slice(0,5);
}

function statusSummary(events){
  const concluded=events.filter(isPast).length;
  return {concluded,pending:events.length-concluded,total:events.length};
}
function statusByType(events){
  return Object.keys(TYPE_META).map(type=>{
    const subset=events.filter(e=>eventKind(e)===type);
    return {type,...statusSummary(subset)};
  });
}
function statusByDiscipline(events){
  return Object.keys(S.data.disciplines)
    .filter(k=>k!=="GERAL")
    .map(k=>{
      const subset=events.filter(e=>e.disc===k);
      return {disc:k,...statusSummary(subset)};
    });
}
function statusBars(items,mode="type"){
  return `<div class="${mode==="disc"?"discipline-chart":"chart-list"}">${items.map(item=>{
    const meta=mode==="type"?TYPE_META[item.type]:disc(item.disc);
    const total=Math.max(item.total,1);
    const pastPct=item.concluded/total*100;
    const futurePct=item.pending/total*100;
    return `<div class="chart-row">
      <div class="chart-name">${mode==="type"?meta.name:(meta.icon||"")+" "+meta.short}</div>
      <div class="stacked" title="${item.concluded} concluídas · ${item.pending} pendentes">
        <span class="seg-past" style="width:${pastPct}%"></span>
        <span class="seg-future" style="width:${futurePct}%"></span>
      </div>
      <div class="chart-values">${item.concluded} / ${item.pending}</div>
    </div>`;
  }).join("")}</div>`;
}

function nextDisciplineCards(){
  const cards=Object.keys(S.data.disciplines).filter(k=>k!=="GERAL").map(k=>{
    const e=nextEvent(S.data.events.filter(x=>x.disc===k));
    if(!e)return "";
    const c=countdownText(e);
    return `<button class="next-disc-card" data-next-disc="${k}" style="--c:${disc(k).color}">
      <div class="next-disc-head">
        <div class="next-disc-name">${disc(k).icon||""} ${disc(k).name}</div>
        <div><div class="next-disc-days">${c.number}</div><span class="next-disc-unit">${c.unit}</span></div>
      </div>
      <div class="next-disc-title">${e.label}</div>
      <div class="next-disc-meta">${fmt(e.date)}${e.time?" · "+e.time:""}</div>
      <div class="next-disc-link">Abrir agenda da disciplina →</div>
    </button>`;
  }).join("");
  return `<section class="next-disc-section">
    <div class="panel">
      <h2>Próximo evento de cada disciplina</h2>
      <div class="next-disc-grid">${cards}</div>
    </div>
  </section>`;
}

function dashboard(){
  const ev=S.data.events.filter(visible);
  const now=new Date();
  const future=futureEvents(ev);
  const summary=statusSummary(ev);
  const counts=[
    ["Eventos",ev.length],
    ["Avaliações",ev.filter(e=>eventKind(e)==="assessment").length],
    ["GDs",ev.filter(e=>eventKind(e)==="gd").length],
    ["Ambulatórios",ev.filter(e=>eventKind(e)==="ambulatory").length],
    ["Pendentes",summary.pending],
    ["Concluídas",summary.concluded]
  ];
  const ss=dateKey(S.data.meta.semesterStart),se=dateKey(S.data.meta.semesterEnd);
  const pct=Math.round(Math.min(1,Math.max(0,(todayKey()-ss)/(se-ss)))*100);
  const donutAngle=summary.total?summary.concluded/summary.total*360:0;

  $("#dashboard").innerHTML=`
    <div class="stats">${counts.map(([k,v])=>
      `<div class="card"><div class="metric">${v}</div><div class="label">${k}</div></div>`).join("")}
    </div>
    <div class="card progress">
      <div class="progress-head"><b>Progresso do semestre</b><span>${pct}%</span></div>
      <div class="track"><div class="fill" style="width:${pct}%"></div></div>
    </div>
    ${legend()}
    ${nextDisciplineCards()}
    <div class="chart-grid">
      <div class="panel chart-panel">
        <h2>Status geral das atividades</h2>
        <div class="status-legend">
          <span class="status-key"><span class="status-swatch" style="background:#10b981"></span>Concluídas pela data</span>
          <span class="status-key"><span class="status-swatch" style="background:#f59e0b"></span>Pendentes pela data</span>
        </div>
        <div class="donut-wrap">
          <div class="donut" style="background:conic-gradient(#10b981 0 ${donutAngle}deg,#f59e0b ${donutAngle}deg 360deg)">
            <div class="donut-center"><strong>${summary.pending}</strong><span>pendentes de ${summary.total}</span></div>
          </div>
        </div>
        <div class="auto-note">“Concluída” significa que a data final da atividade já passou. Isso é independente da marcação manual ✅.</div>
      </div>
      <div class="panel chart-panel">
        <h2>Concluídas e pendentes por tipo de evento</h2>
        <div class="status-legend">
          <span class="status-key"><span class="status-swatch" style="background:#10b981"></span>Concluídas</span>
          <span class="status-key"><span class="status-swatch" style="background:#f59e0b"></span>Pendentes</span>
          <span class="status-key">Números: concluídas / pendentes</span>
        </div>
        ${statusBars(statusByType(ev),"type")}
      </div>
    </div>
    <div class="panel" style="margin-bottom:16px">
      <h2>Status por disciplina</h2>
      <div class="status-legend">
        <span class="status-key"><span class="status-swatch" style="background:#10b981"></span>Concluídas</span>
        <span class="status-key"><span class="status-swatch" style="background:#f59e0b"></span>Pendentes</span>
      </div>
      ${statusBars(statusByDiscipline(ev),"disc")}
    </div>
    <div class="grid-2">
      <div class="panel"><h2>Próximos eventos</h2>${rows(future.slice(0,12))}</div>
      <div>
        <div class="panel">
          <h2>Próximas avaliações</h2>
          <div class="quick-list">${
            future.filter(e=>eventKind(e)==="assessment").slice(0,8).map(e=>
              `<div class="quick" style="--c:${disc(e.disc).color}">
                <b>${fmt(e.date)} · ${disc(e.disc).name}</b>
                <small>${e.label}${e.time?" · "+e.time:""}</small>
              </div>`).join("")||"<div class='empty'>Nenhuma avaliação futura.</div>"
          }</div>
        </div>
        <div class="panel" style="margin-top:16px">
          <h2>Semanas mais pesadas</h2>
          <div class="heavy">${
            heavyWeeks(ev).map(([w,l])=>
              `<div class="heavy-row"><b>${fmt(w)}</b><span>${l.map(e=>disc(e.disc).short).join(" · ")}</span><span class="heat">${l.length}</span></div>`
            ).join("")||"<div class='empty'>Sem dados.</div>"
          }</div>
        </div>
      </div>
    </div>`;
}

function calendar(){
  const months=[7,8,9,10,11].map(m=>{
    const first=new Date(2026,m,1),count=new Date(2026,m+1,0).getDate();
    let cells="<div></div>".repeat(first.getDay());
    for(let n=1;n<=count;n++){
      const iso=`2026-${String(m+1).padStart(2,"0")}-${String(n).padStart(2,"0")}`;
      const es=S.data.events.filter(visible).filter(e=>days(e).includes(iso));
      const t=new Date();
      cells+=`<div class="day ${es.some(e=>e.end)?"range":""} ${t.getFullYear()===2026&&t.getMonth()===m&&t.getDate()===n?"today":""}"
          data-day="${iso}" title="${es.map(e=>disc(e.disc).name+" — "+e.label).join("\n")}">
        <div class="num">${n}</div>
        <div class="marks">${[...new Set(es.map(e=>e.disc))].map(k=>`<span class="mark" style="background:${disc(k).color}"></span>`).join("")}</div>
      </div>`;
    }
    const list=S.data.events.filter(visible).filter(e=>d(e.date).getMonth()===m).sort((a,b)=>dateKey(a.date)-dateKey(b.date));
    return `<div class="month">
      <div class="mhead"><span>${MONTHS[m].toUpperCase()}</span><span>2026</span></div>
      <div class="week">${WD.map(x=>`<div>${x}</div>`).join("")}</div>
      <div class="days">${cells}</div>
      <button class="mobile-month-toggle" type="button">Ver eventos do mês</button>
      <div class="mlist">${
        list.length?list.map(e=>`<div class="mrow">
          <span class="chip" style="background:${disc(e.disc).color}">${fmt(e.date)}</span>
          <div><b>${disc(e.disc).name}</b><br><small>${e.label}${e.time?" · "+e.time:""}</small></div>
        </div>`).join(""):"<div class='empty'>Sem eventos.</div>"
      }</div>
    </div>`;
  }).join("");
  $("#calendar").innerHTML=`${legend()}<div class="calendar-grid">${months}</div>`;
}

function startOfWeek(){
  const x=new Date();x.setHours(12,0,0,0);
  const day=(x.getDay()+6)%7;
  x.setDate(x.getDate()-day+S.weekOffset*7);
  return x;
}
function weekView(){
  const start=startOfWeek();
  const dates=[...Array(7)].map((_,i)=>{const x=new Date(start);x.setDate(x.getDate()+i);return x});
  const today=todayKey();
  $("#week").innerHTML=`
    <div class="controls">
      <button id="prevWeek" class="ctrl btn">← Semana anterior</button>
      <button id="todayWeek" class="ctrl btn">Hoje</button>
      <button id="nextWeek" class="ctrl btn">Próxima semana →</button>
    </div>
    <div class="week-board">${dates.map(x=>{
      const iso=`${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`;
      const es=S.data.events.filter(visible).filter(e=>days(e).includes(iso));
      return `<div class="week-column ${dateKey(iso)===today?"today":""}">
        <div class="week-column-head">${["dom","seg","ter","qua","qui","sex","sáb"][x.getDay()]}<small>${fmt(iso)}</small></div>
        ${es.length?es.map(e=>`<div class="week-event" data-day="${iso}" style="background:${disc(e.disc).color}">
          <b>${disc(e.disc).short}</b><br>${e.label}
        </div>`).join(""):"<div class='week-empty'>Sem eventos</div>"}
      </div>`;
    }).join("")}</div>`;
}
function timeline(){
  $("#timeline").innerHTML=`<div class="panel"><h2>Agenda cronológica</h2>${rows(S.data.events.filter(visible).sort((a,b)=>dateKey(a.date)-dateKey(b.date)))}</div>`;
}
function disciplines(){
  $("#disciplines").innerHTML=`<div class="disc-grid">${Object.entries(S.data.disciplines).map(([k,v])=>{
    const l=S.data.events.filter(e=>e.disc===k&&visible(e));
    const summary=statusSummary(l);
    return `<div class="disc-card" style="border-top:6px solid ${v.color}">
      <h3>${v.icon||""} ${v.name}</h3>
      <div class="disc-count">${l.length}</div><div class="mini">eventos visíveis</div>
      <div class="mini">${summary.concluded} concluídos pela data · ${summary.pending} pendentes</div>
      ${l.slice(0,8).map(e=>`<div class="mini">• ${fmt(e.date)} — ${e.label}</div>`).join("")}
    </div>`;
  }).join("")}</div>`;
}
function favorites(){
  $("#favorites").innerHTML=`<div class="panel"><h2>Favoritos</h2>${rows(S.data.events.filter(e=>S.favorites.has(id(e))).sort((a,b)=>dateKey(a.date)-dateKey(b.date)))}</div>`;
}
function settings(){
  $("#settings").innerHTML=`<div class="panel"><h2>Configurações</h2>
    <div class="settings-grid">
      <div class="setting"><label><span><b>Tema</b><div class="label">Claro/escuro, salvo no aparelho.</div></span><button id="theme2" class="ctrl btn">Alternar</button></label></div>
      <div class="setting"><b>Lembretes ICS</b><div class="label">5 dias antes e 1 dia antes.</div></div>
      <div class="setting"><b>Cores no iPhone</b><div class="label">Exporte por matéria e importe cada arquivo em um calendário separado.</div></div>
      <div class="setting"><b>Instalar no iPhone</b><div class="label">Safari → Compartilhar → Adicionar à Tela de Início.</div></div>
      <div class="setting"><b>Funcionamento offline</b><div class="label">O site tenta buscar a versão nova primeiro e usa o cache apenas se estiver sem internet.</div></div>
      <div class="setting"><label><span><b>Limpar favoritos e marcações</b><div class="label">Remove apenas dados salvos neste navegador.</div></span><button id="reset" class="ctrl btn">Limpar</button></label></div>
    </div>
  </div>`;
}

function render(){
  renderCountdown();
  dashboard();
  calendar();
  weekView();
  timeline();
  disciplines();
  favorites();
  settings();
  bind();
  setView(S.view);
}

function bind(){
  $("#search").value=S.query;
  $("#type").value=S.type;
  $("#search").oninput=e=>{S.query=e.target.value.trim().toLowerCase();render()};
  $("#type").onchange=e=>{S.type=e.target.value;render()};
  $("#theme").onclick=toggleTheme;
  if($("#theme2"))$("#theme2").onclick=toggleTheme;

  $$(".nav button").forEach(b=>b.onclick=()=>{S.view=b.dataset.view;setView(S.view)});
  $$("[data-disc]").forEach(b=>b.onclick=()=>{
    S.active.has(b.dataset.disc)?S.active.delete(b.dataset.disc):S.active.add(b.dataset.disc);
    render();
  });
  $$("[data-next-disc]").forEach(b=>b.onclick=()=>{
    const k=b.dataset.nextDisc;
    S.active=new Set([k]);
    S.query="";
    S.type="all";
    S.view="timeline";
    render();
    window.scrollTo({top:0,behavior:"smooth"});
  });
  $$("[data-fav]").forEach(b=>b.onclick=()=>{
    const x=decodeURIComponent(b.dataset.fav);
    S.favorites.has(x)?S.favorites.delete(x):S.favorites.add(x);
    save();render();toast("Favoritos atualizados");
  });
  $$("[data-done]").forEach(b=>b.onclick=()=>{
    const x=decodeURIComponent(b.dataset.done);
    S.completed.has(x)?S.completed.delete(x):S.completed.add(x);
    save();render();toast("Marcação atualizada");
  });
  $$("[data-day]").forEach(b=>b.onclick=()=>openDay(b.dataset.day));
  $$(".mobile-month-toggle").forEach(button=>button.onclick=()=>{
    const month=button.closest(".month");
    const opened=month.classList.toggle("mobile-open");
    button.textContent=opened?"Ocultar eventos do mês":"Ver eventos do mês";
  });

  $("#prevWeek").onclick=()=>{S.weekOffset--;weekView();bindWeek()};
  $("#nextWeek").onclick=()=>{S.weekOffset++;weekView();bindWeek()};
  $("#todayWeek").onclick=()=>{S.weekOffset=0;weekView();bindWeek()};

  $("#icsAll").onclick=()=>download("Calendario_Medicina_UFMG_6P_2026_2.ics",ics(S.data.events.filter(visible),"Medicina UFMG — 6º Período — 2026/2","#111827"));
  $("#icsDisc").onclick=()=>Object.entries(S.data.disciplines).forEach(([k,v],i)=>
    setTimeout(()=>download(v.name.replaceAll(" ","_")+".ics",ics(S.data.events.filter(e=>e.disc===k&&visible(e)),v.name,v.color)),i*350)
  );

  if($("#reset"))$("#reset").onclick=()=>{
    if(confirm("Limpar favoritos e eventos marcados manualmente como concluídos?")){
      S.favorites.clear();S.completed.clear();save();render();
    }
  };
  $(".close").onclick=closeDrawer;
  $(".backdrop").onclick=closeDrawer;
}
function bindWeek(){
  $$("[data-day]").forEach(b=>b.onclick=()=>openDay(b.dataset.day));
  $("#prevWeek").onclick=()=>{S.weekOffset--;weekView();bindWeek()};
  $("#nextWeek").onclick=()=>{S.weekOffset++;weekView();bindWeek()};
  $("#todayWeek").onclick=()=>{S.weekOffset=0;weekView();bindWeek()};
}
function openDay(iso){
  const es=S.data.events.filter(visible).filter(e=>days(e).includes(iso));
  $("#drawerTitle").textContent=`Eventos de ${fmt(iso)}`;
  $("#drawerBody").innerHTML=rows(es);
  $("#drawer").classList.add("show");
  bindDrawer();
}
function bindDrawer(){
  $(".close").onclick=closeDrawer;
  $(".backdrop").onclick=closeDrawer;
  $$("#drawer [data-fav]").forEach(b=>b.onclick=()=>{
    const x=decodeURIComponent(b.dataset.fav);
    S.favorites.has(x)?S.favorites.delete(x):S.favorites.add(x);
    save();render();closeDrawer();
  });
  $$("#drawer [data-done]").forEach(b=>b.onclick=()=>{
    const x=decodeURIComponent(b.dataset.done);
    S.completed.has(x)?S.completed.delete(x):S.completed.add(x);
    save();render();closeDrawer();
  });
}
function closeDrawer(){$("#drawer").classList.remove("show")}
function toggleTheme(){
  document.body.classList.toggle("dark");
  localStorage.setItem("theme",document.body.classList.contains("dark")?"dark":"light");
}

function esc(s){return(s||"").replaceAll("\\","\\\\").replaceAll("\n","\\n").replaceAll(",","\\,").replaceAll(";","\\;")}
function times(s){return[...((s||"").matchAll(/(\d{1,2})h(\d{2})?/g))].map(m=>[+m[1],+(m[2]||0)])}
function ics(list,name,color){
  const stamp=new Date().toISOString().replace(/[-:]/g,"").replace(/\.\d{3}Z/,"Z");
  let o=["BEGIN:VCALENDAR","VERSION:2.0","CALSCALE:GREGORIAN",`X-WR-CALNAME:${esc(name)}`,`X-APPLE-CALENDAR-COLOR:${color}`];
  list.forEach((e,i)=>{
    const ds=e.date.replaceAll("-",""),t=e.end?[]:times(e.time);
    o.push("BEGIN:VEVENT",`UID:${e.disc}-${ds}-${i}@turmaa`,`DTSTAMP:${stamp}`);
    if(t.length){
      const[sh,sm]=t[0],[eh,em]=t[1]||[Math.min(sh+1,23),sm];
      o.push(`DTSTART;TZID=America/Sao_Paulo:${ds}T${String(sh).padStart(2,"0")}${String(sm).padStart(2,"0")}00`,
             `DTEND;TZID=America/Sao_Paulo:${ds}T${String(eh).padStart(2,"0")}${String(em).padStart(2,"0")}00`);
    }else{
      const z=new Date((e.end||e.date)+"T00:00:00");z.setDate(z.getDate()+1);
      o.push(`DTSTART;VALUE=DATE:${ds}`,`DTEND;VALUE=DATE:${z.toISOString().slice(0,10).replaceAll("-","")}`);
    }
    o.push(`SUMMARY:${esc(e.label)}`,
           `DESCRIPTION:${esc(disc(e.disc).name+" — "+e.label+(e.time?" ("+e.time+")":""))}`,
           "BEGIN:VALARM","ACTION:DISPLAY","TRIGGER:-P5D","DESCRIPTION:Faltam 5 dias","END:VALARM",
           "BEGIN:VALARM","ACTION:DISPLAY","TRIGGER:-P1D","DESCRIPTION:Falta 1 dia","END:VALARM",
           "END:VEVENT");
  });
  o.push("END:VCALENDAR");
  return o.join("\r\n");
}
function download(n,t){
  const b=new Blob([t],{type:"text/calendar;charset=utf-8"}),u=URL.createObjectURL(b),a=document.createElement("a");
  a.href=u;a.download=n;a.click();URL.revokeObjectURL(u);
}

document.addEventListener("DOMContentLoaded",()=>{
  fetch("./eventos.json",{cache:"no-store"})
    .then(r=>r.json())
    .then(x=>{
      S.data=x;
      S.data.events.forEach(e=>e.type=classify(e));
      Object.keys(x.disciplines).forEach(k=>S.active.add(k));
      document.body.innerHTML=shell()+`<div id="toast" class="toast"></div>`;
      if(localStorage.getItem("theme")==="dark")document.body.classList.add("dark");
      render();
      setInterval(renderCountdown,60000);
      if("serviceWorker"in navigator)navigator.serviceWorker.register("./sw.js").catch(()=>{});
    })
    .catch(()=>document.body.innerHTML="<div class='boot'>Não foi possível carregar eventos.json.</div>");
});
