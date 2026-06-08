import { useState, useEffect, useCallback } from "react";

// ── Paleta ─────────────────────────────────────────────────────────────────
const C = {
  bg:      "#08090c",
  panel:   "#101319",
  panel2:  "#161a22",
  border:  "#1e2430",
  border2: "#262d3a",
  txt:     "#dfe3ea",
  txt2:    "#aab3c4",   // más claro que el original para mejor lectura
  txt3:    "#788090",   // más claro que el original para mejor lectura
  accent:  "#34d399",
  blue:    "#3b82f6",
};

const FONT = 'ui-monospace,"SF Mono",SFMono-Regular,Menlo,Consolas,monospace';

// ── Datos ──────────────────────────────────────────────────────────────────
const FRENTES = {
  sc200:     { label: "SC-200",    color: "#3b82f6" },
  wazuh:     { label: "Wazuh",     color: "#8b5cf6" },
  azure:     { label: "Azure",     color: "#06b6d4" },
  cisco:     { label: "Cisco",     color: "#34d399" },
  ingles:    { label: "Inglés",    color: "#f59e0b" },
  busqueda:  { label: "Búsqueda",  color: "#f97316" },
  freelance: { label: "Freelance", color: "#ec4899" },
};
const FRENTE_KEYS = Object.keys(FRENTES);

const WEEKDAY = [
  { frente: "sc200",  text: "SC-200: estudio + lab (2h)" },
  { frente: "wazuh",  text: "Wazuh: avanzar repo soc-homelab (1.5h)" },
  { frente: "cisco",  text: "Cisco: módulo del día (1.5h)" },
  { frente: "ingles", text: "Inglés: práctica diaria (45m)" },
];
const PLAN_SUGERIDO = {
  1: WEEKDAY, 2: WEEKDAY, 3: WEEKDAY, 4: WEEKDAY, 5: WEEKDAY,
  6: [
    { frente: "wazuh",  text: "Portfolio: Wazuh / KQL write-up (1.5h)" },
    { frente: "ingles", text: "Inglés liviano: serie/pod (30m)" },
  ],
  0: [
    { frente: "sc200", text: "Repaso suave de la semana (opcional)" },
    { frente: "sc200", text: "Planificar la semana que viene (opcional)" },
  ],
};

// minutos desde medianoche
const HORARIO = [
  { from: 510,  to: 540,  label: "Despertar, desayuno" },
  { from: 540,  to: 660,  block: true,  title: "Bloque 1 · SC-200 (2h)",           note: "Cabeza fresca, lo más exigente del día" },
  { from: 960,  to: 1050, block: true,  title: "Bloque 2 · frente del día (1.5h)", note: "Cisco / Wazuh / búsqueda, según el día" },
  { from: 1050, to: 1290, label: "Cena / descanso / vida" },
  { from: 1290, to: 1335, block: true,  title: "Bloque 3 · inglés técnico (45 min)", note: "Lo más liviano: hablar, escuchar, repasar" },
  { from: 1335, to: 1380, label: "Bajar revoluciones, lejos de pantalla pesada" },
  { from: 1380, to: 1440, label: "A dormir" },
];

const hhmm = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const rango = (it) => `${hhmm(it.from)}–${hhmm(it.to)}`;

// ── Helpers storage ────────────────────────────────────────────────────────
const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const uid = () => Math.random().toString(36).slice(2, 9);
const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /**/ } };
const buildPlan = (d) =>
  (PLAN_SUGERIDO[d.getDay()] || []).map((s) => ({ id: uid(), text: s.text, frente: s.frente, done: false }));

const loadDay = (d) => {
  const k = `soc:dia:${ymd(d)}`;
  let saved = null;
  try { saved = JSON.parse(lsGet(k)); } catch { /**/ }
  if (saved && saved.length > 0) return saved;
  const plan = buildPlan(d);
  lsSet(k, JSON.stringify(plan));
  return plan;
};

// ── Componente ─────────────────────────────────────────────────────────────
export default function OrganizadorSOC() {
  const [date, setDate]           = useState(new Date());
  const [tasks, setTasks]         = useState(() => loadDay(new Date()));
  const [newText, setNewText]     = useState("");
  const [newFrente, setNewFrente] = useState("sc200");
  const [nowMin, setNowMin]       = useState(() => {
    const n = new Date(); return n.getHours() * 60 + n.getMinutes();
  });

  // Actualizar "AHORA" cada minuto
  useEffect(() => {
    const t = setInterval(() => {
      const n = new Date(); setNowMin(n.getHours() * 60 + n.getMinutes());
    }, 60000);
    return () => clearInterval(t);
  }, []);

  const key = `soc:dia:${ymd(date)}`;

  const persist     = useCallback((next) => { setTasks(next); lsSet(key, JSON.stringify(next)); }, [key]);
  const resetDia    = () => { if (tasks.length && !window.confirm("¿Borrar todos los objetivos de este día?")) return; persist(buildPlan(date)); };
  const addTask     = () => { const t = newText.trim(); if (!t) return; persist([...tasks, { id: uid(), text: t, frente: newFrente, done: false }]); setNewText(""); };
  const toggle      = (id) => persist(tasks.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  const remove      = (id) => persist(tasks.filter((x) => x.id !== id));
  const cambiarDia  = (d) => { const n = new Date(date); n.setDate(n.getDate() + d); setDate(n); setTasks(loadDay(n)); };

  const hechas = tasks.filter((t) => t.done).length;
  const total  = tasks.length;
  const pct    = total ? Math.round((hechas / total) * 100) : 0;
  const esHoy  = ymd(date) === ymd(new Date());

  // Bloque activo en el horario
  const curBlock = esHoy ? (HORARIO.find((it) => nowMin >= it.from && nowMin < it.to) || null) : null;

  const fechaLabel = date.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

  // Ring SVG (r=25, circ≈157)
  const R = 25, CIRC = 2 * Math.PI * R;
  const ringOffset = CIRC - (pct / 100) * CIRC;
  const ringColor  = pct === 100 && total ? C.accent : C.blue;

  // Frentes que tienen tareas
  const frentesActivos = FRENTE_KEYS.reduce((acc, k) => {
    const total = tasks.filter((t) => t.frente === k).length;
    if (total > 0) acc[k] = { total, done: tasks.filter((t) => t.frente === k && t.done).length };
    return acc;
  }, {});

  // ── Estilos compartidos ──────────────────────────────────────────────────
  const panel = {
    background: C.panel, border: `1px solid ${C.border}`,
    borderRadius: 10, marginBottom: 14, overflow: "hidden",
  };

  return (
    <div style={{ background: C.bg, color: C.txt, fontFamily: FONT, minHeight: "100vh",
      padding: "28px 16px",
      backgroundImage: "radial-gradient(800px 400px at 50% -120px, rgba(52,211,153,.06), transparent 70%)" }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>

        {/* ── HEADER ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <span style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0,
              background: "linear-gradient(135deg,#34d399,#10b981)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#06281e", fontWeight: 700, fontSize: 13 }}>✦</span>
            <span>
              <b style={{ fontSize: 14, letterSpacing: "0.12em" }}>SOC_TRACKER</b>
              <span style={{ display: "block", fontSize: 9, color: C.txt3, letterSpacing: "0.22em", marginTop: 1 }}>// DAILY OPS</span>
            </span>
          </div>
          <button onClick={resetDia}
            style={{ background: "none", border: `1px solid ${C.border2}`, color: C.txt2, fontFamily: FONT,
              fontSize: 11, borderRadius: 6, padding: "6px 10px", cursor: "pointer", letterSpacing: "0.04em" }}
            onMouseEnter={(e) => { e.target.style.borderColor = "#3a4252"; e.target.style.color = C.txt; }}
            onMouseLeave={(e) => { e.target.style.borderColor = C.border2; e.target.style.color = C.txt2; }}>
            ↻ RESETEAR DÍA
          </button>
        </div>

        {/* ── FECHA ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10,
          padding: "12px 8px", marginBottom: 14 }}>
          <button onClick={() => cambiarDia(-1)}
            style={{ background: "none", border: "none", color: C.txt3, fontSize: 20, cursor: "pointer",
              padding: "0 12px", fontFamily: FONT, lineHeight: 1 }}
            onMouseEnter={(e) => e.target.style.color = C.txt}
            onMouseLeave={(e) => e.target.style.color = C.txt3}>‹</button>
          <div style={{ flex: 1, textAlign: "center" }}>
            <div style={{ fontSize: 9, color: C.txt3, letterSpacing: "0.2em" }}>PLAN DEL DÍA</div>
            <h1 style={{ fontSize: 16, color: "#fff", fontWeight: 600, textTransform: "capitalize", marginTop: 2, fontFamily: FONT }}>
              {fechaLabel}
            </h1>
            {esHoy && (
              <span style={{ display: "inline-block", marginTop: 3, fontSize: 9, color: C.accent,
                border: `1px solid rgba(52,211,153,.35)`, borderRadius: 4, padding: "1px 7px", letterSpacing: "0.12em" }}>
                ● HOY
              </span>
            )}
          </div>
          <button onClick={() => cambiarDia(1)}
            style={{ background: "none", border: "none", color: C.txt3, fontSize: 20, cursor: "pointer",
              padding: "0 12px", fontFamily: FONT, lineHeight: 1 }}
            onMouseEnter={(e) => e.target.style.color = C.txt}
            onMouseLeave={(e) => e.target.style.color = C.txt3}>›</button>
        </div>

        {/* ── PROGRESO ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 16,
          background: C.panel, border: `1px solid ${C.border}`, borderRadius: 10,
          padding: 16, marginBottom: 14 }}>
          <div style={{ position: "relative", width: 60, height: 60, flexShrink: 0 }}>
            <svg width="60" height="60" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="30" cy="30" r={R} stroke={C.border} strokeWidth="5" fill="none" />
              <circle cx="30" cy="30" r={R} stroke={ringColor} strokeWidth="5" fill="none"
                strokeLinecap="round"
                strokeDasharray={CIRC} strokeDashoffset={ringOffset}
                style={{ transition: "stroke-dashoffset .4s ease, stroke .3s" }} />
            </svg>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
              justifyContent: "center", fontSize: 14, fontWeight: 600, color: "#fff" }}>
              {pct}%
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: C.txt3, letterSpacing: "0.16em" }}>PROGRESO DEL DÍA</div>
            <div style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginTop: 2 }}>
              {hechas} <span style={{ color: C.txt3, fontWeight: 400 }}>/ {total} completadas</span>
            </div>
          </div>
        </div>

        {/* ── OBJETIVOS ── */}
        <div style={panel}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px" }}>
            <span style={{ fontSize: 12, letterSpacing: "0.08em", color: C.txt, fontWeight: 600 }}>OBJETIVOS</span>
            <span style={{ fontSize: 10, color: C.txt3 }}>{total > 0 ? `${total} ${total === 1 ? "tarea" : "tareas"}` : ""}</span>
          </div>

          {/* Lista */}
          {tasks.length === 0 ? (
            <div style={{ padding: "22px 16px", borderTop: `1px solid ${C.border}`, textAlign: "center", color: C.txt3, fontSize: 12 }}>
              Sin objetivos para este día.
            </div>
          ) : (
            <>
              {tasks.map((t) => {
                const f = FRENTES[t.frente] || FRENTES.sc200;
                return (
                  <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 12,
                    padding: "11px 16px", borderTop: `1px solid ${C.border}`,
                    borderLeft: `3px solid ${t.done ? C.border2 : f.color}` }}>
                    <button onClick={() => toggle(t.id)}
                      style={{ width: 17, height: 17, flexShrink: 0, borderRadius: 5, cursor: "pointer",
                        border: `1px solid ${t.done ? f.color : "#3a4252"}`,
                        background: t.done ? f.color : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, color: "#06281e", fontFamily: FONT,
                        transition: "all .15s" }}>
                      {t.done ? "✓" : ""}
                    </button>
                    <span style={{ flex: 1, fontSize: 13, color: t.done ? C.txt3 : C.txt,
                      textDecoration: t.done ? "line-through" : "none" }}>
                      {t.text}
                    </span>
                    <span style={{ fontSize: 10, letterSpacing: "0.03em", flexShrink: 0, color: f.color }}>
                      {f.label}
                    </span>
                    <button onClick={() => remove(t.id)}
                      style={{ background: "none", border: "none", color: "#39414f", cursor: "pointer",
                        fontSize: 13, flexShrink: 0, fontFamily: FONT, lineHeight: 1 }}
                      onMouseEnter={(e) => e.target.style.color = "#e06a6a"}
                      onMouseLeave={(e) => e.target.style.color = "#39414f"}>
                      ✕
                    </button>
                  </div>
                );
              })}
              {pct === 100 && total > 0 && (
                <div style={{ padding: "14px 16px", borderTop: `1px solid ${C.border}`,
                  textAlign: "center", color: C.accent, fontSize: 13 }}>
                  ✓ Día cerrado. Bien ahí.
                </div>
              )}
            </>
          )}

          {/* Agregar */}
          <div style={{ display: "flex", gap: 8, padding: "14px 16px", borderTop: `1px solid ${C.border}` }}>
            <input type="text" value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Nuevo objetivo…"
              style={{ flex: 1, background: C.panel2, border: `1px solid ${C.border2}`, color: C.txt,
                borderRadius: 7, padding: "9px 11px", fontSize: 13, fontFamily: FONT, outline: "none" }}
              onFocus={(e) => e.target.style.borderColor = "#3a4252"}
              onBlur={(e) => e.target.style.borderColor = C.border2} />
            <select value={newFrente} onChange={(e) => setNewFrente(e.target.value)}
              style={{ background: C.panel2, border: `1px solid ${C.border2}`, color: C.txt,
                borderRadius: 7, padding: "9px 11px", fontSize: 13, fontFamily: FONT, outline: "none", cursor: "pointer" }}>
              {FRENTE_KEYS.map((k) => (
                <option key={k} value={k}>{FRENTES[k].label}</option>
              ))}
            </select>
            <button onClick={addTask}
              style={{ background: C.accent, color: "#06281e", border: "none", fontWeight: 700,
                cursor: "pointer", padding: "9px 14px", borderRadius: 7, fontFamily: FONT, fontSize: 13 }}
              onMouseEnter={(e) => e.target.style.filter = "brightness(1.08)"}
              onMouseLeave={(e) => e.target.style.filter = "none"}>
              +
            </button>
          </div>
        </div>

        {/* ── FRENTES ACTIVOS ── */}
        <div style={panel}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px" }}>
            <span style={{ fontSize: 12, letterSpacing: "0.08em", color: C.txt, fontWeight: 600 }}>FRENTES ACTIVOS</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, padding: "0 16px 14px" }}>
            {Object.keys(frentesActivos).length === 0 ? (
              <span style={{ color: C.txt3, fontSize: 11 }}>Cargá objetivos para ver los frentes.</span>
            ) : (
              Object.entries(frentesActivos).map(([k, v]) => {
                const f = FRENTES[k] || FRENTES.sc200;
                return (
                  <span key={k} style={{ display: "flex", alignItems: "center", gap: 7, borderRadius: 999,
                    padding: "5px 11px", fontSize: 11, background: C.panel2, border: `1px solid ${C.border2}` }}>
                    <span style={{ width: 7, height: 7, borderRadius: 999, background: f.color, display: "inline-block" }} />
                    {f.label}
                    <span style={{ color: C.txt3, fontSize: 10 }}>{v.done}/{v.total}</span>
                  </span>
                );
              })
            )}
          </div>
        </div>

        {/* ── HORARIO ── */}
        {[1,2,3,4,5].includes(date.getDay()) && (
          <div style={panel}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px" }}>
              <span style={{ fontSize: 12, letterSpacing: "0.08em", color: C.txt, fontWeight: 600 }}>HORARIO DEL DÍA</span>
            </div>

            {/* Bloque actual */}
            {esHoy && (
              <div style={{ padding: "0 16px 13px", display: "flex", alignItems: "center", gap: 9, fontSize: 12 }}>
                {curBlock ? (
                  <>
                    <span style={{ fontSize: 9, letterSpacing: "0.14em", color: C.accent,
                      border: `1px solid rgba(52,211,153,.3)`, borderRadius: 4, padding: "1px 6px" }}>
                      AHORA
                    </span>
                    <span style={{ color: C.txt2 }}>
                      {rango(curBlock)} · {curBlock.block ? curBlock.title : curBlock.label}
                    </span>
                  </>
                ) : (
                  <span style={{ color: C.txt3 }}>Fuera de horario de jornada</span>
                )}
              </div>
            )}

            {/* Timeline */}
            <div style={{ padding: "2px 16px 16px", borderTop: `1px solid ${C.border}` }}>
              {HORARIO.map((it, i) => {
                const isCur = curBlock && curBlock.from === it.from;
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "78px 1fr",
                    gap: 10, alignItems: "start", padding: "7px 0" }}>
                    <div style={{ fontSize: 11, color: C.txt3, paddingTop: 1 }}>{rango(it)}</div>
                    <div style={{
                      fontSize: 12, position: "relative", paddingLeft: 16,
                      color: it.block ? C.txt : C.txt2,
                      ...(isCur ? { background: "rgba(52,211,153,.05)", borderRadius: 6,
                        marginLeft: -6, paddingLeft: 22, paddingRight: 8 } : {}),
                    }}>
                      {/* dot */}
                      <span style={{
                        position: "absolute", left: isCur ? 6 : 0, top: 5,
                        width: 6, height: 6, borderRadius: 999,
                        background: isCur ? C.accent : "#39414f",
                        display: "inline-block",
                        ...(isCur ? { boxShadow: "0 0 0 3px rgba(52,211,153,.18)" } : {}),
                      }} />
                      {it.block ? (
                        <>
                          <b style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 1 }}>{it.title}</b>
                          <small style={{ color: C.txt3, fontSize: 11 }}>{it.note}</small>
                        </>
                      ) : (
                        it.label
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", color: C.txt3, fontSize: 10, letterSpacing: "0.1em", marginTop: 18 }}>
          localStorage · offline · sin cuenta
        </div>
      </div>
    </div>
  );
}
