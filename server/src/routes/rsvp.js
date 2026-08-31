const express = require("express");
const rateLimit = require("express-rate-limit");
const { prisma } = require("../db");
const { requireAdmin } = require("../middleware/admin");

const router = express.Router();

const EVENT_KEYS = ["noivado", "cha", "casamento"];
const MAX_GUESTS = 20;

// mesmo teto das reservas: o suficiente para uma família confirmando junta,
// baixo o suficiente para não virar porta de flood
const rsvpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas. Tente novamente em instantes." },
});

// Public: convidado confirma (ou declina) presença
router.post("/", rsvpLimiter, async (req, res, next) => {
  try {
    const { event, guestName, attending, guests, message } = req.body || {};

    if (!EVENT_KEYS.includes(event)) {
      return res.status(400).json({ error: "Evento inválido." });
    }
    if (!guestName || !String(guestName).trim()) {
      return res.status(400).json({ error: "Por favor, informe seu nome." });
    }
    if (typeof attending !== "boolean") {
      return res.status(400).json({ error: "Informe se você vai comparecer." });
    }

    // quem não vai não leva ninguém; quem vai conta pelo menos consigo mesmo
    let count = 1;
    if (attending) {
      count = Number.parseInt(guests, 10);
      if (!Number.isFinite(count) || count < 1) count = 1;
      if (count > MAX_GUESTS) count = MAX_GUESTS;
    }

    const created = await prisma.rsvp.create({
      data: {
        event,
        guestName: String(guestName).trim().slice(0, 120),
        attending,
        guests: attending ? count : 0,
        message: message ? String(message).trim().slice(0, 500) : null,
      },
    });

    res.status(201).json({ id: created.id });
  } catch (err) {
    next(err);
  }
});

// Admin: lista as confirmações, opcionalmente de um evento só
router.get("/admin", requireAdmin, async (req, res, next) => {
  try {
    const { event } = req.query;
    const where = EVENT_KEYS.includes(event) ? { event } : {};
    const list = await prisma.rsvp.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// Admin: remove uma confirmação (duplicada, teste, engano do convidado)
router.delete("/admin/:id", requireAdmin, async (req, res, next) => {
  try {
    await prisma.rsvp.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Confirmação não encontrada" });
    }
    next(err);
  }
});

module.exports = router;
