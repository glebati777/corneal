"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Eye, UserRound, Search, Download, Plus, Trash2, LogIn, LayoutDashboard, BarChart3, Database, HeartPulse, X, Sparkles, Gauge, BrainCircuit, Filter, AlertTriangle, FileText, Microscope } from "lucide-react";

type Patient = {
  id: string; fullName: string; age: number | string; sex: string; graftType: string; surgeryType: string;
  neovascularization: string; priorInflammation: string; rejectionHistory: string;
  il1: number | string; il6: number | string; tnf: number | string; vegf: number | string; tgfb: number | string;
  notes: string; lastVisit: string;
};

const STORAGE_KEY = "corneal_v9_safe";
const starterPatients: Patient[] = [
  { id:"PT-001", fullName:"Иванов И.И.", age:46, sex:"М", graftType:"repeat", surgeryType:"PKP", neovascularization:"severe", priorInflammation:"yes", rejectionHistory:"yes", il1:12, il6:17, tnf:9, vegf:95, tgfb:48, notes:"Повторная госпитализация, выраженная васкуляризация.", lastVisit:"2026-03-10" },
  { id:"PT-002", fullName:"Петрова А.А.", age:31, sex:"Ж", graftType:"primary", surgeryType:"DMEK", neovascularization:"none", priorInflammation:"no", rejectionHistory:"no", il1:3, il6:4, tnf:3, vegf:22, tgfb:18, notes:"Спокойное течение послеоперационного периода.", lastVisit:"2026-03-12" },
  { id:"PT-003", fullName:"Сидоров Д.В.", age:58, sex:"М", graftType:"repeat", surgeryType:"DALK", neovascularization:"moderate", priorInflammation:"yes", rejectionHistory:"no", il1:7, il6:10, tnf:6, vegf:61, tgfb:35, notes:"Нужна промежуточная оценка лабораторных маркеров и клинической динамики.", lastVisit:"2026-03-08" },
  { id:"PT-004", fullName:"Соколова Е.В.", age:39, sex:"Ж", graftType:"primary", surgeryType:"DSAEK", neovascularization:"moderate", priorInflammation:"no", rejectionHistory:"no", il1:5, il6:7, tnf:4, vegf:40, tgfb:26, notes:"Плановое наблюдение после эндотелиальной кератопластики.", lastVisit:"2026-03-11" }
];
const emptyPatient: Patient = { id:"", fullName:"", age:"", sex:"М", graftType:"primary", surgeryType:"PKP", neovascularization:"none", priorInflammation:"no", rejectionHistory:"no", il1:"", il6:"", tnf:"", vegf:"", tgfb:"", notes:"", lastVisit:new Date().toISOString().slice(0,10) };

function clamp(v:number,a:number,b:number){ return Math.min(Math.max(v,a),b); }
function labelize(code:string,map:Record<string,string>){ return map[code] || code; }
function surgeryLabel(code:string){ return labelize(code,{ PKP:"PKP — сквозная кератопластика", DMEK:"DMEK — кератопластика десцеметовой мембраны", DSAEK:"DSAEK — задняя послойная эндотелиальная кератопластика", DALK:"DALK — глубокая передняя послойная кератопластика" }); }
function calc(p: Patient){ let s=0; if(p.graftType==="repeat") s+=18; if(p.neovascularization==="moderate") s+=14; if(p.neovascularization==="severe") s+=24; if(p.priorInflammation==="yes") s+=12; if(p.rejectionHistory==="yes") s+=18; s+=clamp((Number(p.il1)||0)/2,0,10)+clamp((Number(p.il6)||0)/2,0,12)+clamp((Number(p.tnf)||0)/2,0,10)+clamp((Number(p.vegf)||0)/10,0,12)+clamp((Number(p.tgfb)||0)/12,0,10); const risk=clamp(Math.round(s),0,100); return { risk, level:risk<35?"Низкий":risk<65?"Умеренный":"Высокий", status:risk<35?"Стабильное наблюдение":risk<65?"Усиленный мониторинг":"Повышенное внимание" }; }
function explanation(p: Patient){ const items:string[]=[]; if(p.graftType==="repeat") items.push("repeat graft"); if(p.neovascularization==="severe") items.push("severe neovascularization"); if(p.neovascularization==="moderate") items.push("moderate neovascularization"); if(p.priorInflammation==="yes") items.push("inflammatory history"); if(Number(p.il6)>=10) items.push("elevated IL-6"); if(Number(p.vegf)>=60) items.push("elevated VEGF"); return `${items.length ? "Основной вклад в риск дают: " + items.join(", ") + "." : "Выраженных факторов повышения риска не выявлено."} Совокупность параметров формирует ${calc(p).level.toLowerCase()} профиль риска.`; }
function recommendations(p: Patient){ const r=calc(p).risk; return r>=65?["Усилить частоту клинического наблюдения.","Повторить оценку воспалительных маркеров в коротком интервале.","Оценить динамику неоваскуляризации."]:r>=35?["Сократить интервал контрольного визита.","Повторно оценить IL-6 и VEGF.","Сопоставить лабораторные данные с клинической картиной."]:["Продолжить стандартное плановое наблюдение.","Повторно оценить маркеры по обычному протоколу.","Сохранять контроль клинической стабильности трансплантата."]; }
function heatStatus(name:string,val:number){ const t:Record<string,[number,number]>={"IL-1":[4,8],"IL-6":[5,10],"TNF-α":[4,8],"VEGF":[30,60],"TGF-β":[25,40]}; const [m,h]=t[name]; return val>=h?"high":val>=m?"mid":"low"; }
function exportReport(p?:Patient){ if(!p) return; const res = calc(p); const html = `<html><head><title>Clinical Report</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#111}h1{margin:0 0 12px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0}.box{border:1px solid #d1d5db;border-radius:12px;padding:14px}</style></head><body><h1>Clinical Report</h1><div>Structured follow-up summary after corneal transplantation</div><div class="grid"><div class="box"><strong>Patient</strong><div>${p.fullName}</div><div>ID: ${p.id}</div></div><div class="box"><strong>Visit</strong><div>${p.lastVisit}</div><div>${surgeryLabel(p.surgeryType)}</div></div><div class="box"><strong>Risk score</strong><div>${res.risk}% · ${res.level}</div></div><div class="box"><strong>Markers</strong><div>IL-1 ${p.il1} · IL-6 ${p.il6} · TNF-α ${p.tnf} · VEGF ${p.vegf}</div></div></div><script>window.onload=()=>window.print()</script></body></html>`; const w = window.open("", "_blank"); if(!w) return; w.document.write(html); w.document.close(); }

function RiskGauge({ value, label }:{ value:number; label:string }) {
  const angle=`${-90 + (value/100)*180}deg`;
  const gaugeClass=value>=65?"high":value>=35?"mid":"low";
  return <div className="gaugeWrap"><div className={`gaugeShell ${gaugeClass}`}><div className="gaugeArc"/><div className="gaugeInner"/><div className="gaugeNeedle" style={{["--angle" as any]:angle}}/><div className="gaugeDot"/><div className="gaugeCenterText"><div className="gaugeValue">{value}%</div><div className="gaugeLabel">{label}</div></div><div className="gaugeLabels"><span>LOW</span><span>MODERATE</span><span>HIGH</span></div></div></div>;
}
function StatCard({ title, value, caption, icon:Icon }:{ title:string; value:string|number; caption:string; icon:any }) {
  return <div className="statCard"><div className="statTop"><div><div className="muted small">{title}</div><div className="statValue">{value}</div><div className="muted small">{caption}</div></div><div className="iconWrap"><Icon size={20} /></div></div></div>;
}
function LoginScreen({ onLogin }:{ onLogin:(u:{email:string})=>void }) {
  const [email,setEmail] = useState("doctor@clinic.local");
  return <div style={{minHeight:"100vh",padding:24}}><div className="container" style={{maxWidth:1240,minHeight:"calc(100vh - 48px)",alignItems:"center"}}><div className="grid g2"><div className="card"><div className="brand" style={{marginBottom:16}}><div className="brandIcon"><Eye size={24}/></div><div><div style={{fontSize:28,fontWeight:800,color:"#fff"}}>Corneal Risk Platform</div><div className="brandSub">Clinical intelligence interface</div></div></div><div className="grid"><div><label className="label">Email</label><input className="input" value={email} onChange={e=>setEmail(e.target.value)} /></div><div><label className="label">Пароль</label><input className="input" type="password" value="demo123" readOnly /></div></div><div style={{marginTop:20}}><button className="btn" style={{width:"100%"}} onClick={()=>onLogin({email})}><LogIn size={16}/>Войти в систему</button></div></div><div className="hero"><div className="heroBadge"><Sparkles size={14}/>Clinical AI Dashboard</div><h1 className="heroTitle">Corneal Risk Platform</h1><div className="heroText">Стабильная версия интерфейса для мониторинга пациентов после трансплантации роговицы.</div></div></div></div></div>;
}

export default function Page() {
  const [user,setUser] = useState<{email:string}|null>(null);
  const [page,setPage] = useState("dashboard");
  const [patients,setPatients] = useState<Patient[]>(starterPatients);
  const [selectedId,setSelectedId] = useState(starterPatients[0].id);
  const [query,setQuery] = useState(""); const [riskFilter,setRiskFilter] = useState("all"); const [sortBy,setSortBy] = useState("risk-desc");
  const [tab,setTab] = useState("summary"); const [modal,setModal] = useState(false); const [form,setForm] = useState<Patient>(emptyPatient);

  useEffect(()=>{ try { const raw = localStorage.getItem(STORAGE_KEY); if(raw){ const parsed = JSON.parse(raw); if(parsed?.patients?.length){ setPatients(parsed.patients); setSelectedId(parsed.patients[0].id); } } } catch {} },[]);
  useEffect(()=>{ try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ patients })); } catch {} },[patients]);

  const selected = useMemo(()=>patients.find(p=>p.id===selectedId) || patients[0],[patients,selectedId]);
  const selectedRisk = useMemo(()=>selected ? calc(selected) : null,[selected]);
  const stats = useMemo(()=>({ total:patients.length, high:patients.filter(p=>calc(p).risk>=65).length, moderate:patients.filter(p=>{const r=calc(p).risk; return r>=35&&r<65;}).length, avg:patients.length?Math.round(patients.reduce((s,p)=>s+calc(p).risk,0)/patients.length):0 }),[patients]);

  const filteredPatients = useMemo(()=>{
    let arr = [...patients].filter(p=>[p.id,p.fullName,p.notes].some(v=>String(v).toLowerCase().includes(query.toLowerCase())));
    if(riskFilter !== "all"){ arr = arr.filter(p=>{ const r=calc(p).risk; if(riskFilter==="low") return r<35; if(riskFilter==="mid") return r>=35&&r<65; return r>=65; });}
    arr.sort((a,b)=>{ const ra=calc(a).risk, rb=calc(b).risk; if(sortBy==="risk-desc") return rb-ra; if(sortBy==="risk-asc") return ra-rb; if(sortBy==="name") return a.fullName.localeCompare(b.fullName); return String(b.lastVisit).localeCompare(String(a.lastVisit)); });
    return arr;
  },[patients,query,riskFilter,sortBy]);

  const openNew = ()=>{ setForm({ ...emptyPatient, id:`PT-${String(patients.length+1).padStart(3,"0")}`, lastVisit:new Date().toISOString().slice(0,10) }); setModal(true); };
  const save = ()=>{ if(!form.id || !form.fullName) return; const n:Patient={...form,age:Number(form.age)||0,il1:Number(form.il1)||0,il6:Number(form.il6)||0,tnf:Number(form.tnf)||0,vegf:Number(form.vegf)||0,tgfb:Number(form.tgfb)||0}; const exists=patients.some(p=>p.id===form.id); setPatients(prev=>exists?prev.map(p=>p.id===form.id?n:p):[n,...prev]); setSelectedId(form.id); setModal(false); };
  const remove = (id:string)=>{ const next=patients.filter(p=>p.id!==id); setPatients(next); setSelectedId(next[0]?.id || ""); };

  if(!user) return <LoginScreen onLogin={setUser} />;

  const alertClass = selectedRisk && selectedRisk.risk >= 65 ? "high" : selectedRisk && selectedRisk.risk >= 35 ? "mid" : "low";
  const heatItems:[string,number][] = [["IL-1",Number(selected?.il1||0)],["IL-6",Number(selected?.il6||0)],["TNF-α",Number(selected?.tnf||0)],["VEGF",Number(selected?.vegf||0)],["TGF-β",Number(selected?.tgfb||0)]];
  const riskBars = [
    { name:"Низкий", value:patients.filter(p=>calc(p).risk<35).length },
    { name:"Умеренный", value:patients.filter(p=>{const r=calc(p).risk; return r>=35&&r<65;}).length },
    { name:"Высокий", value:patients.filter(p=>calc(p).risk>=65).length }
  ];
  const surgeryBars = ["PKP","DALK","DSAEK","DMEK"].map(name=>({name,value:patients.filter(p=>p.surgeryType===name).length}));

  return (
    <div className="page">
      <aside className="sidebar">
        <div className="brand"><div className="brandIcon"><Eye size={24}/></div><div><div className="brandTitle">Corneal Risk</div><div className="brandSub">Clinical Decision Support</div></div></div>
        <div className="nav">
          {[["dashboard","Дашборд",LayoutDashboard],["patients","Пациенты",UserRound],["analytics","Аналитика",BarChart3],["methodology","Методология",Microscope],["about","О платформе",FileText]].map(([k,l,Icon])=><button key={String(k)} className={`navBtn ${page===k?"active":""}`} onClick={()=>setPage(String(k))}><Icon size={16}/>{l}</button>)}
        </div>
        <div className="userBox"><div style={{fontWeight:700,color:"#fff"}}>Пользователь</div><div style={{marginTop:6}}>{user.email}</div><div className="tiny" style={{marginTop:12}}>Платформа показывает ориентировочную оценку риска и не заменяет клиническое решение врача.</div></div>
      </aside>

      <main className="main"><div className="container">
        <div className="hero">
          <div className="heroBadge"><HeartPulse size={14}/>Corneal Graft Analytics</div>
          <h1 className="heroTitle">Платформа для наблюдения после трансплантации роговицы</h1>
          <div className="heroText">Стабильная версия интерфейса: реестр пациентов, ориентировочная стратификация риска, heatmap биомаркеров, AI-assisted explanation и printable report.</div>
          <div className="heroActions"><button className="btn outline" onClick={openNew}><Plus size={16}/>Новый пациент</button><button className="btn outline" onClick={()=>exportReport(selected)}><Download size={16}/>PDF report</button></div>
        </div>

        {page==="dashboard" && selected && selectedRisk && <>
          <div className="grid g4">
            <StatCard title="Всего пациентов" value={stats.total} caption="В активной базе" icon={Database}/>
            <StatCard title="Высокий риск" value={stats.high} caption="Требует приоритизации" icon={AlertTriangle}/>
            <StatCard title="Умеренный риск" value={stats.moderate} caption="Нуждается в контроле" icon={Gauge}/>
            <StatCard title="Средний риск" value={`${stats.avg}%`} caption="Сводный показатель" icon={BrainCircuit}/>
          </div>

          <div className="grid g3">
            <div className="card" style={{gridColumn:"span 2"}}>
              <h2>Central Clinical Card</h2>
              <div className="muted small">Структурированная сводка по активному пациенту</div>
              <div className="grid g2" style={{marginTop:18}}>
                <div className="grid">
                  <div className="panel"><div style={{display:"flex",justifyContent:"space-between",gap:12}}><div><div className="muted small">Активный пациент</div><div style={{fontSize:26,fontWeight:850,marginTop:6}}>{selected.fullName}</div><div className="muted small">{selected.id} · {selected.age} лет · визит {selected.lastVisit}</div></div><div className="brandIcon"><UserRound size={20}/></div></div></div>
                  <div className="metricGrid">
                    <div className="metric"><span className="metricTitle">Тип трансплантации</span><div className="metricValue">{labelize(selected.graftType,{primary:"Первичная",repeat:"Повторная"})}</div></div>
                    <div className="metric"><span className="metricTitle">Вид операции</span><div className="metricValue">{selected.surgeryType}</div></div>
                    <div className="metric"><span className="metricTitle">Неоваскуляризация</span><div className="metricValue">{labelize(selected.neovascularization,{none:"Нет",moderate:"Умеренная",severe:"Выраженная"})}</div></div>
                  </div>
                  <div className={`alertBox ${alertClass}`}><div style={{display:"flex",alignItems:"center",gap:10,fontWeight:800}}><AlertTriangle size={18}/> Clinical Alert</div><div className="small" style={{marginTop:8}}>{selectedRisk.risk >= 65 ? "Высокая ориентировочная вероятность иммунологического осложнения. Рекомендуется усиленный мониторинг." : selectedRisk.risk >= 35 ? "Есть факторы, требующие более частого наблюдения." : "Текущая картина соответствует стабильному наблюдению."}</div></div>
                  <div className="card"><div className="muted small">Patient Timeline</div><div className="timelineList">{[
                    {date:selected.lastVisit,title:"Последний визит",text:`Контроль после операции. IL-1 ${selected.il1}, IL-6 ${selected.il6}, TNF-α ${selected.tnf}.`},
                    {date:"2026-02-22",title:"Оценка воспалительной активности",text:selected.priorInflammation==="yes"?"Сохраняются данные за воспалительный компонент.":"Значимого воспалительного компонента не отмечено."},
                    {date:"2026-01-10",title:"Операция",text:surgeryLabel(selected.surgeryType)}
                  ].map((it,idx)=><div key={idx} className="timelineItem"><div className="timelineDate">{it.date}</div><div><div className="timelineTitle">{it.title}</div><div className="small muted" style={{marginTop:4}}>{it.text}</div></div></div>)}</div></div>
                  <div className="card"><div className="muted small">AI-assisted Risk Explanation</div><div style={{marginTop:8}}>{explanation(selected)}</div></div>
                </div>

                <div className="grid">
                  <div className="panel">
                    <div className="grid g2" style={{alignItems:"center"}}>
                      <RiskGauge value={selectedRisk.risk} label={selectedRisk.level} />
                      <div className="grid">
                        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><span className="badge dark">{selectedRisk.level} риск</span><span className="badge outlineBadge">{selectedRisk.status}</span></div>
                        <div className="small muted">Risk score</div>
                        <div className="progress"><div className="bar" style={{width:`${selectedRisk.risk}%`}}/></div>
                        <div className="card" style={{padding:14, marginTop:8}}><div className="muted tiny">Biomarker Trend</div><div className="miniTrend">{[
                          { name:"IL-1", trend:Number(selected.il1)>=8?"↑":Number(selected.il1)>=4?"→":"↓" },
                          { name:"IL-6", trend:Number(selected.il6)>=10?"↑":Number(selected.il6)>=5?"→":"↓" },
                          { name:"VEGF", trend:Number(selected.vegf)>=60?"↑":Number(selected.vegf)>=30?"→":"↓" }
                        ].map((t,i)=><div key={i} className="miniItem"><span>{t.name}</span><strong>{t.trend}</strong></div>)}</div></div>
                      </div>
                    </div>
                  </div>
                  <div className="markerGrid">{[["IL-1", selected.il1],["IL-6", selected.il6],["TNF-α", selected.tnf],["VEGF", selected.vegf],["TGF-β", selected.tgfb]].map(([label, value]) => <div key={String(label)} className="marker"><span className="markerTitle">{label}</span><div className="markerValue">{value}</div></div>)}</div>
                  <div className="card"><div className="muted small">Risk Contributors</div><div className="factorList">{[
                    ...(selected.graftType==="repeat"?[["Repeat graft",18] as const]:[]),
                    ...(selected.neovascularization==="severe"?[["Severe neovascularization",24] as const]:selected.neovascularization==="moderate"?[["Moderate neovascularization",14] as const]:[]),
                    ...(selected.priorInflammation==="yes"?[["Inflammatory history",12] as const]:[]),
                    ...(selected.rejectionHistory==="yes"?[["Rejection history",18] as const]:[]),
                    ["IL-1 elevation",Math.round(clamp((Number(selected.il1)||0)/2,0,10))] as const,
                    ["IL-6 elevation",Math.round(clamp((Number(selected.il6)||0)/2,0,12))] as const,
                    ["VEGF elevation",Math.round(clamp((Number(selected.vegf)||0)/10,0,12))] as const
                  ].filter(x=>x[1]>0).slice(0,5).map((c,i)=><div key={i} className="factorRow"><span>{c[0]}</span><span className="factorScore">+{c[1]}</span></div>)}</div></div>
                  <div className="card"><div className="muted small">Biomarker Heatmap</div><div className="heatmapGrid">{heatItems.map(([name,value])=>{ const s=heatStatus(name,value); return <div key={name} className="heatItem"><div className="heatHeader"><span>{name}</span><span className={`statusDot status-${s}`}></span></div><div className="heatValue">{value}</div><div className="tiny muted">{s==="high"?"High":s==="mid"?"Intermediate":"Low"}</div></div>; })}</div></div>
                </div>
              </div>
            </div>

            <div className="card">
              <h2>Quick Actions</h2>
              <div className="muted small">Основные сценарии работы с интерфейсом</div>
              <div className="grid" style={{marginTop:18}}>
                <button className="btn" onClick={openNew}><Plus size={16}/>Добавить пациента</button>
                <button className="btn outline" onClick={()=>exportReport(selected)}><Download size={16}/>Скачать PDF-отчёт</button>
                <button className="btn outline" onClick={()=>setPage("analytics")}><BarChart3 size={16}/>Открыть аналитику</button>
                <button className="btn outline" onClick={()=>setPage("patients")}><UserRound size={16}/>Открыть реестр</button>
              </div>
            </div>
          </div>
        </>}

        {page==="patients" && selected && selectedRisk && <div className="grid g3">
          <div className="card">
            <h2>Реестр пациентов</h2>
            <div className="muted small">Поиск, фильтрация и сортировка записей</div>
            <div className="filters">
              <div className="searchWrap"><Search className="searchIcon" size={16}/><input className="input searchInput" placeholder="Поиск по ID, ФИО, заметкам" value={query} onChange={e=>setQuery(e.target.value)} /></div>
              <select className="select" value={riskFilter} onChange={e=>setRiskFilter(e.target.value)}><option value="all">Все уровни риска</option><option value="low">Низкий риск</option><option value="mid">Умеренный риск</option><option value="high">Высокий риск</option></select>
              <select className="select" value={sortBy} onChange={e=>setSortBy(e.target.value)}><option value="risk-desc">Риск: по убыванию</option><option value="risk-asc">Риск: по возрастанию</option><option value="name">По имени</option><option value="visit">По дате визита</option></select>
              <button className="btn outline" onClick={()=>{setQuery("");setRiskFilter("all");setSortBy("risk-desc");}}><Filter size={16}/>Сброс</button>
            </div>
            <div className="list" style={{marginTop:18}}>
              {filteredPatients.map(patient=>{ const risk = calc(patient); return <button key={patient.id} className={`patientBtn ${selectedId===patient.id ? "active" : ""}`} onClick={()=>setSelectedId(patient.id)}><div style={{display:"flex",justifyContent:"space-between",gap:10}}><div><div style={{fontWeight:700}}>{patient.fullName}</div><div className="muted small">{patient.id} · {patient.surgeryType} · визит {patient.lastVisit}</div></div><span className={`badge ${risk.risk>=65?"high":risk.risk>=35?"mid":"low"}`}>{risk.risk}%</span></div><div className="muted small" style={{marginTop:8}}>{patient.notes}</div></button>; })}
            </div>
          </div>

          <div className="card" style={{gridColumn:"span 2"}}>
            <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}><div><h2>Карточка пациента</h2><div className="muted small">Структурированные сведения и интерпретация ориентировочного риска</div></div><div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button className="btn outline" onClick={()=>{setForm(selected);setModal(true);}}>Редактировать</button><button className="btn danger" onClick={()=>remove(selected.id)}><Trash2 size={16}/>Удалить</button></div></div>
            <div className="tabs">{[["summary","Сводка"],["markers","Маркеры"],["recommendations","Рекомендации"],["report","Report"]].map(([k,l])=><button key={k} className={`tab ${tab===k ? "active" : ""}`} onClick={()=>setTab(String(k))}>{l}</button>)}</div>

            {tab==="summary" && <div className="grid g3" style={{marginTop:18}}>
              {[
                ["ФИО", selected.fullName],["ID", selected.id],["Возраст", `${selected.age} лет`],["Пол", selected.sex],
                ["Тип трансплантации", labelize(selected.graftType,{primary:"Первичная",repeat:"Повторная"})],["Вид операции", surgeryLabel(selected.surgeryType)],
                ["Неоваскуляризация", labelize(selected.neovascularization,{none:"Нет",moderate:"Умеренная",severe:"Выраженная"})],
                ["Предшествующее воспаление", selected.priorInflammation==="yes"?"Да":"Нет"],["Отторжение в анамнезе", selected.rejectionHistory==="yes"?"Да":"Нет"],["Дата визита", selected.lastVisit]
              ].map(([label,value])=><div key={String(label)} className="panel"><div className="muted small">{label}</div><div style={{marginTop:6,fontWeight:700}}>{value}</div></div>)}
              <div className="card" style={{gridColumn:"1 / -1"}}><div className="muted small">Автоматический clinical summary</div><div style={{marginTop:8}}>{explanation(selected)}</div></div>
            </div>}

            {tab==="markers" && <div className="grid" style={{marginTop:18}}>
              <div className="markerGrid">{[["IL-1", selected.il1],["IL-6", selected.il6],["TNF-α", selected.tnf],["VEGF", selected.vegf],["TGF-β", selected.tgfb]].map(([label,value])=><div key={String(label)} className="marker"><span className="markerTitle">{label}</span><div className="markerValue">{value}</div></div>)}</div>
              <div className="grid g2">
                <div className="card"><div className="muted small">Risk Trajectory</div><div style={{marginTop:12,display:"grid",gap:10}}>{[
                  ["Нед 1",42],["Нед 2",56],["Нед 3",72],["Нед 4",60]
                ].map(([label,val])=><div key={String(label)}><div className="tiny muted">{label}</div><div className="progress" style={{marginTop:6}}><div className="bar" style={{width:`${val}%`}}/></div></div>)}</div></div>
                <div className="card"><div className="muted small">Biomarker Heatmap</div><div className="heatmapGrid" style={{marginTop:12}}>{heatItems.map(([name,value])=>{ const s=heatStatus(name,value); return <div key={name} className="heatItem"><div className="heatHeader"><span>{name}</span><span className={`statusDot status-${s}`}></span></div><div className="heatValue">{value}</div><div className="tiny muted">{s==="high"?"High":s==="mid"?"Intermediate":"Low"}</div></div>; })}</div></div>
              </div>
            </div>}

            {tab==="recommendations" && <div className="grid g2" style={{marginTop:18}}>
              <div className="grid">
                <div className="panel"><div className="muted small">Ориентировочная оценка риска</div><div style={{marginTop:14}}><RiskGauge value={selectedRisk.risk} label={selectedRisk.level} /></div><div className="muted small" style={{marginTop:6}}>{selectedRisk.level} риск · {selectedRisk.status}</div></div>
                <div className={`alertBox ${alertClass}`}><div style={{display:"flex",alignItems:"center",gap:10,fontWeight:800}}><AlertTriangle size={18}/> Clinical Alert</div><div className="small" style={{marginTop:8}}>{selectedRisk.risk >= 65 ? "High probability of graft rejection. Enhanced monitoring recommended." : selectedRisk.risk >= 35 ? "Intermediate-risk profile. Shorter follow-up interval may be considered." : "Low-risk profile with stable follow-up trajectory."}</div></div>
              </div>
              <div className="grid">
                <div className="card"><div className="muted small">AI-assisted Risk Explanation</div><div style={{marginTop:8}}>{explanation(selected)}</div></div>
                <div className="card"><div className="muted small">Smart Recommendations</div><div className="recoList">{recommendations(selected).map((r,i)=><div key={i} className="recoItem"><span>{r}</span><strong>•</strong></div>)}</div></div>
              </div>
            </div>}

            {tab==="report" && <div className="reportSheet" style={{marginTop:18}}>
              <h3 style={{marginTop:0}}>Clinical Report</h3>
              <div className="small">Structured follow-up summary after corneal transplantation</div>
              <div className="reportMeta">
                <div className="reportBlock"><strong>Patient</strong><div>{selected.fullName}</div><div>ID: {selected.id}</div></div>
                <div className="reportBlock"><strong>Visit</strong><div>{selected.lastVisit}</div><div>{surgeryLabel(selected.surgeryType)}</div></div>
                <div className="reportBlock"><strong>Risk score</strong><div>{selectedRisk.risk}% · {selectedRisk.level}</div></div>
                <div className="reportBlock"><strong>Key markers</strong><div>IL-1 {selected.il1} · IL-6 {selected.il6} · TNF-α {selected.tnf}</div></div>
              </div>
              <div className="reportBlock" style={{marginTop:14}}><strong>Clinical summary</strong><div style={{marginTop:8}}>{explanation(selected)}</div></div>
              <div style={{marginTop:16}}><button className="btn" onClick={()=>exportReport(selected)}><Download size={16}/>Print / Save PDF</button></div>
            </div>}
          </div>
        </div>}

        {page==="analytics" && <div className="grid g2">
          <div className="card"><h2>Распределение по уровням риска</h2><div className="grid" style={{marginTop:14}}>{riskBars.map(r=><div key={r.name}><div className="small muted">{r.name} — {r.value}</div><div className="progress" style={{marginTop:6}}><div className="bar" style={{width:`${Math.max(8,r.value*25)}%`}}/></div></div>)}</div></div>
          <div className="card"><h2>Распределение по видам операций</h2><div className="grid" style={{marginTop:14}}>{surgeryBars.map(r=><div key={r.name}><div className="small muted">{r.name} — {r.value}</div><div className="progress" style={{marginTop:6}}><div className="bar" style={{width:`${Math.max(8,r.value*25)}%`}}/></div></div>)}</div></div>
        </div>}

        {page==="methodology" && <div className="grid g2">
          <div className="card"><h2>Методологические принципы</h2><div className="grid small muted" style={{marginTop:18}}><div>Платформа помогает структурировать наблюдение и визуализировать совокупность клинических факторов после трансплантации роговицы.</div><div>Показатель риска является ориентировочным и предназначен для демонстрации логики стратификации, а не для автономного клинического решения.</div><div>Входные параметры: тип трансплантации, вид операции, неоваскуляризация, воспаление в анамнезе, предыдущие эпизоды отторжения, IL-1, IL-6, TNF-α, VEGF и TGF-β.</div></div></div>
          <div className="card"><h2>Новые улучшения</h2><div className="grid small muted" style={{marginTop:18}}><div>• AI-assisted explanation</div><div>• Biomarker heatmap</div><div>• Risk trajectory</div><div>• Smart recommendations</div></div></div>
        </div>}

        {page==="about" && <div className="grid g2">
          <div className="card"><h2>О платформе</h2><div className="grid small muted" style={{marginTop:18}}><div>Corneal Risk Platform объединяет клинические данные пациента, ориентировочную стратификацию риска и аналитические панели в единой рабочей среде.</div><div>Интерфейс подходит для демонстрации концепции цифровой поддержки принятия решений в офтальмологии.</div></div></div>
          <div className="card"><h2>Дальнейшее развитие</h2><div className="grid small muted" style={{marginTop:18}}><div>• Backend и база данных</div><div>• Интеграция с клиническими системами</div><div>• Роли пользователей</div><div>• Реальные датасеты</div></div></div>
        </div>}
      </div></main>

      {modal && <div className="modalBg"><div className="modal">
        <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"start"}}><div><h2 style={{margin:0,color:"#fff"}}>{patients.some(p=>p.id===form.id) ? "Редактирование пациента" : "Новый пациент"}</h2><div className="muted small">Заполните клинические параметры для ориентировочной оценки риска.</div></div><button className="btn outline" onClick={()=>setModal(false)}><X size={16}/></button></div>
        <div className="grid g3" style={{marginTop:20}}>
          <div><label className="label">ID пациента</label><input className="input" value={form.id} onChange={e=>setForm({...form,id:e.target.value})} /></div>
          <div><label className="label">ФИО</label><input className="input" value={form.fullName} onChange={e=>setForm({...form,fullName:e.target.value})} /></div>
          <div><label className="label">Возраст</label><input className="input" type="number" value={form.age} onChange={e=>setForm({...form,age:e.target.value})} /></div>
          <div><label className="label">Пол</label><select className="select" value={form.sex} onChange={e=>setForm({...form,sex:e.target.value})}><option value="М">М</option><option value="Ж">Ж</option></select></div>
          <div><label className="label">Дата визита</label><input className="input" type="date" value={form.lastVisit} onChange={e=>setForm({...form,lastVisit:e.target.value})} /></div>
          <div><label className="label">Тип трансплантации</label><select className="select" value={form.graftType} onChange={e=>setForm({...form,graftType:e.target.value})}><option value="primary">Первичная</option><option value="repeat">Повторная</option></select></div>
          <div><label className="label">Вид операции</label><select className="select" value={form.surgeryType} onChange={e=>setForm({...form,surgeryType:e.target.value})}><option value="PKP">PKP — сквозная кератопластика</option><option value="DALK">DALK — глубокая передняя послойная кератопластика</option><option value="DSAEK">DSAEK — задняя послойная эндотелиальная кератопластика</option><option value="DMEK">DMEK — кератопластика десцеметовой мембраны</option></select></div>
          <div><label className="label">Неоваскуляризация</label><select className="select" value={form.neovascularization} onChange={e=>setForm({...form,neovascularization:e.target.value})}><option value="none">Нет</option><option value="moderate">Умеренная</option><option value="severe">Выраженная</option></select></div>
          <div><label className="label">Предшествующее воспаление</label><select className="select" value={form.priorInflammation} onChange={e=>setForm({...form,priorInflammation:e.target.value})}><option value="no">Нет</option><option value="yes">Да</option></select></div>
          <div><label className="label">Отторжение в анамнезе</label><select className="select" value={form.rejectionHistory} onChange={e=>setForm({...form,rejectionHistory:e.target.value})}><option value="no">Нет</option><option value="yes">Да</option></select></div>
          <div><label className="label">IL-1</label><input className="input" type="number" value={form.il1} onChange={e=>setForm({...form,il1:e.target.value})} /></div>
          <div><label className="label">IL-6</label><input className="input" type="number" value={form.il6} onChange={e=>setForm({...form,il6:e.target.value})} /></div>
          <div><label className="label">TNF-α</label><input className="input" type="number" value={form.tnf} onChange={e=>setForm({...form,tnf:e.target.value})} /></div>
          <div><label className="label">VEGF</label><input className="input" type="number" value={form.vegf} onChange={e=>setForm({...form,vegf:e.target.value})} /></div>
          <div><label className="label">TGF-β</label><input className="input" type="number" value={form.tgfb} onChange={e=>setForm({...form,tgfb:e.target.value})} /></div>
          <div style={{gridColumn:"1 / -1"}}><label className="label">Клинические заметки</label><textarea className="textarea" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} /></div>
        </div>
        <div style={{display:"flex",justifyContent:"end",gap:10,marginTop:18}}><button className="btn outline" onClick={()=>setModal(false)}>Отмена</button><button className="btn" onClick={save}>Сохранить пациента</button></div>
      </div></div>}
    </div>
  );
}
