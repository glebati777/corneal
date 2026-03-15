"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Eye, UserRound, Microscope, ShieldAlert, FileText, Search, Download, Plus,
  Trash2, LogIn, LayoutDashboard, BarChart3, Database, ClipboardList,
  HeartPulse, X, Sparkles, Gauge, BrainCircuit, Filter, WandSparkles, Activity
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend
} from "recharts";

type Patient = {
  id: string;
  fullName: string;
  age: number | string;
  sex: string;
  graftType: string;
  surgeryType: string;
  neovascularization: string;
  priorInflammation: string;
  rejectionHistory: string;
  il1: number | string;
  il6: number | string;
  tnf: number | string;
  vegf: number | string;
  tgfb: number | string;
  notes: string;
  lastVisit: string;
};

const STORAGE_KEY = "corneal_v6_clinical";
const starterPatients: Patient[] = [
  { id:"PT-001", fullName:"Иванов И.И.", age:46, sex:"М", graftType:"repeat", surgeryType:"PKP", neovascularization:"severe", priorInflammation:"yes", rejectionHistory:"yes", il1:12, il6:17, tnf:9, vegf:95, tgfb:48, notes:"Повторная госпитализация, выраженная васкуляризация.", lastVisit:"2026-03-10" },
  { id:"PT-002", fullName:"Петрова А.А.", age:31, sex:"Ж", graftType:"primary", surgeryType:"DMEK", neovascularization:"none", priorInflammation:"no", rejectionHistory:"no", il1:3, il6:4, tnf:3, vegf:22, tgfb:18, notes:"Спокойное течение послеоперационного периода.", lastVisit:"2026-03-12" },
  { id:"PT-003", fullName:"Сидоров Д.В.", age:58, sex:"М", graftType:"repeat", surgeryType:"DALK", neovascularization:"moderate", priorInflammation:"yes", rejectionHistory:"no", il1:7, il6:10, tnf:6, vegf:61, tgfb:35, notes:"Нужна промежуточная оценка лабораторных маркеров и клинической динамики.", lastVisit:"2026-03-08" },
  { id:"PT-004", fullName:"Соколова Е.В.", age:39, sex:"Ж", graftType:"primary", surgeryType:"DSAEK", neovascularization:"moderate", priorInflammation:"no", rejectionHistory:"no", il1:5, il6:7, tnf:4, vegf:40, tgfb:26, notes:"Плановое наблюдение после эндотелиальной кератопластики.", lastVisit:"2026-03-11" }
];
const emptyPatient: Patient = {
  id:"", fullName:"", age:"", sex:"М", graftType:"primary", surgeryType:"PKP",
  neovascularization:"none", priorInflammation:"no", rejectionHistory:"no",
  il1:"", il6:"", tnf:"", vegf:"", tgfb:"", notes:"", lastVisit:new Date().toISOString().slice(0,10)
};
const trendData = [
  { date: "Нед 1", IL1: 6, IL6: 8, TNFa: 5, VEGF: 46, TGFB: 32 },
  { date: "Нед 2", IL1: 8, IL6: 11, TNFa: 7, VEGF: 55, TGFB: 34 },
  { date: "Нед 3", IL1: 10, IL6: 13, TNFa: 8, VEGF: 60, TGFB: 38 },
  { date: "Нед 4", IL1: 7, IL6: 9, TNFa: 6, VEGF: 49, TGFB: 33 }
];

function clamp(v:number,a:number,b:number){ return Math.min(Math.max(v,a),b); }
function labelize(code:string,map:Record<string,string>){ return map[code] || code; }
function surgeryLabel(code:string){
  return labelize(code,{
    PKP:"PKP — сквозная кератопластика",
    DMEK:"DMEK — кератопластика десцеметовой мембраны",
    DSAEK:"DSAEK — задняя послойная эндотелиальная кератопластика",
    DALK:"DALK — глубокая передняя послойная кератопластика"
  });
}

function calculateRisk(patient: Patient){
  let score = 0;
  if (patient.graftType === "repeat") score += 18;
  if (patient.neovascularization === "moderate") score += 14;
  if (patient.neovascularization === "severe") score += 24;
  if (patient.priorInflammation === "yes") score += 12;
  if (patient.rejectionHistory === "yes") score += 18;
  score += clamp((Number(patient.il1)||0)/2,0,10);
  score += clamp((Number(patient.il6)||0)/2,0,12);
  score += clamp((Number(patient.tnf)||0)/2,0,10);
  score += clamp((Number(patient.vegf)||0)/10,0,12);
  score += clamp((Number(patient.tgfb)||0)/12,0,10);
  const risk = clamp(Math.round(score),0,100);
  return {
    risk,
    level: risk < 35 ? "Низкий" : risk < 65 ? "Умеренный" : "Высокий",
    status: risk < 35 ? "Стабильное наблюдение" : risk < 65 ? "Усиленный мониторинг" : "Повышенное внимание",
    recommendation: risk < 35
      ? "Рекомендуется стандартное наблюдение по принятому графику."
      : risk < 65
      ? "Желателен более частый контроль клинической картины и биомаркеров."
      : "Нужен более плотный мониторинг и обсуждение тактики ведения на клиническом уровне."
  };
}

function buildClinicalSummary(patient: Patient){
  const risk = calculateRisk(patient);
  const parts:string[] = [];
  parts.push(`${patient.fullName}, ${patient.age} лет.`);
  parts.push(`${labelize(patient.graftType,{primary:"Первичная",repeat:"Повторная"})} трансплантация.`);
  parts.push(`Вид операции: ${surgeryLabel(patient.surgeryType)}.`);
  if(patient.neovascularization === "severe") parts.push("Отмечается выраженная неоваскуляризация.");
  else if(patient.neovascularization === "moderate") parts.push("Отмечается умеренная неоваскуляризация.");
  else parts.push("Клинически значимой неоваскуляризации не отмечено.");
  if(patient.priorInflammation === "yes") parts.push("В анамнезе есть воспалительный компонент.");
  if(patient.rejectionHistory === "yes") parts.push("Есть эпизоды отторжения в анамнезе.");
  parts.push(`Ориентировочная оценка риска — ${risk.risk}%, что соответствует категории «${risk.level.toLowerCase()} риск».`);
  parts.push(risk.recommendation);
  return parts.join(" ");
}

function exportReport(patient?: Patient){
  if(!patient) return;
  const result = calculateRisk(patient);
  const summary = buildClinicalSummary(patient);
  const text = `Отчёт по пациенту\n\nФИО: ${patient.fullName}\nID: ${patient.id}\nВозраст: ${patient.age}\nПол: ${patient.sex}\nТип трансплантации: ${labelize(patient.graftType,{primary:"Первичная",repeat:"Повторная"})}\nВид операции: ${surgeryLabel(patient.surgeryType)}\nДата визита: ${patient.lastVisit}\n\nОриентировочная оценка риска: ${result.risk}%\nУровень риска: ${result.level}\nТекущий статус: ${result.status}\nРекомендация: ${result.recommendation}\n\nClinical summary:\n${summary}`;
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${patient.id}_report.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function RiskBadge({ risk }:{ risk:number }){
  return <span className={`badge ${risk>=65 ? "high" : risk>=35 ? "mid" : "low"}`}>{risk}%</span>;
}

function StatCard({ title, value, caption, icon:Icon }:{ title:string; value:string|number; caption:string; icon:any }){
  return (
    <div className="statCard">
      <div className="statTop">
        <div>
          <div className="muted small">{title}</div>
          <div className="statValue">{value}</div>
          <div className="muted small">{caption}</div>
        </div>
        <div className="iconWrap"><Icon size={20} /></div>
      </div>
    </div>
  );
}

function RiskGauge({ value, label }:{ value:number; label:string }){
  const angle = `${-90 + (value/100)*180}deg`;
  return (
    <div className="gaugeWrap">
      <div className="gauge" style={{["--angle" as any]: angle}}>
        <div className="needle" />
        <div className="needleDot" />
        <div className="gaugeCenter">
          <div>
            <div className="gaugeValue">{value}%</div>
            <div className="gaugeLabel">{label}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginScreen({ onLogin }:{ onLogin:(u:{email:string})=>void }){
  const [email,setEmail] = useState("doctor@clinic.local");
  return (
    <div style={{minHeight:"100vh",padding:24}}>
      <div className="container" style={{maxWidth:1240,minHeight:"calc(100vh - 48px)",alignItems:"center"}}>
        <div className="grid g2">
          <div className="card">
            <div className="brand" style={{marginBottom:16}}>
              <div className="brandIcon"><Eye size={24}/></div>
              <div>
                <div style={{fontSize:28,fontWeight:800,color:"#fff"}}>Corneal Risk Platform</div>
                <div className="brandSub">Clinical intelligence interface</div>
              </div>
            </div>
            <div className="grid">
              <div><label className="label">Email</label><input className="input" value={email} onChange={e=>setEmail(e.target.value)} /></div>
              <div><label className="label">Пароль</label><input className="input" type="password" value="demo123" readOnly /></div>
            </div>
            <div style={{marginTop:20}}>
              <button className="btn" style={{width:"100%"}} onClick={()=>onLogin({email})}>
                <LogIn size={16}/>Войти в систему
              </button>
            </div>
          </div>

          <div className="hero">
            <div className="heroBadge"><Sparkles size={14}/>Clinical AI Dashboard</div>
            <h1 className="heroTitle">Corneal Risk Platform</h1>
            <div className="heroText">
              Цифровая платформа для структурированного наблюдения после трансплантации роговицы:
              реестр пациентов, ориентировочная оценка риска, клиническая аналитика и единая витрина данных.
            </div>
            <div className="metricGrid" style={{marginTop:18}}>
              <div className="metric"><span className="metricTitle">Patient Registry</span><div className="metricValue">4</div></div>
              <div className="metric"><span className="metricTitle">Risk Analytics</span><div className="metricValue">Live</div></div>
              <div className="metric"><span className="metricTitle">Clinical Markers</span><div className="metricValue">5</div></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page(){
  const [user,setUser] = useState<{email:string}|null>(null);
  const [page,setPage] = useState("dashboard");
  const [patients,setPatients] = useState<Patient[]>(starterPatients);
  const [selectedId,setSelectedId] = useState(starterPatients[0].id);
  const [query,setQuery] = useState("");
  const [riskFilter,setRiskFilter] = useState("all");
  const [sortBy,setSortBy] = useState("risk-desc");
  const [tab,setTab] = useState("summary");
  const [modal,setModal] = useState(false);
  const [form,setForm] = useState<Patient>(emptyPatient);

  useEffect(()=>{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      try{
        const parsed = JSON.parse(raw);
        if(parsed?.patients?.length){
          setPatients(parsed.patients);
          setSelectedId(parsed.patients[0].id);
        }
      }catch{}
    }
  },[]);
  useEffect(()=>{
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ patients }));
  },[patients]);

  const selected = useMemo(()=>patients.find(p=>p.id===selectedId) || patients[0],[patients,selectedId]);
  const selectedRisk = useMemo(()=>selected ? calculateRisk(selected) : null,[selected]);
  const selectedSummary = useMemo(()=>selected ? buildClinicalSummary(selected) : "",[selected]);

  const filteredPatients = useMemo(()=>{
    let arr = [...patients].filter(p=>[p.id,p.fullName,p.notes].some(v=>String(v).toLowerCase().includes(query.toLowerCase())));
    if(riskFilter !== "all"){
      arr = arr.filter(p=>{
        const r = calculateRisk(p).risk;
        if(riskFilter === "low") return r < 35;
        if(riskFilter === "mid") return r >= 35 && r < 65;
        return r >= 65;
      });
    }
    arr.sort((a,b)=>{
      const ra = calculateRisk(a).risk;
      const rb = calculateRisk(b).risk;
      if(sortBy === "risk-desc") return rb - ra;
      if(sortBy === "risk-asc") return ra - rb;
      if(sortBy === "name") return a.fullName.localeCompare(b.fullName);
      return String(b.lastVisit).localeCompare(String(a.lastVisit));
    });
    return arr;
  },[patients,query,riskFilter,sortBy]);

  const stats = useMemo(()=>{
    const high = patients.filter(p=>calculateRisk(p).risk >= 65).length;
    const moderate = patients.filter(p=>{ const r = calculateRisk(p).risk; return r >= 35 && r < 65; }).length;
    const avg = patients.length ? Math.round(patients.reduce((sum,p)=>sum+calculateRisk(p).risk,0)/patients.length) : 0;
    return { total: patients.length, high, moderate, avg };
  },[patients]);

  const riskChart = [
    { name:"Низкий", value:patients.filter(p=>calculateRisk(p).risk < 35).length },
    { name:"Умеренный", value:patients.filter(p=>{ const r = calculateRisk(p).risk; return r >= 35 && r < 65; }).length },
    { name:"Высокий", value:patients.filter(p=>calculateRisk(p).risk >= 65).length }
  ];
  const biomarkerChart = [
    { marker:"IL-1", value:Math.round((patients.reduce((a,p)=>a+Number(p.il1||0),0)/patients.length)*10)/10 },
    { marker:"IL-6", value:Math.round((patients.reduce((a,p)=>a+Number(p.il6||0),0)/patients.length)*10)/10 },
    { marker:"TNF-α", value:Math.round((patients.reduce((a,p)=>a+Number(p.tnf||0),0)/patients.length)*10)/10 },
    { marker:"VEGF", value:Math.round((patients.reduce((a,p)=>a+Number(p.vegf||0),0)/patients.length)*10)/10 },
    { marker:"TGF-β", value:Math.round((patients.reduce((a,p)=>a+Number(p.tgfb||0),0)/patients.length)*10)/10 }
  ];
  const surgeryChart = ["PKP","DALK","DSAEK","DMEK"].map(name => ({ name, value: patients.filter(p=>p.surgeryType === name).length }));

  const openNew = ()=>{
    setForm({ ...emptyPatient, id:`PT-${String(patients.length+1).padStart(3,"0")}`, lastVisit:new Date().toISOString().slice(0,10) });
    setModal(true);
  };
  const save = ()=>{
    if(!form.id || !form.fullName) return;
    const normalized: Patient = {
      ...form,
      age:Number(form.age)||0,
      il1:Number(form.il1)||0,
      il6:Number(form.il6)||0,
      tnf:Number(form.tnf)||0,
      vegf:Number(form.vegf)||0,
      tgfb:Number(form.tgfb)||0
    };
    const exists = patients.some(p=>p.id === form.id);
    setPatients(prev => exists ? prev.map(p=>p.id === form.id ? normalized : p) : [normalized, ...prev]);
    setSelectedId(form.id);
    setModal(false);
  };
  const remove = (id:string)=>{
    const next = patients.filter(p=>p.id !== id);
    setPatients(next);
    setSelectedId(next[0]?.id || "");
  };

  if(!user) return <LoginScreen onLogin={setUser} />;

  return (
    <div className="page">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandIcon"><Eye size={24}/></div>
          <div>
            <div className="brandTitle">Corneal Risk</div>
            <div className="brandSub">Clinical Decision Support</div>
          </div>
        </div>

        <div className="nav">
          {[
            ["dashboard","Дашборд",LayoutDashboard],
            ["patients","Пациенты",UserRound],
            ["analytics","Аналитика",BarChart3],
            ["methodology","Методология",Microscope],
            ["about","О платформе",FileText]
          ].map(([k,l,Icon])=>(
            <button key={String(k)} className={`navBtn ${page===k ? "active" : ""}`} onClick={()=>setPage(String(k))}>
              <Icon size={16}/>{l}
            </button>
          ))}
        </div>

        <div className="profile">
          <div style={{fontWeight:700,color:"#fff"}}>Пользователь</div>
          <div style={{marginTop:6}}>{user.email}</div>
          <div className="tiny" style={{marginTop:12}}>
            Платформа показывает ориентировочную оценку риска и не заменяет клиническое решение врача.
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="container">
          <div className="hero">
            <div className="heroGrid">
              <div>
                <div className="heroBadge"><HeartPulse size={14}/>Corneal Graft Analytics</div>
                <h1 className="heroTitle">Платформа для наблюдения после трансплантации роговицы</h1>
                <div className="heroText">
                  Интерфейс объединяет patient registry, ориентировочную стратификацию риска, динамику лабораторных маркеров
                  и клинические комментарии в одной понятной панели.
                </div>
                <div className="heroActions">
                  <button className="btn outline" onClick={openNew}><Plus size={16}/>Новый пациент</button>
                  <button className="btn outline" onClick={()=>exportReport(selected)}><Download size={16}/>Экспорт отчёта</button>
                </div>
              </div>
              <div className="grid">
                <StatCard title="Пациентов в системе" value={stats.total} caption="Активные клинические записи" icon={Database}/>
                <StatCard title="Высокий риск" value={stats.high} caption="Группа повышенного внимания" icon={ShieldAlert}/>
                <StatCard title="Средняя оценка" value={`${stats.avg}%`} caption="Средний показатель по базе" icon={BrainCircuit}/>
              </div>
            </div>
          </div>

          {page==="dashboard" && selected && selectedRisk && (
            <div className="grid">
              <div className="grid g4">
                <StatCard title="Всего пациентов" value={stats.total} caption="В активной базе" icon={Database}/>
                <StatCard title="Высокий риск" value={stats.high} caption="Требует приоритизации" icon={ShieldAlert}/>
                <StatCard title="Умеренный риск" value={stats.moderate} caption="Нуждается в контроле" icon={Gauge}/>
                <StatCard title="Средний риск" value={`${stats.avg}%`} caption="Сводный показатель" icon={BarChart3}/>
              </div>

              <div className="grid g3">
                <div className="card" style={{gridColumn:"span 2"}}>
                  <h2>Центральная клиническая карточка</h2>
                  <div className="muted small">Структурированная сводка по активному пациенту</div>

                  <div className="grid g2" style={{marginTop:18}}>
                    <div className="grid">
                      <div className="panel">
                        <div style={{display:"flex",justifyContent:"space-between",gap:12}}>
                          <div>
                            <div className="muted small">Активный пациент</div>
                            <div style={{fontSize:26,fontWeight:850,marginTop:6,color:"#fff"}}>{selected.fullName}</div>
                            <div className="muted small">{selected.id} · {selected.age} лет · визит {selected.lastVisit}</div>
                          </div>
                          <div className="brandIcon"><UserRound size={20}/></div>
                        </div>
                      </div>

                      <div className="metricGrid">
                        <div className="metric">
                          <span className="metricTitle">Тип трансплантации</span>
                          <div className="metricValue">{labelize(selected.graftType,{primary:"Первичная",repeat:"Повторная"})}</div>
                        </div>
                        <div className="metric">
                          <span className="metricTitle">Вид операции</span>
                          <div className="metricValue">{selected.surgeryType}</div>
                        </div>
                        <div className="metric">
                          <span className="metricTitle">Неоваскуляризация</span>
                          <div className="metricValue">{labelize(selected.neovascularization,{none:"Нет",moderate:"Умеренная",severe:"Выраженная"})}</div>
                        </div>
                      </div>

                      <div className="callout">
                        <div className="muted small">Клинический комментарий</div>
                        <div style={{marginTop:8,color:"#fff"}}>{selected.notes || "Дополнительные заметки не указаны."}</div>
                      </div>
                    </div>

                    <div className="grid">
                      <div className="panel">
                        <div className="grid g2" style={{alignItems:"center"}}>
                          <RiskGauge value={selectedRisk.risk} label={selectedRisk.level} />
                          <div className="grid">
                            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                              <span className="badge dark">{selectedRisk.level} риск</span>
                              <span className="badge outlineBadge">{selectedRisk.status}</span>
                            </div>
                            <div className="muted small">Ориентировочная шкала риска</div>
                            <div className="progress"><div className="bar" style={{width:`${selectedRisk.risk}%`}} /></div>
                          </div>
                        </div>
                      </div>

                      <div className="markerGrid">
                        {[
                          ["IL-1", selected.il1],
                          ["IL-6", selected.il6],
                          ["TNF-α", selected.tnf],
                          ["VEGF", selected.vegf],
                          ["TGF-β", selected.tgfb]
                        ].map(([label, value]) => (
                          <div key={String(label)} className="marker">
                            <span className="markerTitle">{label}</span>
                            <div className="markerValue">{value}</div>
                          </div>
                        ))}
                      </div>

                      <div className="callout">
                        <div className="muted small">Clinical summary</div>
                        <div style={{marginTop:8,color:"#fff"}}>{selectedSummary}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h2>Быстрые действия</h2>
                  <div className="muted small">Основные сценарии работы с интерфейсом</div>
                  <div className="featureList">
                    <button className="btn" onClick={openNew}><Plus size={16}/>Добавить пациента</button>
                    <button className="btn outline" onClick={()=>exportReport(selected)}><Download size={16}/>Скачать отчёт</button>
                    <button className="btn outline" onClick={()=>setPage("analytics")}><BarChart3 size={16}/>Открыть аналитику</button>
                    <button className="btn outline" onClick={()=>setPage("patients")}><UserRound size={16}/>Открыть реестр</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {page==="patients" && selected && selectedRisk && (
            <div className="grid g3">
              <div className="card">
                <h2>Реестр пациентов</h2>
                <div className="muted small">Поиск, фильтрация и сортировка записей</div>

                <div className="filters">
                  <div className="searchWrap">
                    <Search className="searchIcon" size={16}/>
                    <input className="input searchInput" placeholder="Поиск по ID, ФИО, заметкам" value={query} onChange={e=>setQuery(e.target.value)} />
                  </div>
                  <select className="select" value={riskFilter} onChange={e=>setRiskFilter(e.target.value)}>
                    <option value="all">Все уровни риска</option>
                    <option value="low">Низкий риск</option>
                    <option value="mid">Умеренный риск</option>
                    <option value="high">Высокий риск</option>
                  </select>
                  <select className="select" value={sortBy} onChange={e=>setSortBy(e.target.value)}>
                    <option value="risk-desc">Риск: по убыванию</option>
                    <option value="risk-asc">Риск: по возрастанию</option>
                    <option value="name">По имени</option>
                    <option value="visit">По дате визита</option>
                  </select>
                  <button className="btn outline" onClick={()=>{setQuery("");setRiskFilter("all");setSortBy("risk-desc");}}>
                    <Filter size={16}/>Сброс
                  </button>
                </div>

                <div className="list" style={{marginTop:18}}>
                  {filteredPatients.map((patient)=>{
                    const risk = calculateRisk(patient);
                    return (
                      <button key={patient.id} className={`patientBtn ${selectedId===patient.id ? "active" : ""}`} onClick={()=>setSelectedId(patient.id)}>
                        <div style={{display:"flex",justifyContent:"space-between",gap:10}}>
                          <div>
                            <div style={{fontWeight:700}}>{patient.fullName}</div>
                            <div className="muted small">{patient.id} · {patient.surgeryType} · визит {patient.lastVisit}</div>
                          </div>
                          <RiskBadge risk={risk.risk}/>
                        </div>
                        <div className="muted small" style={{marginTop:8}}>{patient.notes}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="card" style={{gridColumn:"span 2"}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap"}}>
                  <div>
                    <h2>Карточка пациента</h2>
                    <div className="muted small">Структурированные сведения и интерпретация ориентировочного риска</div>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <button className="btn outline" onClick={()=>{setForm(selected);setModal(true);}}>Редактировать</button>
                    <button className="btn danger" onClick={()=>remove(selected.id)}><Trash2 size={16}/>Удалить</button>
                  </div>
                </div>

                <div className="tabs">
                  {[["summary","Сводка"],["markers","Маркеры"],["recommendations","Рекомендации"]].map(([k,l])=>(
                    <button key={k} className={`tab ${tab===k ? "active" : ""}`} onClick={()=>setTab(String(k))}>{l}</button>
                  ))}
                </div>

                {tab==="summary" && (
                  <div className="grid g3" style={{marginTop:18}}>
                    {[
                      ["ФИО", selected.fullName],
                      ["ID", selected.id],
                      ["Возраст", `${selected.age} лет`],
                      ["Пол", selected.sex],
                      ["Тип трансплантации", labelize(selected.graftType,{primary:"Первичная",repeat:"Повторная"})],
                      ["Вид операции", surgeryLabel(selected.surgeryType)],
                      ["Неоваскуляризация", labelize(selected.neovascularization,{none:"Нет",moderate:"Умеренная",severe:"Выраженная"})],
                      ["Предшествующее воспаление", selected.priorInflammation==="yes"?"Да":"Нет"],
                      ["Отторжение в анамнезе", selected.rejectionHistory==="yes"?"Да":"Нет"],
                      ["Дата визита", selected.lastVisit]
                    ].map(([label,value])=>(
                      <div key={String(label)} className="panel">
                        <div className="muted small">{label}</div>
                        <div style={{marginTop:6,fontWeight:700,color:"#fff"}}>{value}</div>
                      </div>
                    ))}
                    <div className="callout" style={{gridColumn:"1 / -1"}}>
                      <div className="muted small">Автоматический clinical summary</div>
                      <div style={{marginTop:8,color:"#fff"}}>{selectedSummary}</div>
                    </div>
                  </div>
                )}

                {tab==="markers" && (
                  <div className="grid" style={{marginTop:18}}>
                    <div className="markerGrid">
                      {[
                        ["IL-1", selected.il1],
                        ["IL-6", selected.il6],
                        ["TNF-α", selected.tnf],
                        ["VEGF", selected.vegf],
                        ["TGF-β", selected.tgfb]
                      ].map(([label,value])=>(
                        <div key={String(label)} className="marker">
                          <span className="markerTitle">{label}</span>
                          <div className="markerValue">{value}</div>
                        </div>
                      ))}
                    </div>
                    <div className="card" style={{padding:18}}>
                      <div className="muted small" style={{marginBottom:10}}>Динамика маркеров по визитам</div>
                      <div style={{height:300}}>
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={trendData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.18)" />
                            <XAxis dataKey="date" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="IL1" name="IL-1" strokeWidth={2} />
                            <Line type="monotone" dataKey="IL6" name="IL-6" strokeWidth={2} />
                            <Line type="monotone" dataKey="TNFa" name="TNF-α" strokeWidth={2} />
                            <Line type="monotone" dataKey="VEGF" name="VEGF" strokeWidth={2} />
                            <Line type="monotone" dataKey="TGFB" name="TGF-β" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {tab==="recommendations" && (
                  <div className="grid g2" style={{marginTop:18}}>
                    <div className="panel">
                      <div className="muted small">Ориентировочная оценка риска</div>
                      <div style={{marginTop:14}}><RiskGauge value={selectedRisk.risk} label={selectedRisk.level} /></div>
                      <div className="muted small" style={{marginTop:6}}>{selectedRisk.level} риск · {selectedRisk.status}</div>
                    </div>
                    <div className="grid">
                      <div className="callout">
                        <div className="muted small">Рекомендация</div>
                        <div style={{marginTop:8,color:"#fff"}}>{selectedRisk.recommendation}</div>
                      </div>
                      <div className="callout">
                        <div className="muted small">Краткий вывод</div>
                        <div style={{marginTop:8,color:"#fff"}}>{selectedSummary}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {page==="analytics" && (
            <div className="grid">
              <div className="grid g2">
                <div className="card">
                  <h2>Распределение по уровням риска</h2>
                  <div className="muted small">Сводная стратификация базы пациентов</div>
                  <div style={{height:320,marginTop:10}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={riskChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.18)" />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis allowDecimals={false} stroke="#94a3b8" />
                        <Tooltip />
                        <Bar dataKey="value" radius={[10,10,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card">
                  <h2>Средние значения биомаркеров</h2>
                  <div className="muted small">Усреднённые лабораторные показатели по базе</div>
                  <div style={{height:320,marginTop:10}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={biomarkerChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.18)" />
                        <XAxis dataKey="marker" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip />
                        <Bar dataKey="value" radius={[10,10,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="grid g2">
                <div className="card">
                  <h2>Распределение по видам операций</h2>
                  <div className="muted small">Структура наблюдений по типам вмешательств</div>
                  <div style={{height:320,marginTop:10}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={surgeryChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.18)" />
                        <XAxis dataKey="name" stroke="#94a3b8" />
                        <YAxis allowDecimals={false} stroke="#94a3b8" />
                        <Tooltip />
                        <Bar dataKey="value" radius={[10,10,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card">
                  <h2>Динамика биомаркеров</h2>
                  <div className="muted small">Пример наблюдения во времени</div>
                  <div style={{height:320,marginTop:10}}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,.18)" />
                        <XAxis dataKey="date" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="IL1" name="IL-1" strokeWidth={2} />
                        <Line type="monotone" dataKey="IL6" name="IL-6" strokeWidth={2} />
                        <Line type="monotone" dataKey="TNFa" name="TNF-α" strokeWidth={2} />
                        <Line type="monotone" dataKey="VEGF" name="VEGF" strokeWidth={2} />
                        <Line type="monotone" dataKey="TGFB" name="TGF-β" strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {page==="methodology" && (
            <div className="grid g3">
              <div className="card" style={{gridColumn:"span 2"}}>
                <h2>Методологические принципы</h2>
                <div className="muted small">Как интерпретировать интерфейс и расчётные блоки</div>
                <div className="grid" style={{marginTop:18}}>
                  {[
                    ["Назначение системы","Платформа помогает структурировать наблюдение и визуализировать совокупность клинических факторов после трансплантации роговицы."],
                    ["Характер оценки","Показатель риска в интерфейсе является ориентировочным и предназначен для демонстрации логики стратификации, а не для автономного клинического решения."],
                    ["Входные параметры","Тип трансплантации, вид операции, неоваскуляризация, воспаление в анамнезе, предыдущие эпизоды отторжения, IL-1, IL-6, TNF-α, VEGF и TGF-β."],
                    ["Перспективы развития","Система может быть расширена до полноценной прогностической модели с backend, базой данных и внешней валидацией."]
                  ].map(([title,text])=>(
                    <div key={String(title)} className="panel">
                      <div style={{fontWeight:700,color:"#fff"}}>{title}</div>
                      <div className="small muted" style={{marginTop:6}}>{text}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h2>Новые улучшения v6</h2>
                <div className="featureList">
                  <div className="featureItem"><WandSparkles size={16} style={{marginRight:8}}/> Визуальная шкала риска</div>
                  <div className="featureItem"><Activity size={16} style={{marginRight:8}}/> Динамика маркеров по визитам</div>
                  <div className="featureItem"><FileText size={16} style={{marginRight:8}}/> Автоматический clinical summary</div>
                </div>
              </div>
            </div>
          )}

          {page==="about" && (
            <div className="grid g2">
              <div className="card">
                <h2>О платформе</h2>
                <div className="grid small muted" style={{marginTop:18}}>
                  <div>Corneal Risk Platform объединяет клинические данные пациента, ориентировочную стратификацию риска и аналитические панели в единой рабочей среде.</div>
                  <div>Интерфейс подходит для демонстрации концепции цифровой поддержки принятия решений в офтальмологии и для презентации логики развития такого продукта.</div>
                  <div>Важный принцип платформы — не подменять врача, а систематизировать сведения и делать клиническую картину более наглядной.</div>
                </div>
              </div>

              <div className="card">
                <h2>Дальнейшее развитие</h2>
                <div className="grid small muted" style={{marginTop:18}}>
                  <div>• Подключение backend и базы данных</div>
                  <div>• Формирование расширенного отчёта</div>
                  <div>• Настройка ролей пользователей</div>
                  <div>• Интеграция с клиническими системами</div>
                  <div>• Валидация на реальном датасете</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {modal && (
        <div className="modalBg">
          <div className="modal">
            <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"start"}}>
              <div>
                <h2 style={{margin:0,color:"#fff"}}>{patients.some(p=>p.id===form.id) ? "Редактирование пациента" : "Новый пациент"}</h2>
                <div className="muted small">Заполните клинические параметры для ориентировочной оценки риска.</div>
              </div>
              <button className="btn outline" onClick={()=>setModal(false)}><X size={16}/></button>
            </div>

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
              <div style={{gridColumn:"1 / -1"}}>
                <label className="label">Клинические заметки</label>
                <textarea className="textarea" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} />
              </div>
            </div>

            <div style={{display:"flex",justifyContent:"end",gap:10,marginTop:18}}>
              <button className="btn outline" onClick={()=>setModal(false)}>Отмена</button>
              <button className="btn" onClick={save}><ClipboardList size={16}/>Сохранить пациента</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
