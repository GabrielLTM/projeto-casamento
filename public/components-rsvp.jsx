// Seção #presenca — o convidado confirma presença direto no site.
// Entra no <main> quando o evento ativo tem sections.rsvp === true.
// A cópia vem de EVENTS[...].rsvpSection; o prazo vem de view.rsvp (/api/config).
const { useState: useState4, useCallback: useCallback4, useEffect: useEffect4, useRef: useRef4 } = React;

function RsvpModal({ ev, onClose }) {
  const E = ev0(ev);
  const S = E.rsvpSection;
  const f = S.form;

  const [name, setName] = useState4("");
  const [attending, setAttending] = useState4(null); // null | true | false
  // string enquanto digita; só vira número ao sair do campo e no envio
  const [guests, setGuests] = useState4("2");
  const [message, setMessage] = useState4("");
  const [stage, setStage] = useState4("form"); // form | done
  const [sending, setSending] = useState4(false);
  const [error, setError] = useState4(null);
  const firstRef = useRef4(null);

  useEffect4(() => {
    const body = document.body;
    const prevOverflow = body.style.overflow;
    body.style.overflow = "hidden";
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    if (firstRef.current) firstRef.current.focus();
    return () => {
      body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim()) { setError(S.errors.name); return; }
    if (attending === null) { setError(S.errors.going); return; }

    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/rsvp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event: E.key,
          guestName: name.trim(),
          attending: attending,
          guests: attending ? guestsNum() : 0,
          message: message.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || S.errors.generic);
        setSending(false);
        return;
      }
      setStage("done");
      setSending(false);
    } catch (err) {
      setError(S.errors.network);
      setSending(false);
    }
  };

  // o que de fato vai para a API e para a mensagem final
  const guestsNum = () => {
    const n = parseInt(guests, 10);
    if (!Number.isFinite(n) || n < 1) return 1;
    return Math.min(20, n);
  };

  const firstName = name.trim().split(" ")[0] || "";
  const done = attending ? S.doneYes : S.doneNo;

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">×</button>

        {stage === "form" ? (
          <>
            <span className="eyebrow">{S.title}</span>
            <h3 className="modal-title">{f.title}</h3>
            <Ornament />
            <p className="modal-text">{f.text}</p>

            <form onSubmit={submit} className="modal-form">
              <label>
                <span>{f.nameLabel}</span>
                <input
                  ref={firstRef}
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={f.namePlaceholder}
                  maxLength={120}
                />
              </label>

              <div className="rsvp-choice" role="group" aria-label={f.goingLabel}>
                <span className="rsvp-choice-lbl">{f.goingLabel}</span>
                <div className="rsvp-choice-btns">
                  <button
                    type="button"
                    className={`rsvp-opt ${attending === true ? "is-on" : ""}`}
                    onClick={() => { setAttending(true); setError(null); }}
                    aria-pressed={attending === true}
                  >
                    {f.yes}
                  </button>
                  <button
                    type="button"
                    className={`rsvp-opt ${attending === false ? "is-on" : ""}`}
                    onClick={() => { setAttending(false); setError(null); }}
                    aria-pressed={attending === false}
                  >
                    {f.no}
                  </button>
                </div>
              </div>

              {attending === true && (
                <label className="rsvp-guests">
                  <span>{f.guestsLabel}</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={2}
                    value={guests}
                    /* aceita só dígitos, mas deixa o campo vazio enquanto digita */
                    onChange={(e) => setGuests(e.target.value.replace(/\D/g, "").slice(0, 2))}
                    onBlur={() => setGuests(String(guestsNum()))}
                  />
                </label>
              )}

              <label>
                <span>{f.messageLabel}</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={f.messagePlaceholder}
                  rows={3}
                  maxLength={500}
                />
              </label>

              {error && <p className="modal-error">{error}</p>}

              <div className="modal-actions">
                <button type="button" className="btn-ghost dark" onClick={onClose} disabled={sending}>
                  {f.cancel}
                </button>
                <button type="submit" className="btn-solid" disabled={sending}>
                  {sending ? f.submitting : f.submit}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <span className="eyebrow">{done.eyebrow(firstName)}</span>
            <h3 className="modal-title">{done.title}</h3>
            <Ornament />
            <p className="modal-text">{done.text(guestsNum())}</p>
            <div className="modal-actions">
              <button className="btn-solid" onClick={onClose}>{S.done.close}</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Rsvp({ ev }) {
  const E = ev0(ev);
  const S = E.rsvpSection;
  const [open, setOpen] = useState4(false);
  const close = useCallback4(() => setOpen(false), []);
  const lead = typeof S.lead === "function" ? S.lead(E) : S.lead;

  // o botão dentro do convite aberto dispara isto ao fechar o overlay
  useEffect4(() => {
    const onAsk = () => setOpen(true);
    window.addEventListener("gk:rsvp-open", onAsk);
    return () => window.removeEventListener("gk:rsvp-open", onAsk);
  }, []);

  return (
    <section className="rsvp" id="presenca" data-screen-label="06 Presença">
      <div className="rsvp-inner">
        {S.eyebrow && <span className="eyebrow">{S.eyebrow}</span>}
        <h2 className="section-title">{S.title}</h2>
        <Ornament />
        <p className="rsvp-lead">{lead}</p>
        <button type="button" className="btn-solid rsvp-cta" onClick={() => setOpen(true)}>
          {S.openLabel}
        </button>
      </div>
      {open && <RsvpModal ev={E} onClose={close} />}
    </section>
  );
}

Object.assign(window, { Rsvp, RsvpModal });
