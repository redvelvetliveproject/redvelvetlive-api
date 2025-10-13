/**
 * 📡 RedVelvetLive — Rutas públicas de Modelos (versión PRO FINAL)
 * -----------------------------------------------------------------
 * ✅ Endpoints:
 *   - GET /api/models           → listado público con búsqueda y scroll infinito
 *   - GET /api/models/:slug     → perfil público optimizado
 */

import express from "express";
import Model from "../models/Model.js";
import cache from "../middleware/cache.js";

const router = express.Router();

/**
 * 🧭 GET /api/models
 * Lista pública con soporte para:
 * - ?page=1&limit=20
 * - ?search=valeria
 * - ?country=Colombia
 * - ?locale=es
 * - ?sort=popularity|recent
 * - ?isOnline=true
 */
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      country,
      locale,
      sort = "popularity",
      isOnline,
    } = req.query;

    // 🧠 Filtros dinámicos
    const query = {};
    if (search) query.name = { $regex: search, $options: "i" };
    if (country) query.country = country;
    if (locale) query.locale = locale;
    if (isOnline !== undefined) query.isOnline = isOnline === "true";

    // 🔀 Ordenamiento
    const sortOptions = {
      popularity: { popularity: -1 },
      recent: { createdAt: -1 },
      name: { name: 1 },
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [models, total] = await Promise.all([
      Model.find(query)
        .select(
          "name bio avatar country locale playbackId slug stats popularity isOnline"
        )
        .sort(sortOptions[sort] || sortOptions.popularity)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Model.countDocuments(query),
    ]);

    // 🔧 Normalización visual (para frontend)
    const formatted = models.map((m) => ({
      ...m,
      avatar: m.avatar || {
        small: "/assets/img/default-avatar.webp",
        large: "/assets/img/default-avatar.webp",
      },
      popularity:
        m.popularity || (m.stats?.followers || 0) + (m.stats?.tips || 0),
    }));

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      results: formatted,
    });
  } catch (err) {
    console.error("❌ Error en /api/models:", err);
    res.status(500).json({
      success: false,
      message: "Error interno al obtener los modelos.",
    });
  }
});

/**
 * 🧠 GET /api/models/:slug
 * Devuelve los datos del perfil público de una modelo específica
 */
router.get("/:slug", cache(60), async (req, res) => {
  try {
    const slug = req.params.slug.trim().toLowerCase();
    if (!slug.match(/^[a-z0-9-]+$/)) {
      return res.status(400).json({
        success: false,
        message: "Slug inválido.",
      });
    }

    const model = await Model.findOne({ slug })
      .select(
        "name bio avatar wallet country locale playbackId gallery socialLinks stats popularity isOnline"
      )
      .lean();

    if (!model) {
      return res.status(404).json({
        success: false,
        message: "Modelo no encontrada",
      });
    }

    // 🔧 Normalización visual
    const formatted = {
      ...model,
      avatar: model.avatar || {
        small: "/assets/img/default-avatar.webp",
        large: "/assets/img/default-avatar.webp",
      },
      gallery:
        model.gallery?.length > 0
          ? model.gallery
          : ["/assets/img/default-gallery.webp"],
      stats: model.stats || { followers: 0, tips: 0 },
      popularity:
        model.popularity ||
        (model.stats?.followers || 0) + (model.stats?.tips || 0),
      socialLinks: model.socialLinks || {},
    };

    res.status(200).json({
      success: true,
      model: formatted,
    });
  } catch (err) {
    console.error("❌ Error en /api/models/:slug:", err);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
});

export default router;
