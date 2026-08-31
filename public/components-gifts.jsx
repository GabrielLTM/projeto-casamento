// Lista de presentes integrada com API: fetch /api/gifts, POST /api/reservations
const { useState: useState2, useEffect: useEffect2, useMemo: useMemo2 } = React;

const PIX_KEY = "gabriellessa251@gmail.com";
const PIX_BRCODE = "00020126470014BR.GOV.BCB.PIX0125gabriellessa251@gmail.com5204000053039865802BR5925Gabriel Lessa Tramasol Ma6009SAO PAULO62140510l8VVMgFvBE63044555";
const CATEGORIES = ["Todos", "Cozinha", "Sala de estar", "Banheiro", "Eletrodomésticos", "Decoração"];

// Paleta do PDF de identidade
const C = { deep: "#B89068", light: "#E1DBC9", soft: "#EFEDE6", paper: "#F8F7F4" };

const qrUrl = (size) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=10&color=231F20&bgcolor=F8F7F4&data=${encodeURIComponent(PIX_BRCODE)}`;

function GiftPlaceholder({ cat }) {
  const map = {
    "Cozinha": (
      <g>
        <ellipse cx="100" cy="115" rx="55" ry="10" fill={C.deep} opacity="0.15"/>
        <path d="M 50 60 L 50 105 Q 50 115 60 115 L 140 115 Q 150 115 150 105 L 150 60 Z" fill={C.light}/>
        <rect x="46" y="56" width="108" height="8" rx="2" fill={C.deep}/>
        <line x1="40" y1="60" x2="35" y2="60" stroke={C.deep} strokeWidth="3" strokeLinecap="round"/>
        <line x1="160" y1="60" x2="165" y2="60" stroke={C.deep} strokeWidth="3" strokeLinecap="round"/>
      </g>
    ),
    "Sala de estar": (
      <g>
        <rect x="40" y="70" width="120" height="40" rx="8" fill={C.light}/>
        <rect x="35" y="95" width="130" height="20" rx="4" fill={C.deep} opacity="0.6"/>
        <rect x="38" y="110" width="6" height="20" fill={C.deep}/>
        <rect x="156" y="110" width="6" height="20" fill={C.deep}/>
        <rect x="55" y="65" width="30" height="20" rx="4" fill={C.soft}/>
        <rect x="115" y="65" width="30" height="20" rx="4" fill={C.soft}/>
      </g>
    ),
    "Banheiro": (
      <g>
        <rect x="55" y="55" width="90" height="65" rx="4" fill={C.soft}/>
        <rect x="55" y="55" width="90" height="8" fill={C.deep}/>
        <line x1="70" y1="75" x2="130" y2="75" stroke={C.deep} strokeWidth="0.6"/>
        <line x1="70" y1="85" x2="130" y2="85" stroke={C.deep} strokeWidth="0.6"/>
        <line x1="70" y1="95" x2="130" y2="95" stroke={C.deep} strokeWidth="0.6"/>
        <line x1="70" y1="105" x2="130" y2="105" stroke={C.deep} strokeWidth="0.6"/>
      </g>
    ),
    "Eletrodomésticos": (
      <g>
        <rect x="55" y="55" width="90" height="70" rx="6" fill={C.light}/>
        <circle cx="100" cy="90" r="22" fill={C.paper}/>
        <circle cx="100" cy="90" r="14" fill="none" stroke={C.deep} strokeWidth="1"/>
        <circle cx="100" cy="90" r="3" fill={C.deep}/>
        <rect x="65" y="62" width="20" height="3" rx="1.5" fill={C.deep}/>
      </g>
    ),
    "Decoração": (
      <g>
        <path d="M 85 60 L 115 60 L 110 75 L 90 75 Z" fill={C.deep}/>
        <ellipse cx="100" cy="100" rx="22" ry="28" fill={C.light}/>
        <path d="M 100 75 Q 96 85 96 95 Q 96 105 100 110 Q 104 105 104 95 Q 104 85 100 75" fill={C.deep} opacity="0.5"/>
        <ellipse cx="100" cy="125" rx="18" ry="3" fill={C.deep} opacity="0.2"/>
      </g>
    ),
  };
  return (
    <svg viewBox="0 0 200 160" className="gift-svg">
      <rect width="200" height="160" fill={C.soft} opacity="0.6"/>
      {map[cat] || map["Decoração"]}
    </svg>
  );
}

function GiftCard({ gift, onReserve }) {
  const reserved = gift.reserved;
  const [imgError, setImgError] = useState2(false);
  const showImage = gift.imageUrl && !imgError;

  return (
    <article className={`gift-card ${reserved ? "reserved" : ""}`}>
      <div className="gift-image">
        {showImage ? (
          <img
            src={gift.imageUrl}
            alt={gift.name}
            onError={() => setImgError(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <GiftPlaceholder cat={gift.category} />
        )}
        {reserved && (
          <div className="gift-stamp">
            <span>Reservado</span>
          </div>
        )}
      </div>
      <div className="gift-meta">
        <span className="gift-cat">{gift.category}</span>
        <h3 className="gift-name">{gift.name}</h3>
        <span className="gift-brand">{gift.brand || ""}</span>
        <div className="gift-foot">
          <span className="gift-price">
            <span className="cur">R$</span>
            {gift.price.toLocaleString("pt-BR")}
          </span>
          <button
            className="gift-btn"
            disabled={reserved}
            onClick={() => onReserve(gift)}
          >
            {reserved ? "Reservado" : "Presentear"}
          </button>
        </div>
      </div>
    </article>
  );
}

function PixPanel({ gift }) {
  const [copied, setCopied] = useState2(false);
  const copyKey = () => {
    navigator.clipboard?.writeText(PIX_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="reserve-pix">
      <div className="reserve-pix-info">
        <span className="ms-lbl">Chave PIX (e-mail)</span>
        <span className="ms-val mono">{PIX_KEY}</span>
        <button onClick={copyKey} className="btn-ghost dark" type="button">
          {copied ? "✓ Copiada" : "Copiar chave"}
        </button>
        <p className="modal-tip">
          No app do seu banco escolha PIX › Chave › E-mail, cole a chave e digite o valor de
          {" "}<strong>R$ {gift.price.toLocaleString("pt-BR")}</strong>.
        </p>
      </div>
      <div className="reserve-pix-qr">
        <img src={qrUrl(240)} alt="QR Code PIX" />
      </div>
    </div>
  );
}

function ReservationModal({ gift, onClose, onSuccess }) {
  const [name, setName] = useState2("");
  const [message, setMessage] = useState2("");
  const [stage, setStage] = useState2("form"); // form | options
  const [submitting, setSubmitting] = useState2(false);
  const [error, setError] = useState2(null);

  if (!gift) return null;

  const submit = async (e) => {
    if (e) e.preventDefault();
    if (!name.trim()) {
      setError("Por favor, informe seu nome.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          giftId: gift.id,
          guestName: name.trim(),
          message: message.trim() || undefined,
          paymentChoice: "pix",
        }),
      });
      if (res.status === 409) {
        setError("Que pena — alguém acabou de reservar esse presente. Escolha outro?");
        setSubmitting(false);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Não foi possível concluir. Tente novamente.");
        setSubmitting(false);
        return;
      }
      setStage("options");
      setSubmitting(false);
      onSuccess && onSuccess();
    } catch (err) {
      setError("Erro de conexão. Tente novamente.");
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">×</button>

        {stage === "form" ? (
          <>
            <span className="eyebrow">Presentear</span>
            <h3 className="modal-title">{gift.name}</h3>
            <Ornament />
            <p className="modal-text">
              Que carinho enorme. Conte para a gente quem está reservando esse
              presente — assim conseguimos agradecer com nome e tudo.
            </p>
            <form onSubmit={submit} className="modal-form">
              <label>
                <span>Seu nome completo</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Como aparece no convite"
                  autoFocus
                  maxLength={120}
                />
              </label>
              <label>
                <span>Recadinho (opcional)</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Deixe um carinho pra gente"
                  rows={3}
                  maxLength={500}
                />
              </label>
              <div className="modal-summary">
                <div>
                  <span className="ms-lbl">Item</span>
                  <span className="ms-val">{gift.name}</span>
                </div>
                <div>
                  <span className="ms-lbl">Valor</span>
                  <span className="ms-val">R$ {gift.price.toLocaleString("pt-BR")}</span>
                </div>
              </div>
              {error && <p className="modal-error">{error}</p>}
              <div className="modal-actions">
                <button type="button" className="btn-ghost dark" onClick={onClose} disabled={submitting}>Cancelar</button>
                <button type="submit" className="btn-solid" disabled={submitting}>
                  {submitting ? "Reservando..." : "Reservar presente"}
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <span className="eyebrow">Obrigado, {name.split(" ")[0]}</span>
            <h3 className="modal-title">Presente reservado.</h3>
            <Ornament />
            <p className="modal-text">
              Agora é só escolher como prefere presentear: via PIX (mais simples)
              {gift.storeUrl ? " ou indo até a loja" : ""}.
            </p>

            <PixPanel gift={gift} />

            <div className="modal-actions" style={{ marginTop: "1.2rem", gap: "0.6rem" }}>
              {gift.storeUrl && (
                <a className="btn-ghost dark" href={gift.storeUrl} target="_blank" rel="noreferrer">
                  Comprar direto na loja
                </a>
              )}
              <button className="btn-solid" onClick={onClose}>Concluído</button>
            </div>

            <p className="modal-tip">
              <em>Caso prefira não concluir, escreva para a gente — soltamos o item de volta na lista.</em>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Gifts({ ev }) {
  const copy = ev0(ev).gifts;
  const [filter, setFilter] = useState2("Todos");
  const [gifts, setGifts] = useState2([]);
  const [loading, setLoading] = useState2(true);
  const [active, setActive] = useState2(null);

  const load = () => {
    setLoading(true);
    fetch("/api/gifts")
      .then((r) => r.json())
      .then((data) => {
        setGifts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect2(() => {
    load();
  }, []);

  const list = useMemo2(
    () => (filter === "Todos" ? gifts : gifts.filter((g) => g.category === filter)),
    [filter, gifts]
  );

  const counts = useMemo2(() => {
    const c = { Todos: gifts.length };
    gifts.forEach((g) => {
      c[g.category] = (c[g.category] || 0) + 1;
    });
    return c;
  }, [gifts]);

  const totalReserved = gifts.filter((g) => g.reserved).length;

  return (
    <section className="gifts" id="presentes" data-screen-label="05 Presentes">
      <div className="gifts-header">
        <span className="eyebrow">{copy.eyebrow}</span>
        <h2 className="section-title">{copy.title}</h2>
        <Ornament />
        <p className="gifts-lead">{copy.lead}</p>
        <div className="gifts-stats">
          <span><strong>{gifts.length}</strong> presentes</span>
          <span className="dot">·</span>
          <span><strong>{totalReserved}</strong> reservados</span>
          <span className="dot">·</span>
          <span><strong>{gifts.length - totalReserved}</strong> disponíveis</span>
        </div>
      </div>

      {loading ? (
        <p className="gifts-empty">Carregando lista de presentes…</p>
      ) : gifts.length === 0 ? (
        <p className="gifts-empty">A lista está sendo preparada com carinho. Volte em breve!</p>
      ) : (
        <>
          <div className="gifts-filters">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`filter ${filter === cat ? "active" : ""}`}
                onClick={() => setFilter(cat)}
              >
                <span>{cat}</span>
                <span className="filter-count">{counts[cat] || 0}</span>
              </button>
            ))}
          </div>

          <div className="gifts-grid">
            {list.map((g) => (
              <GiftCard key={g.id} gift={g} onReserve={setActive} />
            ))}
          </div>
        </>
      )}

      <ReservationModal
        gift={active}
        onClose={() => setActive(null)}
        onSuccess={load}
      />
    </section>
  );
}

// ---------- PIX section ----------
function Pix({ ev }) {
  const copy = ev0(ev).pix;
  const [copied, setCopied] = useState2(false);

  const copyKey = () => {
    navigator.clipboard?.writeText(PIX_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="pix" id="pix" data-screen-label="06 PIX">
      <div className="pix-inner">
        <div className="pix-col">
          <div className="pix-text">
            <span className="eyebrow light">{copy.eyebrow}</span>
            <h2 className="section-title light">{copy.title}</h2>
            <Ornament className="light" />
            <p>{copy.lead}</p>
            <p className="pix-hint">{copy.hint}</p>
          </div>

          <div className="pix-aside">
            <div className="pix-key">
              <div>
                <span className="ms-lbl">Chave PIX (e-mail)</span>
                <span className="ms-val mono">{PIX_KEY}</span>
              </div>
              <button onClick={copyKey} className="btn-ghost light">
                {copied ? "✓ Copiada" : "Copiar"}
              </button>
            </div>
            <div className="pix-recipient">
              <span className="ms-lbl">Em nome de</span>
              <span className="ms-val">Gabriel Lessa</span>
            </div>
          </div>
        </div>

        <div className="pix-qr">
          <div className="pix-qr-frame">
            <div className="qr-corners">
              <span /><span /><span /><span />
            </div>
            <img src={qrUrl(400)} alt="QR Code PIX" />
            <div className="qr-foot">
              <Monogram />
              <span>{copy.qrCaption || "escaneie para presentear"}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------- Thanks ----------
function Thanks({ ev }) {
  const E = ev0(ev);
  const copy = E.thanks;
  const [firstFooterLine, ...restFooterLines] = window.footerLines(E);
  return (
    <section className="thanks" data-screen-label="07 Agradecimento">
      <div className="thanks-inner">
        <Ornament />
        <h2 className="thanks-title">
          <em>{copy.titleEm}</em>{copy.titleAfter}<br/>{copy.titleTail}
        </h2>
        <p className="thanks-text">
          {copy.textBefore}<em>{E.date.dayMonth}</em>{copy.textAfter}
        </p>
        <div className="thanks-sign">
          <span>{copy.signLead}</span>
          <span className="thanks-names">Gabriel <span className="conj">e</span> Kamilly</span>
        </div>
      </div>
      <footer className="footer">
        <Monogram />
        <p>
          {firstFooterLine}
          {restFooterLines.map((line, i) => (
            <React.Fragment key={i}>
              <span className="sep"> · </span><br />
              {line}
            </React.Fragment>
          ))}
        </p>
      </footer>
    </section>
  );
}

Object.assign(window, { Gifts, Pix, Thanks, ReservationModal, GiftCard });
