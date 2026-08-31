// Seção #convite — envelope fechado que abre e revela o card do convite.
// Só entra no <main> quando o evento ativo tem sections.invite === true
// (hoje: "noivado"). Ocupa o lugar da lista de presentes.
const { useState: useState3, useCallback: useCallback3, useEffect: useEffect3, useRef: useRef3 } = React;

// Data e limite de confirmação vêm da view (/api/config) — nada de data
// escrita à mão aqui dentro.
function inviteNoteLines(E) {
  const card = E.invite.card;
  const lines = [];
  if (card.noteHour && E.date) lines.push({ kind: "hour", text: card.noteHour(E.date.hour) });
  // o endereço vem do cadastro (/api/config), não escrito à mão aqui
  if (card.notePlace && E.place && E.place.full) {
    lines.push({ kind: "place", text: card.notePlace(E.place.full) });
  }
  if (card.noteRsvp && E.rsvp) lines.push({ kind: "rsvp", text: card.noteRsvp(E.rsvp.dayDotMonth) });
  return lines;
}

/* ------------------------------------------------------------------
   InviteCard — o convite em si.

   ÚNICO PONTO DE TROCA: EVENTS.noivado.conviteImage (public/events.js).
     null   → renderiza a versão em HTML/CSS abaixo (o padrão de hoje).
     string → renderiza <img src={...}> com a arte final do casal,
              mantendo o envelope, a animação e o botão de abrir/fechar.
   Não é preciso mexer neste componente para fazer a troca.
   ------------------------------------------------------------------ */
function InviteCard({ ev }) {
  const E = ev0(ev);
  const invite = E.invite;
  const alt = typeof invite.alt === "function" ? invite.alt(E) : invite.alt;

  if (E.conviteImage) {
    return (
      <div className="inv-card inv-card-art">
        <img src={E.conviteImage} alt={alt} />
      </div>
    );
  }

  const c = invite.card;
  return (
    <article className="inv-card" aria-label={alt}>
      <div className="inv-datestrip" aria-hidden="true">
        {E.date.stack.map((line, i) => (
          <span key={i}>{line}</span>
        ))}
      </div>

      <h3 className="inv-headline">
        <span className="inv-headline-1">{c.titleTop}</span>
        <span className="inv-headline-2">{c.titleBottom}</span>
      </h3>

      <p className="inv-body">{c.body}</p>

      <p className="inv-note">
        {inviteNoteLines(E).map((line, i) => (
          <span key={i} className={`inv-note-${line.kind}`}>{line.text}</span>
        ))}
      </p>

      <div className="inv-mark" aria-hidden="true">{c.monogram}</div>
    </article>
  );
}

/* ------------------------------------------------------------------
   Envelope — papel (--paper) no corpo, abas em --soft, filete e lacre
   em oliva. A aba de cima gira em 3D (rotateX) sobre a borda superior;
   o card sobe com um leve atraso; o envelope recua e some para o card
   ficar legível por inteiro. Fechar refaz o caminho ao contrário.
   ------------------------------------------------------------------ */
function Envelope({ ev, open, onToggle }) {
  const E = ev0(ev);
  const invite = E.invite;

  return (
    <div className={`envelope ${open ? "is-open" : ""}`}>
      <div className="env-stage">
        <div className="env-back" aria-hidden="true" />

        {/* abas laterais + aba de baixo (o "bolso" do envelope) */}
        <svg
          className="env-pocket"
          viewBox="0 0 108 162"
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <polygon className="env-fold" points="0,0 54,62 0,162" />
          <polygon className="env-fold" points="108,0 54,62 108,162" />
          <polygon className="env-fold env-fold-bottom" points="0,162 54,62 108,162" />
        </svg>

        {/* aba superior — a que gira */}
        <div className="env-flap" aria-hidden="true">
          <svg viewBox="0 0 108 62" preserveAspectRatio="none" focusable="false">
            <polygon className="env-fold" points="0,0 108,0 54,62" />
          </svg>
          <span className="env-seal">
            {/* círculo em SVG: o lacre é redondo sem usar border-radius */}
            <svg viewBox="0 0 100 100" focusable="false">
              <circle cx="50" cy="50" r="49" />
            </svg>
            <span className="env-seal-mark">{invite.card.monogram}</span>
          </span>
        </div>
      </div>

      <button
        type="button"
        className="btn-ghost dark env-toggle"
        onClick={onToggle}
        aria-expanded={open}
      >
        {open ? invite.closeLabel : invite.openLabel}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------
   InviteOverlay — o convite em tela cheia, à frente da página.

   O card impresso é retrato e cheio de tipografia miúda; dentro da
   seção ele ficava pequeno demais para ler no celular. Aqui ele ocupa
   a largura toda da tela (limitado só pelo retrato 1:1.41).
   ------------------------------------------------------------------ */
function InviteOverlay({ ev, onClose }) {
  const E = ev0(ev);
  const closeRef = useRef3(null);
  const alt = typeof E.invite.alt === "function" ? E.invite.alt(E) : E.invite.alt;

  useEffect3(() => {
    // trava o scroll do fundo e devolve a barra sem "pular" o layout
    const body = document.body;
    const prevOverflow = body.style.overflow;
    const prevPad = body.style.paddingRight;
    const gap = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;

    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    if (closeRef.current) closeRef.current.focus();

    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPad;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div
      className="inv-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={alt}
    >
      <div className="inv-overlay-inner" onClick={(e) => e.stopPropagation()}>
        <button
          ref={closeRef}
          type="button"
          className="inv-overlay-close"
          onClick={onClose}
          aria-label="Fechar convite"
        >
          ×
        </button>
        <InviteCard ev={E} />

        {/* atalho para confirmar logo depois de ler o convite; fecha o
            overlay e avisa a seção #presenca, que abre o formulário */}
        {E.sections && E.sections.rsvp && E.rsvpSection && (
          <div className="inv-overlay-cta">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                onClose();
                window.dispatchEvent(new CustomEvent("gk:rsvp-open"));
              }}
            >
              {E.rsvpSection.openLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------- Seção ----------
function Invite({ ev }) {
  const E = ev0(ev);
  const invite = E.invite;
  const [open, setOpen] = useState3(false);
  const toggle = useCallback3(() => setOpen((v) => !v), []);
  const close = useCallback3(() => setOpen(false), []);

  return (
    <section className="invite" id="convite" data-screen-label="05 Convite">
      <div className="invite-header">
        <span className="eyebrow">{invite.eyebrow}</span>
        <h2 className="section-title">{invite.title}</h2>
        <Ornament />
        <p className="invite-lead">{invite.lead}</p>
      </div>
      <Envelope ev={E} open={open} onToggle={toggle} />
      {open && <InviteOverlay ev={E} onClose={close} />}
    </section>
  );
}

Object.assign(window, { Invite, Envelope, InviteCard, InviteOverlay });
