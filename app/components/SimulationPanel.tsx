"use client";
import { useMemo, useState } from "react";
import { Cpu, SlidersHorizontal } from "lucide-react";

type Props = {
  baseRisk: number;
  il1: number;
  il6: number;
  tnf: number;
  vegf: number;
  tgfb: number;
};

export default function SimulationPanel({ baseRisk, il1, il6, tnf, vegf, tgfb }: Props) {
  const [simIL1, setSimIL1] = useState(il1);
  const [simIL6, setSimIL6] = useState(il6);
  const [simTNF, setSimTNF] = useState(tnf);
  const [simVEGF, setSimVEGF] = useState(vegf);
  const [simTGFB, setSimTGFB] = useState(tgfb);

  const simulatedRisk = useMemo(() => {
    let r = baseRisk;
    r += (simIL1 - il1) * 0.7;
    r += (simIL6 - il6) * 0.8;
    r += (simTNF - tnf) * 0.6;
    r += (simVEGF - vegf) * 0.05;
    r += (simTGFB - tgfb) * 0.05;
    return Math.max(0, Math.min(100, Math.round(r)));
  }, [baseRisk, il1, il6, tnf, vegf, tgfb, simIL1, simIL6, simTNF, simVEGF, simTGFB]);

  const delta = simulatedRisk - baseRisk;

  return (
    <div className="card glass">
      <div className="headerRow">
        <div>
          <div className="muted small">AI-симуляция риска</div>
          <h3 style={{ margin: "4px 0 0", color: "#fff" }}>Сценарный анализ</h3>
        </div>
        <div className="iconWrap">
          <SlidersHorizontal size={18} />
        </div>
      </div>

      <div className="simGrid" style={{ marginTop: 14 }}>
        <label className="simField">
          <span>IL-1</span>
          <input type="number" value={simIL1} onChange={(e) => setSimIL1(Number(e.target.value) || 0)} />
        </label>
        <label className="simField">
          <span>IL-6</span>
          <input type="number" value={simIL6} onChange={(e) => setSimIL6(Number(e.target.value) || 0)} />
        </label>
        <label className="simField">
          <span>TNF-α</span>
          <input type="number" value={simTNF} onChange={(e) => setSimTNF(Number(e.target.value) || 0)} />
        </label>
        <label className="simField">
          <span>VEGF</span>
          <input type="number" value={simVEGF} onChange={(e) => setSimVEGF(Number(e.target.value) || 0)} />
        </label>
        <label className="simField">
          <span>TGF-β</span>
          <input type="number" value={simTGFB} onChange={(e) => setSimTGFB(Number(e.target.value) || 0)} />
        </label>
      </div>

      <div className="simResult">
        <div>
          <div className="muted tiny">Текущий риск</div>
          <strong>{baseRisk}%</strong>
        </div>
        <div>
          <div className="muted tiny">Смоделированный риск</div>
          <strong>{simulatedRisk}%</strong>
        </div>
        <div>
          <div className="muted tiny">Изменение</div>
          <strong>{delta > 0 ? `+${delta}` : delta}%</strong>
        </div>
      </div>

      <div className="note" style={{ marginTop: 12 }}>
        Демонстрационный модуль показывает, как изменение воспалительных маркеров может
        сдвигать ориентировочный риск. Это сценарный анализ, а не клиническая рекомендация.
      </div>
    </div>
  );
}
