import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";
import Bill from "../models/bill.model.js";
import mongoose from "mongoose";
import Expense from "../models/expense.model.js";
import Product from "../models/product.model.js";

export const getDashboard = asyncHandler(async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const lowStock = await Product.countDocuments({
    createdBy: req.user._id,
    quantity: { $lte: 5 },
  });

  const sales = await Bill.aggregate([
    {
      $match: {
        createdBy: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $group: {
        _id: null,
        totalSales: {
          $sum: "$total",
        },
      },
    },
  ]);

  const expenses = await Expense.aggregate([
    {
      $match: {
        createdBy: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $group: {
        _id: null,
        totalExpenses: {
          $sum: "$amount",
        },
      },
    },
  ]);

  const todaySales = await Bill.aggregate([
    {
      $match: {
        createdBy: new mongoose.Types.ObjectId(req.user._id),
        createdAt: {
          $gte: startOfToday,
          $lte: endOfToday,
        },
      },
    },
    {
      $group: {
        _id: null,
        todaySales: {
          $sum: "$total",
        },
      },
    },
  ]);

  const todayExpenses = await Expense.aggregate([
    {
      $match: {
        createdBy: new mongoose.Types.ObjectId(req.user._id),
        createdAt: {
          $gte: startOfToday,
          $lte: endOfToday,
        },
      },
    },
    {
      $group: {
        _id: null,
        todayExpenses: {
          $sum: "$amount",
        },
      },
    },
  ]);
  const totalSales = sales.length > 0 ? sales[0].totalSales : 0;

  const totalExpenses = expenses.length > 0 ? expenses[0].totalExpenses : 0;

  const profit = totalSales - totalExpenses;

  const todaySalesAmount = todaySales.length > 0 ? todaySales[0].todaySales : 0;

  const todayExpensesAmount =
    todayExpenses.length > 0 ? todayExpenses[0].todayExpenses : 0;
  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalSales,
        totalExpenses,
        profit,
        todaySales: todaySalesAmount,
        todayExpenses: todayExpensesAmount,
        lowStockProducts: lowStock,
      },
      "Dashboard data fetched successfully",
    ),
  );
});
