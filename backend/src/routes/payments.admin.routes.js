// ============================================
// 👩‍💻 RedVelvetLive — Rutas Administrativas de Modelos (PRO FINAL)
// ============================================
//
// Controla desde el panel:
//   ✅ Listar modelos activos/inactivos
//   ✅ Cambiar estado (activar/desactivar/banear)
//   ✅ Destacar o marcar como embajadora
//   ✅ Auditoría opcional en consola (logs)
//
// Protegido con middleware adminAuth.js
// ============================================

import express from "express";
import ModelUser from "../models/ModelUser.js"; // Mongoose model de los modelos
import { validateObjectId } from "../services/validators.js";

const router = express.Router();

/* ==========================================================
   ✅ 1️⃣ Listar modelos activos/inactivos (GET /api/admin/models)
   ========================================================== */
router.get("/", async (req, res) => {
  try {
    const { status, limit = 50, skip = 0, search = "" } = req.query;
    const query = {};

    // 🔎 Filtros avanzados
    if (status) query.status = status.toUpperCase();
    if (search)
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { country: { $regex: search, $options: "i" } },
        { wallet: { $regex: search, $options: "i" } },
      ];

    const [models, total] = await Promise.all([
      ModelUser.find(query)
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .select(
          "name country wallet status featured ambassador createdAt updatedAt"
        )
        .lean(),
      ModelUser.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      count: models.length,
      data: models,
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
   ✅ 2️⃣ Actualizar estado del modelo (PATCH /:id/status)
   ========================================================== */
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "ID de modelo inválido.",
      });
    }

    const model = await ModelUser.findById(id);
    if (!model) {
      return res.status(404).json({
        success: false,
        message: "Modelo no encontrado.",
      });
    }

    // 🟢 Estados posibles: ACTIVE, INACTIVE, BANNED
    const newStatus = (status || "INACTIVE").toUpperCase();
    model.status = newStatus;
    model.updatedAt = new Date();
    await model.save();

    console.log(`🧩 Estado modelo actualizado: ${model.name} → ${newStatus}`);

    res.status(200).json({
      success: true,
      message: `Estado del modelo actualizado a ${newStatus}.`,
      model,
    });
  } catch (error) {
    console.error("❌ Error actualizando estado del modelo:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al actualizar el estado.",
      error: error.message,
    });
  }
});

/* ==========================================================
   ✅ 3️⃣ Destacar modelo o marcar embajadora (PATCH /:id/feature)
   ========================================================== */
router.patch("/:id/feature", async (req, res) => {
  try {
    const { id } = req.params;
    const { featured = false, ambassador = false } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "ID de modelo inválido.",
      });
    }

    const model = await ModelUser.findById(id);
    if (!model) {
      return res.status(404).json({
        success: false,
        message: "Modelo no encontrado.",
      });
    }

    model.featured = !!featured;
    model.ambassador = !!ambassador;
    model.updatedAt = new Date();
    await model.save();

    console.log(
      `⭐ Modelo actualizado: ${model.name} → Featured: ${model.featured}, Ambassador: ${model.ambassador}`
    );

    res.status(200).json({
      success: true,
      message: "Modelo actualizado correctamente.",
      model,
    });
  } catch (error) {
    console.error("❌ Error destacando modelo:", error);
    res.status(500).json({
      success: false,
      message: "Error interno destacando modelo.",
      error: error.message,
    });
  }
});

/* ==========================================================
   ✅ 4️⃣ Eliminar modelo (DELETE /:id)
   ========================================================== */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!validateObjectId(id))
      return res.status(400).json({
        success: false,
        message: "ID de modelo inválido.",
      });

    const model = await ModelUser.findByIdAndDelete(id);
    if (!model)
      return res.status(404).json({
        success: false,
        message: "Modelo no encontrado o ya eliminado.",
      });

    console.log(`🗑️ Modelo eliminado: ${model.name} (${model.wallet})`);

    res.status(200).json({
      success: true,
      message: "Modelo eliminado correctamente.",
      model,
    });
  } catch (error) {
    console.error("❌ Error eliminando modelo:", error);
    res.status(500).json({
      success: false,
      message: "Error interno eliminando el modelo.",
      error: error.message,
    });
  }
});

export default router;


