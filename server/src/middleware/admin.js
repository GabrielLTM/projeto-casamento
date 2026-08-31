const crypto = require("crypto");
const rateLimit = require("express-rate-limit");

// Compara em tempo constante. Os dois lados passam por SHA-256 antes para
// terem sempre o mesmo tamanho — assim nem o comprimento do token vaza,
// e o timingSafeEqual (que exige buffers iguais) nunca lança.
function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

// Só entra em cena quando a credencial JÁ falhou, então tudo que ele conta
// é tentativa errada. É por IP: quem martela trava a si mesmo.
const failedAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas tentativas. Tente novamente em 15 minutos." },
});

function tokenIsValid(req, expected) {
  const header = req.headers.authorization || "";
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && !!token && safeEqual(token, expected);
}

function requireAdmin(req, res, next) {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    return res.status(500).json({ error: "ADMIN_TOKEN não configurado no servidor" });
  }

  // Credencial correta passa sempre, mesmo que o IP esteja bloqueado: o
  // limite existe para impedir adivinhação, e quem acertou não adivinhou.
  // Sem isso, o dono do painel se tranca sozinho depois de errar 10 vezes.
  if (tokenIsValid(req, expected)) return next();

  // Errou: registra a tentativa e deixa o limitador decidir entre
  // devolver 401 (ainda dentro da cota) ou 429 (estourou).
  return failedAttemptLimiter(req, res, () => {
    res.status(401).json({ error: "Não autorizado" });
  });
}

module.exports = { requireAdmin };
