import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

export const verifyJWT = asyncHandler(async(req,res,next)=>{
    

    
    const token = req.cookies.accessToken

    if (!token) {
    throw new ApiError(401, "Unauthorized");
}

    const decodedToken = jwt.verify(
        token,
        process.env.JWT_SECRET
    );

    const user = await User.findById(decodedToken.id).select("-password");

    if(!user){
        throw new ApiError(401, "Invalid token");
    }

    req.user = user;

    next();
})