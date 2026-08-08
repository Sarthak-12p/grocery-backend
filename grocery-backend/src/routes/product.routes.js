import { Router } from "express";
import { createProduct, getProducts ,getProduct , updateProduct, deleteProduct} from "../controllers/product.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", verifyJWT , createProduct);

router.get("/" , verifyJWT , getProducts)

router.get("/:id" , verifyJWT ,getProduct)

router.patch("/:id", verifyJWT , updateProduct);

router.delete("/:id" , verifyJWT , deleteProduct);

export default router