// backend/src/models/PaymentOrder.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

// ==========================================================
// 🧾 Definición del esquema
// ==========================================================
const paymentOrderSchema = new Schema(
  {
    // 👩‍💻 Modelo o usuario receptor del pago
    modelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ModelUser",
      required: true,
    },

    // 💵 Monto (en tokens o USDT)
    amount: {
      type: Number,
      required: true,
      min: [0.000001, "El monto debe ser mayor a 0"],
    },

    // 💱 Moneda
    currency: {
      type: String,
      enum: ["ONECOP", "USDT"],
      default: "ONECOP",
    },

    // 🔗 Wallet destino
    destinationWallet: {
      type: String,
      required: true,
      trim: true,
      match: [/^0x[a-fA-F0-9]{40}$/, "Dirección de wallet inválida"],
    },

    // 🧾 Hash de transacción
    txHash: {
      type: String,
      trim: true,
      default: "",
    },

    // 🧮 Tipo de operación
    type: {
      type: String,
      enum: ["TIP", "WITHDRAWAL", "DISTRIBUTION", "BONUS"],
      default: "TIP",
    },

    // ⚙️ Estado
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "CONFIRMED", "FAILED", "CANCELLED"],
      default: "PENDING",
    },

    // 🧠 Datos adicionales
    metadata: {
      note: { type: String, default: "" },
      adminActionBy: { type: String, default: "" },
      txExplorer: { type: String, default: "" },
      source: { type: String, default: "frontend" },
      device: { type: String, default: "" },
    },

    // 🧾 Auditoría
    audit: {
      createdBy: { type: String, default: "system" },
      verifiedBy: { type: String, default: "" },
      verificationDate: { type: Date },
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ==========================================================
// 🧩 Hooks de auditoría
// ==========================================================
paymentOrderSchema.pre("save", function (next) {
  if (this.txHash && !this.metadata.txExplorer) {
    this.metadata.txExplorer = `${
      process.env.BLOCKCHAIN_EXPLORER || "https://bscscan.com"
    }/tx/${this.txHash}`;
  }
  this.updatedAt = new Date();
  next();
});

// ==========================================================
// 📚 Índices centralizados
// ==========================================================
paymentOrderSchema.index({ modelId: 1 });
paymentOrderSchema.index({ status: 1, createdAt: -1 });
paymentOrderSchema.index({ currency: 1 });
paymentOrderSchema.index({ type: 1 });
paymentOrderSchema.index({ destinationWallet: 1 });
paymentOrderSchema.index({ txHash: 1 });
paymentOrderSchema.index({ "metadata.txExplorer": 1 });

// ==========================================================
// 🧠 Métodos personalizados
// ==========================================================
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

paymentOrderSchema.methods.markAsConfirmed = function (txHash, verifier = "system") {
  this.status = "CONFIRMED";
  this.txHash = txHash;
  this.metadata.txExplorer = `${
    process.env.BLOCKCHAIN_EXPLORER || "https://bscscan.com"
  }/tx/${txHash}`;
  this.audit.verifiedBy = verifier;
  this.audit.verificationDate = new Date();
  this.updatedAt = new Date();
};

// ==========================================================
// ✅ Exportación
// ==========================================================
const PaymentOrder =
  mongoose.models.PaymentOrder || model("PaymentOrder", paymentOrderSchema);
export default PaymentOrder;
