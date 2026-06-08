import { useState, useEffect, useCallback } from "react";

const FRENTES = {
  sc200:     { label: "SC-200",     color: "#60a5fa" },
  wazuh:     { label: "Wazuh",      color: "#a78bfa" },
  azure:     { label: "Azure data", color: "#22d3ee" },
  cisco:     { label: "Cisco",      color: "#34d399" },
  ingles:    { label: "Inglés",     color: "#fbbf24" },
  busqueda:  { label: "Búsqueda",   color: "#fb923c" },
  freelance: { label: "Freelance",  color: "#f472b6" },
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

const lsGet = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const lsSet = (key, val) => { try { localStorage.setItem(key, val); } catch { /* noop */ } };

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
    try { saved = raw ? JSON.parse(raw) : null; } catch { /* noop */ }
    if (saved && saved.length > 0) {
      setTasks(saved);
    } else {
      const plan = buildPlan(date);
      setTasks(plan);
      lsSet(key, JSON.stringify(plan));
    }
    setLoading(false);
  }, [key]);

  const persist = useCallback((next) => {
    setTasks(next);
    lsSet(key, JSON.stringify(next));
  }, [key]);

  const resetDia  = () => persist(buildPlan(date));
  const addTask   = () => {
    const t = newText.trim();
    if (!t) return;
    persist([...tasks, { id: uid(), text: t, frente: newFrente, done: false }]);
    setNewText("");
  };
  const toggle    = (id) => persist(tasks.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
  const remove    = (id) => persist(tasks.filter((x) => x.id !== id));
  const cambiarDia = (delta) => { const d = new Date(date); d.setDate(d.getDate() + delta); setDate(d); };

  const hechas = tasks.filter((t) => t.done).length;
  const total  = tasks.length;
  const pct    = total ? Math.round((hechas / total) * 100) : 0;
  const esHoy  = ymd(date) === ymd(new Date());

  const fechaLabel = date.toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long",
  });

  return (
    <div style={{ background: "#0c1220", minHeight: "100vh", color: "#e2e8f0" }}>

      {/* top accent line */}
      <div style={{ height: 3, background: "linear-gradient(90deg,#3b82f6,#8b5cf6,#06b6d4)" }} />

      <div
        style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
        className="px-4 py-8 sm:px-8 md:px-12 lg:px-16 max-w-3xl mx-auto"
      >

        {/* ── Cabecera ── */}
        <div className="flex items-center justify-between mb-3">
          <span style={{ color: "#475569", letterSpacing: "0.12em" }} className="text-xs font-medium uppercase">
            Plan del día
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={resetDia}
              title="Resetear al plan sugerido"
              style={{ color: "#475569" }}
              className="text-xs hover:opacity-80 transition-opacity"
            >
              ↺ resetear
            </button>
            {esHoy && (
              <span
                style={{
                  color: "#34d399",
                  background: "#34d39915",
                  border: "1px solid #34d39940",
                }}
                className="text-xs rounded-full px-3 py-0.5 font-medium"
              >
                Hoy
              </span>
            )}
          </div>
        </div>

        {/* Navegación de fecha */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => cambiarDia(-1)}
            style={{ color: "#64748b", background: "#162032", border: "1px solid #1e2d45" }}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl hover:opacity-80 transition-opacity"
            aria-label="Día anterior"
          >
            ‹
          </button>
          <h1
            className="text-2xl sm:text-3xl capitalize text-center flex-1 mx-4 font-semibold"
            style={{ color: "#f1f5f9", letterSpacing: "-0.02em" }}
          >
            {fechaLabel}
          </h1>
          <button
            onClick={() => cambiarDia(1)}
            style={{ color: "#64748b", background: "#162032", border: "1px solid #1e2d45" }}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl hover:opacity-80 transition-opacity"
            aria-label="Día siguiente"
          >
            ›
          </button>
        </div>

        {/* ── Progreso ── */}
        <div
          style={{ background: "#111827", border: "1px solid #1e2d45" }}
          className="rounded-2xl p-5 mb-6"
        >
          <div className="flex items-center justify-between mb-3">
            <span style={{ color: "#94a3b8" }} className="text-sm font-medium">
              {total === 0 ? "Sin objetivos cargados" : `${hechas} de ${total} completadas`}
            </span>
            <span
              style={{ color: pct === 100 && total ? "#34d399" : "#60a5fa" }}
              className="text-lg font-bold"
            >
              {pct}%
            </span>
          </div>
          <div style={{ background: "#1e2d45" }} className="h-3 rounded-full overflow-hidden">
            <div
              style={{
                width: `${pct}%`,
                background:
                  pct === 100 && total
                    ? "linear-gradient(90deg,#10b981,#34d399)"
                    : "linear-gradient(90deg,#3b82f6,#8b5cf6)",
                transition: "width .4s ease",
              }}
              className="h-full rounded-full"
            />
          </div>
        </div>

        {/* ── Agregar tarea ── */}
        <div
          style={{ background: "#111827", border: "1px solid #1e2d45" }}
          className="rounded-2xl p-4 mb-6 flex gap-3"
        >
          <input
            type="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTask()}
            placeholder="Agregar objetivo…"
            style={{ background: "#162032", borderColor: "#1e2d45", color: "#e2e8f0" }}
            className="flex-1 text-sm rounded-xl border px-4 py-3 outline-none placeholder:text-slate-600 focus:border-blue-700 transition-colors"
          />
          <select
            value={newFrente}
            onChange={(e) => setNewFrente(e.target.value)}
            style={{ background: "#162032", borderColor: "#1e2d45", color: "#e2e8f0" }}
            className="text-sm rounded-xl border px-3 py-3 outline-none"
          >
            {FRENTE_KEYS.map((k) => (
              <option key={k} value={k}>{FRENTES[k].label}</option>
            ))}
          </select>
          <button
            onClick={addTask}
            style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff" }}
            className="text-sm rounded-xl px-5 py-3 hover:opacity-90 transition-opacity font-semibold shadow-lg"
          >
            +
          </button>
        </div>

        {/* ── Lista de tareas ── */}
        {loading ? (
          <p style={{ color: "#334155" }} className="text-center py-20 text-base">
            Cargando…
          </p>
        ) : tasks.length === 0 ? (
          <p style={{ color: "#334155" }} className="text-center py-20 text-base">
            No hay plan sugerido para este día.
          </p>
        ) : (
          <ul className="space-y-3">
            {tasks.map((t) => {
              const f = FRENTES[t.frente] || FRENTES.sc200;
              return (
                <li
                  key={t.id}
                  style={{
                    background: t.done ? "#0f1a2e" : "#111827",
                    border: "1px solid #1e2d45",
                    borderLeft: `4px solid ${t.done ? "#334155" : f.color}`,
                  }}
                  className="flex items-center gap-4 rounded-2xl px-5 py-4 sm:py-5 transition-all"
                >
                  {/* Checkbox */}
                  <button
                    onClick={() => toggle(t.id)}
                    aria-label={t.done ? "Marcar pendiente" : "Marcar hecha"}
                    style={{
                      border: `2px solid ${t.done ? "#10b981" : "#2d3f55"}`,
                      background: t.done ? "#10b981" : "transparent",
                      color: "#0c1220",
                      minWidth: "1.5rem",
                    }}
                    className="w-6 h-6 shrink-0 rounded-lg flex items-center justify-center text-sm font-bold transition-all"
                  >
                    {t.done ? "✓" : ""}
                  </button>

                  {/* Texto */}
                  <span
                    style={{
                      color: t.done ? "#475569" : "#cbd5e1",
                      textDecoration: t.done ? "line-through" : "none",
                    }}
                    className="flex-1 text-base leading-snug"
                  >
                    {t.text}
                  </span>

                  {/* Etiqueta frente */}
                  <span
                    style={{
                      color: t.done ? "#475569" : f.color,
                      background: t.done ? "#1e2d4520" : `${f.color}18`,
                      border: `1px solid ${t.done ? "#1e2d45" : `${f.color}35`}`,
                    }}
                    className="text-xs font-medium tracking-wide shrink-0 rounded-lg px-3 py-1 hidden sm:block"
                  >
                    {f.label}
                  </span>

                  {/* Borrar */}
                  <button
                    onClick={() => remove(t.id)}
                    style={{ color: "#2d3f55" }}
                    className="text-base shrink-0 hover:text-red-500 transition-colors px-1"
                    aria-label="Borrar"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Día cerrado */}
        {pct === 100 && total > 0 && (
          <div
            style={{ background: "#0d2218", border: "1px solid #34d39930" }}
            className="rounded-2xl p-5 text-center mt-6"
          >
            <p style={{ color: "#34d399" }} className="text-base font-semibold">
              Día cerrado. Bien ahí. 🎯
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
