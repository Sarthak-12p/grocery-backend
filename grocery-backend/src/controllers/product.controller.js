import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import Product from  "../models/product.model.js";

export const createProduct = asyncHandler(async (req,res) => {

    const {
        name,
        sellingprice,
        quantity,
        category,
        barcode
    } = req.body;

    if(!name || sellingprice === undefined || quantity === undefined){
        throw new ApiError(
            400,
            "Name,price and quantity are required"
        )
    }
    
    const product = await Product.create({
        name,
        sellingprice,
        category,
        quantity,
        barcode,
        createdBy : req.user._id
    });

    return res.status(201).json(
        new ApiResponse(
            201,
            product,
            "Product created successfully"
        )
    )
});

export const getProducts = asyncHandler(async(req,res)=>{
    const products = await Product.find({
        createdBy: req.user._id
});

return res.status(200).json(
    new ApiResponse(
        200,
        products,
        "Products fetched successfully"
    )
)


});

export const getProduct = asyncHandler(async (req,res) => {
    const product = await Product.findOne({
        _id: req.params.id,
        createdBy: req.user._id
    });

    if(!product){
        throw new ApiError(404 , "Product not found ")
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            product,
            "Product fetched successfully"
        )
    )
});

export const updateProduct = asyncHandler(async(req,res)=>{
    const {name , sellingprice, quantity , category ,barcode} = req.body;

    const product = await Product.findOne({
        _id: req.params.id,
        createdBy: req.user._id
    })

    if(!product){
        throw new ApiError(404 , "Product not found")
    }

    if( name !== undefined){
        product.name = name
    }

    if(sellingprice !== undefined){
        product.sellingprice = sellingprice
    }

    if(quantity !== undefined){
        product.quantity = quantity
    }

    if(category !== undefined){
        product.category = category
    }

    if(barcode !== undefined){
        product.barcode = barcode
    }

    await product.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            product,
            "Updated"
        )
    )
});

export const deleteProduct = asyncHandler(async (req,res) => {
    const product = await Product.findOneAndDelete({
        _id: req.params.id,
        createdBy: req.user._id 
    })

    if(!product){
        throw new ApiError(404, "Product not found")
    }

    return res.status(200).json(
        new ApiResponse(
            200,
            product,
            "Product deleted successfully"
        )
    )
})

