import {cCall} from "../models/ccall.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


export const createNewCCall = asyncHandler(async(req, res) =>{
    try {
        const { title, description } = req.body;

        if(!title && !description){
            throw new ApiError(402, "title description feilds are required")
        };

        const newCall = await cCall.create({
            title,
            description,
            castingDirector: req.user._id,
        });

        if(!newCall){
            throw new ApiError(404, "some error cannot create ccall")
        }

        return res.status(201).json(
            new ApiResponse(201, newCall, "casting call created successfully")
        )

    } catch (error) {
        console.log(error.message);
        throw new ApiError(500, "internal error while creating new cCall")
    }
})

export const updateCCallDetails = asyncHandler(async(req, res) =>{
    try {
        const { title, description } = req.body;
        const {ccallId} = req.params;
        if(!ccallId){
            throw new ApiError(402, "please put ccall id in params")
        }
        if(!title && !description ){
            throw new ApiError(401, "title description is reqired")
        }
        const updatedCCall = await cCall.findByIdAndUpdate(ccallId,{title, description});
        if(!updatedCCall){
            throw new ApiError(501, "casting call post does not exist")
        }
        return res.status(200).json(
            new ApiResponse(200, updatedCCall, "Casting Call updated successfully")
        )
    } catch (error) {
        console.log(error.message);
        throw new ApiError(500, "some error cannot update ccall")
    }
})
export const deleteCCall = asyncHandler(async(req, res) =>{
    try {
        const { ccallId } = req.params;
        if(!ccallId){
            throw new ApiError(401, "casting call id is required")
        } 
        const isDeleted = await cCall.findByIdAndDelete(ccallId);
        return res.status(200).json(
            new ApiResponse(200, "ccall deleted successfully")
        )

    } catch (error) {
        console.log(error.message);
        throw new ApiError(500, "something went wrong while deleting the ccall")
    }
})
export const statusToggle = asyncHandler(async(req, res) =>{
    try {
        const {ccallId} = req.params;
        console.log(ccallId);
        const ccall = await cCall.findById(ccallId);
        if(!ccall){
            throw new ApiError(404, "this CCall not found")
        }
        if(ccall.status === "open"){
            ccall.status = "close";
            await ccall.save();
        }else{
            ccall.status = "open";
            await ccall.save();
        }
        return res.status(200).json(
            new ApiResponse(200, ccall, "casting call status updated successfully")
        )
        
    } catch (error) {
        console.log(error.message);
        throw new ApiError(500, "something went wrong can not change ccall status ")
    }
})
export const getApplicant = asyncHandler(async(req, res) =>{
    try {
        const { ccallId } = req.params;
        if(!ccallId){
            throw new ApiError(404, "please put ccallId in params")
        }
        const cpost = await cCall.findById(ccallId);
        if(!cpost){
            throw new ApiError(404, "invailid ccallId")
        }
        const aplicants = cpost.aplicants;
        return res.status(200).json(
            new ApiResponse(200, aplicants, "applicants fetched successfully")
        )
    } catch (error) {
        console.log(error.message);
        throw new ApiError(500, "cannot fetched applicants due to some internal error")
    }
})
export const getAllCCalls = asyncHandler(async(req, res) =>{
    try {
        const cPosts = await cCall.find({status:"open"}).select("-aplicants");
        if(!cPosts){
            throw new ApiError(502,"something went wrong while fetching Casting Posts")
        }
        return res.status(200).json(
            new ApiResponse(200, cPosts, "Casting posts fetched successfully")
        )
    } catch (error) {
        console.log(error.message);
        throw new ApiError(500,"something went wrong while fetching Casting Posts ")
    }
})

export const applyToCCall = asyncHandler(async(req, res) =>{
    try {
        const { ccallId } = req.params;
        if(!ccallId){
            throw new ApiError(404, "please put ccallId in params")
        }
        const cpost = await cCall.findById(ccallId);
        if(!cpost){
            throw new ApiError(404, "invailid ccallId")
        }
        cpost.aplicants.push(req.user._id);
        await cpost.save();
        return res.status(200).json(
            new ApiResponse(200, "appication submited successfully")
        )

    } catch (error) {
        console.log(error.message);
        throw new ApiError(500, "something went wrong while applying to casting call")
    }
})