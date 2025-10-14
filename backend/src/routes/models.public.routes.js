// ============================================
// 🌹 RedVelvetLive — Rutas Públicas de Modelos (PRO FINAL)
// ============================================
//
// API pública para mostrar información segura de las modelos.
// Incluye:
//   ✅ Listado filtrado (activos, país, búsqueda, destacados)
//   ✅ Perfil individual (por ID o wallet)
//   ✅ Resultados seguros (sin exponer datos internos ni contraseñas)
//   ✅ Optimizado para el frontend y el buscador de modelos
//
// Compatible con el esquema extendido ModelUser.js
// ============================================

import express from "express";
import ModelUser from "../models/ModelUser.js";

const router = express.Router();

/* ==========================================================
   ✅ 1️⃣ Listar modelos públicos (GET /api/models)
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

    // 🔎 Filtros dinámicos
    if (country) query.country = new RegExp(country, "i");
    if (featured) query.featured = featured === "true";
    if (ambassador) query.ambassador = ambassador === "true";
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { country: { $regex: q, $options: "i" } },
      ];
    }

    // 🔄 Ordenamiento
    let sortOption = { createdAt: -1 };
    if (sort === "popular") sortOption = { followers: -1 };
    if (sort === "earnings") sortOption = { totalEarnings: -1 };
    if (sort === "featured") sortOption = { featured: -1 };

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

    // 🔒 Sanitizar respuesta pública
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
    console.error("❌ Error listando modelos públicos:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al listar modelos.",
      error: error.message,
    });
  }
});

/* ==========================================================
   ✅ 2️⃣ Obtener perfil público (GET /api/models/:id)
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
    console.error("❌ Error obteniendo perfil público:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al obtener el perfil.",
      error: error.message,
    });
  }
});

export default router;
