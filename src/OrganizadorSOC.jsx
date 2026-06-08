import { useState, useEffect, useCallback } from "react";

const FRENTES = {
  sc200:     { label: "SC-200",     color: "#3b82f6", bg: "#eff6ff" },
  wazuh:     { label: "Wazuh",      color: "#7c3aed", bg: "#f5f3ff" },
  azure:     { label: "Azure",      color: "#0891b2", bg: "#ecfeff" },
  cisco:     { label: "Cisco",      color: "#059669", bg: "#ecfdf5" },
  ingles:    { label: "Inglés",     color: "#d97706", bg: "#fffbeb" },
  busqueda:  { label: "Búsqueda",   color: "#ea580c", bg: "#fff7ed" },
  freelance: { label: "Freelance",  color: "#db2777", bg: "#fdf2f8" },
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

const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const uid = () => Math.random().toString(36).slice(2, 9);
const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch { /**/ } };
const buildPlan = (d) =>
  (PLAN_SUGERIDO[d.getDay()] || []).map((s) => ({ id: uid(), text: s.text, frente: s.frente, done: false }));

export default function OrganizadorSOC() {
  const [date, setDate]           = useState(new Date());
  const [tasks, setTasks]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [newText, setNewText]     = useState("");
  const [newFrente, setNewFrente] = useState("sc200");

  const key = `soc:dia:${ymd(date)}`;

  useEffect(() => {
    setLoading(true);
    const raw = lsGet(key);
    let saved = null;
    try { saved = raw ? JSON.parse(raw) : null; } catch { /**/ }
    if (saved && saved.length > 0) {
      setTasks(saved);
    } else {
      const plan = buildPlan(date);
      setTasks(plan);
      lsSet(key, JSON.stringify(plan));
    }
    setLoading(false);
  }, [key]);

  const persist = useCallback((next) => { setTasks(next); lsSet(key, JSON.stringify(next)); }, [key]);
  const resetDia = () => persist(buildPlan(date));
  const addTask = () => {
    const t = newText.trim();
    if (!t) return;
    persist([...tasks, { id: uid(), text: t, frente: newFrente, done: false }]);
    setNewText("");
  };
  const toggle = (id) => persist(tasks.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  const remove = (id) => persist(tasks.filter((x) => x.id !== id));
  const cambiarDia = (delta) => { const d = new Date(date); d.setDate(d.getDate() + delta); setDate(d); };

  const hechas = tasks.filter((t) => t.done).length;
  const total  = tasks.length;
  const pct    = total ? Math.round((hechas / total) * 100) : 0;
  const esHoy  = ymd(date) === ymd(new Date());

  const fechaLabel = date.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" });

  // Progreso circular (SVG)
  const r = 28, circ = 2 * Math.PI * r;
  const dash = circ - (pct / 100) * circ;

  return (
    <div style={{ background: "#f1f5f9", minHeight: "100vh", fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" }}>

      {/* ── NAV ── */}
      <header style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(15,23,42,.06)" }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)", borderRadius: 10 }}
              className="w-8 h-8 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5" height="5" rx="1" fill="white" />
                <rect x="9" y="2" width="5" height="5" rx="1" fill="white" opacity=".7" />
                <rect x="2" y="9" width="5" height="5" rx="1" fill="white" opacity=".7" />
                <rect x="9" y="9" width="5" height="5" rx="1" fill="white" opacity=".4" />
              </svg>
            </div>
            <span style={{ color: "#0f172a", fontWeight: 700, fontSize: 17 }}>SOC Tracker</span>
          </div>
          <button
            onClick={resetDia}
            style={{ color: "#64748b", border: "1px solid #e2e8f0", background: "#fff", borderRadius: 8, fontSize: 13 }}
            className="px-3 py-1.5 hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          >
            <span>↺</span> Resetear día
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-8 py-8 space-y-5">

        {/* ── FECHA ── */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, boxShadow: "0 1px 4px rgba(15,23,42,.06)" }}
          className="px-6 py-5">
          <div className="flex items-center justify-between">
            <button
              onClick={() => cambiarDia(-1)}
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", borderRadius: 12 }}
              className="w-10 h-10 flex items-center justify-center text-xl hover:bg-slate-100 transition-colors"
              aria-label="Día anterior"
            >‹</button>

            <div className="text-center">
              <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Plan del día
              </p>
              <h1 style={{ color: "#0f172a", fontSize: "clamp(1.3rem, 4vw, 1.75rem)", fontWeight: 700, letterSpacing: "-0.02em" }}
                className="capitalize mt-0.5">
                {fechaLabel}
              </h1>
              {esHoy && (
                <span style={{ background: "#dcfce7", color: "#16a34a", fontSize: 11, fontWeight: 600, borderRadius: 20 }}
                  className="inline-block px-3 py-0.5 mt-1">
                  Hoy
                </span>
              )}
            </div>

            <button
              onClick={() => cambiarDia(1)}
              style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#64748b", borderRadius: 12 }}
              className="w-10 h-10 flex items-center justify-center text-xl hover:bg-slate-100 transition-colors"
              aria-label="Día siguiente"
            >›</button>
          </div>
        </div>

        {/* ── PROGRESO ── */}
        <div style={{ background: "linear-gradient(135deg,#1e40af 0%,#4f46e5 50%,#7c3aed 100%)", borderRadius: 20, boxShadow: "0 4px 20px rgba(79,70,229,.3)" }}
          className="px-6 py-5 flex items-center gap-5">

          {/* Anillo */}
          <div className="shrink-0 relative">
            <svg width="72" height="72" style={{ transform: "rotate(-90deg)" }}>
              <circle cx="36" cy="36" r={r} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="6" />
              <circle cx="36" cy="36" r={r} fill="none" stroke="white" strokeWidth="6"
                strokeDasharray={circ} strokeDashoffset={dash}
                strokeLinecap="round"
                style={{ transition: "stroke-dashoffset .5s ease" }} />
            </svg>
            <span style={{ color: "#fff", fontWeight: 700, fontSize: 15, position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {pct}%
            </span>
          </div>

          <div>
            <p style={{ color: "rgba(255,255,255,.7)", fontSize: 13, marginBottom: 2 }}>Progreso del día</p>
            <p style={{ color: "#fff", fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
              {total === 0 ? "Sin objetivos" : `${hechas} / ${total} completadas`}
            </p>
            {pct === 100 && total > 0 && (
              <p style={{ color: "#a5f3fc", fontSize: 13, marginTop: 2, fontWeight: 600 }}>
                Día cerrado. Bien ahí. 🎯
              </p>
            )}
          </div>
        </div>

        {/* ── TAREAS ── */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, boxShadow: "0 1px 4px rgba(15,23,42,.06)" }}
          className="overflow-hidden">

          {/* Header sección */}
          <div style={{ borderBottom: "1px solid #f1f5f9" }} className="px-6 py-4 flex items-center justify-between">
            <span style={{ color: "#0f172a", fontWeight: 700, fontSize: 16 }}>Objetivos</span>
            <span style={{ background: "#f1f5f9", color: "#64748b", fontSize: 12, fontWeight: 600, borderRadius: 20 }}
              className="px-2.5 py-1">
              {total} tareas
            </span>
          </div>

          {loading ? (
            <div className="px-6 py-16 text-center" style={{ color: "#cbd5e1" }}>Cargando…</div>
          ) : tasks.length === 0 ? (
            <div className="px-6 py-16 text-center" style={{ color: "#94a3b8" }}>
              No hay plan para este día.
            </div>
          ) : (
            <ul className="divide-y" style={{ "--tw-divide-opacity": 1 }}>
              {tasks.map((t) => {
                const f = FRENTES[t.frente] || FRENTES.sc200;
                return (
                  <li key={t.id}
                    style={{ borderColor: "#f8fafc", borderLeftWidth: 4, borderLeftColor: t.done ? "#e2e8f0" : f.color }}
                    className="flex items-center gap-4 px-6 py-4 sm:py-5 hover:bg-slate-50 transition-colors border-l-4 border-b border-b-slate-50"
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggle(t.id)}
                      style={{
                        border: `2px solid ${t.done ? f.color : "#cbd5e1"}`,
                        background: t.done ? f.color : "#fff",
                        color: "#fff",
                        borderRadius: 8,
                        minWidth: 24, minHeight: 24,
                        boxShadow: t.done ? `0 2px 8px ${f.color}40` : "none",
                        transition: "all .2s",
                      }}
                      className="w-6 h-6 shrink-0 flex items-center justify-center text-xs font-bold"
                    >
                      {t.done ? "✓" : ""}
                    </button>

                    {/* Texto */}
                    <span style={{
                      color: t.done ? "#94a3b8" : "#1e293b",
                      textDecoration: t.done ? "line-through" : "none",
                      fontSize: 15, flex: 1,
                    }}>
                      {t.text}
                    </span>

                    {/* Badge frente */}
                    <span style={{
                      color: t.done ? "#94a3b8" : f.color,
                      background: t.done ? "#f8fafc" : f.bg,
                      fontSize: 11, fontWeight: 600,
                      borderRadius: 20, padding: "3px 10px",
                      whiteSpace: "nowrap",
                    }}
                      className="hidden sm:inline-block">
                      {f.label}
                    </span>

                    {/* Borrar */}
                    <button onClick={() => remove(t.id)}
                      style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 1 }}
                      className="shrink-0 hover:text-red-400 transition-colors px-1"
                      aria-label="Borrar">
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── AGREGAR ── */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, boxShadow: "0 1px 4px rgba(15,23,42,.06)" }}
          className="px-6 py-5">
          <p style={{ color: "#0f172a", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Agregar objetivo</p>
          <div className="flex gap-2 flex-wrap sm:flex-nowrap">
            <input
              type="text"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
              placeholder="Descripción del objetivo…"
              style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#1e293b", borderRadius: 12, fontSize: 14 }}
              className="flex-1 min-w-0 px-4 py-3 outline-none focus:border-blue-400 transition-colors placeholder:text-slate-400"
            />
            <select
              value={newFrente}
              onChange={(e) => setNewFrente(e.target.value)}
              style={{ background: "#f8fafc", border: "1.5px solid #e2e8f0", color: "#1e293b", borderRadius: 12, fontSize: 14 }}
              className="px-3 py-3 outline-none"
            >
              {FRENTE_KEYS.map((k) => (
                <option key={k} value={k}>{FRENTES[k].label}</option>
              ))}
            </select>
            <button
              onClick={addTask}
              style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", borderRadius: 12, fontSize: 14, fontWeight: 600, boxShadow: "0 4px 14px rgba(99,102,241,.4)" }}
              className="px-6 py-3 hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              + Agregar
            </button>
          </div>
        </div>

        {/* ── FRENTES ── */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, boxShadow: "0 1px 4px rgba(15,23,42,.06)" }}
          className="px-6 py-5">
          <p style={{ color: "#94a3b8", fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
            Frentes activos
          </p>
          <div className="flex flex-wrap gap-2">
            {FRENTE_KEYS.map((k) => {
              const f = FRENTES[k];
              const count = tasks.filter((t) => t.frente === k).length;
              const done  = tasks.filter((t) => t.frente === k && t.done).length;
              return (
                <div key={k}
                  style={{ background: f.bg, border: `1px solid ${f.color}30`, borderRadius: 12 }}
                  className="flex items-center gap-2 px-3 py-2">
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: f.color, display: "inline-block", flexShrink: 0 }} />
                  <span style={{ color: "#374151", fontSize: 13, fontWeight: 500 }}>{f.label}</span>
                  {count > 0 && (
                    <span style={{ color: f.color, fontSize: 11, fontWeight: 700 }}>{done}/{count}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
