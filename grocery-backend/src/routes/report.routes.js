import express from "express";
import { getReport } from "../controllers/report.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", verifyJWT, getReport);

export default router;