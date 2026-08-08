import { Router } from "express";
import { createExpense, deleteExpense, getExpense, getExpenses, updateExpense } from "../controllers/expense.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";


const router = Router();

router.use(verifyJWT)

router.post("/" , createExpense)

router.get("/", getExpenses)

router.get("/:id" , getExpense)

router.patch("/:id" , updateExpense)

router.delete("/:id" , deleteExpense)

export default router;