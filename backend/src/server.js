import express from "express";
import cors from "cors";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Ruta de prueba (health check)
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "API funcionando correctamente 🚀",
    timestamp: new Date(),
  });
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

export default app;
