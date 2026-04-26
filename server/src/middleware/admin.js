function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return res.status(500).json({ error: "ADMIN_TOKEN não configurado no servidor" });
  }
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || token !== expected) {
    return res.status(401).json({ error: "Não autorizado" });
  }
  next();
}

module.exports = { requireAdmin };
