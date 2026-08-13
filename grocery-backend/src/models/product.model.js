import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: String,

    barcode:{
        type: String,
        unique: true,

    },

    category: {
        type: String,
        required: true
    },

    unit:{
        type:String,
        required:true
    },

    sellingprice:{
        type: Number,
        required: true
    },

    costprice:{
        type:Number,
        required:true
    },

    quantity:{
        type: Number,
        required: true,
    },

    lowstockthreshold:{
        type:Number,
        required:true,
    },


    
    createdBy:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"User"
    },
},

{
    timestamps:true,

});

export default mongoose.model("Product" , productSchema)