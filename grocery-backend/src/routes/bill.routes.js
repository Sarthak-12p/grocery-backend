import { Router } from "express";

import { createBill, getBill, getBills } from "../controllers/bill.controller.js";

import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", verifyJWT, createBill);


router.get("/" , verifyJWT , getBills);

router.get("/:id" , verifyJWT , getBill)


export default router;
