require("dotenv").config();
const express = require("express");
const cors = require("cors");
const errorHandler = require("./middleware/errorHandler");

require("./config/database").getDb();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());

// Rutas
app.use("/api/usuarios", require("./routes/usuarios"));
app.use("/api/contratos", require("./routes/contratos"));
app.use("/api/apuestas", require("./routes/apuestas"));

app.get("/health", (req, res) => res.json({ ok: true }));
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
