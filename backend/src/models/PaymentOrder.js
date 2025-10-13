// backend/src/models/PaymentOrder.js
import mongoose from "mongoose";

const paymentOrderSchema = new mongoose.Schema(
  {
    // 📦 ID del modelo o usuario receptor
    modelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Model",
      required: true,
    },

    // 💰 Monto de la operación
    amount: { type: Number, required: true },

    // 💱 Moneda utilizada (ONECOP / USDT)
    currency: {
      type: String,
      enum: ["ONECOP", "USDT"],
      default: "ONECOP",
    },

    // 🔗 Dirección wallet de destino (BSC)
    destinationWallet: {
      type: String,
      required: true,
      trim: true,
    },

    // 🧾 Hash de transacción (para verificar en BscScan)
    txHash: { type: String, default: "" },

    // 📅 Tipo de operación
    type: {
      type: String,
      enum: ["TIP", "WITHDRAWAL", "DISTRIBUTION", "BONUS"],
      default: "TIP",
    },

    // ⚙️ Estado actual de la orden
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "CONFIRMED", "FAILED", "CANCELLED"],
      default: "PENDING",
    },

    // 🧠 Detalles adicionales o notas internas
    metadata: {
      note: { type: String, default: "" },
      adminActionBy: { type: String, default: "" },
      txExplorer: { type: String, default: "" },
    },

    // 📆 Control de tiempo
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// ✅ Pre-save hook: genera enlace automático a BscScan
paymentOrderSchema.pre("save", function (next) {
  if (this.txHash && !this.metadata.txExplorer) {
    this.metadata.txExplorer = `https://bscscan.com/tx/${this.txHash}`;
  }
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model("PaymentOrder", paymentOrderSchema);
