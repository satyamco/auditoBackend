import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save();
        return { accessToken, refreshToken };
    } catch (error) {
        console.error("Error generating tokens:", error.message);
        throw new ApiError(500, "Something went wrong while generating refresh and access token");
    }
};

export const registerUser = asyncHandler(async (req, res) => {
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
        const isUserExist = await User.findOne({email});
        if (isUserExist) {
            return res.status(401).json(
                new ApiResponse(401, "user already registerd")
            )
        }

        const user = await User.create({username, email, password});

        const newUser = await User.findById(user._id).select("-password")

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

export const loginUser = asyncHandler(async (req, res) =>{

    try {
        const {email, username, password} = req.body;
    
        if (!(username || email)) {
            throw new ApiError(400, "username or email is required")
        }
        
      const user = await User.findOne({
            $or: [{username}, {email}]
        })
    
        if (!user) {
            throw new ApiError(404, "User does not exist")
        }
    
       const isPasswordValid = await user.isPasswordCorrect(password)
    
       if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
        }
    
       const {accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
    
        const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    
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

export const logout = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
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

export const changeUserPassword = asyncHandler(async (req, res) => {
    try {
        const {oldpassword, newpassword} = req.body;

        const user = await User.findById(req.user?._id);
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
export const getUserProfile = asyncHandler(async (req, res) => {
     res.status(200).json(
        new ApiResponse(200, req.user, "user profile fetched successfully")
     )
})

export const completeUserProfile = asyncHandler(async (req, res) => {
    try {
        const { name, age, gender, height, city, instagram, bio } = req.body;
        // console.log(name, age, gender, height, city, instagram, bio);
        
        // Validate text fields
        if ([name, age, gender, height, city, instagram, bio].some(field => !field || field.trim() === "")) {
            throw new ApiError(400, "All fields are required");
        }
        // Validate file uploads
        const profilePicLocalPath = req.files?.profilePic?.[0]?.path;
        const introVideoLocalPath = req.files?.introVideo?.[0]?.path;
        const monologVideoLocalPath = req.files?.monologVideo?.[0]?.path;
        const photosLocalPaths = req.files?.photos && req.files.photos?.length
        ? req.files.photos.map((image) => {
            return `public/images/${image.filename}`
            }):[];


        if (!profilePicLocalPath || !introVideoLocalPath || !monologVideoLocalPath || !photosLocalPaths) {
            throw new ApiError(400, "All files are required, please upload");
        }

        
        const profilePic = await uploadOnCloudinary(profilePicLocalPath);
        const introVideo = await uploadOnCloudinary(introVideoLocalPath);
        const monologVideo = await uploadOnCloudinary(monologVideoLocalPath);
        const photos = await Promise.all(photosLocalPaths.map(async(image) => {
            const imageUrl = await uploadOnCloudinary(image) 
            return imageUrl.url;
        }));
       
        const user = await User.findById(req.user._id);

        if(!user){
            throw new ApiError(404, "something went wrong while updating the user")
        }

        user.name = name;
        user.age = age;
        user.city = city;
        user.instagram = instagram;
        user.bio = bio;
        user.height = height;
        user.gender = gender;
        user.profilePic = profilePic.url;
        user.introVideo = introVideo.url;
        user.monologVideo = monologVideo.url;
        user.photos.push(...photos); 
        await user.save();

        return res.status(200).json(
            new ApiResponse(200, user, "user profile updated successfully")
        );

    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message || "Server Error" });
    }
});

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

        const user = await User.findById(decodedToken?._id)

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

        const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

export const getAllUsers = asyncHandler(async(req, res) => {
    try {
        const users = await User.find({});
        if(!users){
            throw new ApiError(500, "someting went wrong cannot fetch users")
        }
        return res.status(200).json(
            new ApiResponse(200, users, "all user fetched successfully")
        )
        
    } catch (error) {
        console.log(error.message);
        throw new ApiError(500, "internal error while getting all users")
    }
})
