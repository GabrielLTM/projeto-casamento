const express = require("express");
const { prisma } = require("../db");
const { requireAdmin } = require("../middleware/admin");

const router = express.Router();

// Public: lista presentes ativos com flag reserved (sem expor dados do convidado)
router.get("/", async (req, res, next) => {
  try {
    const gifts = await prisma.gift.findMany({
      where: { active: true },
      orderBy: { createdAt: "asc" },
      include: { reservation: { select: { id: true } } },
    });
    res.json(
      gifts.map((g) => ({
        id: g.id,
        name: g.name,
        category: g.category,
        brand: g.brand,
        price: g.price,
        imageUrl: g.imageUrl,
        storeUrl: g.storeUrl,
        reserved: !!g.reservation,
      }))
    );
  } catch (err) {
    next(err);
  }
});

// Admin: lista completa
router.get("/admin", requireAdmin, async (req, res, next) => {
  try {
    const gifts = await prisma.gift.findMany({
      orderBy: { createdAt: "desc" },
      include: { reservation: true },
    });
    res.json(gifts);
  } catch (err) {
    next(err);
  }
});

function sanitize(body) {
  const { name, category, brand, price, imageUrl, storeUrl, active } = body || {};
  if (!name || !category || price === undefined) {
    return { error: "name, category e price são obrigatórios" };
  }
  const parsedPrice = Number(price);
  if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
    return { error: "price inválido" };
  }
  return {
    data: {
      name: String(name).trim(),
      category: String(category).trim(),
      brand: brand ? String(brand).trim() : null,
      price: parsedPrice,
      imageUrl: imageUrl ? String(imageUrl).trim() : null,
      storeUrl: storeUrl ? String(storeUrl).trim() : null,
      active: active === undefined ? true : Boolean(active),
    },
  };
}

router.post("/admin", requireAdmin, async (req, res, next) => {
  try {
    const result = sanitize(req.body);
    if (result.error) return res.status(400).json({ error: result.error });
    const created = await prisma.gift.create({ data: result.data });
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.put("/admin/:id", requireAdmin, async (req, res, next) => {
  try {
    const result = sanitize(req.body);
    if (result.error) return res.status(400).json({ error: result.error });
    const updated = await prisma.gift.update({
      where: { id: req.params.id },
      data: result.data,
    });
    res.json(updated);
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Presente não encontrado" });
    next(err);
  }
});

router.delete("/admin/:id", requireAdmin, async (req, res, next) => {
  try {
    await prisma.gift.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (err) {
    if (err.code === "P2025") return res.status(404).json({ error: "Presente não encontrado" });
    next(err);
  }
});

module.exports = router;
