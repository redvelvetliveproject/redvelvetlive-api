// ============================================
// 👩‍💻 RedVelvetLive — Rutas Administrativas de Modelos (PRO FINAL + KPIs)
// ============================================
//
// Controla desde el panel:
//   ✅ Listar modelos con KPIs en tiempo real
//   ✅ Cambiar estado (activar/desactivar/banear)
//   ✅ Destacar o marcar como embajadora
//   ✅ Eliminar modelo (seguro)
//   ✅ Logs detallados para auditoría
//
// Protegido con middleware adminAuth.js
// ============================================

import express from "express";
import ModelUser from "../models/ModelUser.js";
import { validateObjectId } from "../services/validators.js";

const router = express.Router();

/* ==========================================================
   ✅ 1️⃣ Listar modelos + KPIs (GET /api/admin/models)
   ========================================================== */
router.get("/", async (req, res) => {
  try {
    const { status, limit = 50, skip = 0, q = "" } = req.query;
    const query = {};

    // 🔎 Filtros dinámicos
    if (status) query.status = status.toUpperCase();
    if (q) {
      query.$or = [
        { name: { $regex: q, $options: "i" } },
        { country: { $regex: q, $options: "i" } },
        { wallet: { $regex: q, $options: "i" } },
      ];
    }

    // 📊 KPIs globales
    const [models, total, active, inactive, featured, ambassador] =
      await Promise.all([
        ModelUser.find(query)
          .sort({ createdAt: -1 })
          .skip(Number(skip))
          .limit(Number(limit))
          .select("name country wallet status featured ambassador createdAt updatedAt")
          .lean(),
        ModelUser.countDocuments(query),
        ModelUser.countDocuments({ status: "ACTIVE" }),
        ModelUser.countDocuments({ status: "INACTIVE" }),
        ModelUser.countDocuments({ featured: true }),
        ModelUser.countDocuments({ ambassador: true }),
      ]);

    res.status(200).json({
      success: true,
      total,
      count: models.length,
      data: models,
      kpis: {
        active,
        inactive,
        featured,
        ambassador,
      },
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

    const newStatus = (status || "INACTIVE").toUpperCase();
    model.status = newStatus;
    model.updatedAt = new Date();
    await model.save();

    console.log(`🧩 Estado actualizado: ${model.name} → ${newStatus}`);

    res.status(200).json({
      success: true,
      message: `Estado actualizado a ${newStatus}`,
      model,
    });
  } catch (error) {
    console.error("❌ Error actualizando estado del modelo:", error);
    res.status(500).json({
      success: false,
      message: "Error interno al actualizar estado del modelo.",
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
      `⭐ Modelo actualizado: ${model.name} → featured=${model.featured}, ambassador=${model.ambassador}`
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
      message: "Error interno al actualizar modelo.",
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
    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "ID de modelo inválido.",
      });
    }

    const model = await ModelUser.findByIdAndDelete(id);
    if (!model) {
      return res.status(404).json({
        success: false,
        message: "Modelo no encontrado o ya eliminado.",
      });
    }

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
      message: "Error interno al eliminar modelo.",
      error: error.message,
    });
  }
});

export default router;


