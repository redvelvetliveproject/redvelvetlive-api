import express from "express";
import { loginAdmin, verifyToken, logoutAdmin } from "../controllers/admin.auth.controller.js";
import adminAuth from "../middleware/adminAuth.js";

const router = express.Router();

router.post("/login", loginAdmin); // Login
router.get("/verify", adminAuth, verifyToken); // Validar token activo
router.post("/logout", logoutAdmin); // Logout

export default router;
