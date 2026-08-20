import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Bill from "../models/bill.model.js";
import Product from "../models/product.model.js";
import mongoose from "mongoose";
import { generateBillNumber } from "../utils/generateBillNumber.js";

export const createBill = asyncHandler(async (req, res) => {
  const session = await mongoose.startSession();

  session.startTransaction();
  try{

  const { customerName, items, tax = 0, paymentMethod = "cash" } = req.body;

  if (!items || items.length === 0) {
    throw new ApiError(400, "Bill must contain at least one product ");
  }

  if (!["cash", "upi"].includes(paymentMethod)) {
    throw new ApiError(400, "Invalid payment method");
  }
  const billNumber = await generateBillNumber(session);

  const billItems = [];

  let subtotal = 0;

  for (const item of items) {
    const product = await Product.findOne({
      _id: item.product,
      createdBy: req.user._id,
    }).session(session);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    if (item.quantity <= 0) {
      throw new ApiError(400, `Invalid quantity for ${product.name}`);
    }

    if (product.quantity < item.quantity) {
      throw new ApiError(400, `Not enough stock for ${product.name}`);
    }

    const itemTotal = product.sellingprice * item.quantity;

    subtotal += itemTotal;

    billItems.push({
      product: product._id,
      quantity: item.quantity,
      sellingprice: product.sellingprice,
    });

    product.quantity -= item.quantity;

    await product.save({ session });
  }

  const total = subtotal + tax;

  const [bill] = await Bill.create(
    [
      {
        customerName,
        billNumber,
        items: billItems,
        subtotal,
        tax,
        total,
        paymentMethod,
        createdBy: req.user._id,
      },
    ],
    { session },
  );

  await session.commitTransaction();

  session.endSession();

  return res
    .status(201)
    .json(new ApiResponse(201, bill, "Bill created successfully"));
  }
  catch (error) {

        await session.abortTransaction();

        session.endSession();

        throw error;
    }

});

export const getBills = asyncHandler(async (req, res) => {
  const bills = await Bill.find({
    createdBy: req.user._id,
  })
    .populate("items.product", "name sellingprice")
    .sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, bills, "Bills fetched successfully"));
});

export const getBill = asyncHandler(async (req, res) => {
  const bill = await Bill.findOne({
    _id: req.params.id,
    createdBy: req.user._id,
  }).populate("items.product", "name sellingprice");

  if (!bill) {
    throw new ApiError(404, "Bill not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, bill, "Bill fetched successfully"));
});
