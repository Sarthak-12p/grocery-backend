import mongoose from "mongoose";

const billSchema = new mongoose.Schema(
    {
        customerName: String,

        billNumber: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },

        items:[
            {
                product:{
                    type:mongoose.Schema.Types.ObjectId,
                    ref:"Product",
                },

                quantity: {
                    type: Number,
                    required: true,
                    min: 1,
                },

                sellingprice: {
                    type: Number,
                    required: true,
                    min: 0,
                },
                costprice:{
                    type:Number,
                    required:true,
                    min:0
                },
                productName:{
                    type:String,
                    required:true,
                    min:0
                },
            },

        ],

        subtotal: {
            type: Number,
            required: true,
            min: 0,
        },

        tax: {
            type: Number,
            default: 0,
            min: 0,
        },

        total: {
            type: Number,
            required: true,
            min: 0,
        },

        paymentMethod: {
            type: String,
            enum: ["cash", "upi"],
            default: "cash"
        },

        createdBy:{
            type: mongoose.Schema.Types.ObjectId,
            ref:"User",
            required: true,
        },

    },

    {
        timestamps: true,
    }
);

export default mongoose.model("Bill" , billSchema)