const express = require("express");
const { prisma } = require("../db");
const { requireAdmin } = require("../middleware/admin");

const router = express.Router();

// Fonte de verdade das chaves válidas. Precisa bater com public/events.js.
const EVENT_KEYS = ["noivado", "cha", "casamento"];
const DEFAULT_EVENT = "casamento";
// Singleton do SiteConfig: sempre a mesma linha. `key` é o alvo do upsert.
const SINGLETON_KEY = "site";

/* ------------------------------------------------------------------
   Defaults de data/local — usados quando o banco está vazio ou fora
   do ar. O site NUNCA fica em branco por causa disso.

   ⚠ Espelhados em public/events.js (window.EVENT_DEFAULTS), que serve
   de último fallback se o próprio fetch de /api/config falhar.
   Ao mexer aqui, mexa lá também.
   ------------------------------------------------------------------ */
const EVENT_DEFAULTS = {
  casamento: {
    dateIso: "2027-04-11T16:00:00-03:00",
    placeShort: "Águas Claras / RS",
    placeFull: "Beco do Betinho, 1225 · Morada Casagrande · Águas Claras / RS",
    rsvpUntil: null,
    // data já confirmada pelo casal
    datePendingByDefault: false,
  },
  noivado: {
    dateIso: "2026-09-11T20:00:00-03:00",
    // o jantar é em Guaíba, endereço próprio — não é o do casamento
    placeShort: "Guaíba / RS",
    placeFull: "Rua Dr. Gabriel Fortuna, 45 · Guaíba / RS",
    rsvpUntil: "2026-09-07",
    datePendingByDefault: false,
  },
  cha: {
    // PLACEHOLDER — o casal ainda não definiu a data do chá de panela.
    // Enquanto não houver documento salvo no banco, o admin mostra aviso.
    dateIso: "2027-02-20T15:00:00-03:00",
    placeShort: "Águas Claras / RS",
    placeFull: "Beco do Betinho, 1225 · Morada Casagrande · Águas Claras / RS",
    rsvpUntil: null,
    datePendingByDefault: true,
  },
};

const LIMITS = { placeShort: 120, placeFull: 240, dateIso: 40, rsvpUntil: 40 };

function normalizeEventKey(value) {
  return EVENT_KEYS.includes(value) ? value : DEFAULT_EVENT;
}

function isValidDateString(value) {
  return typeof value === "string" && !Number.isNaN(new Date(value).getTime());
}

function trimTo(value, max) {
  return String(value).trim().slice(0, max);
}

// Monta a resposta pública de um evento a partir do default + (opcional) linha do banco.
function shapeEvent(key, row) {
  const base = EVENT_DEFAULTS[key];
  const fromDb = !!row;
  return {
    key,
    dateIso: fromDb ? row.dateIso : base.dateIso,
    placeShort: fromDb ? row.placeShort : base.placeShort,
    placeFull: fromDb ? row.placeFull : base.placeFull,
    rsvpUntil: fromDb ? row.rsvpUntil || null : base.rsvpUntil,
    // uma vez salvo pelo casal, deixa de estar pendente
    datePending: fromDb ? false : base.datePendingByDefault,
    source: fromDb ? "db" : "default",
  };
}

function shapeAll(activeEvent, rows) {
  const byKey = {};
  (rows || []).forEach((r) => {
    byKey[r.key] = r;
  });
  const events = {};
  EVENT_KEYS.forEach((key) => {
    events[key] = shapeEvent(key, byKey[key]);
  });
  return { activeEvent, events };
}

async function readConfig() {
  const [site, rows] = await Promise.all([
    prisma.siteConfig.findUnique({ where: { key: SINGLETON_KEY } }),
    prisma.eventConfig.findMany(),
  ]);
  const activeEvent = site ? normalizeEventKey(site.activeEvent) : DEFAULT_EVENT;
  return shapeAll(activeEvent, rows);
}

// Público: evento ativo + data/local dos três eventos.
// Nunca falha: banco fora do ar, model ainda não sincronizado (`db push`)
// ou coleção vazia caem nos defaults do código.
router.get("/", async (req, res) => {
  res.set("Cache-Control", "no-store");
  try {
    return res.json(await readConfig());
  } catch (err) {
    console.warn("[config] leitura falhou, caindo nos defaults:", err && err.message);
    const payload = shapeAll(DEFAULT_EVENT, []);
    payload.fallback = true;
    return res.json(payload);
  }
});

// Admin: troca o evento ativo e/ou grava data/local de UM evento.
// Body: { activeEvent?, event?: { key, dateIso?, placeShort?, placeFull?, rsvpUntil? } }
router.put("/", requireAdmin, async (req, res, next) => {
  const body = req.body || {};
  const hasActive = body.activeEvent !== undefined;
  const hasEvent = body.event !== undefined && body.event !== null;

  if (!hasActive && !hasEvent) {
    return res.status(400).json({ error: "Envie activeEvent e/ou event." });
  }

  if (hasActive && !EVENT_KEYS.includes(body.activeEvent)) {
    return res.status(400).json({
      error: `activeEvent inválido. Use um de: ${EVENT_KEYS.join(", ")}`,
    });
  }

  let eventData = null;
  let eventKey = null;
  if (hasEvent) {
    const { key, dateIso, placeShort, placeFull, rsvpUntil } = body.event;
    if (!EVENT_KEYS.includes(key)) {
      return res.status(400).json({
        error: `event.key inválido. Use um de: ${EVENT_KEYS.join(", ")}`,
      });
    }
    eventKey = key;
    const base = EVENT_DEFAULTS[key];

    if (dateIso !== undefined && !isValidDateString(dateIso)) {
      return res.status(400).json({ error: "dateIso inválido (esperado ISO 8601)." });
    }
    if (rsvpUntil !== undefined && rsvpUntil !== null && rsvpUntil !== "" && !isValidDateString(rsvpUntil)) {
      return res.status(400).json({ error: "rsvpUntil inválido (esperado ISO 8601)." });
    }

    const nextPlaceShort = placeShort === undefined ? base.placeShort : trimTo(placeShort, LIMITS.placeShort);
    const nextPlaceFull = placeFull === undefined ? base.placeFull : trimTo(placeFull, LIMITS.placeFull);
    if (!nextPlaceShort || !nextPlaceFull) {
      return res.status(400).json({ error: "placeShort e placeFull não podem ficar vazios." });
    }

    eventData = {
      dateIso: dateIso === undefined ? base.dateIso : trimTo(dateIso, LIMITS.dateIso),
      placeShort: nextPlaceShort,
      placeFull: nextPlaceFull,
      rsvpUntil:
        rsvpUntil === undefined || rsvpUntil === null || rsvpUntil === ""
          ? null
          : trimTo(rsvpUntil, LIMITS.rsvpUntil),
    };
  }

  try {
    if (hasActive) {
      await prisma.siteConfig.upsert({
        where: { key: SINGLETON_KEY },
        create: { key: SINGLETON_KEY, activeEvent: body.activeEvent },
        update: { activeEvent: body.activeEvent },
      });
    }
    if (eventData) {
      await prisma.eventConfig.upsert({
        where: { key: eventKey },
        create: { key: eventKey, ...eventData },
        update: eventData,
      });
    }
    return res.json(await readConfig());
  } catch (err) {
    // Model ainda não gerado/sincronizado: mensagem útil em vez de 500 genérico.
    if (err instanceof TypeError || (err && err.code === "P2021")) {
      return res.status(503).json({
        error: "Coleções SiteConfig/EventConfig indisponíveis. Rode `npm run db:push` no servidor.",
      });
    }
    return next(err);
  }
});

module.exports = router;
module.exports.EVENT_KEYS = EVENT_KEYS;
module.exports.DEFAULT_EVENT = DEFAULT_EVENT;
module.exports.EVENT_DEFAULTS = EVENT_DEFAULTS;
