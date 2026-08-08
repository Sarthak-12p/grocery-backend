import express from "express";
import cors from "cors";
import helmet  from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import errorHandler from "./middleware/error.middleware.js";
import authRoutes from "./routes/auth.routes.js";
import billRoutes from "./routes/bill.routes.js";
import productRoutes from "./routes/product.routes.js";
import expenseRoutes from "./routes/expense.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import shopRoutes from "./routes/shop.routes.js";

const app = express();

app.use(cors(
    {
    origin: process.env.CLIENT_URL,
    credentials: true,
  }
));


app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.use(morgan("dev"));



app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products" , productRoutes)
app.use("/api/v1/bills", billRoutes);
app.use("/api/v1/expenses" , expenseRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/shop", shopRoutes);

app.get("/" ,(req,res) =>{
    res.json({
        success: true,
        message: "API is running"
    });
});

app.use(errorHandler);  

export default app;