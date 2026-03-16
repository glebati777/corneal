"use client";

import React, { useEffect, useMemo, useState } from "react";
import SimulationPanel from "./components/SimulationPanel";
import {
  Eye,
  UserRound,
  Search,
  Download,
  Plus,
  Trash2,
  LogIn,
  LayoutDashboard,
  BarChart3,
  Database,
  HeartPulse,
  X,
  Sparkles,
  Gauge,
  BrainCircuit,
  Filter,
  AlertTriangle,
  FileText,
  Microscope,
  ShieldCheck,
  Cpu,
  Activity,
  CalendarDays,
  LineChart,
  ChevronRight,
} from "lucide-react";

type Visit = {
  id: string;
  date: string;
  il1: number;
  il6: number;
  tnf: number;
  vegf: number;
  tgfb: number;
  neovascularization: "none" | "moderate" | "severe";
  priorInflammation: "no" | "yes";
  rejectionHistory: "no" | "yes";
  notes: string;
};

type Patient = {
  id: string;
  fullName: string;
  age: number;
  sex: "М" | "Ж";
  graftType: "primary" | "repeat";
  surgeryType: "PKP" | "DMEK" | "DSAEK" | "DALK";
  visits: Visit[];
};

const STORAGE_KEY = "corneal_platform_v3_clinical";

const starterPatients: Patient[] = [
  {
    id: "PT-001",
    fullName: "Иванов И.И.",
    age: 46,
    sex: "М",
    graftType: "repeat",
    surgeryType: "PKP",
    visits: [
      { id: "V-001-1", date: "2026-01-10", il1: 9, il6: 13, tnf: 7, vegf: 72, tgfb: 41, neovascularization: "moderate", priorInflammation: "yes", rejectionHistory: "yes", notes: "Послеоперационное наблюдение. Сохраняется воспалительный компонент." },
      { id: "V-001-2", date: "2026-02-22", il1: 10, il6: 15, tnf: 8, vegf: 84, tgfb: 44, neovascularization: "severe", priorInflammation: "yes", rejectionHistory: "yes", notes: "Усиление неоваскуляризации. Нужен более частый контроль." },
      { id: "V-001-3", date: "2026-03-10", il1: 12, il6: 17, tnf: 9, vegf: 95, tgfb: 48, neovascularization: "severe", priorInflammation: "yes", rejectionHistory: "yes", notes: "Повторная госпитализация, выраженная васкуляризация." },
    ],
  },
  {
    id: "PT-002",
    fullName: "Петрова А.А.",
    age: 31,
    sex: "Ж",
    graftType: "primary",
    surgeryType: "DMEK",
    visits: [
      { id: "V-002-1", date: "2026-02-01", il1: 4, il6: 5, tnf: 3, vegf: 26, tgfb: 20, neovascularization: "none", priorInflammation: "no", rejectionHistory: "no", notes: "Ранний послеоперационный контроль." },
      { id: "V-002-2", date: "2026-03-12", il1: 3, il6: 4, tnf: 3, vegf: 22, tgfb: 18, neovascularization: "none", priorInflammation: "no", rejectionHistory: "no", notes: "Спокойное течение послеоперационного периода." },
    ],
  },
  {
    id: "PT-003",
    fullName: "Сидоров Д.В.",
    age: 58,
    sex: "М",
    graftType: "repeat",
    surgeryType: "DALK",
    visits: [
      { id: "V-003-1", date: "2026-02-08", il1: 6, il6: 8, tnf: 5, vegf: 49, tgfb: 29, neovascularization: "moderate", priorInflammation: "yes", rejectionHistory: "no", notes: "Сохраняется умеренная воспалительная активность." },
      { id: "V-003-2", date: "2026-03-08", il1: 7, il6: 10, tnf: 6, vegf: 61, tgfb: 35, neovascularization: "moderate", priorInflammation: "yes", rejectionHistory: "no", notes: "Нужна промежуточная оценка лабораторных маркеров и клинической динамики." },
    ],
  },
  {
    id: "PT-004",
    fullName: "Соколова Е.В.",
    age: 39,
    sex: "Ж",
    graftType: "primary",
    surgeryType: "DSAEK",
    visits: [
      { id: "V-004-1", date: "2026-02-15", il1: 4, il6: 6, tnf: 4, vegf: 34, tgfb: 24, neovascularization: "moderate", priorInflammation: "no", rejectionHistory: "no", notes: "Плановый контроль после операции." },
      { id: "V-004-2", date: "2026-03-11", il1: 5, il6: 7, tnf: 4, vegf: 40, tgfb: 26, neovascularization: "moderate", priorInflammation: "no", rejectionHistory: "no", notes: "Плановое наблюдение после эндотелиальной кератопластики." },
    ],
  },
];

const emptyPatient = {
  id: "",
  fullName: "",
  age: 35,
  sex: "М" as "М" | "Ж",
  graftType: "primary" as "primary" | "repeat",
  surgeryType: "PKP" as "PKP" | "DMEK" | "DSAEK" | "DALK",
};

const emptyVisit: Omit<Visit, "id"> = {
  date: new Date().toISOString().slice(0, 10),
  il1: 0,
  il6: 0,
  tnf: 0,
  vegf: 0,
  tgfb: 0,
  neovascularization: "none",
  priorInflammation: "no",
  rejectionHistory: "no",
  notes: "",
};

function clamp(v: number, a: number, b: number) {
  return Math.min(Math.max(v, a), b);
}

function surgeryLabel(code: Patient["surgeryType"]) {
  return {
    PKP: "PKP — сквозная кератопластика",
    DMEK: "DMEK — кератопластика десцеметовой мембраны",
    DSAEK: "DSAEK — задняя послойная эндотелиальная кератопластика",
    DALK: "DALK — глубокая передняя послойная кератопластика",
  }[code];
}

function getLatestVisit(p?: Patient) {
  if (!p || !p.visits.length) return null;
  return [...p.visits].sort((a, b) => b.date.localeCompare(a.date))[0];
}

function riskScoreFromVisit(patient?: Patient, visit?: Visit) {
  if (!patient || !visit) return 0;
  let score = 0;
  if (patient.graftType === "repeat") score += 18;
  if (visit.neovascularization === "moderate") score += 14;
  if (visit.neovascularization === "severe") score += 24;
  if (visit.priorInflammation === "yes") score += 12;
  if (visit.rejectionHistory === "yes") score += 18;
  score += clamp(visit.il1 / 2, 0, 10);
  score += clamp(visit.il6 / 2, 0, 12);
  score += clamp(visit.tnf / 2, 0, 10);
  score += clamp(visit.vegf / 10, 0, 12);
  score += clamp(visit.tgfb / 12, 0, 10);
  return clamp(Math.round(score), 0, 100);
}

function calcRisk(patient?: Patient) {
  const risk = riskScoreFromVisit(patient, getLatestVisit(patient) || undefined);
  return {
    risk,
    level: risk < 35 ? "Низкий" : risk < 65 ? "Умеренный" : "Высокий",
    status: risk < 35 ? "Стабильное наблюдение" : risk < 65 ? "Требует контроля" : "Требует усиленного мониторинга",
  };
}

function calcMlForecast(patient?: Patient) {
  const visit = getLatestVisit(patient);
  if (!patient || !visit) return { probability: 0, classLabel: "Низкая вероятность" };
  const x =
    -4.2 +
    (patient.graftType === "repeat" ? 0.95 : 0) +
    (visit.neovascularization === "moderate" ? 0.7 : 0) +
    (visit.neovascularization === "severe" ? 1.25 : 0) +
    (visit.priorInflammation === "yes" ? 0.62 : 0) +
    (visit.rejectionHistory === "yes" ? 0.9 : 0) +
    visit.il1 * 0.05 +
    visit.il6 * 0.06 +
    visit.tnf * 0.05 +
    visit.vegf * 0.012 +
    visit.tgfb * 0.01;
  const probability = Math.round((1 / (1 + Math.exp(-x))) * 100);
  return {
    probability,
    classLabel: probability < 25 ? "Низкая вероятность" : probability < 55 ? "Промежуточная вероятность" : "Высокая вероятность",
  };
}

function makeExplanation(patient?: Patient) {
  const visit = getLatestVisit(patient);
  if (!patient || !visit) return "Данные для интерпретации отсутствуют.";
  const items: string[] = [];
  if (patient.graftType === "repeat") items.push("повторная трансплантация");
  if (visit.neovascularization === "moderate") items.push("умеренная неоваскуляризация");
  if (visit.neovascularization === "severe") items.push("выраженная неоваскуляризация");
  if (visit.priorInflammation === "yes") items.push("воспалительный анамнез");
  if (visit.rejectionHistory === "yes") items.push("отторжение в анамнезе");
  if (visit.il1 >= 8) items.push("повышение IL-1");
  if (visit.il6 >= 10) items.push("повышение IL-6");
  if (visit.vegf >= 60) items.push("повышение VEGF");
  return `${items.length ? "Наибольший вклад в ориентировочный риск дают: " + items.join(", ") + "." : "Явных факторов усиления риска по текущему визиту не выявлено."} Совокупность параметров формирует ${calcRisk(patient).level.toLowerCase()} профиль риска и требует интерпретации в клиническом контексте.`;
}

function explainFactors(patient?: Patient) {
  const visit = getLatestVisit(patient);
  if (!patient || !visit) return [] as { label: string; value: number }[];
  return [
    { label: "Повторная трансплантация", value: patient.graftType === "repeat" ? 18 : 0 },
    { label: "Неоваскуляризация", value: visit.neovascularization === "severe" ? 24 : visit.neovascularization === "moderate" ? 14 : 0 },
    { label: "Воспалительный анамнез", value: visit.priorInflammation === "yes" ? 12 : 0 },
    { label: "Отторжение в анамнезе", value: visit.rejectionHistory === "yes" ? 18 : 0 },
    { label: "IL-6", value: clamp(visit.il6 / 2, 0, 12) },
    { label: "VEGF", value: clamp(visit.vegf / 10, 0, 12) },
  ].filter((r) => r.value > 0).sort((a, b) => b.value - a.value);
}

function recommendations(patient?: Patient) {
  const risk = calcRisk(patient).risk;
  if (risk >= 65) return ["Усилить частоту клинического наблюдения.", "Повторить оценку воспалительных маркеров в коротком интервале.", "Оценить динамику неоваскуляризации и иммунологической активности."];
  if (risk >= 35) return ["Сократить интервал контрольного визита.", "Повторно оценить IL-6 и VEGF.", "Сопоставить лабораторные данные с клинической картиной."];
  return ["Продолжить стандартное плановое наблюдение.", "Повторно оценить маркеры по обычному протоколу.", "Сохранять контроль клинической стабильности трансплантата."];
}

function heatStatus(name: string, val: number) {
  const t: Record<string, [number, number]> = { "IL-1": [4, 8], "IL-6": [5, 10], "TNF-α": [4, 8], VEGF: [30, 60], "TGF-β": [25, 40] };
  const [m, h] = t[name];
  return val >= h ? "high" : val >= m ? "mid" : "low";
}

function exportReport(patient?: Patient) {
  const visit = getLatestVisit(patient);
  if (!patient || !visit) return;
  const risk = calcRisk(patient);
  const ml = calcMlForecast(patient);
  const html = `<html><head><title>Клинический отчёт</title><style>body{font-family:Arial,sans-serif;padding:40px;color:#111}h1{margin:0 0 12px 0}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:20px 0}.box{border:1px solid #d1d5db;border-radius:12px;padding:14px}</style></head><body><h1>Клинический отчёт</h1><div>Структурированная сводка наблюдения после трансплантации роговицы</div><div class="grid"><div class="box"><strong>Пациент</strong><div>${patient.fullName}</div><div>ID: ${patient.id}</div></div><div class="box"><strong>Дата визита</strong><div>${visit.date}</div><div>${surgeryLabel(patient.surgeryType)}</div></div><div class="box"><strong>Оценка риска</strong><div>${risk.risk}% · ${risk.level}</div></div><div class="box"><strong>Вероятность отторжения</strong><div>${ml.probability}% · ${ml.classLabel}</div></div></div><div class="box"><strong>Биомаркеры</strong><div>IL-1 ${visit.il1} · IL-6 ${visit.il6} · TNF-α ${visit.tnf} · VEGF ${visit.vegf} · TGF-β ${visit.tgfb}</div></div><div class="box" style="margin-top:12px"><strong>Клиническая интерпретация</strong><div style="margin-top:8px">${makeExplanation(patient)}</div></div><script>window.onload=()=>window.print()</script></body></html>`;
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

function StatCard({ title, value, caption, icon: Icon }: { title: string; value: string | number; caption: string; icon: React.ComponentType<any>; }) {
  return <div className="statCard glass"><div className="statTop"><div><div className="muted small">{title}</div><div className="statValue">{value}</div><div className="muted small">{caption}</div></div><div className="iconWrap"><Icon size={20} /></div></div></div>;
}

function RiskGauge({ value, label }: { value: number; label: string }) {
  const angle = `${-90 + (value / 100) * 180}deg`;
  const tone = value >= 65 ? "high" : value >= 35 ? "mid" : "low";
  return <div className="gaugeWrap"><div className={`gaugeShell ${tone}`}><div className="gaugeArc" /><div className="gaugeInner" /><div className="gaugeNeedle" style={{ ["--angle" as any]: angle }} /><div className="gaugeDot" /><div className="gaugeCenterText"><div className="gaugeValue">{value}%</div><div className="gaugeLabel">{label}</div></div><div className="gaugeLabels"><span>НИЗКИЙ</span><span>УМЕРЕННЫЙ</span><span>ВЫСОКИЙ</span></div></div></div>;
}

function TrendChart({ title, visits, getValue }: { title: string; visits: Visit[]; getValue: (v: Visit) => number; }) {
  const ordered = [...visits].sort((a, b) => a.date.localeCompare(b.date));
  const values = ordered.map(getValue);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const points = values.map((v, i) => `${(i / Math.max(values.length - 1, 1)) * 100},${100 - ((v - min) / range) * 100}`).join(" ");
  return <div className="trendCard glass"><div className="trendHeader"><div><div className="muted tiny">{title}</div><div className="trendValue">{values[values.length - 1] ?? 0}</div></div><LineChart size={18} /></div><svg viewBox="0 0 100 100" className="trendSvg" preserveAspectRatio="none"><defs><linearGradient id={`g-${title}`} x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="rgba(16,185,129,1)" /><stop offset="100%" stopColor="rgba(59,130,246,1)" /></linearGradient></defs><polyline fill="none" stroke={`url(#g-${title})`} strokeWidth="4" points={points} strokeLinecap="round" strokeLinejoin="round" /></svg><div className="trendDates">{ordered.map((v) => <span key={v.id}>{v.date.slice(5)}</span>)}</div></div>;
}

function SimpleLine({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);
  const points = values.map((v, i) => `${(i / Math.max(values.length - 1, 1)) * 100},${100 - ((v - min) / range) * 100}`).join(" ");
  return <svg viewBox="0 0 100 100" className="miniSvg" preserveAspectRatio="none"><defs><linearGradient id="miniRisk" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stopColor="rgba(16,185,129,1)" /><stop offset="100%" stopColor="rgba(239,68,68,1)" /></linearGradient></defs><polyline fill="none" stroke="url(#miniRisk)" strokeWidth="4" points={points} strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function CorneaDiagram({ tone }: { tone: "low" | "mid" | "high" }) {
  return <div className={`corneaCard ${tone}`}><div className="corneaOuter"><div className="corneaMiddle"><div className="corneaInner" /></div></div><div className="corneaLegend"><div className="tiny muted">Схема роговицы</div><strong>Визуальная зона оценки</strong><div className="small muted" style={{ marginTop: 6 }}>{tone === "high" ? "Выраженная активность факторов риска." : tone === "mid" ? "Нужен более частый контроль." : "Стабильное наблюдение."}</div></div></div>;
}

function LoginScreen({ onLogin }: { onLogin: (u: { email: string }) => void }) {
  const [email, setEmail] = useState("doctor@clinic.local");
  return <div style={{ minHeight: "100vh", padding: 24 }}><div className="container shellCenter"><div className="grid g2"><div className="card glass"><div className="brand" style={{ marginBottom: 16 }}><div className="brandIcon"><Eye size={24} /></div><div><div className="titleXL">Corneal Risk Platform</div><div className="brandSub">Clinical intelligence interface</div></div></div><div className="grid"><div><label className="label">Email</label><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} /></div><div><label className="label">Пароль</label><input className="input" type="password" value="demo123" readOnly /></div></div><div style={{ marginTop: 20 }}><button className="btn" style={{ width: "100%" }} onClick={() => onLogin({ email })}><LogIn size={16} />Войти в систему</button></div></div><div className="hero heroTall glass"><div className="heroBadge"><Sparkles size={14} />V3 Clinical Edition</div><h1 className="heroTitle">Интерфейс наблюдения уровня clinical-grade</h1><div className="heroText">Визиты в хронологии, график риска во времени, explainable AI и более детальная визуализация клинической картины.</div></div></div></div></div>;
}

export default function Page() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [page, setPage] = useState("dashboard");
  const [tab, setTab] = useState("summary");
  const [patients, setPatients] = useState<Patient[]>(starterPatients);
  const [selectedId, setSelectedId] = useState(starterPatients[0].id);
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortBy, setSortBy] = useState("risk-desc");
  const [patientModal, setPatientModal] = useState(false);
  const [visitModal, setVisitModal] = useState(false);
  const [patientForm, setPatientForm] = useState(emptyPatient);
  const [visitForm, setVisitForm] = useState(emptyVisit);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.patients?.length) {
          setPatients(parsed.patients);
          setSelectedId(parsed.patients[0].id);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ patients })); } catch {}
  }, [patients]);

  const selected = useMemo(() => patients.find((p) => p.id === selectedId) || patients[0], [patients, selectedId]);
  const latestVisit = useMemo(() => getLatestVisit(selected), [selected]);
  const selectedRisk = useMemo(() => calcRisk(selected), [selected]);
  const ml = useMemo(() => calcMlForecast(selected), [selected]);
  const factorRows = useMemo(() => explainFactors(selected), [selected]);
  const riskTimeline = useMemo(() => {
    if (!selected) return [] as { date: string; risk: number }[];
    return [...selected.visits].sort((a, b) => a.date.localeCompare(b.date)).map((v) => ({ date: v.date, risk: riskScoreFromVisit(selected, v) }));
  }, [selected]);
  const futureForecast = useMemo(() => {
    if (!riskTimeline.length) return [] as { label: string; value: number }[];
    const now = riskTimeline[riskTimeline.length - 1].risk;
    const prev = riskTimeline.length > 1 ? riskTimeline[riskTimeline.length - 2].risk : now;
    const delta = clamp(now - prev, -10, 12);
    return [
      { label: "Сейчас", value: now },
      { label: "1 месяц", value: clamp(now + delta * 0.45, 0, 100) },
      { label: "3 месяца", value: clamp(now + delta * 0.9, 0, 100) },
    ];
  }, [riskTimeline]);

  const stats = useMemo(() => {
    const risks = patients.map((p) => calcRisk(p).risk);
    return { total: patients.length, high: risks.filter((r) => r >= 65).length, moderate: risks.filter((r) => r >= 35 && r < 65).length, avg: risks.length ? Math.round(risks.reduce((a, b) => a + b, 0) / risks.length) : 0 };
  }, [patients]);

  const filteredPatients = useMemo(() => {
    let arr = [...patients].filter((p) => [p.id, p.fullName, getLatestVisit(p)?.notes || ""].some((v) => String(v).toLowerCase().includes(query.toLowerCase())));
    if (riskFilter !== "all") {
      arr = arr.filter((p) => {
        const r = calcRisk(p).risk;
        if (riskFilter === "low") return r < 35;
        if (riskFilter === "mid") return r >= 35 && r < 65;
        return r >= 65;
      });
    }
    arr.sort((a, b) => {
      const ra = calcRisk(a).risk;
      const rb = calcRisk(b).risk;
      if (sortBy === "risk-desc") return rb - ra;
      if (sortBy === "risk-asc") return ra - rb;
      if (sortBy === "name") return a.fullName.localeCompare(b.fullName);
      return (getLatestVisit(b)?.date || "").localeCompare(getLatestVisit(a)?.date || "");
    });
    return arr;
  }, [patients, query, riskFilter, sortBy]);

  const heatItems: [string, number][] = latestVisit ? [["IL-1", latestVisit.il1], ["IL-6", latestVisit.il6], ["TNF-α", latestVisit.tnf], ["VEGF", latestVisit.vegf], ["TGF-β", latestVisit.tgfb]] : [];
  const alertTone = selectedRisk.risk >= 65 ? "high" : selectedRisk.risk >= 35 ? "mid" : "low";

  const openPatientModal = () => {
    setPatientForm({ ...emptyPatient, id: `PT-${String(patients.length + 1).padStart(3, "0")}` });
    setPatientModal(true);
  };

  const savePatient = () => {
    if (!patientForm.id || !patientForm.fullName) return;
    const newPatient: Patient = { ...patientForm, visits: [{ ...emptyVisit, id: `V-${patientForm.id}-1`, notes: "Первичный визит после внесения пациента в систему." }] };
    setPatients((prev) => [newPatient, ...prev]);
    setSelectedId(newPatient.id);
    setPatientModal(false);
  };

  const saveVisit = () => {
    if (!selected) return;
    const newVisit: Visit = { ...visitForm, id: `V-${selected.id}-${selected.visits.length + 1}` };
    setPatients((prev) => prev.map((p) => (p.id === selected.id ? { ...p, visits: [...p.visits, newVisit] } : p)));
    setVisitForm(emptyVisit);
    setVisitModal(false);
  };

  const removePatient = (id: string) => {
    const next = patients.filter((p) => p.id !== id);
    setPatients(next);
    setSelectedId(next[0]?.id || "");
  };

  if (!user) return <LoginScreen onLogin={setUser} />;

  return (
    <div className="page">
      <aside className="sidebar">
        <div className="brand"><div className="brandIcon"><Eye size={24} /></div><div><div className="brandTitle">Corneal Risk</div><div className="brandSub">Clinical Decision Support</div></div></div>
        <div className="nav">
          <button className={`navBtn ${page === "dashboard" ? "active" : ""}`} onClick={() => setPage("dashboard")}><LayoutDashboard size={16} />Дашборд</button>
          <button className={`navBtn ${page === "patients" ? "active" : ""}`} onClick={() => setPage("patients")}><UserRound size={16} />Пациенты</button>
          <button className={`navBtn ${page === "analytics" ? "active" : ""}`} onClick={() => setPage("analytics")}><BarChart3 size={16} />Аналитика</button>
          <button className={`navBtn ${page === "methodology" ? "active" : ""}`} onClick={() => setPage("methodology")}><Microscope size={16} />Методология</button>
          <button className={`navBtn ${page === "about" ? "active" : ""}`} onClick={() => setPage("about")}><FileText size={16} />О платформе</button>
        <button className={`navBtn ${page === "research" ? "active" : ""}`} onClick={() => setPage("research")}><Cpu size={16} />Research</button>
        </div>
        <div className="userBox glass"><div style={{ fontWeight: 700, color: "#fff" }}>Пользователь</div><div style={{ marginTop: 6 }}>{user.email}</div><div className="tiny" style={{ marginTop: 12 }}>Оценка риска и прогноз вероятности отторжения в этой версии остаются демонстрационными.</div></div>
      </aside>

      <main className="main">
        <div className="container">
          <div className="hero heroV3 glass">
            <div className="heroBadge"><HeartPulse size={14} />Corneal Graft Analytics V3</div>
            <div className="heroTopLine"><h1 className="heroTitle">Clinical-grade интерфейс наблюдения</h1><div className="heroMiniPanel"><div className="muted tiny">Текущий прогноз</div><strong>{ml.probability}%</strong></div></div>
            <div className="heroText">Timeline визитов, график риска во времени, explainable AI, динамика биомаркеров и более зрелая медицинская подача.</div>
            <div className="heroActions">
              <button className="btn outline" onClick={openPatientModal}><Plus size={16} />Новый пациент</button>
              <button className="btn outline" onClick={() => setVisitModal(true)}><CalendarDays size={16} />Добавить визит</button>
              <button className="btn outline" onClick={() => exportReport(selected)}><Download size={16} />PDF-отчёт</button>
            </div>
          </div>

          <div className="grid g4">
            <StatCard title="Всего пациентов" value={stats.total} caption="В активной базе" icon={Database} />
            <StatCard title="Высокий риск" value={stats.high} caption="Требует приоритизации" icon={AlertTriangle} />
            <StatCard title="Умеренный риск" value={stats.moderate} caption="Нуждается в контроле" icon={Gauge} />
            <StatCard title="Средний риск" value={`${stats.avg}%`} caption="Сводный показатель" icon={BrainCircuit} />
          </div>

          {page === "dashboard" && selected && latestVisit && (
            <div className="grid g3">
              <div className="card glass" style={{ gridColumn: "span 2" }}>
                <div className="sectionTitle"><div><h2>Центральная клиническая карточка V3</h2><div className="muted small">Риск, динамика, факторы, timeline пациента и прогноз в одной панели.</div></div><div className="kpiPill"><ShieldCheck size={14} />Explainable AI</div></div>

                <div className="grid g2" style={{ marginTop: 18 }}>
                  <div className="grid">
                    <div className="panel premiumPanel glass"><div className="headerRow"><div><div className="muted small">Активный пациент</div><div className="titlePatient">{selected.fullName}</div><div className="muted small">{selected.id} · {selected.age} лет · визит {latestVisit.date}</div></div><div className="brandIcon"><UserRound size={20} /></div></div></div>
                    <div className="metricGrid">
                      <div className="metric glass"><span className="metricTitle">Тип трансплантации</span><div className="metricValue">{selected.graftType === "repeat" ? "Повторная" : "Первичная"}</div></div>
                      <div className="metric glass"><span className="metricTitle">Вид операции</span><div className="metricValue">{selected.surgeryType}</div></div>
                      <div className="metric glass"><span className="metricTitle">Неоваскуляризация</span><div className="metricValue">{latestVisit.neovascularization === "severe" ? "Выраженная" : latestVisit.neovascularization === "moderate" ? "Умеренная" : "Нет"}</div></div>
                    </div>
                    <div className={`alertBox ${alertTone}`}><div className="alertTitle"><AlertTriangle size={18} />Клиническое предупреждение</div><div className="small" style={{ marginTop: 8 }}>{selectedRisk.risk >= 65 ? "Высокая ориентировочная вероятность осложнений. Рекомендуется усиленный мониторинг." : selectedRisk.risk >= 35 ? "Есть факторы, требующие более частого наблюдения." : "Текущая картина соответствует стабильному плановому наблюдению."}</div></div>
                    <div className="softCard glass"><div className="headerRow"><div><div className="muted tiny">AI-интерпретация</div><strong>Что влияет на риск</strong></div><Sparkles size={18} /></div><div className="small muted" style={{ marginTop: 10 }}>{makeExplanation(selected)}</div></div>
                    <div className="card glass">
                      <div className="headerRow"><div><div className="muted small">Timeline пациента</div><div className="tiny muted">Хронология визитов и клинических событий</div></div><CalendarDays size={18} /></div>
                      <div className="timelineList" style={{ marginTop: 12 }}>
                        {[...selected.visits].sort((a, b) => b.date.localeCompare(a.date)).map((v) => (
                          <div key={v.id} className="timelineItem timelineV3"><div className="timelineDot" /><div className="timelineDate">{v.date}</div><div><div className="timelineTitle">IL-1 {v.il1} · IL-6 {v.il6} · VEGF {v.vegf}</div><div className="small muted" style={{ marginTop: 4 }}>{v.notes}</div></div></div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid">
                    <div className="panel premiumTopGrid glass">
                      <div className="premiumGaugeBox">
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}><span className="badge dark">{selectedRisk.level} риск</span><span className="badge outlineBadge">{selectedRisk.status}</span></div>
                        <RiskGauge value={selectedRisk.risk} label={selectedRisk.level} />
                        <div className="small muted" style={{ marginTop: 6 }}>Оценка риска</div>
                        <div className="progress" style={{ marginTop: 8 }}><div className="bar" style={{ width: `${selectedRisk.risk}%` }} /></div>
                      </div>
                      <div className="softCard glass compactInfoCard"><div className="headerRow"><div><div className="muted tiny">Вероятность отторжения</div><strong style={{ fontSize: 34 }}>{ml.probability}%</strong><div className="small muted">{ml.classLabel}</div></div><Cpu size={18} /></div><div className="small muted" style={{ marginTop: 10 }}>Прогноз обновляется по последнему визиту и отражает текущую демонстрационную модель вероятности отторжения.</div></div>
                    </div>

                    <div className="grid g2">
                      <TrendChart title="IL-6" visits={selected.visits} getValue={(v) => v.il6} />
                      <TrendChart title="VEGF" visits={selected.visits} getValue={(v) => v.vegf} />
                    </div>

                    <div className="grid g2">
                      <div className="card glass">
                        <div className="headerRow"><div><div className="muted small">Риск во времени</div><div className="tiny muted">Trajectory по визитам</div></div><Activity size={18} /></div>
                        <SimpleLine values={riskTimeline.map((r) => r.risk)} />
                        <div className="trendDates">{riskTimeline.map((r) => <span key={r.date}>{r.date.slice(5)}</span>)}</div>
                        <div className="riskRowTable">{riskTimeline.map((r) => <div key={r.date} className="riskRow"><span>{r.date}</span><strong>{r.risk}%</strong></div>)}</div>
                      </div>
                      <div className="card glass">
                        <div className="headerRow"><div><div className="muted small">Прогноз риска</div><div className="tiny muted">Ориентировочный сценарий на 3 месяца</div></div><BrainCircuit size={18} /></div>
                        <div className="forecastList">{futureForecast.map((row) => <div key={row.label} className="forecastItem"><div className="headerRow"><span>{row.label}</span><strong>{row.value}%</strong></div><div className="progress" style={{ marginTop: 8 }}><div className="bar" style={{ width: `${row.value}%` }} /></div></div>)}</div>
                      </div>
                    </div>

                    <div className="grid g2">
                      <div className="card glass">
                        <div className="headerRow"><div><div className="muted small">Explainable AI</div><div className="tiny muted">Вклад факторов в текущий риск</div></div><Activity size={18} /></div>
                        <div className="factorList">{factorRows.map((r) => <div key={r.label} className="factorRow"><div className="headerRow"><span>{r.label}</span><strong>+{Math.round(r.value)}</strong></div><div className="miniBar"><div className="miniBarFill" style={{ width: `${Math.min((r.value / 24) * 100, 100)}%` }} /></div></div>)}</div>
                      </div>
                      <CorneaDiagram tone={alertTone} />
                    </div>

                    <div className="grid g3">
                      {heatItems.map(([name, value]) => {
                        const s = heatStatus(name, value);
                        return <div key={name} className="heatItem glass"><div className="heatHeader"><span>{name}</span><span className={`statusDot status-${s}`} /></div><div className="heatValue">{value}</div><div className="tiny muted">{s === "high" ? "Высокий" : s === "mid" ? "Промежуточный" : "Низкий"}</div></div>;
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="card glass">
                <h2>Основные действия</h2>
                <div className="muted small">Управление визитами, экспорт и переход к клиническим данным.</div>
                <div className="grid" style={{ marginTop: 18 }}>
                  <button className="btn" onClick={openPatientModal}><Plus size={16} />Добавить пациента</button>
                  <button className="btn outline" onClick={() => setVisitModal(true)}><CalendarDays size={16} />Добавить визит</button>
                  <button className="btn outline" onClick={() => exportReport(selected)}><Download size={16} />Скачать PDF</button>
                  <button className="btn outline" onClick={() => setPage("patients")}><ChevronRight size={16} />Открыть список пациентов</button>
                </div>
              </div>
            </div>
          )}

          {page === "patients" && selected && latestVisit && (
            <div className="grid g3">
              <div className="card glass">
                <h2>Реестр пациентов</h2>
                <div className="muted small">Сортировка по риску, поиск и навигация по повторным визитам.</div>
                <div className="filters">
                  <div className="searchWrap"><Search className="searchIcon" size={16} /><input className="input searchInput" placeholder="Поиск по ID, ФИО, заметкам" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
                  <select className="select" value={riskFilter} onChange={(e) => setRiskFilter(e.target.value)}><option value="all">Все уровни риска</option><option value="low">Низкий риск</option><option value="mid">Умеренный риск</option><option value="high">Высокий риск</option></select>
                  <select className="select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}><option value="risk-desc">Риск: по убыванию</option><option value="risk-asc">Риск: по возрастанию</option><option value="name">По имени</option><option value="visit">По дате визита</option></select>
                  <button className="btn outline" onClick={() => { setQuery(""); setRiskFilter("all"); setSortBy("risk-desc"); }}><Filter size={16} />Сброс</button>
                </div>
                <div className="list" style={{ marginTop: 18 }}>
                  {filteredPatients.map((patient) => {
                    const risk = calcRisk(patient);
                    const visit = getLatestVisit(patient);
                    return <button key={patient.id} className={`patientBtn ${selectedId === patient.id ? "active" : ""}`} onClick={() => setSelectedId(patient.id)}><div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}><div><div className="patientName">{patient.fullName}</div><div className="muted small">{patient.id} · {patient.surgeryType} · визит {visit?.date}</div></div><span className={`badge ${risk.risk >= 65 ? "high" : risk.risk >= 35 ? "mid" : "low"}`}>{risk.risk}%</span></div><div className="muted small" style={{ marginTop: 8 }}>{visit?.notes}</div></button>;
                  })}
                </div>
              </div>

              <div className="card glass" style={{ gridColumn: "span 2" }}>
                <div className="headerRow"><div><h2>Карточка пациента</h2><div className="muted small">Повторные визиты, динамика, риск во времени и рекомендации.</div></div><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}><button className="btn outline" onClick={() => setVisitModal(true)}>Добавить визит</button><button className="btn danger" onClick={() => removePatient(selected.id)}><Trash2 size={16} />Удалить</button></div></div>

                <div className="tabs">
                  <button className={`tab ${tab === "summary" ? "active" : ""}`} onClick={() => setTab("summary")}>Сводка</button>
                  <button className={`tab ${tab === "markers" ? "active" : ""}`} onClick={() => setTab("markers")}>Динамика</button>
                  <button className={`tab ${tab === "recommendations" ? "active" : ""}`} onClick={() => setTab("recommendations")}>Рекомендации</button>
                  <button className={`tab ${tab === "report" ? "active" : ""}`} onClick={() => setTab("report")}>Отчёт</button>
                </div>

                {tab === "summary" && <div className="grid g3" style={{ marginTop: 18 }}>
                  {[
                    ["ФИО", selected.fullName],
                    ["ID", selected.id],
                    ["Возраст", `${selected.age} лет`],
                    ["Пол", selected.sex],
                    ["Тип трансплантации", selected.graftType === "repeat" ? "Повторная" : "Первичная"],
                    ["Вид операции", surgeryLabel(selected.surgeryType)],
                    ["Неоваскуляризация", latestVisit.neovascularization === "severe" ? "Выраженная" : latestVisit.neovascularization === "moderate" ? "Умеренная" : "Нет"],
                    ["Предшествующее воспаление", latestVisit.priorInflammation === "yes" ? "Да" : "Нет"],
                    ["Отторжение в анамнезе", latestVisit.rejectionHistory === "yes" ? "Да" : "Нет"],
                    ["Дата визита", latestVisit.date],
                  ].map(([label, value]) => <div key={String(label)} className="panel glass"><div className="muted small">{label}</div><div style={{ marginTop: 6, fontWeight: 700 }}>{value}</div></div>)}
                  <div className="card glass" style={{ gridColumn: "1 / -1" }}><div className="muted small">Клиническая сводка</div><div style={{ marginTop: 8 }}>{makeExplanation(selected)}</div></div>
                </div>}

                {tab === "markers" && <div className="grid g2" style={{ marginTop: 18 }}>
                  <TrendChart title="IL-1" visits={selected.visits} getValue={(v) => v.il1} />
                  <TrendChart title="IL-6" visits={selected.visits} getValue={(v) => v.il6} />
                  <TrendChart title="TNF-α" visits={selected.visits} getValue={(v) => v.tnf} />
                  <TrendChart title="VEGF" visits={selected.visits} getValue={(v) => v.vegf} />
                  <TrendChart title="TGF-β" visits={selected.visits} getValue={(v) => v.tgfb} />
                  <div className="card glass"><div className="muted small">Таблица визитов</div><div className="visitTable"><div className="visitHead"><span>Дата</span><span>IL-1</span><span>IL-6</span><span>TNF-α</span><span>VEGF</span><span>Риск</span></div>{[...selected.visits].sort((a, b) => b.date.localeCompare(a.date)).map((v) => <div key={v.id} className="visitRow"><span>{v.date}</span><span>{v.il1}</span><span>{v.il6}</span><span>{v.tnf}</span><span>{v.vegf}</span><strong>{riskScoreFromVisit(selected, v)}%</strong></div>)}</div></div>
                </div>}

                {tab === "recommendations" && <div className="grid g2" style={{ marginTop: 18 }}>
                  <div className="grid">
                    <div className="panel glass"><div className="muted small">Ориентировочная оценка риска</div><div style={{ marginTop: 14 }}><RiskGauge value={selectedRisk.risk} label={selectedRisk.level} /></div><div className="muted small" style={{ marginTop: 6 }}>{selectedRisk.level} риск · {selectedRisk.status}</div></div>
                    <div className="softCard glass"><div className="headerRow"><div><div className="muted tiny">AI-объяснение</div><strong>Почему риск изменился</strong></div><Activity size={18} /></div><div className="small muted" style={{ marginTop: 8 }}>{makeExplanation(selected)}</div></div>
                  </div>
                  <div className="grid">
                    <div className="softCard glass"><div className="headerRow"><div><div className="muted tiny">Вероятность отторжения</div><strong>{ml.probability}%</strong></div><Cpu size={18} /></div><div className="progress" style={{ marginTop: 12 }}><div className="bar" style={{ width: `${ml.probability}%` }} /></div><div className="small muted" style={{ marginTop: 8 }}>{ml.classLabel}</div></div>
                    <div className="card glass"><div className="muted small">Рекомендации</div><div className="recoList">{recommendations(selected).map((r, i) => <div key={i} className="recoItem"><span>{r}</span><strong>•</strong></div>)}</div></div>
                  </div>
                </div>}

                {tab === "report" && <div className="reportSheet" style={{ marginTop: 18 }}><h3 style={{ marginTop: 0 }}>Клинический отчёт</h3><div className="small">Структурированная сводка наблюдения после трансплантации роговицы</div><div className="reportMeta"><div className="reportBlock"><strong>Пациент</strong><div>{selected.fullName}</div><div>ID: {selected.id}</div></div><div className="reportBlock"><strong>Дата визита</strong><div>{latestVisit.date}</div><div>{surgeryLabel(selected.surgeryType)}</div></div><div className="reportBlock"><strong>Оценка риска</strong><div>{selectedRisk.risk}% · {selectedRisk.level}</div></div><div className="reportBlock"><strong>Вероятность отторжения</strong><div>{ml.probability}% · {ml.classLabel}</div></div></div><div className="reportBlock" style={{ marginTop: 14 }}><strong>Клиническая интерпретация</strong><div style={{ marginTop: 8 }}>{makeExplanation(selected)}</div></div><div style={{ marginTop: 16 }}><button className="btn" onClick={() => exportReport(selected)}><Download size={16} />Печать / сохранить PDF</button></div></div>}
              </div>
            </div>
          )}

          {page === "analytics" && <div className="grid g2"><div className="card glass"><h2>Аналитический обзор</h2><div className="listCompact" style={{ marginTop: 14 }}><div className="softCard glass"><div className="headerRow"><span>Средний риск по базе</span><strong>{stats.avg}%</strong></div></div><div className="softCard glass"><div className="headerRow"><span>Высокий риск</span><strong>{stats.high}</strong></div></div><div className="softCard glass"><div className="headerRow"><span>Умеренный риск</span><strong>{stats.moderate}</strong></div></div></div></div><div className="card glass"><h2>AI и ML блоки</h2><div className="note" style={{ marginTop: 14 }}>В версии V3 добавлены explainable AI, график риска во времени и ориентировочный прогноз на 3 месяца. Это продуктовый демонстрационный сценарий для следующего этапа разработки.</div></div></div>}

          {page === "methodology" && <div className="grid g2"><div className="card glass"><h2>Методологические принципы</h2><div className="grid small muted" style={{ marginTop: 18 }}><div>Платформа показывает текущий срез и динамику маркеров по повторным визитам.</div><div>При добавлении нового визита автоматически пересчитываются риск, прогноз вероятности отторжения и AI-интерпретация.</div><div>Текущая модель остаётся демонстрационной и не заменяет решение врача.</div></div></div><div className="card glass"><h2>Что важно для следующего этапа</h2><div className="grid small muted" style={{ marginTop: 18 }}><div>Подключение backend и базы данных визитов.</div><div>Импорт лабораторных значений и автоматическое заполнение маркеров.</div><div>Внешняя клиническая валидация ML-модели на реальных данных.</div></div></div></div>}

          {page === "about" && <div className="grid g2"><div className="card glass"><h2>О платформе</h2><div className="grid small muted" style={{ marginTop: 18 }}><div>Corneal Risk Platform V3 объединяет карточку пациента, историю визитов, графики динамики, trajectory риска и автоматическую интерпретацию данных.</div><div>Интерфейс создавался как продуктовый демонстрационный прототип с дорогой, спокойной и современной медицинской подачей.</div></div></div><div className="card glass"><h2>Назначение</h2><div className="grid small muted" style={{ marginTop: 18 }}><div>Учебная, исследовательская и демонстрационная работа с клиническими сценариями наблюдения.</div><div>Подготовка логики для следующего шага — реальной платформы с backend, базой данных и ML-моделью.</div></div></div></div>}
        </div>
      </main>

      {patientModal && <div className="modalBg"><div className="modal glass"><div className="headerRow"><div><h2 style={{ margin: 0, color: "#fff" }}>Новый пациент</h2><div className="muted small">Создание карточки пациента для дальнейшего наблюдения.</div></div><button className="btn outline" onClick={() => setPatientModal(false)}><X size={16} /></button></div><div className="grid g3" style={{ marginTop: 20 }}><div><label className="label">ID пациента</label><input className="input" value={patientForm.id} onChange={(e) => setPatientForm({ ...patientForm, id: e.target.value })} /></div><div><label className="label">ФИО</label><input className="input" value={patientForm.fullName} onChange={(e) => setPatientForm({ ...patientForm, fullName: e.target.value })} /></div><div><label className="label">Возраст</label><input className="input" type="number" value={patientForm.age} onChange={(e) => setPatientForm({ ...patientForm, age: Number(e.target.value) })} /></div><div><label className="label">Пол</label><select className="select" value={patientForm.sex} onChange={(e) => setPatientForm({ ...patientForm, sex: e.target.value as "М" | "Ж" })}><option value="М">М</option><option value="Ж">Ж</option></select></div><div><label className="label">Тип трансплантации</label><select className="select" value={patientForm.graftType} onChange={(e) => setPatientForm({ ...patientForm, graftType: e.target.value as "primary" | "repeat" })}><option value="primary">Первичная</option><option value="repeat">Повторная</option></select></div><div><label className="label">Вид операции</label><select className="select" value={patientForm.surgeryType} onChange={(e) => setPatientForm({ ...patientForm, surgeryType: e.target.value as Patient["surgeryType"] })}><option value="PKP">PKP</option><option value="DALK">DALK</option><option value="DSAEK">DSAEK</option><option value="DMEK">DMEK</option></select></div></div><div style={{ display: "flex", justifyContent: "end", gap: 10, marginTop: 18 }}><button className="btn outline" onClick={() => setPatientModal(false)}>Отмена</button><button className="btn" onClick={savePatient}>Сохранить пациента</button></div></div></div>}

      {visitModal && selected && <div className="modalBg"><div className="modal glass"><div className="headerRow"><div><h2 style={{ margin: 0, color: "#fff" }}>Новый визит</h2><div className="muted small">Добавление новых значений маркеров с автоматическим перерасчётом риска.</div></div><button className="btn outline" onClick={() => setVisitModal(false)}><X size={16} /></button></div><div className="grid g3" style={{ marginTop: 20 }}><div><label className="label">Дата визита</label><input className="input" type="date" value={visitForm.date} onChange={(e) => setVisitForm({ ...visitForm, date: e.target.value })} /></div><div><label className="label">IL-1</label><input className="input" type="number" value={visitForm.il1} onChange={(e) => setVisitForm({ ...visitForm, il1: Number(e.target.value) })} /></div><div><label className="label">IL-6</label><input className="input" type="number" value={visitForm.il6} onChange={(e) => setVisitForm({ ...visitForm, il6: Number(e.target.value) })} /></div><div><label className="label">TNF-α</label><input className="input" type="number" value={visitForm.tnf} onChange={(e) => setVisitForm({ ...visitForm, tnf: Number(e.target.value) })} /></div><div><label className="label">VEGF</label><input className="input" type="number" value={visitForm.vegf} onChange={(e) => setVisitForm({ ...visitForm, vegf: Number(e.target.value) })} /></div><div><label className="label">TGF-β</label><input className="input" type="number" value={visitForm.tgfb} onChange={(e) => setVisitForm({ ...visitForm, tgfb: Number(e.target.value) })} /></div><div><label className="label">Неоваскуляризация</label><select className="select" value={visitForm.neovascularization} onChange={(e) => setVisitForm({ ...visitForm, neovascularization: e.target.value as Visit["neovascularization"] })}><option value="none">Нет</option><option value="moderate">Умеренная</option><option value="severe">Выраженная</option></select></div><div><label className="label">Предшествующее воспаление</label><select className="select" value={visitForm.priorInflammation} onChange={(e) => setVisitForm({ ...visitForm, priorInflammation: e.target.value as Visit["priorInflammation"] })}><option value="no">Нет</option><option value="yes">Да</option></select></div><div><label className="label">Отторжение в анамнезе</label><select className="select" value={visitForm.rejectionHistory} onChange={(e) => setVisitForm({ ...visitForm, rejectionHistory: e.target.value as Visit["rejectionHistory"] })}><option value="no">Нет</option><option value="yes">Да</option></select></div><div style={{ gridColumn: "1 / -1" }}><label className="label">Клинические заметки</label><textarea className="textarea" value={visitForm.notes} onChange={(e) => setVisitForm({ ...visitForm, notes: e.target.value })} /></div></div><div style={{ display: "flex", justifyContent: "end", gap: 10, marginTop: 18 }}><button className="btn outline" onClick={() => setVisitModal(false)}>Отмена</button><button className="btn" onClick={saveVisit}>Сохранить визит</button></div></div></div>}
    </div>
  );
}
