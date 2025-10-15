// ============================================
// 🌹 RedVelvetLive — Rutas Públicas de Modelos (PRO EXTENDIDA)
// ============================================
//
// API avanzada para mostrar información segura de modelos:
//   ✅ Listado general con búsqueda y filtros
//   ✅ Perfil público individual
//   ✅ Ranking dinámico (Top / Destacadas / Embajadoras / En vivo)
//
// Totalmente optimizada para SEO y carga en el frontend.
// ============================================

import express from "express";
import ModelUser from "../models/ModelUser.js";

const router = express.Router();

/* ==========================================================
   ✅ 1️⃣ Listado general con búsqueda y filtros
   ========================================================== */
router.get("/", async (req, res) => {
  try {
    const {
      limit = 30,
      skip = 0,
      country,
      featured,
      ambassador,
      q,
      sort = "recent",
    } = req.query;

    const query = { status: "ACTIVE" };

    // 🔎 Filtros
    if (country) query.country = new RegExp(country, "i");
    if (featured) query.featured = featured === "true";
    if (ambassador) query.ambassador = ambassador === "true";
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { country: { $regex: q, $options: "i" } },
      ];
    }

    // 📊 Ordenamiento
    let sortOption = { createdAt: -1 };
    if (sort === "popular") sortOption = { followers: -1 };
    if (sort === "earnings") sortOption = { totalEarnings: -1 };
    if (sort === "featured") sortOption = { featured: -1 };
    if (sort === "ambassador") sortOption = { ambassador: -1 };

    const [models, total] = await Promise.all([
      ModelUser.find(query)
        .sort(sortOption)
        .skip(Number(skip))
        .limit(Number(limit))
        .select(
          "name country wallet status featured ambassador avatarUrl bannerUrl totalEarnings followers liveStatus createdAt"
        )
        .lean(),
      ModelUser.countDocuments(query),
    ]);

    const safeModels = models.map((m) => ({
      id: m._id,
      name: m.name,
      country: m.country,
      wallet: m.wallet,
      status: m.status,
      featured: m.featured,
      ambassador: m.ambassador,
      avatarUrl: m.avatarUrl,
      bannerUrl: m.bannerUrl,
      totalEarnings: m.totalEarnings,
      followers: m.followers,
      liveStatus: m.liveStatus,
      createdAt: m.createdAt,
    }));

    res.status(200).json({
      success: true,
      total,
      count: safeModels.length,
      data: safeModels,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("❌ Error listando modelos:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al listar modelos.",
      error: error.message,
    });
  }
});

/* ==========================================================
   ✅ 2️⃣ Perfil público de modelo (por ID o wallet)
   ========================================================== */
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const model =
      (await ModelUser.findOne({
        $or: [{ _id: id }, { wallet: id.toLowerCase() }],
        status: "ACTIVE",
      })
        .select(
          "name country bio wallet featured ambassador avatarUrl bannerUrl totalEarnings followers liveStatus createdAt"
        )
        .lean()) || null;

    if (!model) {
      return res.status(404).json({
        success: false,
        message: "Modelo no encontrada o inactiva.",
      });
    }

    res.status(200).json({
      success: true,
      data: model,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("❌ Error obteniendo perfil:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al obtener perfil.",
      error: error.message,
    });
  }
});

/* ==========================================================
   🌟 3️⃣ Modelos destacadas (GET /api/models/featured)
   ========================================================== */
router.get("/featured/list", async (req, res) => {
  try {
    const models = await ModelUser.find({ featured: true, status: "ACTIVE" })
      .sort({ updatedAt: -1 })
      .limit(20)
      .select(
        "name country wallet featured ambassador avatarUrl bannerUrl followers totalEarnings liveStatus"
      )
      .lean();

    res.status(200).json({
      success: true,
      count: models.length,
      data: models,
    });
  } catch (error) {
    console.error("❌ Error obteniendo destacadas:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al obtener destacadas.",
      error: error.message,
    });
  }
});

/* ==========================================================
   💎 4️⃣ Embajadoras del mes (GET /api/models/ambassadors)
   ========================================================== */
router.get("/ambassadors/list", async (req, res) => {
  try {
    const models = await ModelUser.find({ ambassador: true, status: "ACTIVE" })
      .sort({ totalEarnings: -1 })
      .limit(20)
      .select(
        "name country wallet ambassador avatarUrl bannerUrl followers totalEarnings liveStatus"
      )
      .lean();

    res.status(200).json({
      success: true,
      count: models.length,
      data: models,
    });
  } catch (error) {
    console.error("❌ Error obteniendo embajadoras:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al obtener embajadoras.",
      error: error.message,
    });
  }
});

/* ==========================================================
   🔥 5️⃣ Modelos en vivo (GET /api/models/live)
   ========================================================== */
router.get("/live/list", async (req, res) => {
  try {
    const models = await ModelUser.find({
      status: "ACTIVE",
      liveStatus: { $in: ["ONLINE", "VOICE_ONLY"] },
    })
      .sort({ liveStatus: -1, followers: -1 })
      .select(
        "name country wallet avatarUrl bannerUrl liveStatus followers featured ambassador"
      )
      .limit(25)
      .lean();

    res.status(200).json({
      success: true,
      count: models.length,
      data: models,
    });
  } catch (error) {
    console.error("❌ Error obteniendo modelos en vivo:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al obtener modelos en vivo.",
      error: error.message,
    });
  }
});

/* ==========================================================
   🏆 6️⃣ Ranking general (GET /api/models/top)
   ========================================================== */
router.get("/top/list", async (req, res) => {
  try {
    const { metric = "followers", limit = 15 } = req.query;

    const validMetrics = ["followers", "totalEarnings", "createdAt"];
    const sortField = validMetrics.includes(metric) ? metric : "followers";

    const models = await ModelUser.find({ status: "ACTIVE" })
      .sort({ [sortField]: -1 })
      .limit(Number(limit))
      .select(
        "name country wallet featured ambassador avatarUrl totalEarnings followers liveStatus"
      )
      .lean();

    res.status(200).json({
      success: true,
      metric,
      count: models.length,
      data: models,
    });
  } catch (error) {
    console.error("❌ Error obteniendo ranking:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al obtener ranking.",
      error: error.message,
    });
  }
});

export default router;