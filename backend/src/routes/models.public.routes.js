// ============================================
// 🌹 RedVelvetLive — Rutas Públicas de Modelos (PRO FINAL)
// ============================================
//
// Permite al frontend mostrar listados públicos sin exponer datos internos.
// Incluye:
//   ✅ /api/models                → Listado general con filtros
//   ✅ /api/models/top            → Ranking global (por seguidores o ingresos)
//   ✅ /api/models/featured       → Modelos destacadas
//   ✅ /api/models/live           → Modelos transmitiendo
//   ✅ /api/models/ambassadors    → Embajadoras activas
// ============================================

import express from "express";
import ModelUser from "../models/ModelUser.js";

const router = express.Router();

/* ==========================================================
   ✅ 1️⃣ Listado general /api/models
   ========================================================== */
router.get("/", async (req, res) => {
  try {
    const { status = "ACTIVE", search = "", limit = 50, skip = 0 } = req.query;

    const query = { status: status.toUpperCase() };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
      ];
    }

    const [models, total] = await Promise.all([
      ModelUser.find(query)
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .select(
          "name country avatarUrl bannerUrl liveStatus followers featured ambassador"
        )
        .lean(),
      ModelUser.countDocuments(query),
    ]);

    res.json({
      success: true,
      total,
      count: models.length,
      data: models,
    });
  } catch (error) {
    console.error("❌ Error listando modelos públicos:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al listar modelos.",
    });
  }
});

/* ==========================================================
   ✅ 2️⃣ Top Modelos /api/models/top
   ========================================================== */
router.get("/top", async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const models = await ModelUser.find({ status: "ACTIVE" })
      .sort({ followers: -1, totalEarnings: -1 })
      .limit(Number(limit))
      .select(
        "name country avatarUrl bannerUrl followers totalEarnings featured ambassador"
      )
      .lean();

    res.json({
      success: true,
      category: "top",
      count: models.length,
      data: models,
    });
  } catch (error) {
    console.error("❌ Error en /api/models/top:", error);
    res.status(500).json({
      success: false,
      message: "Error obteniendo ranking top.",
    });
  }
});

/* ==========================================================
   ✅ 3️⃣ Destacadas /api/models/featured
   ========================================================== */
router.get("/featured", async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const models = await ModelUser.find({ status: "ACTIVE", featured: true })
      .sort({ updatedAt: -1 })
      .limit(Number(limit))
      .select(
        "name country avatarUrl bannerUrl featured ambassador followers"
      )
      .lean();

    res.json({
      success: true,
      category: "featured",
      count: models.length,
      data: models,
    });
  } catch (error) {
    console.error("❌ Error en /api/models/featured:", error);
    res.status(500).json({
      success: false,
      message: "Error obteniendo modelos destacadas.",
    });
  }
});

/* ==========================================================
   ✅ 4️⃣ En Vivo /api/models/live
   ========================================================== */
router.get("/live", async (req, res) => {
  try {
    const models = await ModelUser.find({
      status: "ACTIVE",
      liveStatus: { $in: ["ONLINE", "VOICE_ONLY"] },
    })
      .sort({ updatedAt: -1 })
      .select(
        "name country avatarUrl bannerUrl liveStatus followers featured ambassador"
      )
      .lean();

    res.json({
      success: true,
      category: "live",
      count: models.length,
      data: models,
    });
  } catch (error) {
    console.error("❌ Error en /api/models/live:", error);
    res.status(500).json({
      success: false,
      message: "Error obteniendo modelos en vivo.",
    });
  }
});

/* ==========================================================
   ✅ 5️⃣ Embajadoras /api/models/ambassadors
   ========================================================== */
router.get("/ambassadors", async (req, res) => {
  try {
    const models = await ModelUser.find({
      status: "ACTIVE",
      ambassador: true,
    })
      .sort({ followers: -1 })
      .select("name country avatarUrl bannerUrl ambassador featured followers")
      .lean();

    res.json({
      success: true,
      category: "ambassadors",
      count: models.length,
      data: models,
    });
  } catch (error) {
    console.error("❌ Error en /api/models/ambassadors:", error);
    res.status(500).json({
      success: false,
      message: "Error obteniendo embajadoras.",
    });
  }
});

export default router;
