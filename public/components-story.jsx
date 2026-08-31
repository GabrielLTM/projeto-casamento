// Hero, Story intro, Timeline, Countdown components
// A prop `ev` é a "view" do evento ativo: cópia estática de window.EVENTS
// + data/local vindos de /api/config, já derivados (window.buildEventView).
const { useState, useEffect, useRef, useMemo } = React;

// Fallback defensivo: se por algum motivo o App não passar a view montada,
// monta a do evento padrão em vez de quebrar a página.
function ev0(ev) {
  if (ev && ev.date) return ev;
  return window.buildEventView(window.DEFAULT_EVENT, null);
}

// ---------- ornaments ----------
function Ornament({ className = "" }) {
  return (
    <svg className={`ornament ${className}`} viewBox="0 0 200 24" aria-hidden="true">
      <line x1="0" y1="12" x2="80" y2="12" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="100" cy="12" r="3" fill="none" stroke="currentColor" strokeWidth="0.6" />
      <circle cx="100" cy="12" r="0.8" fill="currentColor" />
      <line x1="120" y1="12" x2="200" y2="12" stroke="currentColor" strokeWidth="0.6" />
    </svg>
  );
}

function Monogram() {
  return <span className="monogram" aria-hidden="true">G &amp; K</span>;
}

// ---------- countdown ----------
function useCountdown(target) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds };
}

// ---------- Hero ----------
function Hero({ ev }) {
  const E = ev0(ev);
  const h = E.hero;
  return (
    <section className="hero" data-screen-label="01 Hero">
      <div className="hero-image">
        <img src="assets/hero.jpg" alt="Gabriel e Kamilly" />
        <div className="hero-veil" />
      </div>
      <div className="hero-inner">
        <div className="hero-tag">
          <span className="hero-date">{E.date.tag}</span>
          <span className="dot">·</span>
          <span>{E.place.short}</span>
        </div>
        <h1 className="hero-title">
          <span className="script-names">
            <span>Gabriel</span>
            <span className="conj">e</span>
            <span>Kamilly</span>
          </span>
        </h1>
        <Ornament className="light" />
        <p className="hero-sub">
          {h.sub}
          {h.subCite && <cite className="hero-cite">{h.subCite}</cite>}
        </p>
        <div className="hero-cta">
          <a href={h.ghostCta.href} className="btn-ghost">{h.ghostCta.label}</a>
          <a href={h.solidCta.href} className="btn-solid">{h.solidCta.label}</a>
        </div>
      </div>
      <div className="hero-scroll">
        <span>role para começar</span>
        <svg viewBox="0 0 12 24" width="12" height="24"><path d="M6 0v22M2 18l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="0.8"/></svg>
      </div>
    </section>
  );
}

// ---------- Story intro ----------
function Story({ ev }) {
  const s = ev0(ev).story;
  return (
    <section className="story" id="historia" data-screen-label="02 Nossa história">
      <div className="story-inner">
        <span className="eyebrow">{s.eyebrow}</span>
        <h2 className="section-title">{s.title}</h2>
        <Ornament />
        <p className="story-lead">{s.lead}</p>
      </div>
    </section>
  );
}

// ---------- Timeline (vertical polaroids alternating) ----------
function PolaroidPhoto({ item }) {
  if (item.photo) {
    return <img src={item.photo} alt={item.title} className="polaroid-img" />;
  }
  // Fallback ilustrado, caso alguma foto ainda não exista
  return (
    <svg viewBox="0 0 200 200">
      <rect width="200" height="200" fill="#EFEDE6" />
      <path d="M60 170 L 60 90 Q 60 50 100 50 Q 140 50 140 90 L 140 170 Z" fill="none" stroke="#B89068" strokeWidth="1.5"/>
      <line x1="100" y1="50" x2="100" y2="170" stroke="#B89068" strokeWidth="0.8"/>
      <text x="100" y="110" textAnchor="middle" fontFamily="EB Garamond" fontStyle="italic" fontSize="40" fill="#B89068">∞</text>
      <text x="100" y="190" textAnchor="middle" fontFamily="Cinzel" fontSize="14" fill="#61663C" letterSpacing="3">SIM</text>
    </svg>
  );
}

function TimelineItem({ item, index }) {
  const side = index % 2 === 0 ? "left" : "right";
  return (
    <div className={`tl-item tl-${side}`}>
      <div className="tl-dot" />
      <div className="tl-card">
        <div className="polaroid" style={{ "--rot": `${item.rotate}deg` }}>
          <div className="polaroid-photo">
            <PolaroidPhoto item={item} />
          </div>
          <div className="polaroid-caption">
            <span>{item.date}</span>
          </div>
        </div>
        <div className="tl-text">
          <span className="tl-num">0{index + 1}</span>
          <h3>{item.title}</h3>
          <p>{item.text}</p>
        </div>
      </div>
    </div>
  );
}

function Timeline({ ev }) {
  const t = ev0(ev).timeline;
  return (
    <section className="timeline" data-screen-label="03 Linha do tempo">
      <div className="tl-header">
        <span className="eyebrow">{t.eyebrow}</span>
        <h2 className="section-title">{t.title}</h2>
        <Ornament />
      </div>
      <div className="tl-track">
        <div className="tl-line" />
        {window.TIMELINE.map((item, i) => (
          <TimelineItem key={i} item={item} index={i} />
        ))}
      </div>
    </section>
  );
}

// ---------- Countdown ----------
function Countdown({ ev }) {
  const E = ev0(ev);
  const cd = E.countdown;
  // E.date.ts é o instante real (a string ISO carrega o offset -03:00),
  // então a contagem fica certa mesmo para quem abre de outro fuso.
  const target = E.date.ts;
  const footLines = useMemo(() => window.countdownFootLines(E), [E]);
  const { days, hours, minutes, seconds } = useCountdown(target);
  const cells = [
    { v: days, l: "dias" },
    { v: hours, l: "horas" },
    { v: minutes, l: "minutos" },
    { v: seconds, l: "segundos" },
  ];
  return (
    <section className="countdown" data-screen-label="04 Contagem">
      <div className="cd-inner">
        <span className="eyebrow light">{cd.eyebrow}</span>
        <div className="cd-grid">
          {cells.map((c, i) => (
            <div className="cd-cell" key={i}>
              <span className="cd-num">{String(c.v).padStart(2, "0")}</span>
              <span className="cd-lbl">{c.l}</span>
            </div>
          ))}
        </div>
        <p className="cd-foot">
          <em>{E.date.long}</em>
          {footLines.map((line, i) => (
            <React.Fragment key={i}>
              <span className="sep"> · </span><br />
              {line}
            </React.Fragment>
          ))}
        </p>
      </div>
    </section>
  );
}

Object.assign(window, { Hero, Story, Timeline, Countdown, Ornament, Monogram, ev0 });
