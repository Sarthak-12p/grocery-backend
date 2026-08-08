import { Router } from "express";
import {
  createShop,
  getShop,
} from "../controllers/shop.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.post("/", createShop);
router.get("/", getShop);

export default router;