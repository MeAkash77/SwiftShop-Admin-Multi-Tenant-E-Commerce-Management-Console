/**
 * Category taxonomy for products and marketing banners.
 */
import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
{
    name:{
        type:String,
        required:true,
        trim:true
    },

    slug:{
        type:String,
        unique:true
    },

    description:String,

    status:{
        type:Boolean,
        default:true
    }
},
{
    timestamps:true
}
);

export default mongoose.model("Category",categorySchema);