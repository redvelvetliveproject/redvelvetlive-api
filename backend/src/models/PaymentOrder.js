/**
 * 💰 RedVelvetLive — Modelo PaymentOrder (PRO FINAL)
 * --------------------------------------------------
 * Representa todas las transacciones financieras del sistema:
 * tips, retiros, bonificaciones y distribuciones.
 * 100% compatible con BSC, ONECOP y USDT.
 */

import mongoose from "mongoose";

const paymentOrderSchema = new mongoose.Schema(
  {
    // 🧩 Modelo o usuario receptor del pago
    modelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Model",
      required: true,
      index: true,
    },

    // 💵 Monto de la operación (en tokens o USDT)
    amount: {
      type: Number,
      required: true,
      min: [0.000001, "El monto debe ser mayor a 0"],
    },

    // 💱 Moneda usada (ONECOP / USDT)
    currency: {
      type: String,
      enum: ["ONECOP", "USDT"],
      default: "ONECOP",
      index: true,
    },

    // 🔗 Wallet de destino en la red BSC
    destinationWallet: {
      type: String,
      required: true,
      trim: true,
      match: [/^0x[a-fA-F0-9]{40}$/, "Dirección de wallet inválida"],
      index: true,
    },

    // 🧾 Hash de transacción blockchain
    txHash: {
      type: String,
      default: "",
      trim: true,
      index: true,
    },

    // 🧮 Tipo de transacción
    type: {
      type: String,
      enum: ["TIP", "WITHDRAWAL", "DISTRIBUTION", "BONUS"],
      default: "TIP",
      index: true,
    },

    // ⚙️ Estado actual de la transacción
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "CONFIRMED", "FAILED", "CANCELLED"],
      default: "PENDING",
      index: true,
    },

    // 🧠 Datos extra para trazabilidad
    metadata: {
      note: { type: String, default: "" },
      adminActionBy: { type: String, default: "" },
      txExplorer: { type: String, default: "" },
      source: { type: String, default: "frontend" }, // origen (frontend, backend, cron, etc.)
      device: { type: String, default: "" }, // opcional: registrar tipo de dispositivo
    },

    // 🧾 Enlaces de auditoría (auto-generados)
    audit: {
      createdBy: { type: String, default: "system" },
      verifiedBy: { type: String, default: "" },
      verificationDate: { type: Date },
    },

    // 🕒 Control de fechas
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

/* ======================================================
   🧠 Pre-save hooks: auditoría y trazabilidad automática
   ====================================================== */
paymentOrderSchema.pre("save", function (next) {
  // Si existe hash y aún no hay enlace a BscScan
  if (this.txHash && !this.metadata.txExplorer) {
    this.metadata.txExplorer = `https://bscscan.com/tx/${this.txHash}`;
  }

  // Actualiza fecha de modificación
  this.updatedAt = Date.now();
  next();
});

/* ======================================================
   🧩 Índices y optimización de búsqueda
   ====================================================== */
paymentOrderSchema.index({ status: 1, createdAt: -1 });
paymentOrderSchema.index({ currency: 1 });
paymentOrderSchema.index({ type: 1 });
paymentOrderSchema.index({ "metadata.txExplorer": 1 });

/* ======================================================
   📊 Métodos personalizados
   ====================================================== */
paymentOrderSchema.methods.toPublicJSON = function () {
  return {
    id: this._id,
    modelId: this.modelId,
    amount: this.amount,
    currency: this.currency,
    destinationWallet: this.destinationWallet,
    type: this.type,
    status: this.status,
    txHash: this.txHash,
    txExplorer: this.metadata.txExplorer,
    note: this.metadata.note,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

paymentOrderSchema.methods.isConfirmed = function () {
  return this.status === "CONFIRMED";
};

paymentOrderSchema.methods.markAsConfirmed = function (txHash) {
  this.status = "CONFIRMED";
  this.txHash = txHash;
  this.metadata.txExplorer = `https://bscscan.com/tx/${txHash}`;
  this.audit.verificationDate = new Date();
};

/* ======================================================
   ✅ Exportación
   ====================================================== */
export default mongoose.model("PaymentOrder", paymentOrderSchema);

