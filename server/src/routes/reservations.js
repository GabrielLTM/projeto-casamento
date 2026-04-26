const express = require("express");
const rateLimit = require("express-rate-limit");
const { prisma } = require("../db");
const { requireAdmin } = require("../middleware/admin");

const router = express.Router();

const reserveLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas. Tente novamente em instantes." },
});

// Public: cria reserva
router.post("/", reserveLimiter, async (req, res, next) => {
  try {
    const { giftId, guestName, message, paymentChoice } = req.body || {};
    if (!giftId || !guestName || !String(guestName).trim()) {
      return res.status(400).json({ error: "giftId e guestName são obrigatórios" });
    }
    if (paymentChoice && !["pix", "store"].includes(paymentChoice)) {
      return res.status(400).json({ error: "paymentChoice inválido" });
    }

    const gift = await prisma.gift.findUnique({ where: { id: giftId } });
    if (!gift || !gift.active) {
      return res.status(404).json({ error: "Presente não encontrado" });
    }

    const reservation = await prisma.reservation.create({
      data: {
        giftId: gift.id,
        guestName: String(guestName).trim().slice(0, 120),
        message: message ? String(message).trim().slice(0, 500) : null,
        paymentChoice: paymentChoice || null,
        giftName: gift.name,
        giftCategory: gift.category,
        giftPrice: gift.price,
        giftImageUrl: gift.imageUrl,
        giftStoreUrl: gift.storeUrl,
      },
    });
    res.status(201).json({ id: reservation.id });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Esse presente já foi reservado" });
    }
    next(err);
  }
});

// Admin: lista todas reservas
router.get("/admin", requireAdmin, async (req, res, next) => {
  try {
    const reservations = await prisma.reservation.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(reservations);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
