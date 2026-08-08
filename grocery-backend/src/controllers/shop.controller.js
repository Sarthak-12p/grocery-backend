import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Shop from "../models/shop.model.js";

export const createShop = asyncHandler(async (req, res) => {
  const {
    shopName,
    shopAddress,
    gstNumber,
    contactNumber,
  } = req.body;

  if (
    !shopName ||
    !shopAddress ||
    !gstNumber ||
    !contactNumber
  ) {
    throw new ApiError(
      400,
      "All shop information fields are required"
    );
  }

  const existingShop = await Shop.findOne({
    createdBy: req.user._id,
  });

  if (existingShop) {
    throw new ApiError(
      409,
      "Shop information already exists"
    );
  }

  const shop = await Shop.create({
    shopName,
    shopAddress,
    gstNumber,
    contactNumber,
    createdBy: req.user._id,
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        shop,
        "Shop information saved successfully"
      )
    );
});

export const getShop = asyncHandler(async (req, res) => {
  const shop = await Shop.findOne({
    createdBy: req.user._id,
  });

  if (!shop) {
    throw new ApiError(404, "Shop information not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        shop,
        "Shop information fetched successfully"
      )
    );
});