/**
 * 📡 RedVelvetLive — Rutas públicas de Modelos
 * ------------------------------------------------------------
 * Endpoint principal: /api/models/:slug
 * Devuelve información pública del modelo optimizada para el frontend.
 */

import express from "express";
import Model from "../models/Model.js";
import cache from "../middleware/cache.js";

const router = express.Router();

/**
 * 🧠 GET /api/models/:slug
 * Devuelve los datos del perfil público de una modelo
 */
router.get("/:slug", cache(60), async (req, res) => {
  try {
    const { slug } = req.params;

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

    res.status(200).json(formatted);
  } catch (err) {
    console.error("❌ Error en /api/models/:slug:", err);
    res.status(500).json({
      success: false,
      message: "Error interno del servidor",
    });
  }
});

export default router;
