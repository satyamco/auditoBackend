import {cUser} from "../models/cuser.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshTokens = async(userId) =>{
    try {
        const user = await cUser.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}
export const registerCUser = asyncHandler(async(req, res) =>{
    try {
        const { username, email, password } = req.body;
        if (!username) {
            return res.status(404).json(
                new ApiResponse(404, "username feild required")
            )
        }
        if (!email) {
            return res.status(404).json(
                new ApiResponse(404, "email feild is required")
            )
        }
        if (!password) {
            return res.status(404).json(
                new ApiResponse(404, "password feild is required")
            )
        }
        const isUserExist = await cUser.findOne({email});
        if (isUserExist) {
            return res.status(401).json(
                new ApiResponse(401, "user already registerd")
            )
        }

        const user = await cUser.create({username, email, password});

        const newUser = await cUser.findById(user._id).select("-password")

        if(!newUser){
            throw new ApiError(500, "internal error while registering the user")
        }
        return res.status(201).json(
            new ApiResponse(201, newUser, "user registerd successfully")
        )
    } catch (error) {
        console.log(error.message);
        throw new ApiError(500, "something went wrong while registering the user")
    }
})
export const loginCUser = asyncHandler(async(req, res) =>{
    try {
        const {email, username, password} = req.body;
    
        if (!(username || email)) {
            throw new ApiError(400, "username or email is required")
        }
        
      const user = await cUser.findOne({
            $or: [{username}, {email}]
        })
    
        if (!user) {
            throw new ApiError(404, "User does not exist")
        }
    
       const isPasswordValid = await user.isPasswordCorrect(password)
    
       if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
        }
    
       const {accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)
    
        const loggedInUser = await cUser.findById(user._id).select("-password -refreshToken")
    
        const options = {
            httpOnly: true,
            // secure: true
        }
    
        return res
        .status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(
            new ApiResponse(
                200, 
                {
                    user: loggedInUser, accessToken, refreshToken
                },
                "User logged In Successfully"
            )
        )
    } catch (error) {
        console.log(error.message);
        throw new ApiError(500, "something went wrong while logged in user")
    }

})
export const logoutCUser = asyncHandler(async(req, res) =>{
    await cUser.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1 // this removes the field from document
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})
export const getCUserProfile = asyncHandler(async(req, res) =>{
    res.status(200).json(
        new ApiResponse(200, req.user, "user profile fetched successfully")
     )
})
export const changeCUserPassword = asyncHandler(async(req, res) =>{
    try {
        const {oldpassword, newpassword} = req.body;

        const user = await cUser.findById(req.user?._id);
        const isPasswordCorrect = await user.isPasswordCorrect(oldpassword);
        if(!isPasswordCorrect){
            throw new ApiError(404, "old password is incorrect");
        }
        
        user.password = newpassword;
        await user.save({validateBeforeSave: false})

        return res.status(200).json(
            new ApiResponse(200, {}, "your password changed successfully"))
        
    } catch (error) {
       console.log(error.message);
       throw new ApiError(500, "something went wrong while updating password")
    }
})
export const updateCUserProfile = asyncHandler(async(req, res) =>{
    try {
        const {name, bio} = req.body;
        if(!name && !bio){
            throw new ApiError(401, "name and bio feilds are required")
        }

        const profilePicLocalPath = req.files?.profilePic[0]?.path;
        const bannerPicLocalPath = req.files?.bannerPic[0]?.path;

        if(!profilePicLocalPath && bannerPicLocalPath){
            throw new ApiError(401, "profile and banner image are required")
        }

        const profilePic = await uploadOnCloudinary(profilePicLocalPath);
        const bannerPic = await uploadOnCloudinary(bannerPicLocalPath);
        const user = await cUser.findById(req.user._id);
        if(!user){
            throw new ApiError(500, "something went wrong while fetching user and updating profile")
        }
        user.name = name;
        user.bio = bio;
        user.profilePic = profilePic.url;
        user.bannerPic = bannerPic.url;
        await user.save()

        const updatedUser = await cUser.findById(user._id).select("-password -refreshToken")

        return res.status(200).json(
            new ApiResponse(200, updatedUser, "user profile updated successfully")
        )

    } catch (error) {
        console.log(error.meassage);
        throw new ApiError(501, "something went wrong while updating profile")
    }
})
export const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await cUser.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})
export const getAllCDirectors = asyncHandler(async(req, res) => {
    try {
        const users = await cUser.find({});
        if(!users){
            throw new ApiError(500, "someting went wrong cannot fetch cusers")
        }
        return res.status(200).json(
            new ApiResponse(200, users, "all cuser fetched successfully")
        )
        
    } catch (error) {
        console.log(error.message);
        throw new ApiError(500, "internal error while getting all cusers")
    }
})
