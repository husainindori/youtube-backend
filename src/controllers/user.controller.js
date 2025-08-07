import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"




// email validation
const isValidEmail = (email) => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|net|org|in)$/;
  return regex.test(email);
};

const registerUser = asyncHandler(async (req, res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response

    const {username, fullname, password, email} = req.body
    // console.log(`username: ${username}`);

    if (
        [username, fullname, password, email].some((field) => field?.trim() === "")
    ) {
        throw new ApiError(400, "all field must be required!!")
    }

    if (!isValidEmail(email)) {
        throw new ApiError(400, "Enter valid email")
    }

    const existedUser = await User.findOne({
        $or: [{username}, {email}],
    })

    if (existedUser) {
        throw new ApiError(409, `User with this username: ${username} and email: ${email} already existed!!` )
    }

    // console.log(req.files)

    const avatarLocalPath = req.files?.avatar[0].path
    // const coverImageLocalPath = req.files?.coverImage[0].path

    
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file required!")
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar must required!")
    }

    const user = await User.create({
        username: username.toLowerCase(),
        fullname,
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Sorry, Something went wrong while Registering the User") 
    }

    res.status(201).json(
        new ApiResponse(200, createdUser, "User register successfully")
    )
});

export { registerUser };
