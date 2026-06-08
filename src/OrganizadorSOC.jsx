import { useState, useEffect, useCallback } from "react";

const FRENTES = {
  sc200:     { label: "SC-200",   color: "#3b82f6", bg: "#eff6ff" },
  wazuh:     { label: "Wazuh",   color: "#7c3aed", bg: "#f5f3ff" },
  azure:     { label: "Azure",   color: "#0891b2", bg: "#ecfeff" },
  cisco:     { label: "Cisco",   color: "#059669", bg: "#ecfdf5" },
  ingles:    { label: "Inglés",  color: "#d97706", bg: "#fffbeb" },
  busqueda:  { label: "Búsqueda",color: "#ea580c", bg: "#fff7ed" },
  freelance: { label: "Freelance",color:"#db2777", bg: "#fdf2f8" },
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

const HORARIO = [
  { time: "08:30",       label: "Despertar, desayuno",                           type: "rest" },
  { time: "09:00–11:00", label: "Bloque 1 · SC-200 (2h)",                        sub: "Cabeza fresca, lo más exigente del día",     type: "block", bg: "#E6F1FB", border: "#185FA5", text: "#0C447C", sub_c: "#185FA5" },
  { time: "16:00–17:30", label: "Bloque 2 · frente del día (1.5h)",              sub: "Cisco / Wazuh / búsqueda, según el día",     type: "block", bg: "#E1F5EE", border: "#0F6E56", text: "#085041", sub_c: "#0F6E56" },
  { time: "17:30–21:30", label: "Cena / descanso / vida",                         type: "rest" },
  { time: "21:30–22:15", label: "Bloque 3 · inglés técnico (45 min)",            sub: "Lo más liviano: hablar, escuchar, repasar",  type: "block", bg: "#FAEEDA", border: "#BA7517", text: "#854F0B", sub_c: "#BA7517" },
  { time: "22:15–23:00", label: "Bajar revoluciones, lejos de pantalla pesada",   type: "rest" },
  { time: "23:00",       label: "A dormir",                                        type: "rest" },
];

const ymd = (d) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const uid = () => Math.random().toString(36).slice(2,9);
const lsGet = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lsSet = (k,v) => { try { localStorage.setItem(k,v); } catch { /**/ } };
const buildPlan = (d) =>
  (PLAN_SUGERIDO[d.getDay()]||[]).map(s=>({id:uid(),text:s.text,frente:s.frente,done:false}));

// ── Estilos de tarjeta base ────────────────────────────────────────────────
const card = { background:"#fff", border:"1px solid #e2e8f0", borderRadius:16,
               boxShadow:"0 1px 3px rgba(15,23,42,.05)" };

export default function OrganizadorSOC() {
  const [date,setDate]           = useState(new Date());
  const [tasks,setTasks]         = useState([]);
  const [loading,setLoading]     = useState(true);
  const [newText,setNewText]     = useState("");
  const [newFrente,setNewFrente] = useState("sc200");

  const key = `soc:dia:${ymd(date)}`;

  useEffect(()=>{
    setLoading(true);
    const raw = lsGet(key);
    let saved = null;
    try { saved = raw ? JSON.parse(raw) : null; } catch { /**/ }
    if (saved && saved.length>0) { setTasks(saved); }
    else { const p=buildPlan(date); setTasks(p); lsSet(key,JSON.stringify(p)); }
    setLoading(false);
  },[key]);

  const persist = useCallback((next)=>{ setTasks(next); lsSet(key,JSON.stringify(next)); },[key]);
  const resetDia  = ()=>persist(buildPlan(date));
  const addTask   = ()=>{ const t=newText.trim(); if(!t)return; persist([...tasks,{id:uid(),text:t,frente:newFrente,done:false}]); setNewText(""); };
  const toggle    = (id)=>persist(tasks.map(x=>x.id===id?{...x,done:!x.done}:x));
  const remove    = (id)=>persist(tasks.filter(x=>x.id!==id));
  const cambiarDia = (d)=>{ const n=new Date(date); n.setDate(n.getDate()+d); setDate(n); };

  const hechas = tasks.filter(t=>t.done).length;
  const total  = tasks.length;
  const pct    = total ? Math.round((hechas/total)*100) : 0;
  const esHoy  = ymd(date)===ymd(new Date());
  const esSemanaDia = [1,2,3,4,5].includes(date.getDay());

  const fechaLabel = date.toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"});

  const r=26, circ=2*Math.PI*r, dash=circ-(pct/100)*circ;

  return (
    <div className="app-shell" style={{fontFamily:"Inter,ui-sans-serif,system-ui,sans-serif",background:"#f1f5f9",color:"#1e293b"}}>

      {/* ── HEADER ── */}
      <header style={{background:"#fff",borderBottom:"1px solid #e2e8f0",boxShadow:"0 1px 3px rgba(15,23,42,.06)",flexShrink:0,height:52,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 1.5rem"}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <div style={{background:"linear-gradient(135deg,#3b82f6,#6366f1)",borderRadius:8,width:28,height:28,display:"flex",alignItems:"center",justifyContent:"center"}}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="2" y="2" width="5" height="5" rx="1.5" fill="white"/>
              <rect x="9" y="2" width="5" height="5" rx="1.5" fill="white" opacity=".7"/>
              <rect x="2" y="9" width="5" height="5" rx="1.5" fill="white" opacity=".7"/>
              <rect x="9" y="9" width="5" height="5" rx="1.5" fill="white" opacity=".35"/>
            </svg>
          </div>
          <span style={{fontWeight:700,fontSize:15,color:"#0f172a"}}>SOC Tracker</span>
        </div>
        <button onClick={resetDia}
          style={{color:"#64748b",border:"1px solid #e2e8f0",background:"#fff",borderRadius:8,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",gap:5,padding:"5px 12px"}}>
          ↺ Resetear día
        </button>
      </header>

      {/* ── MAIN GRID ── */}
      <div className="main-grid">

        {/* ══ COLUMNA IZQUIERDA ══ */}
        <div className="grid-col">

          {/* Fecha */}
          <div style={{...card, padding:"12px 18px", flexShrink:0}}>
            <p style={{color:"#94a3b8",fontSize:10,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",textAlign:"center",marginBottom:6}}>Plan del día</p>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <button onClick={()=>cambiarDia(-1)}
                style={{background:"#f8fafc",border:"1px solid #e2e8f0",color:"#64748b",borderRadius:10,width:34,height:34,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                ‹
              </button>
              <div style={{textAlign:"center"}}>
                <h1 style={{fontSize:"clamp(1rem,2.5vw,1.25rem)",fontWeight:700,color:"#0f172a",margin:0,letterSpacing:"-0.02em",textTransform:"capitalize"}}>
                  {fechaLabel}
                </h1>
                {esHoy && <span style={{background:"#dcfce7",color:"#16a34a",fontSize:10,fontWeight:600,borderRadius:20,padding:"2px 10px",marginTop:4,display:"inline-block"}}>Hoy</span>}
              </div>
              <button onClick={()=>cambiarDia(1)}
                style={{background:"#f8fafc",border:"1px solid #e2e8f0",color:"#64748b",borderRadius:10,width:34,height:34,fontSize:18,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
                ›
              </button>
            </div>
          </div>

          {/* Progreso */}
          <div style={{background:"linear-gradient(135deg,#1e40af 0%,#4f46e5 55%,#7c3aed 100%)",borderRadius:16,boxShadow:"0 4px 18px rgba(79,70,229,.28)",padding:"14px 20px",display:"flex",alignItems:"center",gap:16,flexShrink:0}}>
            <div style={{position:"relative",flexShrink:0}}>
              <svg width="64" height="64" style={{transform:"rotate(-90deg)"}}>
                <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="5"/>
                <circle cx="32" cy="32" r={r} fill="none" stroke="white" strokeWidth="5"
                  strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
                  style={{transition:"stroke-dashoffset .5s ease"}}/>
              </svg>
              <span style={{color:"#fff",fontWeight:700,fontSize:13,position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center"}}>
                {pct}%
              </span>
            </div>
            <div>
              <p style={{color:"rgba(255,255,255,.65)",fontSize:11,margin:"0 0 3px"}}>Progreso del día</p>
              <p style={{color:"#fff",fontSize:19,fontWeight:800,margin:0,letterSpacing:"-0.02em"}}>
                {total===0 ? "Sin objetivos" : `${hechas} / ${total} hechas`}
              </p>
              {pct===100&&total>0&&<p style={{color:"#a5f3fc",fontSize:11,margin:"3px 0 0",fontWeight:600}}>Día cerrado 🎯</p>}
            </div>
          </div>

          {/* Horario — solo días de semana */}
          {esSemanaDia ? (
            <div style={{...card, display:"flex",flexDirection:"column"}} className="flex-fill">
              <div style={{padding:"10px 18px",borderBottom:"1px solid #f1f5f9",flexShrink:0}}>
                <span style={{fontWeight:700,fontSize:13,color:"#0f172a"}}>Horario del día</span>
              </div>
              <div style={{padding:"10px 18px",overflowY:"auto",flex:1}}>
                <div style={{borderLeft:"2px solid #e2e8f0",display:"grid",gridTemplateColumns:"90px 1fr",gap:0}}>
                  {HORARIO.map((item,i)=>(
                    <>
                      <div key={`t${i}`} style={{fontSize:11,fontWeight:item.type==="block"?600:400,color:item.type==="block"?"#374151":"#9ca3af",padding:"8px 10px",lineHeight:1.3}}>
                        {item.time}
                      </div>
                      <div key={`c${i}`} style={{padding:"5px 4px 5px 0"}}>
                        {item.type==="block" ? (
                          <div style={{background:item.bg,border:`0.5px solid ${item.border}`,borderRadius:8,padding:"7px 10px"}}>
                            <div style={{fontSize:12,fontWeight:600,color:item.text}}>{item.label}</div>
                            <div style={{fontSize:11,color:item.sub_c,marginTop:1}}>{item.sub}</div>
                          </div>
                        ) : (
                          <div style={{fontSize:12,color:"#9ca3af",padding:"3px 0",lineHeight:1.4}}>{item.label}</div>
                        )}
                      </div>
                    </>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div style={{...card,padding:"20px",textAlign:"center",color:"#94a3b8",fontSize:13}} className="flex-fill">
              Fin de semana — sin horario fijo.
            </div>
          )}
        </div>

        {/* ══ COLUMNA DERECHA ══ */}
        <div className="grid-col">

          {/* Lista de tareas */}
          <div style={{...card,display:"flex",flexDirection:"column"}} className="flex-fill">
            <div style={{padding:"11px 18px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0}}>
              <span style={{fontWeight:700,fontSize:14,color:"#0f172a"}}>Objetivos</span>
              <span style={{background:"#f1f5f9",color:"#64748b",fontSize:11,fontWeight:600,borderRadius:20,padding:"2px 10px"}}>{total} tareas</span>
            </div>
            <div style={{flex:1,overflowY:"auto",minHeight:0}}>
              {loading ? (
                <div style={{color:"#cbd5e1",padding:"32px",textAlign:"center",fontSize:13}}>Cargando…</div>
              ) : tasks.length===0 ? (
                <div style={{color:"#94a3b8",padding:"32px",textAlign:"center",fontSize:13}}>Sin objetivos para este día.</div>
              ) : (
                <ul style={{margin:0,padding:0,listStyle:"none"}}>
                  {tasks.map(t=>{
                    const f=FRENTES[t.frente]||FRENTES.sc200;
                    return (
                      <li key={t.id} style={{borderLeft:`4px solid ${t.done?"#e2e8f0":f.color}`,borderBottom:"1px solid #f8fafc",display:"flex",alignItems:"center",gap:12,padding:"11px 18px",transition:"background .15s",cursor:"default"}}
                        onMouseEnter={e=>e.currentTarget.style.background="#fafafa"}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <button onClick={()=>toggle(t.id)}
                          style={{border:`2px solid ${t.done?f.color:"#cbd5e1"}`,background:t.done?f.color:"#fff",color:"#fff",borderRadius:7,width:22,height:22,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,cursor:"pointer",boxShadow:t.done?`0 2px 8px ${f.color}40`:"none",transition:"all .2s"}}>
                          {t.done?"✓":""}
                        </button>
                        <span style={{flex:1,fontSize:14,color:t.done?"#94a3b8":"#1e293b",textDecoration:t.done?"line-through":"none"}}>
                          {t.text}
                        </span>
                        <span style={{color:t.done?"#94a3b8":f.color,background:t.done?"#f8fafc":f.bg,fontSize:10,fontWeight:600,borderRadius:20,padding:"2px 9px",flexShrink:0}}>
                          {f.label}
                        </span>
                        <button onClick={()=>remove(t.id)}
                          style={{color:"#cbd5e1",fontSize:13,background:"none",border:"none",cursor:"pointer",flexShrink:0,lineHeight:1,padding:"0 2px"}}
                          onMouseEnter={e=>e.currentTarget.style.color="#f87171"}
                          onMouseLeave={e=>e.currentTarget.style.color="#cbd5e1"}>
                          ✕
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Agregar objetivo */}
          <div style={{...card,padding:"12px 16px",flexShrink:0}}>
            <div style={{display:"flex",gap:8}}>
              <input type="text" value={newText} onChange={e=>setNewText(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&addTask()} placeholder="Agregar objetivo…"
                style={{flex:1,background:"#f8fafc",border:"1.5px solid #e2e8f0",color:"#1e293b",borderRadius:10,fontSize:13,padding:"9px 14px",outline:"none",fontFamily:"inherit"}}
                onFocus={e=>e.target.style.borderColor="#93c5fd"}
                onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
              <select value={newFrente} onChange={e=>setNewFrente(e.target.value)}
                style={{background:"#f8fafc",border:"1.5px solid #e2e8f0",color:"#1e293b",borderRadius:10,fontSize:13,padding:"9px 10px",outline:"none",cursor:"pointer",fontFamily:"inherit"}}>
                {FRENTE_KEYS.map(k=><option key={k} value={k}>{FRENTES[k].label}</option>)}
              </select>
              <button onClick={addTask}
                style={{background:"linear-gradient(135deg,#3b82f6,#6366f1)",color:"#fff",borderRadius:10,fontSize:13,fontWeight:600,padding:"9px 18px",border:"none",cursor:"pointer",boxShadow:"0 3px 12px rgba(99,102,241,.35)",whiteSpace:"nowrap"}}>
                + Agregar
              </button>
            </div>
          </div>

          {/* Frentes activos */}
          <div style={{...card,padding:"11px 16px",flexShrink:0}}>
            <p style={{color:"#94a3b8",fontSize:10,fontWeight:600,letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:9}}>Frentes activos</p>
            <div style={{display:"flex",flexWrap:"wrap",gap:7}}>
              {FRENTE_KEYS.map(k=>{
                const f=FRENTES[k];
                const cnt=tasks.filter(t=>t.frente===k).length;
                const dn=tasks.filter(t=>t.frente===k&&t.done).length;
                return (
                  <div key={k} style={{background:f.bg,border:`1px solid ${f.color}28`,borderRadius:20,display:"flex",alignItems:"center",gap:6,padding:"4px 11px"}}>
                    <span style={{width:7,height:7,borderRadius:"50%",background:f.color,display:"inline-block",flexShrink:0}}/>
                    <span style={{color:"#374151",fontSize:12,fontWeight:500}}>{f.label}</span>
                    {cnt>0&&<span style={{color:f.color,fontSize:11,fontWeight:700}}>{dn}/{cnt}</span>}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
