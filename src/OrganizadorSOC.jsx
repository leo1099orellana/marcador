import { useState, useEffect, useCallback } from "react";
import "./index.css";

const FRENTES = {
  sc200:     { label: "Security+",  color: "#3b82f6" },
  wazuh:     { label: "Wazuh",     color: "#8b5cf6" },
  azure:     { label: "Azure",     color: "#06b6d4" },
  cisco:     { label: "Cisco",     color: "#34d399" },
  ingles:    { label: "Inglés",    color: "#f59e0b" },
  busqueda:  { label: "Búsqueda",  color: "#f97316" },
  freelance: { label: "Freelance", color: "#ec4899" },
};

const WEEKDAY = [
  { frente: "sc200",  text: "Security+: teoría de la certificación (2h)" },
  { frente: "wazuh",  text: "Wazuh / Wireshark / Linux (1.5h)" },
  { frente: "cisco",  text: "Cisco: módulo del día (1.5h)" },
  { frente: "ingles", text: "Inglés: práctica diaria (45m)" },
];

const PLAN = {
  1:WEEKDAY, 2:WEEKDAY, 3:WEEKDAY, 4:WEEKDAY, 5:WEEKDAY,
  6:[{frente:"wazuh",text:"Portfolio: Wazuh / KQL write-up (1.5h)"},{frente:"ingles",text:"Inglés liviano: serie/pod (30m)"}],
  0:[{frente:"sc200",text:"Repaso suave de la semana (opcional)"},{frente:"sc200",text:"Planificar la semana que viene (opcional)"}],
};

const HORARIO = [
  { from:510,  to:540,  label:"Despertar, desayuno" },
  { from:540,  to:660,  block:true, title:"Bloque 1 · Security+ (2h)",         note:"Cabeza fresca, lo más exigente del día" },
  { from:960,  to:1050, block:true, title:"Bloque 2 · frente del día (1.5h)", note:"Cisco / Wazuh / búsqueda, según el día" },
  { from:1050, to:1290, label:"Cena / descanso / vida" },
  { from:1290, to:1335, block:true, title:"Bloque 3 · inglés técnico (45 min)",note:"Lo más liviano: hablar, escuchar, repasar" },
  { from:1335, to:1380, label:"Bajar revoluciones, lejos de pantalla pesada" },
  { from:1380, to:1440, label:"A dormir" },
];

const hhmm = m => `${String(Math.floor(m/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;
const rango = it => `${hhmm(it.from)}–${hhmm(it.to)}`;
const ymd   = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const uid   = () => Math.random().toString(36).slice(2,9);
const lsGet = k => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k,v) => { try { localStorage.setItem(k,v); } catch { /**/ } };

const loadDay = d => {
  const k = `soc:dia:${ymd(d)}`;
  let saved; try { saved = JSON.parse(lsGet(k)); } catch { /**/ }
  if (saved?.length) return saved;
  const plan = (PLAN[d.getDay()]||[]).map(s=>({id:uid(),text:s.text,frente:s.frente,done:false}));
  lsSet(k, JSON.stringify(plan));
  return plan;
};

export default function App() {
  const [date,     setDate]     = useState(new Date());
  const [tasks,    setTasks]    = useState(() => loadDay(new Date()));
  const [newText,  setNewText]  = useState("");
  const [frente,   setFrente]   = useState("sc200");
  const [nowMin,   setNowMin]   = useState(() => { const n=new Date(); return n.getHours()*60+n.getMinutes(); });

  useEffect(() => {
    const t = setInterval(() => { const n=new Date(); setNowMin(n.getHours()*60+n.getMinutes()); }, 60000);
    return () => clearInterval(t);
  }, []);

  const key     = `soc:dia:${ymd(date)}`;
  const persist = useCallback(next => { setTasks(next); lsSet(key, JSON.stringify(next)); }, [key]);
  const goDay   = d => { const n=new Date(date); n.setDate(n.getDate()+d); setDate(n); setTasks(loadDay(n)); };
  const add     = () => { const t=newText.trim(); if(!t) return; persist([...tasks,{id:uid(),text:t,frente,done:false}]); setNewText(""); };
  const toggle  = id => persist(tasks.map(x => x.id===id ? {...x,done:!x.done} : x));
  const remove  = id => persist(tasks.filter(x => x.id!==id));

  const hechas  = tasks.filter(t=>t.done).length;
  const total   = tasks.length;
  const pct     = total ? Math.round(hechas/total*100) : 0;
  const esHoy   = ymd(date) === ymd(new Date());
  const curBlk  = esHoy ? HORARIO.find(it => nowMin>=it.from && nowMin<it.to) : null;
  const esLV    = [1,2,3,4,5].includes(date.getDay());

  const R=25, CIRC=2*Math.PI*R;

  return (
    <div className="page">
      <div className="wrap">

        {/* header */}
        <div className="hd">
          <div className="logo">
            <span className="logo-mark">✦</span>
            <span><b className="logo-name">SOC_TRACKER</b><span className="logo-sub">// DAILY OPS</span></span>
          </div>
          <button className="btn-reset" onClick={() => { if (tasks.length && !confirm("¿Borrar objetivos de este día?")) return; const p=loadDay(date); setTasks(p); lsSet(key,JSON.stringify(p)); }}>↻ RESETEAR DÍA</button>
        </div>

        {/* fecha */}
        <div className="datebar">
          <button onClick={() => goDay(-1)}>‹</button>
          <div style={{flex:1,textAlign:"center"}}>
            <div className="date-kicker">PLAN DEL DÍA</div>
            <h1 className="date-h1">{date.toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"})}</h1>
            {esHoy && <span className="date-hoy">● HOY</span>}
          </div>
          <button onClick={() => goDay(1)}>›</button>
        </div>

        {/* progreso */}
        <div className="prog">
          <div className="ring">
            <svg width="60" height="60">
              <circle cx="30" cy="30" r={R} stroke="#1e2430" strokeWidth="5" fill="none"/>
              <circle cx="30" cy="30" r={R} stroke={pct===100&&total?"#34d399":"#3b82f6"} strokeWidth="5" fill="none"
                strokeLinecap="round" strokeDasharray={CIRC}
                strokeDashoffset={CIRC-(pct/100)*CIRC} style={{transition:"stroke-dashoffset .4s ease"}}/>
            </svg>
            <div className="ring-num">{pct}%</div>
          </div>
          <div>
            <div className="prog-lab">PROGRESO DEL DÍA</div>
            <div className="prog-big">{hechas} <span>/ {total} completadas</span></div>
          </div>
        </div>

        {/* objetivos */}
        <div className="panel">
          <div className="panel-hd">
            <span className="title">OBJETIVOS</span>
            <span className="count">{total>0 ? `${total} ${total===1?"tarea":"tareas"}` : ""}</span>
          </div>
          {tasks.length===0
            ? <div className="empty">Sin objetivos para este día.</div>
            : tasks.map(t => {
                const f = FRENTES[t.frente]||FRENTES.sc200;
                return (
                  <div key={t.id} className="task" style={{borderLeftColor:f.color}}>
                    <button className="chk" onClick={()=>toggle(t.id)}
                      style={{background:t.done?f.color:"transparent",borderColor:t.done?f.color:"#3a4252"}}>
                      {t.done?"✓":""}
                    </button>
                    <span className={`task-txt${t.done?" done":""}`}>{t.text}</span>
                    <span className="task-fr" style={{color:f.color}}>{f.label}</span>
                    <button className="del" onClick={()=>remove(t.id)}>✕</button>
                  </div>
                );
              })
          }
          {pct===100&&total>0 && <div className="cerrado">✓ Día cerrado. Bien ahí.</div>}
          <div className="add">
            <input value={newText} onChange={e=>setNewText(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&add()} placeholder="Nuevo objetivo…"/>
            <select value={frente} onChange={e=>setFrente(e.target.value)}>
              {Object.entries(FRENTES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={add}>+</button>
          </div>
        </div>

        {/* frentes activos */}
        <div className="panel">
          <div className="panel-hd"><span className="title">FRENTES ACTIVOS</span></div>
          <div className="frentes">
            {Object.entries(FRENTES).map(([k,f]) => {
              const n=tasks.filter(t=>t.frente===k).length;
              const d=tasks.filter(t=>t.frente===k&&t.done).length;
              if (!n) return null;
              return (
                <span key={k} className="pill">
                  <span className="pill-dot" style={{background:f.color}}/>
                  {f.label} <span className="pill-n">{d}/{n}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* horario */}
        {esLV && (
          <div className="panel">
            <div className="panel-hd"><span className="title">HORARIO DEL DÍA</span></div>
            {esHoy && (
              <div className="now-line">
                {curBlk
                  ? <><span className="now-tag">AHORA</span>{rango(curBlk)} · {curBlk.block?curBlk.title:curBlk.label}</>
                  : <span style={{color:"var(--t3)"}}>Fuera de horario de jornada</span>
                }
              </div>
            )}
            <div className="tl">
              {HORARIO.map((it,i) => {
                const cur = curBlk?.from===it.from;
                return (
                  <div key={i} className="tl-row">
                    <div className="tl-hr">{rango(it)}</div>
                    <div className={`tl-ev${it.block?" block":""}${cur?" cur":""}`}>
                      {it.block ? <><b>{it.title}</b><small>{it.note}</small></> : it.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="foot">localStorage · offline · sin cuenta</div>
      </div>
    </div>
  );
}
