import { useState, useEffect, useCallback } from "react";

const SOURCES = [
  { label: "jsDelivr CDN",    url: "https://cdn.jsdelivr.net/gh/AzurAPI/azurapi-js-setup@master/ships.json" },
  { label: "allorigins proxy",url: "https://api.allorigins.win/raw?url=" + encodeURIComponent("https://raw.githubusercontent.com/AzurAPI/azurapi-js-setup/master/ships.json") },
  { label: "corsproxy.io",    url: "https://corsproxy.io/?" + encodeURIComponent("https://raw.githubusercontent.com/AzurAPI/azurapi-js-setup/master/ships.json") },
];

const FACTION_STYLES = {
  "Eagle Union":         { accent: "#60a5fa",  flag: "🦅" },
  "Royal Navy":          { accent: "#a78bfa",  flag: "👑" },
  "Sakura Empire":       { accent: "#f9a8d4",  flag: "🌸" },
  "Iron Blood":          { accent: "#d4d4d8",  flag: "⚙️" },
  "Dragon Empery":       { accent: "#fca5a5",  flag: "🐉" },
  "Sardegna Empire":     { accent: "#6ee7b7",  flag: "🦁" },
  "Northern Parliament": { accent: "#67e8f9",  flag: "❄️" },
  "Iris Libre":          { accent: "#e879f9",  flag: "⚜️" },
  "Vichya Dominion":     { accent: "#f0abfc",  flag: "🌹" },
  "Tempesta":            { accent: "#fbbf24",  flag: "🌩️" },
  "META":                { accent: "#94a3b8",  flag: "🌀" },
  "Neptunia":            { accent: "#c084fc",  flag: "🎮" },
  "Bilibili":            { accent: "#fb923c",  flag: "📺" },
  "Utawarerumono":       { accent: "#4ade80",  flag: "🎭" },
  "Kizuna AI":           { accent: "#f472b6",  flag: "🤖" },
  "Hololive":            { accent: "#34d399",  flag: "🎙️" },
  "Venus Vacation":      { accent: "#fde68a",  flag: "🌴" },
  "The Idolmaster":      { accent: "#fb7185",  flag: "⭐" },
  "SSSS.Gridman":        { accent: "#38bdf8",  flag: "🦸" },
  "Atelier Ryza":        { accent: "#fb923c",  flag: "⚗️" },
  "Senran Kagura":       { accent: "#f9a8d4",  flag: "🎌" },
  "To Love-Ru":          { accent: "#fb7185",  flag: "💫" },
  "other":               { accent: "#9ca3af",  flag: "🚢" },
};

const RARITY_COLORS = {
  "Normal":     "#9ca3af", "Rare":       "#60a5fa",
  "Elite":      "#c084fc", "Super Rare": "#fbbf24",
  "Ultra Rare": "#f87171", "Priority":   "#34d399", "Decisive": "#f87171",
};

const getFS = (n) => FACTION_STYLES[n] || FACTION_STYLES["other"];
const getRC = (r) => RARITY_COLORS[r]  || "#9ca3af";

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function parseShips(json) {
  return Object.entries(json)
    .filter(([id]) => id !== "version-number")
    .map(([id, s]) => ({
      id,
      name:      s.names?.en || s.names?.code || id,
      faction:   s.nationality || "Unknown",
      type:      s.hullType || s.class || "Unknown",
      rarity:    s.rarity || "Normal",
      thumbnail: s.skins?.[0]?.image || s.skins?.[1]?.image || s.thumbnail || null,
    }))
    .filter(s => s.name);
}

// Build rounds from a list of ships
function buildRound(ships) {
  const pairs = [];
  for (let i = 0; i < ships.length - 1; i += 2) {
    pairs.push([ships[i], ships[i + 1]]);
  }
  const bye = ships.length % 2 === 1 ? ships[ships.length - 1] : null;
  return { pairs, bye };
}

const ROOT = {
  fontFamily: "'Cinzel',Georgia,serif", background: "#080c1a",
  minHeight: "100vh", width: "100%", color: "#e2d9f3",
  display: "flex", flexDirection: "column", alignItems: "center",
  justifyContent: "center", padding: "1rem", position: "relative",
  overflow: "hidden", boxSizing: "border-box",
};

const pill = (c, active) => ({
  padding: "0.4rem 1.1rem", borderRadius: "2rem",
  border: `2px solid ${active ? c : "#374151"}`,
  background: active ? `${c}22` : "transparent",
  color: active ? c : "#6b7280", cursor: "pointer",
  fontFamily: "'Cinzel',serif", fontSize: "0.78rem", fontWeight: "700",
});

function Bg() {
  return (
    <>
      <div style={{ position:"fixed",inset:0,background:"radial-gradient(ellipse at 50% 50%, #0f1935 0%, #080c1a 70%)",zIndex:0 }} />
      <div style={{ position:"fixed",inset:0,backgroundImage:"radial-gradient(circle, #1a2040 1px, transparent 1px)",backgroundSize:"30px 30px",opacity:0.25,zIndex:0 }} />
    </>
  );
}

// Single portrait card used in both game and tournament
function ShipCard({ ship, height = 520, onClick, chosen, lost, imgErrors, setImgErrors, label }) {
  const fs = getFS(ship.faction);
  const img = imgErrors[ship.id] ? null : ship.thumbnail;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative", borderRadius: "1.25rem", overflow: "hidden",
        border: `2px solid ${chosen ? "#fbbf24" : lost ? "#374151" : hovered && onClick ? fs.accent : `${fs.accent}50`}`,
        boxShadow: chosen
          ? "0 0 40px rgba(251,191,36,0.5), 0 0 80px rgba(251,191,36,0.2)"
          : lost ? "none"
          : hovered && onClick ? `0 0 50px ${fs.accent}40` : `0 0 30px ${fs.accent}15`,
        height, cursor: onClick ? "pointer" : "default",
        opacity: lost ? 0.35 : 1,
        transition: "all 0.25s",
        transform: hovered && onClick && !chosen && !lost ? "scale(1.02)" : "scale(1)",
        flex: 1,
      }}
    >
      {img ? (
        <img src={img} alt={ship.name}
          style={{ width:"100%", height:"100%", objectFit:"contain", objectPosition:"center bottom", display:"block", background:"#080c1a" }}
          onError={() => setImgErrors(p => ({...p,[ship.id]:true}))} />
      ) : (
        <div style={{ width:"100%", height:"100%", background:`linear-gradient(145deg,${fs.accent}15,#0d1225)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"5rem" }}>
          {fs.flag}
        </div>
      )}

      {/* Chosen winner glow overlay */}
      {chosen && (
        <div style={{ position:"absolute", inset:0, background:"rgba(251,191,36,0.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ fontSize:"5rem" }}>👑</div>
        </div>
      )}

      {/* VS label if provided */}
      {label && (
        <div style={{ position:"absolute", top:"0.6rem", left:"50%", transform:"translateX(-50%)", padding:"0.2rem 0.7rem", borderRadius:"1rem", background:"rgba(0,0,0,0.7)", backdropFilter:"blur(8px)", fontSize:"0.6rem", color:"#d4af37", fontFamily:"'Cinzel',serif", fontWeight:"700", whiteSpace:"nowrap" }}>
          {label}
        </div>
      )}

      {/* Bottom info */}
      <div style={{ position:"absolute", bottom:0, left:0, right:0, padding:"1.5rem 0.85rem 0.85rem", background:"linear-gradient(to top, rgba(8,12,26,0.98) 0%, rgba(8,12,26,0.75) 55%, transparent 100%)" }}>
        <div style={{ fontSize:"0.55rem", color:fs.accent, letterSpacing:"0.12em", fontWeight:"700", fontFamily:"'Cinzel',serif", marginBottom:"0.2rem" }}>{fs.flag} {ship.faction}</div>
        <h2 style={{ fontSize:"1.1rem", color:"#e2d9f3", margin:"0 0 0.3rem", fontFamily:"'Cinzel',serif", fontWeight:"900", lineHeight:1.15, textShadow:`0 0 20px ${fs.accent}70` }}>{ship.name}</h2>
        <div style={{ display:"flex", gap:"0.3rem", flexWrap:"wrap" }}>
          <span style={{ padding:"0.1rem 0.45rem", borderRadius:"1rem", background:`${fs.accent}22`, color:fs.accent, fontSize:"0.58rem", fontFamily:"Crimson Text", border:`1px solid ${fs.accent}40` }}>{ship.type}</span>
          <span style={{ padding:"0.1rem 0.45rem", borderRadius:"1rem", border:`1px solid ${getRC(ship.rarity)}55`, color:getRC(ship.rarity), fontSize:"0.58rem", fontFamily:"Crimson Text" }}>{ship.rarity}</span>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  // ── Data ──
  const [allShips,    setAllShips]    = useState([]);
  const [imgErrors,   setImgErrors]   = useState({});
  const [loadStatus,  setLoadStatus]  = useState("Connecting...");

  // ── Phase ──
  // loading | error | game | pretournament | tournament | winner | results
  const [phase, setPhase] = useState("loading");
  const [errorList, setErrorList] = useState([]);

  // ── Round 1 (Smash/Pass) ──
  const [ships,      setShips]      = useState([]);
  const [index,      setIndex]      = useState(0);
  const [smashed,    setSmashed]    = useState([]);
  const [passed,     setPassed]     = useState([]);
  const [anim,       setAnim]       = useState(null);
  const [filter,       setFilter]       = useState("All");
  const [showFilter,   setShowFilter]   = useState(false);
  const [typeFilter,   setTypeFilter]   = useState("All");
  const [showTypeFilter, setShowTypeFilter] = useState(false);

  // ── Tournament ──
  const [tournRound,   setTournRound]   = useState(1);   // round number
  const [tournPairs,   setTournPairs]   = useState([]);  // [[ship,ship], ...]
  const [tournBye,     setTournBye]     = useState(null);
  const [tournIndex,   setTournIndex]   = useState(0);   // current pair index
  const [tournWinners, setTournWinners] = useState([]);  // winners this round
  const [chosen,       setChosen]       = useState(null); // 0 or 1
  const [winner,       setWinner]       = useState(null); // final winner ship

  // ── Results tab ──
  const [resultTab, setResultTab] = useState("smash");

  // ── Load data ──
  useEffect(() => {
    let cancelled = false;
    const errs = [];
    (async () => {
      for (const src of SOURCES) {
        if (cancelled) return;
        setLoadStatus(`Trying ${src.label}...`);
        try {
          const r = await fetch(src.url, { signal: AbortSignal.timeout(8000) });
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          const json = await r.json();
          const parsed = parseShips(json);
          if (parsed.length < 10) throw new Error("Too few ships");
          if (cancelled) return;
          setAllShips(parsed);
          setShips(shuffle(parsed));
          setPhase("game");
          return;
        } catch (e) { errs.push(`${src.label}: ${e.message}`); }
      }
      if (!cancelled) { setErrorList(errs); setPhase("error"); }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Round 1 logic ──
  const factions      = ["All", ...Object.keys(FACTION_STYLES).filter(f => f !== "other")];
  const shipTypes     = ["All", ...Array.from(new Set(allShips.map(s => s.type))).sort()];
  const filteredShips = ships
    .filter(s => filter === "All" || s.faction === filter)
    .filter(s => typeFilter === "All" || s.type === typeFilter);
  const current       = filteredShips[index];
  const r1Done        = index >= filteredShips.length;
  const r1Progress    = filteredShips.length > 0 ? Math.min((index / filteredShips.length) * 100, 100) : 0;

  const handleChoice = useCallback((choice) => {
    if (r1Done || anim || phase !== "game") return;
    setAnim(choice);
    setTimeout(() => {
      if (choice === "smash") setSmashed(p => [...p, current]);
      else setPassed(p => [...p, current]);
      setIndex(i => i + 1);
      setAnim(null);
    }, 380);
  }, [r1Done, anim, current, phase]);

  useEffect(() => {
    if (phase !== "game") return;
    const h = (e) => {
      if (e.key === "ArrowLeft"  || e.key === "a") handleChoice("pass");
      if (e.key === "ArrowRight" || e.key === "d") handleChoice("smash");
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [handleChoice, phase]);

  const applyFilter = (f) => {
    setFilter(f); setIndex(0);
    setSmashed([]); setPassed([]);
    setShowFilter(false);
  };
  const applyTypeFilter = (t) => {
    setTypeFilter(t); setIndex(0);
    setSmashed([]); setPassed([]);
    setShowTypeFilter(false);
  };

  // ── Start tournament ──
  const startTournament = () => {
    if (smashed.length < 2) return;
    const shuffled = shuffle(smashed);
    const { pairs, bye } = buildRound(shuffled);
    setTournRound(1);
    setTournPairs(pairs);
    setTournBye(bye);
    setTournIndex(0);
    setTournWinners([]);
    setChosen(null);
    setPhase("tournament");
  };

  // ── Tournament: pick a ship ──
  const pickShip = (idx) => {
    if (chosen !== null) return;
    setChosen(idx);
    setTimeout(() => {
      const w = tournPairs[tournIndex][idx];
      const newWinners = [...tournWinners, w];
      const nextIndex  = tournIndex + 1;

      if (nextIndex < tournPairs.length) {
        // More pairs in this round
        setTournWinners(newWinners);
        setTournIndex(nextIndex);
        setChosen(null);
      } else {
        // Round over — collect all winners + bye
        const roundWinners = tournBye ? [...newWinners, tournBye] : newWinners;

        if (roundWinners.length === 1) {
          // We have a champion!
          setWinner(roundWinners[0]);
          setPhase("winner");
        } else {
          // Next round
          const nextShuffled = shuffle(roundWinners);
          const { pairs, bye } = buildRound(nextShuffled);
          setTournRound(r => r + 1);
          setTournPairs(pairs);
          setTournBye(bye);
          setTournIndex(0);
          setTournWinners([]);
          setChosen(null);
        }
      }
    }, 600);
  };

  const restart = () => {
    setShips(shuffle(allShips));
    setIndex(0); setSmashed([]); setPassed([]);
    setAnim(null); setFilter("All"); setShowFilter(false); setTypeFilter("All"); setShowTypeFilter(false);
    setTournRound(1); setTournPairs([]); setTournBye(null);
    setTournIndex(0); setTournWinners([]); setChosen(null); setWinner(null);
    setPhase("game");
  };

  // ════════════════════════════════════════════════
  //  LOADING
  // ════════════════════════════════════════════════
  if (phase === "loading") return (
    <div style={ROOT}>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Crimson+Text:wght@400;600&display=swap" rel="stylesheet" />
      <Bg /><style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ position:"relative",zIndex:1,textAlign:"center" }}>
        <div style={{ fontSize:"3.5rem",display:"inline-block",animation:"spin 1.5s linear infinite" }}>⚓</div>
        <p style={{ color:"#d4af37",fontFamily:"'Cinzel',serif",fontSize:"1.1rem",letterSpacing:"0.15em",marginTop:"1rem" }}>LOADING FLEET DATA</p>
        <p style={{ color:"#4b5563",fontFamily:"Crimson Text",fontSize:"0.85rem",marginTop:"0.4rem" }}>{loadStatus}</p>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════
  //  ERROR
  // ════════════════════════════════════════════════
  if (phase === "error") return (
    <div style={ROOT}>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Crimson+Text:wght@400;600&display=swap" rel="stylesheet" />
      <Bg />
      <div style={{ position:"relative",zIndex:1,textAlign:"center",maxWidth:440,padding:"1rem" }}>
        <div style={{ fontSize:"3rem",marginBottom:"0.75rem" }}>⚠️</div>
        <p style={{ color:"#f87171",fontFamily:"'Cinzel',serif",fontSize:"1.1rem" }}>ALL SOURCES BLOCKED</p>
        <div style={{ marginTop:"1rem",background:"#0d1225",border:"1px solid #1e2a45",borderRadius:"0.75rem",padding:"0.75rem",textAlign:"left" }}>
          {errorList.map((e,i) => <p key={i} style={{ color:"#4b5563",fontFamily:"Crimson Text",fontSize:"0.75rem",margin:"0.2rem 0" }}>✗ {e}</p>)}
        </div>
        <p style={{ color:"#6b7280",fontFamily:"Crimson Text",fontSize:"0.82rem",marginTop:"1rem",lineHeight:1.7 }}>
          Run locally with:<br/>
          <code style={{ color:"#a78bfa" }}>npm create vite@latest</code> → React → replace App.jsx → <code style={{ color:"#a78bfa" }}>npm run dev</code>
        </p>
      </div>
    </div>
  );

  // ════════════════════════════════════════════════
  //  RESULTS (smash/pass list)
  // ════════════════════════════════════════════════
  if (phase === "results") {
    const list = resultTab === "smash" ? smashed : passed;
    return (
      <div style={{ ...ROOT,justifyContent:"flex-start",paddingTop:"2rem" }}>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Crimson+Text:wght@400;600&display=swap" rel="stylesheet" />
        <Bg />
        <div style={{ position:"relative",zIndex:1,width:"100%",maxWidth:920,padding:"0 1rem" }}>
          <h1 style={{ textAlign:"center",fontSize:"2rem",color:"#d4af37",fontFamily:"'Cinzel',serif",marginBottom:"0.2rem" }}>⚓ FLEET VERDICT</h1>
          <p style={{ textAlign:"center",color:"#7c6f9f",marginBottom:"1.25rem",fontFamily:"Crimson Text" }}>
            {smashed.length} smashed &nbsp;·&nbsp; {passed.length} passed
          </p>
          <div style={{ display:"flex",gap:"0.6rem",justifyContent:"center",marginBottom:"1.25rem",flexWrap:"wrap" }}>
            <button onClick={() => setResultTab("smash")} style={pill("#22c55e", resultTab==="smash")}>💚 SMASH ({smashed.length})</button>
            <button onClick={() => setResultTab("pass")}  style={pill("#ef4444", resultTab==="pass")}>❌ PASS ({passed.length})</button>
            {smashed.length >= 2 && <button onClick={startTournament} style={pill("#fbbf24", false)}>🏆 START TOURNAMENT</button>}
            <button onClick={restart} style={pill("#6b7280", false)}>🔄 RESTART</button>
          </div>
          <div style={{ display:"grid",gridTemplateColumns:"repeat(auto-fill, minmax(130px,1fr))",gap:"0.5rem" }}>
            {list.map((ship, i) => {
              const fs  = getFS(ship.faction);
              const img = imgErrors[ship.id] ? null : ship.thumbnail;
              return (
                <div key={i} style={{ background:`${fs.accent}10`,border:`1px solid ${fs.accent}30`,borderRadius:"0.75rem",padding:"0.5rem",textAlign:"center" }}>
                  {img
                    ? <img src={img} alt={ship.name} style={{ width:"100%",maxHeight:72,objectFit:"contain",marginBottom:"0.2rem" }} onError={() => setImgErrors(p => ({...p,[ship.id]:true}))} />
                    : <div style={{ height:52,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.6rem" }}>{fs.flag}</div>}
                  <div style={{ fontSize:"0.68rem",fontWeight:"700",color:"#e2d9f3",fontFamily:"'Cinzel',serif",lineHeight:1.2 }}>{ship.name}</div>
                  <div style={{ fontSize:"0.56rem",color:fs.accent,marginTop:"0.15rem",fontFamily:"Crimson Text" }}>{ship.faction}</div>
                </div>
              );
            })}
            {list.length === 0 && <div style={{ gridColumn:"1/-1",textAlign:"center",color:"#4b5563",padding:"3rem",fontFamily:"Crimson Text",fontSize:"1.1rem" }}>Nothing here!</div>}
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════
  //  TOURNAMENT
  // ════════════════════════════════════════════════
  if (phase === "tournament") {
    const pair        = tournPairs[tournIndex];
    const totalPairs  = tournPairs.length;
    const remaining   = tournPairs.length - tournIndex - 1 + (tournBye ? 1 : 0) + tournWinners.length;
    const totalInRound = tournPairs.length * 2 + (tournBye ? 1 : 0);

    return (
      <div style={{ ...ROOT, justifyContent:"flex-start", paddingTop:"1.5rem" }}>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Crimson+Text:wght@400;600&display=swap" rel="stylesheet" />
        <Bg />
        <div style={{ position:"relative",zIndex:1,width:"100%",maxWidth:860,padding:"0 1rem" }}>

          {/* Header */}
          <div style={{ textAlign:"center",marginBottom:"1rem" }}>
            <h1 style={{ fontSize:"1.5rem",color:"#d4af37",letterSpacing:"0.15em",margin:0,fontFamily:"'Cinzel',serif",textShadow:"0 0 20px rgba(212,175,55,0.4)" }}>
              🏆 TOURNAMENT
            </h1>
            <p style={{ color:"#7c6f9f",margin:"0.2rem 0 0",fontSize:"0.65rem",letterSpacing:"0.15em",fontFamily:"Crimson Text" }}>
              ROUND {tournRound} &nbsp;·&nbsp; MATCH {tournIndex + 1} OF {totalPairs} &nbsp;·&nbsp; {totalInRound} SHIPS REMAIN
            </p>
          </div>

          {/* Progress */}
          <div style={{ height:"3px",background:"#1e2a45",borderRadius:"2px",marginBottom:"1.25rem",overflow:"hidden" }}>
            <div style={{ height:"100%",width:`${(tournIndex/Math.max(totalPairs,1))*100}%`,background:"linear-gradient(90deg,#d4af37,#f59e0b)",transition:"width 0.3s" }} />
          </div>

          {/* VS label */}
          <div style={{ textAlign:"center",marginBottom:"0.75rem" }}>
            <span style={{ fontSize:"0.7rem",color:"#4b5563",fontFamily:"Crimson Text",letterSpacing:"0.1em" }}>
              CLICK TO CHOOSE YOUR FAVOURITE
            </span>
          </div>

          {/* Two cards side by side */}
          <div style={{ display:"flex",gap:"0.75rem",alignItems:"stretch" }}>
            <ShipCard ship={pair[0]} height={480} onClick={() => pickShip(0)}
              chosen={chosen === 0} lost={chosen === 1}
              imgErrors={imgErrors} setImgErrors={setImgErrors} />

            {/* VS divider */}
            <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"0.5rem",minWidth:36 }}>
              <div style={{ color:"#d4af37",fontFamily:"'Cinzel',serif",fontSize:"1.4rem",fontWeight:"900",textShadow:"0 0 15px rgba(212,175,55,0.5)" }}>VS</div>
            </div>

            <ShipCard ship={pair[1]} height={480} onClick={() => pickShip(1)}
              chosen={chosen === 1} lost={chosen === 0}
              imgErrors={imgErrors} setImgErrors={setImgErrors} />
          </div>

          {/* Bye notice */}
          {tournBye && tournIndex === totalPairs - 1 && (
            <p style={{ textAlign:"center",color:"#4b5563",fontFamily:"Crimson Text",fontSize:"0.75rem",marginTop:"0.75rem" }}>
              ⚡ {tournBye.name} has a bye this round and advances automatically
            </p>
          )}

          <div style={{ textAlign:"center",marginTop:"1rem" }}>
            <button onClick={() => setPhase("results")} style={{ ...pill("#6b7280",false), fontSize:"0.65rem" }}>← Back to Results</button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════
  //  WINNER
  // ════════════════════════════════════════════════
  if (phase === "winner") {
    const fs = getFS(winner.faction);
    return (
      <div style={{ ...ROOT }}>
        <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Crimson+Text:wght@400;600&display=swap" rel="stylesheet" />
        <Bg />
        <style>{`
          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
          @keyframes glow  { 0%,100%{opacity:0.6} 50%{opacity:1} }
        `}</style>
        <div style={{ position:"relative",zIndex:1,width:"100%",maxWidth:420,padding:"0 1rem",textAlign:"center" }}>
          <div style={{ fontSize:"0.75rem",color:"#d4af37",letterSpacing:"0.3em",fontFamily:"'Cinzel',serif",marginBottom:"0.5rem",animation:"glow 2s ease-in-out infinite" }}>
            ULTIMATE WINNER
          </div>
          <h1 style={{ fontSize:"1.6rem",color:"#d4af37",fontFamily:"'Cinzel',serif",letterSpacing:"0.12em",marginBottom:"1.25rem",textShadow:"0 0 30px rgba(212,175,55,0.7)" }}>
            🏆 FLEET CHAMPION 🏆
          </h1>

          {/* Winner card */}
          <div style={{ animation:"float 3s ease-in-out infinite", borderRadius:"1.5rem", overflow:"hidden", border:`3px solid #fbbf24`, boxShadow:`0 0 80px rgba(251,191,36,0.4), 0 0 30px rgba(251,191,36,0.2), 0 30px 60px rgba(0,0,0,0.8)`, height:480, position:"relative" }}>
            {!imgErrors[winner.id] && winner.thumbnail ? (
              <img src={winner.thumbnail} alt={winner.name}
                style={{ width:"100%",height:"100%",objectFit:"contain",objectPosition:"center bottom",display:"block",background:"#080c1a" }}
                onError={() => setImgErrors(p => ({...p,[winner.id]:true}))} />
            ) : (
              <div style={{ width:"100%",height:"100%",background:`linear-gradient(145deg,${fs.accent}15,#0d1225)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"6rem" }}>
                {fs.flag}
              </div>
            )}
            {/* Gold shimmer overlay */}
            <div style={{ position:"absolute",inset:0,background:"linear-gradient(135deg, rgba(251,191,36,0.08) 0%, transparent 50%, rgba(251,191,36,0.08) 100%)" }} />

            <div style={{ position:"absolute",bottom:0,left:0,right:0,padding:"2rem 1.25rem 1.25rem",background:"linear-gradient(to top,rgba(8,12,26,0.98) 0%,rgba(8,12,26,0.75) 55%,transparent 100%)" }}>
              <div style={{ fontSize:"0.6rem",color:fs.accent,letterSpacing:"0.15em",fontFamily:"'Cinzel',serif",fontWeight:"700",marginBottom:"0.3rem" }}>{fs.flag} {winner.faction}</div>
              <h2 style={{ fontSize:"2rem",color:"#fbbf24",margin:"0 0 0.5rem",fontFamily:"'Cinzel',serif",fontWeight:"900",textShadow:"0 0 30px rgba(251,191,36,0.8)",lineHeight:1.1 }}>{winner.name}</h2>
              <div style={{ display:"flex",gap:"0.4rem",flexWrap:"wrap" }}>
                <span style={{ padding:"0.15rem 0.6rem",borderRadius:"1rem",background:`${fs.accent}25`,color:fs.accent,fontSize:"0.7rem",fontFamily:"Crimson Text",border:`1px solid ${fs.accent}40` }}>{winner.type}</span>
                <span style={{ padding:"0.15rem 0.6rem",borderRadius:"1rem",border:`1px solid ${getRC(winner.rarity)}60`,color:getRC(winner.rarity),fontSize:"0.7rem",fontFamily:"Crimson Text" }}>{winner.rarity}</span>
              </div>
            </div>
          </div>

          <div style={{ display:"flex",gap:"0.75rem",justifyContent:"center",marginTop:"1.5rem",flexWrap:"wrap" }}>
            <button onClick={() => { startTournament(); }} style={pill("#fbbf24", false)}>🔄 Redo Tournament</button>
            <button onClick={restart} style={pill("#6b7280", false)}>🔁 Full Restart</button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════
  //  GAME (Round 1 — Smash or Pass)
  // ════════════════════════════════════════════════
  const style = current ? getFS(current.faction) : { accent:"#d4af37", flag:"⚓" };
  const cardAnim = {
    transform: anim === "smash" ? "translateX(150%) rotate(28deg)" : anim === "pass" ? "translateX(-150%) rotate(-28deg)" : "none",
    opacity: anim ? 0 : 1,
    transition: "transform 0.38s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.38s",
  };

  return (
    <div style={ROOT}>
      <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Crimson+Text:wght@400;600&display=swap" rel="stylesheet" />
      <Bg />
      <div style={{ position:"relative",zIndex:1,width:"100%",maxWidth:500,padding:"0 1rem" }}>

        <div style={{ textAlign:"center",marginBottom:"1.2rem" }}>
          <h1 style={{ fontSize:"1.55rem",color:"#d4af37",letterSpacing:"0.15em",margin:0,fontFamily:"'Cinzel',serif",textShadow:"0 0 20px rgba(212,175,55,0.4)" }}>⚓ AZUR LANE</h1>
          <p style={{ color:"#7c6f9f",margin:"0.2rem 0 0",fontSize:"0.62rem",letterSpacing:"0.2em",fontFamily:"Crimson Text" }}>
            SMASH OR PASS &nbsp;·&nbsp; {allShips.length} SHIPS LOADED
          </p>
        </div>

        <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.7rem" }}>
          <div style={{ display:"flex",gap:"0.75rem",fontSize:"0.8rem",fontFamily:"Crimson Text" }}>
            <span style={{ color:"#22c55e" }}>💚 {smashed.length}</span>
            <span style={{ color:"#ef4444" }}>❌ {passed.length}</span>
          </div>
          <div style={{ display:"flex",gap:"0.4rem" }}>
            <button onClick={() => { setShowFilter(f => !f); setShowTypeFilter(false); }} style={{ padding:"0.2rem 0.65rem",background:"rgba(212,175,55,0.08)",border:`1px solid ${filter!=="All"?"#d4af37":"#d4af3740"}`,borderRadius:"1rem",color:"#d4af37",cursor:"pointer",fontFamily:"'Cinzel',serif",fontSize:"0.6rem" }}>
              🏳️ {filter === "All" ? "FACTION" : filter.length > 12 ? filter.slice(0,12)+"…" : filter}
            </button>
            <button onClick={() => { setShowTypeFilter(f => !f); setShowFilter(false); }} style={{ padding:"0.2rem 0.65rem",background:"rgba(96,165,250,0.08)",border:`1px solid ${typeFilter!=="All"?"#60a5fa":"#60a5fa40"}`,borderRadius:"1rem",color:"#60a5fa",cursor:"pointer",fontFamily:"'Cinzel',serif",fontSize:"0.6rem" }}>
              🚢 {typeFilter === "All" ? "TYPE" : typeFilter}
            </button>
          </div>
        </div>

        {showFilter && (
          <div style={{ background:"#0d1225",border:"1px solid #1e2a45",borderRadius:"0.75rem",padding:"0.55rem",marginBottom:"0.7rem",display:"flex",flexWrap:"wrap",gap:"0.28rem" }}>
            <div style={{ width:"100%",fontSize:"0.55rem",color:"#4b5563",fontFamily:"'Cinzel',serif",letterSpacing:"0.1em",marginBottom:"0.3rem" }}>FACTION</div>
            {factions.map(f => (
              <button key={f} onClick={() => applyFilter(f)} style={{ padding:"0.16rem 0.5rem",borderRadius:"1rem",border:`1px solid ${filter===f?"#d4af37":"#1e2a45"}`,background:filter===f?"rgba(212,175,55,0.12)":"transparent",color:filter===f?"#d4af37":"#6b7280",cursor:"pointer",fontSize:"0.56rem",fontFamily:"'Cinzel',serif" }}>
                {FACTION_STYLES[f]?.flag || "🏳️"} {f}
              </button>
            ))}
          </div>
        )}

        {showTypeFilter && (
          <div style={{ background:"#0d1225",border:"1px solid #1e2a45",borderRadius:"0.75rem",padding:"0.55rem",marginBottom:"0.7rem",display:"flex",flexWrap:"wrap",gap:"0.28rem" }}>
            <div style={{ width:"100%",fontSize:"0.55rem",color:"#4b5563",fontFamily:"'Cinzel',serif",letterSpacing:"0.1em",marginBottom:"0.3rem" }}>SHIP TYPE</div>
            {shipTypes.map(t => (
              <button key={t} onClick={() => applyTypeFilter(t)} style={{ padding:"0.16rem 0.5rem",borderRadius:"1rem",border:`1px solid ${typeFilter===t?"#60a5fa":"#1e2a45"}`,background:typeFilter===t?"rgba(96,165,250,0.12)":"transparent",color:typeFilter===t?"#60a5fa":"#6b7280",cursor:"pointer",fontSize:"0.56rem",fontFamily:"'Cinzel',serif" }}>
                {t}
              </button>
            ))}
          </div>
        )}

        <div style={{ height:"3px",background:"#1e2a45",borderRadius:"2px",marginBottom:"1.2rem",overflow:"hidden" }}>
          <div style={{ height:"100%",width:`${r1Progress}%`,background:"linear-gradient(90deg,#d4af37,#f59e0b)",transition:"width 0.3s" }} />
        </div>

        {r1Done ? (
          <div style={{ textAlign:"center",padding:"2.5rem 2rem",background:"#0d1a3580",border:"1px solid #1e2a45",borderRadius:"1.5rem" }}>
            <div style={{ fontSize:"2.5rem",marginBottom:"0.75rem" }}>⚓</div>
            <h2 style={{ color:"#d4af37",fontFamily:"'Cinzel',serif",margin:"0 0 0.5rem" }}>All Hands Reviewed!</h2>
            <p style={{ color:"#7c6f9f",fontFamily:"Crimson Text",marginBottom:"0.5rem" }}>
              {smashed.length} ships smashed · {passed.length} passed
            </p>
            {smashed.length >= 2 && (
              <p style={{ color:"#4ade80",fontFamily:"Crimson Text",fontSize:"0.85rem",marginBottom:"1.5rem" }}>
                🏆 {smashed.length} ships enter the tournament!
              </p>
            )}
            {smashed.length < 2 && (
              <p style={{ color:"#ef4444",fontFamily:"Crimson Text",fontSize:"0.85rem",marginBottom:"1.5rem" }}>
                You need at least 2 smashes to start a tournament.
              </p>
            )}
            <div style={{ display:"flex",gap:"0.75rem",justifyContent:"center",flexWrap:"wrap" }}>
              {smashed.length >= 2 && <button onClick={startTournament} style={pill("#fbbf24", true)}>🏆 Start Tournament</button>}
              <button onClick={() => setPhase("results")} style={pill("#d4af37", false)}>📋 See Results</button>
              <button onClick={restart} style={pill("#6b7280", false)}>🔄 Restart</button>
            </div>
          </div>
        ) : current ? (
          <>
            <div style={{ position:"relative",borderRadius:"1.5rem",overflow:"hidden",border:`2px solid ${style.accent}50`,boxShadow:`0 0 60px ${style.accent}25, 0 20px 60px rgba(0,0,0,0.6)`,height:520,...cardAnim }}>
              {!imgErrors[current.id] && current.thumbnail ? (
                <img src={current.thumbnail} alt={current.name}
                  style={{ width:"100%",height:"100%",objectFit:"contain",objectPosition:"center bottom",display:"block",background:"#080c1a" }}
                  onError={() => setImgErrors(p => ({...p,[current.id]:true}))} />
              ) : (
                <div style={{ width:"100%",height:"100%",background:`linear-gradient(145deg,${style.accent}15,#0d1225)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"6rem" }}>
                  {style.flag}
                </div>
              )}
              <div style={{ position:"absolute",top:"1rem",left:"1rem",padding:"0.25rem 0.75rem",borderRadius:"1rem",background:"rgba(0,0,0,0.65)",backdropFilter:"blur(8px)",border:`1px solid ${style.accent}50`,fontSize:"0.65rem",color:style.accent,fontFamily:"'Cinzel',serif",fontWeight:"700",letterSpacing:"0.1em" }}>
                {style.flag} {current.faction}
              </div>
              <div style={{ position:"absolute",top:"1rem",right:"1rem",padding:"0.25rem 0.6rem",borderRadius:"1rem",background:"rgba(0,0,0,0.65)",backdropFilter:"blur(8px)",fontSize:"0.6rem",color:"#6b7280",fontFamily:"Crimson Text" }}>
                {index + 1} / {filteredShips.length}
              </div>
              {anim && (
                <div style={{ position:"absolute",inset:0,background:anim==="smash"?"rgba(34,197,94,0.3)":"rgba(239,68,68,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"9rem",zIndex:10 }}>
                  {anim === "smash" ? "💚" : "❌"}
                </div>
              )}
              <div style={{ position:"absolute",bottom:0,left:0,right:0,padding:"2rem 1.25rem 1.25rem",background:"linear-gradient(to top,rgba(8,12,26,0.98) 0%,rgba(8,12,26,0.8) 60%,transparent 100%)" }}>
                <h2 style={{ fontSize:"2rem",color:"#e2d9f3",margin:"0 0 0.5rem",fontFamily:"'Cinzel',serif",fontWeight:"900",textShadow:`0 0 30px ${style.accent}80`,lineHeight:1.1 }}>{current.name}</h2>
                <div style={{ display:"flex",gap:"0.4rem",flexWrap:"wrap" }}>
                  <span style={{ padding:"0.15rem 0.6rem",borderRadius:"1rem",background:`${style.accent}25`,color:style.accent,fontSize:"0.7rem",fontFamily:"Crimson Text",border:`1px solid ${style.accent}40` }}>{current.type}</span>
                  <span style={{ padding:"0.15rem 0.6rem",borderRadius:"1rem",border:`1px solid ${getRC(current.rarity)}60`,color:getRC(current.rarity),fontSize:"0.7rem",fontFamily:"Crimson Text" }}>{current.rarity}</span>
                </div>
              </div>
            </div>

            <div style={{ display:"flex",gap:"1rem",marginTop:"1.2rem",justifyContent:"center" }}>
              <button onClick={() => handleChoice("pass")}
                style={{ flex:1,maxWidth:160,padding:"0.85rem",borderRadius:"1rem",background:"rgba(239,68,68,0.12)",border:"2px solid rgba(239,68,68,0.5)",color:"#f87171",fontSize:"1rem",cursor:"pointer",fontFamily:"'Cinzel',serif",fontWeight:"700",transition:"all 0.15s",letterSpacing:"0.08em" }}
                onMouseEnter={e => { e.currentTarget.style.transform="scale(1.06)"; e.currentTarget.style.borderColor="#ef4444"; e.currentTarget.style.background="rgba(239,68,68,0.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform="scale(1)";    e.currentTarget.style.borderColor="rgba(239,68,68,0.5)"; e.currentTarget.style.background="rgba(239,68,68,0.12)"; }}>
                ❌ PASS
              </button>
              <button onClick={() => handleChoice("smash")}
                style={{ flex:1,maxWidth:160,padding:"0.85rem",borderRadius:"1rem",background:"rgba(34,197,94,0.12)",border:"2px solid rgba(34,197,94,0.5)",color:"#4ade80",fontSize:"1rem",cursor:"pointer",fontFamily:"'Cinzel',serif",fontWeight:"700",transition:"all 0.15s",letterSpacing:"0.08em" }}
                onMouseEnter={e => { e.currentTarget.style.transform="scale(1.06)"; e.currentTarget.style.borderColor="#22c55e"; e.currentTarget.style.background="rgba(34,197,94,0.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform="scale(1)";    e.currentTarget.style.borderColor="rgba(34,197,94,0.5)";  e.currentTarget.style.background="rgba(34,197,94,0.12)"; }}>
                💚 SMASH
              </button>
            </div>
            <p style={{ textAlign:"center",color:"#1f2937",fontSize:"0.56rem",marginTop:"0.45rem",fontFamily:"Crimson Text" }}>← / A = Pass &nbsp;·&nbsp; → / D = Smash</p>
          </>
        ) : null}
      </div>
    </div>
  );
}
