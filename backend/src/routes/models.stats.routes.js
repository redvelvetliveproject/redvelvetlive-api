// ============================================
// 📊 RedVelvetLive — Rutas Públicas de Estadísticas de Modelos (PRO FINAL)
// ============================================
//
// Devuelve métricas rápidas para KPIs o dashboards:
//   ✅ Total de modelos activos
//   ✅ Total de inactivos
//   ✅ Total de destacadas
//   ✅ Total de embajadoras
//   ✅ Total en vivo (ONLINE o VOICE_ONLY)
// ============================================

import express from "express";
import ModelUser from "../models/ModelUser.js";

const router = express.Router();

/* ==========================================================
   ✅ Estadísticas globales de modelos
   ========================================================== */
router.get("/", async (req, res) => {
  try {
    const [active, inactive, featured, ambassadors, live] = await Promise.all([
      ModelUser.countDocuments({ status: "ACTIVE" }),
      ModelUser.countDocuments({ status: "INACTIVE" }),
      ModelUser.countDocuments({ featured: true, status: "ACTIVE" }),
      ModelUser.countDocuments({ ambassador: true, status: "ACTIVE" }),
      ModelUser.countDocuments({
        status: "ACTIVE",
        liveStatus: { $in: ["ONLINE", "VOICE_ONLY"] },
      }),
    ]);

    res.json({
      success: true,
      data: {
        active,
        inactive,
        featured,
        ambassadors,
        live,
      },
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("❌ Error obteniendo estadísticas:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al obtener estadísticas de modelos.",
    });
  }
});

export default router;