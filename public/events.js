/* ============================================================
   events.js — FONTE DE VERDADE das diferenças ESTRUTURAIS entre
   os três eventos: quais seções entram, rótulos dos botões e as
   cópias de cada seção.

   O que NÃO mora aqui: data, local e limite de confirmação.
   Isso é dado editável, vem de GET /api/config e o casal altera
   no /admin. Os defaults abaixo (window.EVENT_DEFAULTS) só entram
   se o próprio fetch falhar.

   Chaves válidas (batem com server/src/routes/config.js):
     "noivado" | "cha" | "casamento"
   ============================================================ */

/* ------------------------------------------------------------------
   Fuso do site. O Brasil não tem mais horário de verão, então o RS é
   sempre UTC-03:00. O painel manda datetime-local ("2026-09-11T20:00")
   e a gente carimba esse offset antes de salvar — assim o horário de
   parede digitado é exatamente o que o convidado lê.
   ------------------------------------------------------------------ */
window.SITE_UTC_OFFSET = "-03:00";

/* ------------------------------------------------------------------
   ⚠ Espelho de EVENT_DEFAULTS em server/src/routes/config.js.
   Último fallback: só é usado se GET /api/config nem responder.
   Ao mexer em um, mexa no outro.
   ------------------------------------------------------------------ */
window.EVENT_DEFAULTS = {
  casamento: {
    dateIso: "2027-04-11T16:00:00-03:00",
    placeShort: "Águas Claras / RS",
    placeFull: "Beco do Betinho, 1225 · Morada Casagrande · Águas Claras / RS",
    rsvpUntil: null,
    datePending: false,
    source: "default",
  },
  noivado: {
    dateIso: "2026-09-11T20:00:00-03:00",
    placeShort: "Guaíba / RS",
    placeFull: "Rua Dr. Gabriel Fortuna, 45 · Guaíba / RS",
    rsvpUntil: "2026-09-07",
    datePending: false,
    source: "default",
  },
  cha: {
    // PLACEHOLDER — data do chá ainda não definida pelo casal.
    dateIso: "2027-02-20T15:00:00-03:00",
    placeShort: "Águas Claras / RS",
    placeFull: "Beco do Betinho, 1225 · Morada Casagrande · Águas Claras / RS",
    rsvpUntil: null,
    datePending: true,
    source: "default",
  },
};

/* ============================================================
   Derivação de data — ponto ÚNICO de formatação.
   Nenhum componente chama toLocaleDateString: todos leem daqui.
   ============================================================ */
const MESES_PT = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Lê os componentes LITERAIS da string ISO em vez de converter para o
// fuso do visitante. "2026-09-11T20:00:00-03:00" é sempre 11/09 às 20h,
// esteja o convidado onde estiver — com getDate()/getMonth() a data
// escorregaria um dia para quem abrisse de outro fuso.
const ISO_PARTS = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/;

window.formatEventDate = function formatEventDate(iso) {
  const m = ISO_PARTS.exec(String(iso || ""));
  if (!m) return null;

  const year = m[1];
  const month = m[2];
  const day = m[3];
  const hh = m[4] || "00";
  const mm = m[5] || "00";

  const dayNumber = String(Number(day)); // "04" → "4", como em "4 de Janeiro"
  const monthName = MESES_PT[Number(month) - 1] || "";
  const parsed = new Date(iso);

  return {
    iso: String(iso),
    // instante real (respeita o offset) — é o que alimenta a contagem
    ts: Number.isNaN(parsed.getTime()) ? NaN : parsed.getTime(),
    tag: `${day} · ${month} · ${year}`,             // 11 · 09 · 2026
    long: `${dayNumber} de ${monthName} de ${year}`, // 11 de Setembro de 2026
    dayMonth: `${dayNumber} de ${monthName}`,        // 11 de Setembro
    stack: [day, month, year.slice(2)],              // ["11", "09", "26"]
    hour: mm === "00" ? `${hh}h` : `${hh}h${mm}`,    // 20h · 20h30
    short: `${day}.${month}.${year}`,                // 11.09.2026
    dayDotMonth: `${day}.${month}`,                  // 01.09
    inputDateTime: `${year}-${month}-${day}T${hh}:${mm}`, // <input type="datetime-local">
    inputDate: `${year}-${month}-${day}`,                 // <input type="date">
  };
};

// Converte o valor de um <input type="datetime-local"> em ISO com offset do site.
window.toSiteIso = function toSiteIso(localValue) {
  if (!localValue) return null;
  const value = String(localValue).length === 16 ? `${localValue}:00` : String(localValue);
  return `${value}${window.SITE_UTC_OFFSET}`;
};

// "Beco do Betinho, 1225 · Morada Casagrande · Águas Claras / RS"
//   → ["Beco do Betinho, 1225 · Morada Casagrande", "Águas Claras / RS"]
// O último trecho (cidade/UF) vira a segunda linha; o resto fica na primeira.
// É assim que o rodapé da contagem e o footer sempre foram quebrados.
function splitPlace(placeFull) {
  const parts = String(placeFull || "")
    .split(" · ")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length <= 1) return parts;
  return [parts.slice(0, -1).join(" · "), parts[parts.length - 1]];
}

// Texto da história — igual nos três eventos: é a história do casal.
const HISTORIA = {
  eyebrow: "Capítulo um",
  title: "A nossa história",
  lead:
    'Tudo começou com um olhar, um "oi" assustado, foi virando um sonho que nunca poderíamos imaginar. Hoje, depois de tudo, só podemos olhar pra trás e agradecer a Deus por tudo que Ele nos proporcionou.',
};

const LINHA_DO_TEMPO = {
  eyebrow: "Linha do tempo",
  title: "Cinco datas, uma vida.",
};

const AGRADECIMENTO_TITULO = {
  titleEm: "Obrigado",
  titleAfter: " por fazer parte ",
  titleTail: "dessa história.",
  textAfter: ".",
  signLead: "com amor,",
};


/* Confirmação de presença — o convidado responde direto no site.
   A cópia é a mesma nos três eventos; o que muda é só ligar/desligar em
   `sections.rsvp`. Hoje só o noivado usa (o convite pede confirmação),
   mas basta virar a flag para o chá ou o casamento passarem a ter. */
const PRESENCA = {
  // sem eyebrow: a seção é um desdobramento do convite logo acima, então
  // um "capítulo" próprio aqui não teria sentido
  title: "Confirme sua presença",
  lead: (v) =>
    v.rsvp
      ? `Precisamos saber quem vem para preparar tudo com carinho — responda até ${v.rsvp.dayDotMonth}. Leva menos de um minuto.`
      : "Precisamos saber quem vem para preparar tudo com carinho. Leva menos de um minuto.",
  openLabel: "Confirmar presença",

  form: {
    title: "Você vem?",
    text:
      "Conte para a gente quem está confirmando e quantas pessoas vêm com você — assim conseguimos preparar tudo direitinho.",
    nameLabel: "Seu nome completo",
    namePlaceholder: "Como aparece no convite",
    goingLabel: "Você vai comparecer?",
    yes: "Sim, eu vou",
    no: "Não vou conseguir",
    guestsLabel: "Quantas pessoas (contando você)",
    messageLabel: "Recadinho (opcional)",
    messagePlaceholder: "Deixe um carinho pra gente",
    submit: "Confirmar",
    submitting: "Enviando…",
    cancel: "Cancelar",
  },

  doneYes: {
    eyebrow: (name) => `Obrigado, ${name}`,
    title: "Presença confirmada.",
    text: (n) =>
      n > 1
        ? `Anotamos você e mais ${n - 1} ${n - 1 === 1 ? "pessoa" : "pessoas"}. Já estamos ansiosos.`
        : "Anotamos aqui. Já estamos ansiosos para receber você.",
  },
  doneNo: {
    eyebrow: (name) => `Obrigado por avisar, ${name}`,
    title: "Vamos sentir sua falta.",
    text: () =>
      "Obrigado por responder mesmo assim — isso ajuda muito na organização. Fica para a próxima celebração.",
  },
  done: { close: "Fechar" },

  errors: {
    name: "Por favor, informe seu nome.",
    going: "Diga se você vai poder ir.",
    network: "Erro de conexão. Tente novamente.",
    generic: "Não foi possível enviar. Tente novamente.",
  },
};

window.EVENTS = {
  /* ==========================================================
     CASAMENTO — é a interface atual do site. Os textos abaixo
     foram extraídos 1:1 dos componentes originais; mudar aqui
     muda a página que já está no ar.
     ========================================================== */
  casamento: {
    key: "casamento",
    adminLabel: "Lista de Casamento",
    adminHint: "Site completo: história, contagem, lista de presentes e PIX.",

    // Quais seções entram no <main>, na ordem em que o App renderiza.
    sections: {
      story: true,
      timeline: true,
      countdown: true,
      gifts: true,
      invite: false,
      rsvp: false,
      pix: true,
      thanks: true,
    },

    // documentTitle recebe a view do evento (data já derivada).
    documentTitle: (v) => `Gabriel & Kamilly · ${v.date.long}`,

    hero: {
      sub:
        "Vamos nos casar. E queríamos muito que você fizesse parte desse capítulo da nossa história.",
      ghostCta: { label: "Nossa história", href: "#historia" },
      solidCta: { label: "Lista de presentes", href: "#presentes" },
    },

    story: HISTORIA,
    timeline: LINHA_DO_TEMPO,
    rsvpSection: PRESENCA,

    countdown: {
      eyebrow: "faltam apenas",
      // rodapé = <em>{data}</em> + linhas do endereço (+ hora/rsvp se marcado)
      showHour: false,
      showRsvp: false,
    },

    gifts: {
      eyebrow: "Capítulo dois",
      title: "Lista de presentes",
      lead:
        "Sua presença já é o nosso maior presente. Mas se quiser nos ajudar a montar a casa, ficamos felizes — escolhemos cada item com carinho, pensando no nosso primeiro lar.",
    },

    pix: {
      eyebrow: "Outra forma de presentear",
      title: "Presente em PIX",
      lead:
        "Se preferir não escolher um item da lista, você pode contribuir diretamente — toda ajudinha vai virar parte da nossa nova casa, ou um momento especial da nossa lua de mel.",
      hint: "Aponte a câmera do seu banco para o QR Code ao lado, ou copie a chave abaixo.",
    },

    thanks: Object.assign({}, AGRADECIMENTO_TITULO, {
      textBefore:
        "Cada nome nessa lista, cada mensagem, cada abraço — guardamos tudo. A gente mal vê a hora de receber vocês no ",
    }),
  },

  /* ==========================================================
     NOIVADO — jantar de noivado. Única seção que sai é a lista
     de presentes (#presentes); no lugar dela entra o convite
     (#convite). A seção PIX continua.
     ========================================================== */
  noivado: {
    key: "noivado",
    adminLabel: "Jantar de Noivado",
    adminHint: "Sem lista de presentes — no lugar dela aparece o convite do jantar. PIX continua.",

    sections: {
      story: true,
      timeline: true,
      countdown: true,
      gifts: false,
      invite: true,
      rsvp: true,
      pix: true,
      thanks: true,
    },

    // neutro de propósito: o título da aba apareceria antes de qualquer
    // clique e entregaria a surpresa
    documentTitle: (v) => `Gabriel & Kamilly · ${v.date.long}`,

    hero: {
      // o jantar é surpresa até o convite ser aberto: nada aqui pode entregar
      // de que tipo de celebração se trata
      sub:
        "Deus é amor. Todo aquele que permanece no amor permanece em Deus, e Deus nele.",
      subCite: "1 João 4:16",
      ghostCta: { label: "Nossa história", href: "#historia" },
      solidCta: { label: "Um convite especial", href: "#convite" },
    },

    story: HISTORIA,
    timeline: LINHA_DO_TEMPO,
    rsvpSection: PRESENCA,

    countdown: {
      eyebrow: "faltam apenas",
      showHour: true,
      showRsvp: true,
      hourLine: (hour) => `às ${hour}`,
      rsvpLine: (day) => `confirme sua presença até ${day}`,
    },

    invite: {
      eyebrow: "Capítulo dois",
      title: "Um convite especial",
      lead:
        "Reservamos uma noite para celebrar o noivado com quem esteve com a gente desde o começo. Abra o envelope — o convite foi feito pensando em você.",
      openLabel: "Abrir convite",
      closeLabel: "Fechar convite",
      // legenda para leitores de tela / alt da arte final
      alt: (v) =>
        `Convite do jantar de noivado de Gabriel e Kamilly, ${v.date.long}, às ${v.date.hour}.`,
      card: {
        titleTop: "Jantar",
        titleBottom: "de Noivado",
        body:
          "Queremos dar início as celebrações dessa temporada tão especial para nós – e para isso, te convidamos para viver conosco",
        // as linhas em itálico, alinhadas à direita: hora, endereço, confirmação
        noteHour: (hour) => `Te esperamos às ${hour}`,
        notePlace: (place) => place,
        noteRsvp: (day) => `confirmar presença até o dia ${day}`,
        // separado para o "e" poder ser renderizado menor, como no hero
        monogram: { left: "G", right: "K" },
      },
    },

    // ---- ÚNICO PONTO DE TROCA DO CARD DO CONVITE ----------------
    // null   → o convite é renderizado em HTML/CSS (componente InviteCard).
    // string → renderiza <img src={conviteImage}> no lugar, mantendo o
    //          envelope, a animação e o botão de abrir/fechar. Basta
    //          apontar para a arte final quando o casal enviar, ex.:
    //          "assets/convite-noivado.jpg" (retrato, ~1:1.41).
    conviteImage: null,
    // -------------------------------------------------------------

    pix: {
      eyebrow: "Outra forma de celebrar",
      // no noivado o título evita a palavra "presente": o convidado não pode
      // confundir esta seção com a lista de presentes do casamento
      title: "Se quiser nos abençoar nessa jornada pré casamento",
      // "presentear" aqui reintroduziria justamente a confusão com a lista
      // de presentes do casamento que o título acima evita
      qrCaption: "escaneie para abençoar",
      // sem o "Se quiser" do original, que agora ecoaria o título
      lead:
        "Você pode contribuir diretamente — cada ajudinha vira parte da casa que estamos começando a construir.",
      hint: "Aponte a câmera do seu banco para o QR Code ao lado, ou copie a chave abaixo.",
    },

    thanks: Object.assign({}, AGRADECIMENTO_TITULO, {
      textBefore:
        "Cada mensagem, cada abraço, cada oração — guardamos tudo. A gente mal vê a hora de receber vocês no ",
    }),
  },

  /* ==========================================================
     CHÁ DE PANELA — mesma estrutura do casamento (lista de
     presentes + PIX), com cópia própria.
     ========================================================== */
  cha: {
    key: "cha",
    adminLabel: "Chá de Panela",
    adminHint: "Mesma estrutura do casamento (lista + PIX), com os textos do chá.",

    sections: {
      story: true,
      timeline: true,
      countdown: true,
      gifts: true,
      invite: false,
      rsvp: false,
      pix: true,
      thanks: true,
    },

    documentTitle: () => "Gabriel & Kamilly · Chá de Panela",

    hero: {
      sub:
        "Antes da mudança, um chá. Vem com a gente montar, item por item, a casa onde a nossa história vai continuar.",
      ghostCta: { label: "Nossa história", href: "#historia" },
      solidCta: { label: "Lista de presentes", href: "#presentes" },
    },

    story: HISTORIA,
    timeline: LINHA_DO_TEMPO,
    rsvpSection: PRESENCA,

    countdown: {
      eyebrow: "faltam apenas",
      showHour: true,
      showRsvp: false,
      hourLine: (hour) => `às ${hour}`,
    },

    gifts: {
      eyebrow: "Montando a casa",
      title: "Lista do chá de panela",
      lead:
        "O chá de panela é a parte prática do sonho: a panela, a toalha, a colher que sempre falta. Escolhemos cada item pensando no dia a dia da nossa casa — e adoraríamos que você fizesse parte disso.",
    },

    pix: {
      eyebrow: "Outra forma de presentear",
      title: "Presente em PIX",
      lead:
        "Se preferir não escolher um item da lista, você pode contribuir diretamente — toda ajudinha vira panela, toalha, tempero: as primeiras coisas da nossa cozinha.",
      hint: "Aponte a câmera do seu banco para o QR Code ao lado, ou copie a chave abaixo.",
    },

    thanks: Object.assign({}, AGRADECIMENTO_TITULO, {
      textBefore:
        "Cada nome nessa lista, cada mensagem, cada abraço — guardamos tudo. Cada item vai ter uso, história e a lembrança de quem deu. A gente mal vê a hora de receber vocês no ",
    }),
  },
};

// Ordem em que os três botões aparecem no admin.
window.EVENT_ORDER = ["noivado", "cha", "casamento"];
window.DEFAULT_EVENT = "casamento";

// Resolve uma chave em config estática, sempre devolvendo algo renderizável.
window.getEvent = function getEvent(key) {
  return window.EVENTS[key] || window.EVENTS[window.DEFAULT_EVENT];
};

/* ------------------------------------------------------------------
   buildEventView — junta a cópia estática (EVENTS) com os dados
   editáveis vindos da API e já entrega tudo derivado. É o objeto que
   circula como prop `ev` pelos componentes.
   ------------------------------------------------------------------ */
window.buildEventView = function buildEventView(key, data) {
  const safeKey = window.EVENTS[key] ? key : window.DEFAULT_EVENT;
  const config = window.EVENTS[safeKey];
  const fallback = window.EVENT_DEFAULTS[safeKey];
  const source = data || fallback;

  const date = window.formatEventDate(source.dateIso) || window.formatEventDate(fallback.dateIso);
  const rsvp = source.rsvpUntil ? window.formatEventDate(source.rsvpUntil) : null;
  const placeFull = source.placeFull || fallback.placeFull;

  return Object.assign({}, config, {
    data: source,
    date: date,
    rsvp: rsvp,
    place: {
      short: source.placeShort || fallback.placeShort,
      full: placeFull,
      lines: splitPlace(placeFull),
    },
  });
};

// Linhas do rodapé da contagem regressiva, montadas a partir da view.
window.countdownFootLines = function countdownFootLines(v) {
  const cd = v.countdown || {};
  const lines = [];
  if (cd.showHour && cd.hourLine && v.date) lines.push(cd.hourLine(v.date.hour));
  lines.push.apply(lines, v.place.lines);
  if (cd.showRsvp && cd.rsvpLine && v.rsvp) lines.push(cd.rsvpLine(v.rsvp.dayDotMonth));
  return lines;
};

// Linhas do footer: endereço + a data curta grudada na última linha,
// exatamente como o rodapé sempre foi ("Águas Claras / RS · 11.04.2027").
window.footerLines = function footerLines(v) {
  const lines = v.place.lines.slice();
  if (!lines.length) return [v.date ? v.date.short : ""];
  lines[lines.length - 1] = `${lines[lines.length - 1]} · ${v.date.short}`;
  return lines;
};
