// backend/src/services/validators.js
import mongoose from "mongoose";

export const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);