require("dotenv").config();
const express = require("express");
const cors = require("cors");
const errorHandler = require("./middleware/errorHandler");

// Inicializa la DB al arrancar
require("./config/database").getDb();

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());

// Rutas
app.use("/api/usuarios", require("./routes/usuarios"));

// Health check
app.get("/health", (req, res) => res.json({ ok: true }));

// Manejo de errores
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
