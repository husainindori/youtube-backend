import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"


// generate access and refresh token
const generateAccessAndRefreshTokens = async (userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}

// email validation
const isValidEmail = (email) => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|net|org|in)$/;
  return regex.test(email);
};

// register user
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



// login user
const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username or email
  //find the user
  //password check
  //access and refresh token
  //send cookie

  // takes the data from user
  const body = req.body;
  const { email, username, password } = body;
  console.log(email);

  if (!email && !username) {
    throw new ApiError(400, "email and username are required or invalid");
  }

  // Here is an alternative of above code based on logic discussed in video:
  // if (!(username || email)) {
  //     throw new ApiError(400, "username or email is required")

  // }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  const validatePassword = await user.isPasswordCorrect(password);

  if (!validatePassword) {
    throw new ApiError(401, "invalid password, please recheck the password");
  }

  const { accessToken, refreshToken } =
    await generateAccessAndRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "user logged in successfully"
      )
    );
});

// logout user
const logoutUser = asyncHandler(async (req, res) => {
    User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )


    const options = {
    httpOnly: true,
    secure: true,
  };

  return req
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(201, {}, "User Logout Successfully"))
})

export { 
    registerUser,
    loginUser,
    logoutUser,
};
