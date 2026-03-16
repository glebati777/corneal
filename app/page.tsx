"use client";

import React, { useEffect, useMemo, useState } from "react";
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
} from "lucide-react";

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

const STORAGE_KEY = "corneal_platform_final_v1";

const starterPatients: Patient[] = [
  {
    id: "PT-001",
    fullName: "Иванов И.И.",
    age: 46,
    sex: "М",
    graftType: "repeat",
    surgeryType: "PKP",
    neovascularization: "severe",
    priorInflammation: "yes",
    rejectionHistory: "yes",
    il1: 12,
    il6: 17,
    tnf: 9,
    vegf: 95,
    tgfb: 48,
    notes: "Повторная госпитализация, выраженная васкуляризация.",
    lastVisit: "2026-03-10",
  },
  {
    id: "PT-002",
    fullName: "Петрова А.А.",
    age: 31,
    sex: "Ж",
    graftType: "primary",
    surgeryType: "DMEK",
    neovascularization: "none",
    priorInflammation: "no",
    rejectionHistory: "no",
    il1: 3,
    il6: 4,
    tnf: 3,
    vegf: 22,
    tgfb: 18,
    notes: "Спокойное течение послеоперационного периода.",
    lastVisit: "2026-03-12",
  },
  {
    id: "PT-003",
    fullName: "Сидоров Д.В.",
    age: 58,
    sex: "М",
    graftType: "repeat",
    surgeryType: "DALK",
    neovascularization: "moderate",
    priorInflammation: "yes",
    rejectionHistory: "no",
    il1: 7,
    il6: 10,
    tnf: 6,
    vegf: 61,
    tgfb: 35,
    notes: "Нужна промежуточная оценка лабораторных маркеров и клинической динамики.",
    lastVisit: "2026-03-08",
  },
  {
    id: "PT-004",
    fullName: "Соколова Е.В.",
    age: 39,
    sex: "Ж",
    graftType: "primary",
    surgeryType: "DSAEK",
    neovascularization: "moderate",
    priorInflammation: "no",
    rejectionHistory: "no",
    il1: 5,
    il6: 7,
    tnf: 4,
    vegf: 40,
    tgfb: 26,
    notes: "Плановое наблюдение после эндотелиальной кератопластики.",
    lastVisit: "2026-03-11",
  },
];

const emptyPatient: Patient = {
  id: "",
  fullName: "",
  age: "",
  sex: "М",
  graftType: "primary",
  surgeryType: "PKP",
  neovascularization: "none",
  priorInflammation: "no",
  rejectionHistory: "no",
  il1: "",
  il6: "",
  tnf: "",
  vegf: "",
  tgfb: "",
  notes: "",
  lastVisit: new Date().toISOString().slice(0, 10),
};

function clamp(v: number, a: number, b: number) {
  return Math.min(Math.max(v, a), b);
}

function sigmoid(x: number) {
  return 1 / (1 + Math.exp(-x));
}

function labelize(code: string, map: Record<string, string>) {
  return map[code] || code;
}

function surgeryLabel(code: string) {
  return labelize(code, {
    PKP: "PKP — сквозная кератопластика",
    DMEK: "DMEK — кератопластика десцеметовой мембраны",
    DSAEK: "DSAEK — задняя послойная эндотелиальная кератопластика",
    DALK: "DALK — глубокая передняя послойная кератопластика",
  });
}

function calcRisk(patient: Patient) {
  let score = 0;

  if (patient.graftType === "repeat") score += 18;
  if (patient.neovascularization === "moderate") score += 14;
  if (patient.neovascularization === "severe") score += 24;
  if (patient.priorInflammation === "yes") score += 12;
  if (patient.rejectionHistory === "yes") score += 18;

  score += clamp((Number(patient.il1) || 0) / 2, 0, 10);
  score += clamp((Number(patient.il6) || 0) / 2, 0, 12);
  score += clamp((Number(patient.tnf) || 0) / 2, 0, 10);
  score += clamp((Number(patient.vegf) || 0) / 10, 0, 12);
  score += clamp((Number(patient.tgfb) || 0) / 12, 0, 10);

  const risk = clamp(Math.round(score), 0, 100);

  return {
    risk,
    level: risk < 35 ? "Низкий" : risk < 65 ? "Умеренный" : "Высокий",
    status:
      risk < 35
        ? "Стабильное наблюдение"
        : risk < 65
        ? "Усиленный мониторинг"
        : "Повышенное внимание",
  };
}

function calcMlForecast(patient: Patient) {
  const x =
    -4.2 +
    (patient.graftType === "repeat" ? 0.95 : 0) +
    (patient.neovascularization === "moderate" ? 0.7 : 0) +
    (patient.neovascularization === "severe" ? 1.25 : 0) +
    (patient.priorInflammation === "yes" ? 0.62 : 0) +
    (patient.rejectionHistory === "yes" ? 0.9 : 0) +
    (Number(patient.il1) || 0) * 0.05 +
    (Number(patient.il6) || 0) * 0.06 +
    (Number(patient.tnf) || 0) * 0.05 +
    (Number(patient.vegf) || 0) * 0.012 +
    (Number(patient.tgfb) || 0) * 0.01;

  const probability = Math.round(sigmoid(x) * 100);

  return {
    probability,
    classLabel:
      probability < 25
        ? "Низкая вероятность"
        : probability < 55
        ? "Промежуточная вероятность"
        : "Высокая вероятность",
  };
}

function explanation(p: Patient) {
  const items: string[] = [];

  if (p.graftType === "repeat") items.push("повторная трансплантация");
  if (p.neovascularization === "moderate") items.push("умеренная неоваскуляризация");
  if (p.neovascularization === "severe") items.push("выраженная неоваскуляризация");
  if (p.priorInflammation === "yes") items.push("воспалительный анамнез");
  if (p.rejectionHistory === "yes") items.push("отторжение в анамнезе");
  if (Number(p.il1) >= 8) items.push("повышение IL-1");
  if (Number(p.il6) >= 10) items.push("повышение IL-6");
  if (Number(p.vegf) >= 60) items.push("повышение VEGF");

  return `${
    items.length
      ? "Наибольший вклад в ориентировочный риск дают: " + items.join(", ") + "."
      : "Выраженных факторов повышения риска не выявлено."
  } Совокупность параметров формирует ${
    calcRisk(p).level.toLowerCase()
  } профиль риска и требует интерпретации в клиническом контексте.`;
}

function recommendations(p: Patient) {
  const r = calcRisk(p).risk;

  if (r >= 65) {
    return [
      "Усилить частоту клинического наблюдения.",
      "Повторить оценку воспалительных маркеров в коротком интервале.",
      "Оценить динамику неоваскуляризации и иммунологической активности.",
    ];
  }

  if (r >= 35) {
    return [
      "Сократить интервал контрольного визита.",
      "Повторно оценить IL-6 и VEGF.",
      "Сопоставить лабораторные данные с клинической картиной.",
    ];
  }

  return [
    "Продолжить стандартное плановое наблюдение.",
    "Повторно оценить маркеры по обычному протоколу.",
    "Сохранять контроль клинической стабильности трансплантата.",
  ];
}

function heatStatus(name: string, val: number) {
  const t: Record<string, [number, number]> = {
    "IL-1": [4, 8],
    "IL-6": [5, 10],
    "TNF-α": [4, 8],
    VEGF: [30, 60],
    "TGF-β": [25, 40],
  };

  const [m, h] = t[name];
  return val >= h ? "high" : val >= m ? "mid" : "low";
}

function exportReport(p?: Patient) {
  if (!p) return;

  const risk = calcRisk(p);
  const ml = calcMlForecast(p);

  const html = `
    <html>
      <head>
        <title>Клинический отчёт</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; color: #111; }
          h1 { margin: 0 0 12px 0; }
          .grid { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:20px 0; }
          .box { border:1px solid #d1d5db; border-radius:12px; padding:14px; }
        </style>
      </head>
      <body>
        <h1>Клинический отчёт</h1>
        <div>Структурированная сводка наблюдения после трансплантации роговицы</div>

        <div class="grid">
          <div class="box"><strong>Пациент</strong><div>${p.fullName}</div><div>ID: ${p.id}</div></div>
          <div class="box"><strong>Дата визита</strong><div>${p.lastVisit}</div><div>${surgeryLabel(
    p.surgeryType
  )}</div></div>
          <div class="box"><strong>Оценка риска</strong><div>${risk.risk}% · ${risk.level}</div></div>
          <div class="box"><strong>Вероятность отторжения</strong><div>${ml.probability}% · ${
    ml.classLabel
  }</div></div>
        </div>

        <div class="box">
          <strong>Биомаркеры</strong>
          <div>IL-1 ${p.il1} · IL-6 ${p.il6} · TNF-α ${p.tnf} · VEGF ${p.vegf} · TGF-β ${p.tgfb}</div>
        </div>

        <div class="box" style="margin-top:12px">
          <strong>Клиническая интерпретация</strong>
          <div style="margin-top:8px">${explanation(p)}</div>
        </div>

        <script>window.onload = () => window.print()</script>
      </body>
    </html>
  `;

  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(html);
  w.document.close();
}

function RiskGauge({ value, label }: { value: number; label: string }) {
  const angle = `${-90 + (value / 100) * 180}deg`;
  const gaugeClass = value >= 65 ? "high" : value >= 35 ? "mid" : "low";

  return (
    <div className="gaugeWrap">
      <div className={`gaugeShell ${gaugeClass}`}>
        <div className="gaugeArc" />
        <div className="gaugeInner" />
        <div className="gaugeNeedle" style={{ ["--angle" as any]: angle }} />
        <div className="gaugeDot" />
        <div className="gaugeCenterText">
          <div className="gaugeValue">{value}%</div>
          <div className="gaugeLabel">{label}</div>
        </div>
        <div className="gaugeLabels">
          <span>НИЗКИЙ</span>
          <span>УМЕРЕННЫЙ</span>
          <span>ВЫСОКИЙ</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  caption,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  caption: string;
  icon: any;
}) {
  return (
    <div className="statCard">
      <div className="statTop">
        <div>
          <div className="muted small">{title}</div>
          <div className="statValue">{value}</div>
          <div className="muted small">{caption}</div>
        </div>
        <div className="iconWrap">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}

function LoginScreen({
  onLogin,
}: {
  onLogin: (u: { email: string }) => void;
}) {
  const [email, setEmail] = useState("doctor@clinic.local");

  return (
    <div style={{ minHeight: "100vh", padding: 24 }}>
      <div
        className="container"
        style={{ maxWidth: 1240, minHeight: "calc(100vh - 48px)", alignItems: "center" }}
      >
        <div className="grid g2">
          <div className="card">
            <div className="brand" style={{ marginBottom: 16 }}>
              <div className="brandIcon">
                <Eye size={24} />
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#fff" }}>
                  Corneal Risk Platform
                </div>
                <div className="brandSub">Clinical intelligence interface</div>
              </div>
            </div>

            <div className="grid">
              <div>
                <label className="label">Email</label>
                <input
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Пароль</label>
                <input className="input" type="password" value="demo123" readOnly />
              </div>
            </div>

            <div style={{ marginTop: 20 }}>
              <button className="btn" style={{ width: "100%" }} onClick={() => onLogin({ email })}>
                <LogIn size={16} />
                Войти в систему
              </button>
            </div>
          </div>

          <div className="hero">
            <div className="heroBadge">
              <Sparkles size={14} />
              Clinical AI Dashboard
            </div>
            <h1 className="heroTitle">Corneal Risk Platform</h1>
            <div className="heroText">
              Интерфейс для мониторинга пациентов после трансплантации роговицы с
              акцентом на аккуратную медицинскую подачу, автоматическую интерпретацию
              показателей и демонстрационный прогноз вероятности отторжения.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [page, setPage] = useState("dashboard");
  const [patients, setPatients] = useState<Patient[]>(starterPatients);
  const [selectedId, setSelectedId] = useState(starterPatients[0].id);
  const [query, setQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState("all");
  const [sortBy, setSortBy] = useState("risk-desc");
  const [tab, setTab] = useState("summary");
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Patient>(emptyPatient);

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
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ patients }));
    } catch {}
  }, [patients]);

  const selected = useMemo(
    () => patients.find((p) => p.id === selectedId) || patients[0],
    [patients, selectedId]
  );

  const selectedRisk = useMemo(
    () => (selected ? calcRisk(selected) : null),
    [selected]
  );

  const ml = useMemo(
    () => (selected ? calcMlForecast(selected) : null),
    [selected]
  );

  const stats = useMemo(
    () => ({
      total: patients.length,
      high: patients.filter((p) => calcRisk(p).risk >= 65).length,
      moderate: patients.filter((p) => {
        const r = calcRisk(p).risk;
        return r >= 35 && r < 65;
      }).length,
      avg: patients.length
        ? Math.round(patients.reduce((s, p) => s + calcRisk(p).risk, 0) / patients.length)
        : 0,
    }),
    [patients]
  );

  const openNew = () => {
    setForm({
      ...emptyPatient,
      id: `PT-${String(patients.length + 1).padStart(3, "0")}`,
      lastVisit: new Date().toISOString().slice(0, 10),
    });
    setModal(true);
  };

  const save = () => {
    if (!form.id || !form.fullName) return;

    const normalized: Patient = {
      ...form,
      age: Number(form.age) || 0,
      il1: Number(form.il1) || 0,
      il6: Number(form.il6) || 0,
      tnf: Number(form.tnf) || 0,
      vegf: Number(form.vegf) || 0,
      tgfb: Number(form.tgfb) || 0,
    };

    const exists = patients.some((p) => p.id === form.id);

    setPatients((prev) =>
      exists ? prev.map((p) => (p.id === form.id ? normalized : p)) : [normalized, ...prev]
    );

    setSelectedId(form.id);
    setModal(false);
  };

  const remove = (id: string) => {
    const next = patients.filter((p) => p.id !== id);
    setPatients(next);
    setSelectedId(next[0]?.id || "");
  };


  const filteredPatients = useMemo(() => {
    let arr = [...patients].filter((p) =>
      [p.id, p.fullName, p.notes].some((v) =>
        String(v).toLowerCase().includes(query.toLowerCase())
      )
    );

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

      return String(b.lastVisit).localeCompare(String(a.lastVisit));
    });

    return arr;
  }, [patients, query, riskFilter, sortBy]);

  const alertClass =
    selectedRisk && selectedRisk.risk >= 65
      ? "high"
      : selectedRisk && selectedRisk.risk >= 35
      ? "mid"
      : "low";

  const heatItems: [string, number][] = [
    ["IL-1", Number(selected?.il1 || 0)],
    ["IL-6", Number(selected?.il6 || 0)],
    ["TNF-α", Number(selected?.tnf || 0)],
    ["VEGF", Number(selected?.vegf || 0)],
    ["TGF-β", Number(selected?.tgfb || 0)],
  ];

  if (!user) return <LoginScreen onLogin={setUser} />;
  
  return (
    <div className="page">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandIcon">
            <Eye size={24} />
          </div>
          <div>
            <div className="brandTitle">Corneal Risk</div>
            <div className="brandSub">Clinical Decision Support</div>
          </div>
        </div>

        <div className="nav">
          <button
            className={`navBtn ${page === "dashboard" ? "active" : ""}`}
            onClick={() => setPage("dashboard")}
          >
            <LayoutDashboard size={16} />
            Дашборд
          </button>
          <button
            className={`navBtn ${page === "patients" ? "active" : ""}`}
            onClick={() => setPage("patients")}
          >
            <UserRound size={16} />
            Пациенты
          </button>
          <button
            className={`navBtn ${page === "analytics" ? "active" : ""}`}
            onClick={() => setPage("analytics")}
          >
            <BarChart3 size={16} />
            Аналитика
          </button>
          <button
            className={`navBtn ${page === "methodology" ? "active" : ""}`}
            onClick={() => setPage("methodology")}
          >
            <Microscope size={16} />
            Методология
          </button>
          <button
            className={`navBtn ${page === "about" ? "active" : ""}`}
            onClick={() => setPage("about")}
          >
            <FileText size={16} />
            О платформе
          </button>
        </div>

        <div className="userBox">
          <div style={{ fontWeight: 700, color: "#fff" }}>Пользователь</div>
          <div style={{ marginTop: 6 }}>{user.email}</div>
          <div className="tiny" style={{ marginTop: 12 }}>
            Оценка риска и прогноз вероятности отторжения в этой демонстрационной версии
            не являются клинически валидированными моделями.
          </div>
        </div>
      </aside>

      <main className="main">
        <div className="container">
          <div className="hero">
            <div className="heroBadge">
              <HeartPulse size={14} />
              Corneal Graft Analytics
            </div>
            <h1 className="heroTitle">Платформа для наблюдения после трансплантации роговицы</h1>
            <div className="heroText">
              Аккуратная цифровая платформа: реестр пациентов, ориентировочная
              стратификация риска, автоматическая интерпретация показателей и
              демонстрационный ML-прогноз вероятности отторжения.
            </div>
            <div className="heroActions">
              <button className="btn outline" onClick={openNew}>
                <Plus size={16} />
                Новый пациент
              </button>
              <button className="btn outline" onClick={() => exportReport(selected)}>
                <Download size={16} />
                PDF-отчёт
              </button>
            </div>

            <div className="grid g4" style={{ marginTop: 22 }}>
              <div className="statMini">
                <span className="muted tiny">Risk engine</span>
                <strong>Live</strong>
                <span className="tiny muted">Оценка обновляется по данным пациента</span>
              </div>
              <div className="statMini">
                <span className="muted tiny">Clinical markers</span>
                <strong>5</strong>
                <span className="tiny muted">IL-1, IL-6, TNF-α, VEGF, TGF-β</span>
              </div>
              <div className="statMini">
                <span className="muted tiny">Operation types</span>
                <strong>4</strong>
                <span className="tiny muted">PKP, DALK, DSAEK, DMEK</span>
              </div>
              <div className="statMini">
                <span className="muted tiny">ML forecast</span>
                <strong>{ml?.probability ?? 0}%</strong>
                <span className="tiny muted">Demo rejection probability</span>
              </div>
            </div>
          </div>

          {page === "dashboard" && selected && selectedRisk && ml && (
            <>
              <div className="grid g4">
                <StatCard
                  title="Всего пациентов"
                  value={stats.total}
                  caption="В активной базе"
                  icon={Database}
                />
                <StatCard
                  title="Высокий риск"
                  value={stats.high}
                  caption="Требует приоритизации"
                  icon={AlertTriangle}
                />
                <StatCard
                  title="Умеренный риск"
                  value={stats.moderate}
                  caption="Нуждается в контроле"
                  icon={Gauge}
                />
                <StatCard
                  title="Средний риск"
                  value={`${stats.avg}%`}
                  caption="Сводный показатель"
                  icon={BrainCircuit}
                />
              </div>

              <div className="grid g3">
                <div className="card" style={{ gridColumn: "span 2" }}>
                  <div className="sectionTitle">
                    <div>
                      <h2>Центральная клиническая карточка</h2>
                      <div className="muted small">
                        Ключевые клинические параметры, оценка риска, прогноз вероятности
                        отторжения и клиническая интерпретация в одной панели
                      </div>
                    </div>
                    <div className="kpiPill">
                      <ShieldCheck size={14} />
                      Демонстрационная модель
                    </div>
                  </div>

                  <div className="grid g2" style={{ marginTop: 18 }}>
                    <div className="grid">
                      <div className="panel">
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                          <div>
                            <div className="muted small">Активный пациент</div>
                            <div style={{ fontSize: 26, fontWeight: 850, marginTop: 6 }}>
                              {selected.fullName}
                            </div>
                            <div className="muted small">
                              {selected.id} · {selected.age} лет · визит {selected.lastVisit}
                            </div>
                          </div>
                          <div className="brandIcon">
                            <UserRound size={20} />
                          </div>
                        </div>
                      </div>

                      <div className="metricGrid">
                        <div className="metric">
                          <span className="metricTitle">Тип трансплантации</span>
                          <div className="metricValue">
                            {labelize(selected.graftType, {
                              primary: "Первичная",
                              repeat: "Повторная",
                            })}
                          </div>
                        </div>
                        <div className="metric">
                          <span className="metricTitle">Вид операции</span>
                          <div className="metricValue">{selected.surgeryType}</div>
                        </div>
                        <div className="metric">
                          <span className="metricTitle">Неоваскуляризация</span>
                          <div className="metricValue">
                            {labelize(selected.neovascularization, {
                              none: "Нет",
                              moderate: "Умеренная",
                              severe: "Выраженная",
                            })}
                          </div>
                        </div>
                      </div>

                      <div className={`alertBox ${alertClass}`}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800 }}>
                          <AlertTriangle size={18} />
                          Клиническое предупреждение
                        </div>
                        <div className="small" style={{ marginTop: 8 }}>
                          {selectedRisk.risk >= 65
                            ? "Высокая ориентировочная вероятность иммунологического осложнения. Рекомендуется усиленный мониторинг."
                            : selectedRisk.risk >= 35
                            ? "Есть факторы, требующие более частого наблюдения."
                            : "Текущая картина соответствует стабильному наблюдению."}
                        </div>
                      </div>

                      <div className="softCard glowBlue compactInfoCard">
                        <div className="headerRow">
                          <div>
                            <div className="muted tiny">Вероятность отторжения</div>
                            <strong style={{ fontSize: 34 }}>{ml.probability}%</strong>
                            <div className="small muted">{ml.classLabel}</div>
                          </div>
                          <div className="iconWrap">
                            <Cpu size={18} />
                          </div>
                        </div>
                        <div className="progress" style={{ marginTop: 14 }}>
                          <div className="bar" style={{ width: `${ml.probability}%` }} />
                        </div>
                        <div className="note" style={{ marginTop: 12 }}>
                          Это демонстрационная логистическая модель без клинической
                          валидации. Она показывает, как может выглядеть модуль прогноза
                          внутри цифровой платформы.
                        </div>
                      </div>

                      <div className="card">
                        <div className="muted small">Patient Timeline</div>
                        <div className="timelineList">
                          {[
                            {
                              date: selected.lastVisit,
                              title: "Последний визит",
                              text: `Контроль после операции. IL-1 ${selected.il1}, IL-6 ${selected.il6}, TNF-α ${selected.tnf}.`,
                            },
                            {
                              date: "2026-02-22",
                              title: "Оценка воспалительной активности",
                              text:
                                selected.priorInflammation === "yes"
                                  ? "Сохраняются данные за воспалительный компонент."
                                  : "Значимого воспалительного компонента не отмечено.",
                            },
                            {
                              date: "2026-01-10",
                              title: "Операция",
                              text: surgeryLabel(selected.surgeryType),
                            },
                          ].map((it, idx) => (
                            <div key={idx} className="timelineItem">
                              <div className="timelineDate">{it.date}</div>
                              <div>
                                <div className="timelineTitle">{it.title}</div>
                                <div className="small muted" style={{ marginTop: 4 }}>
                                  {it.text}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid">
                      <div className="panel premiumTopGrid">
                        <div className="premiumGaugeBox">
                          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
                            <span className="badge dark">{selectedRisk.level} риск</span>
                            <span className="badge outlineBadge">{selectedRisk.status}</span>
                          </div>
                          <RiskGauge value={selectedRisk.risk} label={selectedRisk.level} />
                          <div className="small muted" style={{ marginTop: 2 }}>
                            Оценка риска
                          </div>
                          <div className="progress" style={{ marginTop: 8 }}>
                            <div className="bar" style={{ width: `${selectedRisk.risk}%` }} />
                          </div>
                        </div>

                        <div className="softCard glowBlue compactInfoCard">
                          <div className="headerRow">
                            <div>
                              <div className="muted tiny">Клинический статус</div>
                              <strong>{selectedRisk.level} риск</strong>
                            </div>
                            <ShieldCheck size={18} />
                          </div>
                          <div className="small muted" style={{ marginTop: 8 }}>
                            {selectedRisk.risk >= 65
                              ? "Требуется усиленный мониторинг и более плотный клинический контроль."
                              : selectedRisk.risk >= 35
                              ? "Желателен сокращённый интервал повторного наблюдения."
                              : "Картина соответствует стабильному плановому наблюдению."}
                          </div>
                        </div>
                      </div>

                      <div className="markerGrid">
                        {[
                          ["IL-1", selected.il1],
                          ["IL-6", selected.il6],
                          ["TNF-α", selected.tnf],
                          ["VEGF", selected.vegf],
                          ["TGF-β", selected.tgfb],
                        ].map(([label, value]) => (
                          <div key={String(label)} className="marker">
                            <span className="markerTitle">{label}</span>
                            <div className="markerValue">{value}</div>
                          </div>
                        ))}
                      </div>

                      <div className="card">
                        <div className="muted small">Карта биомаркеров</div>
                        <div className="heatmapGrid">
                          {heatItems.map(([name, value]) => {
                            const s = heatStatus(name, value);
                            return (
                              <div key={name} className="heatItem">
                                <div className="heatHeader">
                                  <span>{name}</span>
                                  <span className={`statusDot status-${s}`} />
                                </div>
                                <div className="heatValue">{value}</div>
                                <div className="tiny muted">
                                  {s === "high" ? "Высокий" : s === "mid" ? "Промежуточный" : "Низкий"}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="card">
                        <div className="muted small">Автоматическая интерпретация</div>
                        <div style={{ marginTop: 8 }}>{explanation(selected)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h2>Основные действия</h2>
                  <div className="muted small">Основные сценарии работы с интерфейсом</div>
                  <div className="grid" style={{ marginTop: 18 }}>
                    <button className="btn" onClick={openNew}>
                      <Plus size={16} />
                      Добавить пациента
                    </button>
                    <button className="btn outline" onClick={() => exportReport(selected)}>
                      <Download size={16} />
                      Скачать отчёт PDF
                    </button>
                    <button className="btn outline" onClick={() => setPage("analytics")}>
                      <BarChart3 size={16} />
                      Открыть аналитику
                    </button>
                    <button className="btn outline" onClick={() => setPage("patients")}>
                      <UserRound size={16} />
                      Открыть список пациентов
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {page === "patients" && selected && selectedRisk && ml && (
            <div className="grid g3">
              <div className="card">
                <h2>Реестр пациентов</h2>
                <div className="muted small">
                  Быстрый доступ к пациентам, сортировка по риску и клиническим заметкам
                </div>

                <div className="filters">
                  <div className="searchWrap">
                    <Search className="searchIcon" size={16} />
                    <input
                      className="input searchInput"
                      placeholder="Поиск по ID, ФИО, заметкам"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>

                  <select
                    className="select"
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                  >
                    <option value="all">Все уровни риска</option>
                    <option value="low">Низкий риск</option>
                    <option value="mid">Умеренный риск</option>
                    <option value="high">Высокий риск</option>
                  </select>

                  <select
                    className="select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="risk-desc">Риск: по убыванию</option>
                    <option value="risk-asc">Риск: по возрастанию</option>
                    <option value="name">По имени</option>
                    <option value="visit">По дате визита</option>
                  </select>

                  <button
                    className="btn outline"
                    onClick={() => {
                      setQuery("");
                      setRiskFilter("all");
                      setSortBy("risk-desc");
                    }}
                  >
                    <Filter size={16} />
                    Сброс
                  </button>
                </div>

                <div className="list" style={{ marginTop: 18 }}>
                  {filteredPatients.map((patient) => {
                    const risk = calcRisk(patient);

                    return (
                      <button
                        key={patient.id}
                        className={`patientBtn ${selectedId === patient.id ? "active" : ""}`}
                        onClick={() => setSelectedId(patient.id)}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                          <div>
                            <div className="patientName">{patient.fullName}</div>
                            <div className="muted small">
                              {patient.id} · {patient.surgeryType} · визит {patient.lastVisit}
                            </div>
                          </div>
                          <span className={`badge ${risk.risk >= 65 ? "high" : risk.risk >= 35 ? "mid" : "low"}`}>
                            {risk.risk}%
                          </span>
                        </div>
                        <div className="muted small" style={{ marginTop: 8 }}>
                          {patient.notes}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="card" style={{ gridColumn: "span 2" }}>
                <div className="headerRow">
                  <div>
                    <h2>Карточка пациента</h2>
                    <div className="muted small">
                      Структурированные сведения, биомаркеры и интерпретация клинической картины
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button className="btn outline" onClick={() => { setForm(selected); setModal(true); }}>
                      Редактировать
                    </button>
                    <button className="btn danger" onClick={() => remove(selected.id)}>
                      <Trash2 size={16} />
                      Удалить
                    </button>
                  </div>
                </div>

                <div className="tabs">
                  <button className={`tab ${tab === "summary" ? "active" : ""}`} onClick={() => setTab("summary")}>
                    Сводка
                  </button>
                  <button className={`tab ${tab === "markers" ? "active" : ""}`} onClick={() => setTab("markers")}>
                    Маркеры
                  </button>
                  <button
                    className={`tab ${tab === "recommendations" ? "active" : ""}`}
                    onClick={() => setTab("recommendations")}
                  >
                    Рекомендации
                  </button>
                  <button className={`tab ${tab === "report" ? "active" : ""}`} onClick={() => setTab("report")}>
                    Отчёт
                  </button>
                </div>

                {tab === "summary" && (
                  <div className="grid g3" style={{ marginTop: 18 }}>
                    {[
                      ["ФИО", selected.fullName],
                      ["ID", selected.id],
                      ["Возраст", `${selected.age} лет`],
                      ["Пол", selected.sex],
                      [
                        "Тип трансплантации",
                        labelize(selected.graftType, {
                          primary: "Первичная",
                          repeat: "Повторная",
                        }),
                      ],
                      ["Вид операции", surgeryLabel(selected.surgeryType)],
                      [
                        "Неоваскуляризация",
                        labelize(selected.neovascularization, {
                          none: "Нет",
                          moderate: "Умеренная",
                          severe: "Выраженная",
                        }),
                      ],
                      ["Предшествующее воспаление", selected.priorInflammation === "yes" ? "Да" : "Нет"],
                      ["Отторжение в анамнезе", selected.rejectionHistory === "yes" ? "Да" : "Нет"],
                      ["Дата визита", selected.lastVisit],
                    ].map(([label, value]) => (
                      <div key={String(label)} className="panel">
                        <div className="muted small">{label}</div>
                        <div style={{ marginTop: 6, fontWeight: 700 }}>{value}</div>
                      </div>
                    ))}

                    <div className="card" style={{ gridColumn: "1 / -1" }}>
                      <div className="muted small">Клиническая сводка</div>
                      <div style={{ marginTop: 8 }}>{explanation(selected)}</div>
                    </div>
                  </div>
                )}

                {tab === "markers" && (
                  <div className="grid" style={{ marginTop: 18 }}>
                    <div className="markerGrid">
                      {[
                        ["IL-1", selected.il1],
                        ["IL-6", selected.il6],
                        ["TNF-α", selected.tnf],
                        ["VEGF", selected.vegf],
                        ["TGF-β", selected.tgfb],
                      ].map(([label, value]) => (
                        <div key={String(label)} className="marker">
                          <span className="markerTitle">{label}</span>
                          <div className="markerValue">{value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="card">
                      <div className="muted small">Карта биомаркеров</div>
                      <div className="heatmapGrid" style={{ marginTop: 12 }}>
                        {heatItems.map(([name, value]) => {
                          const s = heatStatus(name, value);
                          return (
                            <div key={name} className="heatItem">
                              <div className="heatHeader">
                                <span>{name}</span>
                                <span className={`statusDot status-${s}`} />
                              </div>
                              <div className="heatValue">{value}</div>
                              <div className="tiny muted">
                                {s === "high" ? "Высокий" : s === "mid" ? "Промежуточный" : "Низкий"}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {tab === "recommendations" && (
                  <div className="grid g2" style={{ marginTop: 18 }}>
                    <div className="grid">
                      <div className="panel">
                        <div className="muted small">Ориентировочная оценка риска</div>
                        <div style={{ marginTop: 14 }}>
                          <RiskGauge value={selectedRisk.risk} label={selectedRisk.level} />
                        </div>
                        <div className="muted small" style={{ marginTop: 6 }}>
                          {selectedRisk.level} риск · {selectedRisk.status}
                        </div>
                      </div>

                      <div className="softCard glowBlue">
                        <div className="headerRow">
                          <div>
                            <div className="muted tiny">Вероятность отторжения</div>
                            <strong>
                              {ml.probability}% · {ml.classLabel}
                            </strong>
                          </div>
                          <Cpu size={18} />
                        </div>
                        <div className="small muted" style={{ marginTop: 8 }}>
                          Демонстрационная логистическая модель без клинической валидации.
                        </div>
                      </div>
                    </div>

                    <div className="grid">
                      <div className="card">
                        <div className="muted small">Автоматическая интерпретация</div>
                        <div style={{ marginTop: 8 }}>{explanation(selected)}</div>
                      </div>

                      <div className="card">
                        <div className="muted small">Рекомендации</div>
                        <div className="recoList">
                          {recommendations(selected).map((r, i) => (
                            <div key={i} className="recoItem">
                              <span>{r}</span>
                              <strong>•</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {tab === "report" && (
                  <div className="reportSheet" style={{ marginTop: 18 }}>
                    <h3 style={{ marginTop: 0 }}>Клинический отчёт</h3>
                    <div className="small">Структурированная сводка наблюдения после трансплантации роговицы</div>

                    <div className="reportMeta">
                      <div className="reportBlock">
                        <strong>Пациент</strong>
                        <div>{selected.fullName}</div>
                        <div>ID: {selected.id}</div>
                      </div>
                      <div className="reportBlock">
                        <strong>Дата визита</strong>
                        <div>{selected.lastVisit}</div>
                        <div>{surgeryLabel(selected.surgeryType)}</div>
                      </div>
                      <div className="reportBlock">
                        <strong>Оценка риска</strong>
                        <div>
                          {selectedRisk.risk}% · {selectedRisk.level}
                        </div>
                      </div>
                      <div className="reportBlock">
                        <strong>Вероятность отторжения</strong>
                        <div>
                          {ml.probability}% · {ml.classLabel}
                        </div>
                      </div>
                    </div>

                    <div className="reportBlock" style={{ marginTop: 14 }}>
                      <strong>Клиническая интерпретация</strong>
                      <div style={{ marginTop: 8 }}>{explanation(selected)}</div>
                    </div>

                    <div style={{ marginTop: 16 }}>
                      <button className="btn" onClick={() => exportReport(selected)}>
                        <Download size={16} />
                        Печать / сохранить PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {page === "analytics" && (
            <div className="grid g2">
              <div className="card">
                <h2>Аналитический обзор</h2>
                <div className="listCompact" style={{ marginTop: 14 }}>
                  <div className="softCard">
                    <div className="headerRow">
                      <span>Средний риск по базе</span>
                      <strong>{stats.avg}%</strong>
                    </div>
                  </div>
                  <div className="softCard">
                    <div className="headerRow">
                      <span>Высокий риск</span>
                      <strong>{stats.high}</strong>
                    </div>
                  </div>
                  <div className="softCard">
                    <div className="headerRow">
                      <span>Умеренный риск</span>
                      <strong>{stats.moderate}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <h2>Блоки AI и ML</h2>
                <div className="note" style={{ marginTop: 14 }}>
                  В этой версии показаны демонстрационные прогнозные блоки. Для реального
                  клинического применения потребуется клинический набор данных и отдельная
                  валидация.
                </div>
              </div>
            </div>
          )}

          {page === "methodology" && (
            <div className="grid g2">
              <div className="card">
                <h2>Методологические принципы</h2>
                <div className="grid small muted" style={{ marginTop: 18 }}>
                  <div>
                    Платформа помогает структурировать наблюдение, визуализировать
                    совокупность клинических факторов и быстро получать целостную картину
                    по пациенту после трансплантации роговицы.
                  </div>
                  <div>
                    Показатель риска является ориентировочным и предназначен для
                    демонстрации логики стратификации. Он не должен использоваться как
                    автономное клиническое решение без оценки врача.
                  </div>
                  <div>
                    Входные параметры: тип трансплантации, вид операции, неоваскуляризация,
                    воспаление в анамнезе, предыдущие эпизоды отторжения, IL-1, IL-6,
                    TNF-α, VEGF и TGF-β.
                  </div>
                </div>
              </div>

              <div className="card">
                <h2>Ограничения</h2>
                <div className="grid small muted" style={{ marginTop: 18 }}>
                  <div>
                    Текущая версия интерфейса демонстрирует возможную логику цифровой
                    поддержки принятия решений.
                  </div>
                  <div>
                    Прогноз вероятности отторжения в этой версии является демонстрационным
                    и не заменяет клиническую оценку.
                  </div>
                </div>
              </div>
            </div>
          )}

          {page === "about" && (
            <div className="grid g2">
              <div className="card">
                <h2>О платформе</h2>
                <div className="grid small muted" style={{ marginTop: 18 }}>
                  <div>
                    Corneal Risk Platform объединяет клинические данные пациента,
                    ориентировочную стратификацию риска, интерпретацию биомаркеров и
                    аналитические панели в единой рабочей среде.
                  </div>
                  <div>
                    Интерфейс подходит для демонстрации концепции цифровой поддержки
                    принятия решений в офтальмологии и для презентации потенциального
                    продукта медицинского класса.
                  </div>
                </div>
              </div>

              <div className="card">
                <h2>Назначение</h2>
                <div className="grid small muted" style={{ marginTop: 18 }}>
                  <div>
                    Платформа предназначена для учебной, исследовательской и
                    демонстрационной работы с клиническими сценариями наблюдения.
                  </div>
                  <div>
                    Врач остаётся конечным участником интерпретации результатов и
                    принятия решения по тактике ведения пациента.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {modal && (
        <div className="modalBg">
          <div className="modal">
            <div className="headerRow">
              <div>
                <h2 style={{ margin: 0, color: "#fff" }}>
                  {patients.some((p) => p.id === form.id) ? "Редактирование пациента" : "Новый пациент"}
                </h2>
                <div className="muted small">
                  Заполните клинические параметры для ориентировочной оценки риска.
                </div>
              </div>
              <button className="btn outline" onClick={() => setModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="grid g3" style={{ marginTop: 20 }}>
              <div>
                <label className="label">ID пациента</label>
                <input className="input" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
              </div>
              <div>
                <label className="label">ФИО</label>
                <input
                  className="input"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Возраст</label>
                <input
                  className="input"
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Пол</label>
                <select className="select" value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}>
                  <option value="М">М</option>
                  <option value="Ж">Ж</option>
                </select>
              </div>
              <div>
                <label className="label">Дата визита</label>
                <input
                  className="input"
                  type="date"
                  value={form.lastVisit}
                  onChange={(e) => setForm({ ...form, lastVisit: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Тип трансплантации</label>
                <select
                  className="select"
                  value={form.graftType}
                  onChange={(e) => setForm({ ...form, graftType: e.target.value })}
                >
                  <option value="primary">Первичная</option>
                  <option value="repeat">Повторная</option>
                </select>
              </div>
              <div>
                <label className="label">Вид операции</label>
                <select
                  className="select"
                  value={form.surgeryType}
                  onChange={(e) => setForm({ ...form, surgeryType: e.target.value })}
                >
                  <option value="PKP">PKP — сквозная кератопластика</option>
                  <option value="DALK">DALK — глубокая передняя послойная кератопластика</option>
                  <option value="DSAEK">DSAEK — задняя послойная эндотелиальная кератопластика</option>
                  <option value="DMEK">DMEK — кератопластика десцеметовой мембраны</option>
                </select>
              </div>
              <div>
                <label className="label">Неоваскуляризация</label>
                <select
                  className="select"
                  value={form.neovascularization}
                  onChange={(e) => setForm({ ...form, neovascularization: e.target.value })}
                >
                  <option value="none">Нет</option>
                  <option value="moderate">Умеренная</option>
                  <option value="severe">Выраженная</option>
                </select>
              </div>
              <div>
                <label className="label">Предшествующее воспаление</label>
                <select
                  className="select"
                  value={form.priorInflammation}
                  onChange={(e) => setForm({ ...form, priorInflammation: e.target.value })}
                >
                  <option value="no">Нет</option>
                  <option value="yes">Да</option>
                </select>
              </div>
              <div>
                <label className="label">Отторжение в анамнезе</label>
                <select
                  className="select"
                  value={form.rejectionHistory}
                  onChange={(e) => setForm({ ...form, rejectionHistory: e.target.value })}
                >
                  <option value="no">Нет</option>
                  <option value="yes">Да</option>
                </select>
              </div>
              <div>
                <label className="label">IL-1</label>
                <input className="input" type="number" value={form.il1} onChange={(e) => setForm({ ...form, il1: e.target.value })} />
              </div>
              <div>
                <label className="label">IL-6</label>
                <input className="input" type="number" value={form.il6} onChange={(e) => setForm({ ...form, il6: e.target.value })} />
              </div>
              <div>
                <label className="label">TNF-α</label>
                <input className="input" type="number" value={form.tnf} onChange={(e) => setForm({ ...form, tnf: e.target.value })} />
              </div>
              <div>
                <label className="label">VEGF</label>
                <input className="input" type="number" value={form.vegf} onChange={(e) => setForm({ ...form, vegf: e.target.value })} />
              </div>
              <div>
                <label className="label">TGF-β</label>
                <input className="input" type="number" value={form.tgfb} onChange={(e) => setForm({ ...form, tgfb: e.target.value })} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label className="label">Клинические заметки</label>
                <textarea
                  className="textarea"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "end", gap: 10, marginTop: 18 }}>
              <button className="btn outline" onClick={() => setModal(false)}>
                Отмена
              </button>
              <button className="btn" onClick={save}>
                Сохранить пациента
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
