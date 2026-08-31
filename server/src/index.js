require("dotenv").config();

const path = require("path");
const express = require("express");
const helmet = require("helmet");

const giftsRouter = require("./routes/gifts");
const reservationsRouter = require("./routes/reservations");
const rsvpRouter = require("./routes/rsvp");
const configRouter = require("./routes/config");

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.resolve(__dirname, "../../public");

app.use(
  helmet({
    contentSecurityPolicy: false, // CDN React/Babel + qrserver inline
    crossOriginEmbedderPolicy: false,
  })
);
app.use(express.json({ limit: "100kb" }));

// API
app.use("/api/config", configRouter);
app.use("/api/gifts", giftsRouter);
app.use("/api/reservations", reservationsRouter);
app.use("/api/rsvp", rsvpRouter);

// Static
app.use(express.static(PUBLIC_DIR, { extensions: ["html"] }));

// SPA fallback (root + admin)
app.get("/", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "index.html")));
app.get("/admin", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "admin.html")));

// 404 JSON pra rotas /api desconhecidas
app.use("/api", (req, res) => res.status(404).json({ error: "Endpoint não encontrado" }));

// Error handler
app.use((err, req, res, _next) => {
  console.error("[error]", err);
  res.status(500).json({ error: "Erro interno" });
});

app.listen(PORT, () => {
  console.log(`Server up at http://localhost:${PORT}`);
});
