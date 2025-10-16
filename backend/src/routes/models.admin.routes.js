// ============================================
// 👩‍💼 RedVelvetLive — Rutas Administrativas de Modelos (PRO FINAL)
// ============================================
//
// Módulo de gestión para modelos desde el panel admin.
//   ✅ Listar modelos con métricas
//   ✅ Activar / desactivar cuentas
//   ✅ Revisar reportes y estadísticas
// ============================================

import express from "express";
import Model from "../models/Model.js";
import { validateObjectId } from "../services/validators.js";

const router = express.Router();

/* ======================================================
   🧾 1️⃣ Listar modelos con filtros
   ====================================================== */
router.get("/", async (req, res) => {
  try {
    const { active, verified } = req.query;
    const filter = {};

    if (active !== undefined) filter.active = active === "true";
    if (verified !== undefined) filter.verified = verified === "true";

    const models = await Model.find(filter)
      .select("name country wallet verified active createdAt")
      .sort({ createdAt: -1 })
      .lean();

    res.json({ success: true, count: models.length, data: models });
  } catch (error) {
    console.error("❌ Error listando modelos:", error);
    res.status(500).json({ success: false, message: "Error interno del servidor." });
  }
});

/* ======================================================
   🔄 2️⃣ Activar / desactivar modelo
   ====================================================== */
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { active } = req.body;

    if (!validateObjectId(id)) {
      return res.status(400).json({ success: false, message: "ID inválido." });
    }

    const model = await Model.findByIdAndUpdate(
      id,
      { active },
      { new: true }
    ).select("name active verified");

    if (!model)
      return res.status(404).json({ success: false, message: "Modelo no encontrado." });

    res.json({ success: true, message: "Estado actualizado.", model });
  } catch (error) {
    console.error("❌ Error actualizando modelo:", error);
    res.status(500).json({ success: false, message: "Error interno al actualizar modelo." });
  }
});

export default router;
