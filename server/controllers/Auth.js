const bcrypt = require("bcryptjs");
const User = require("../models/User");
const OTP = require("../models/OTP");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const mailSender = require("../utils/mailSender");
const { passwordUpdated } = require("../mail/templates/passwordUpdate");
const Profile = require("../models/Profile");
require("dotenv").config();


// --------------------------------------------------
// SIGNUP CONTROLLER
// --------------------------------------------------
exports.signup = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      accountType,
      contactNumber,
      otp,
    } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password || !confirmPassword || !otp) {
      return res.status(403).json({
        success: false,
        message: "All Fields are required",
      });
    }

    // Passwords match?
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Password and Confirm Password do not match.",
      });
    }

    // User exists?
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists. Please sign in.",
      });
    }

    // Verify OTP
    const otpResponse = await OTP.find({ email }).sort({ createdAt: -1 }).limit(1);

    if (otpResponse.length === 0 || otp !== otpResponse[0].otp) {
      return res.status(400).json({
        success: false,
        message: "The OTP is not valid",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create empty profile
    const profileDetails = await Profile.create({
      gender: null,
      dateOfBirth: null,
      about: null,
      contactNumber: null,
    });

    // Approved logic (just always true except instructors)
    const approved = accountType === "Instructor" ? false : true;

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      contactNumber,
      password: hashedPassword,
      accountType,
      approved,
      additionalDetails: profileDetails._id,
      image: "",
    });

    return res.status(200).json({
      success: true,
      user,
      message: "User registered successfully",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "User cannot be registered. Please try again.",
    });
  }
};



// --------------------------------------------------
// LOGIN CONTROLLER
// --------------------------------------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    // Find user
    const user = await User.findOne({ email }).populate("additionalDetails");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User is not registered. Please signup.",
      });
    }

    // Compare password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Password is incorrect",
      });
    }

    // **FIXED TOKEN!**
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
        accountType: user.accountType,  // << FIXED
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Set cookie
    user.token = token;
    user.password = undefined;

    const options = {
      expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      httpOnly: true,
    };

    return res.cookie("token", token, options).status(200).json({
      success: true,
      token,
      user,
      message: "User login successful",
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Login failed. Try again.",
    });
  }
};



// --------------------------------------------------
// SEND OTP CONTROLLER
// --------------------------------------------------
exports.sendotp = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user already exists
    const checkUserPresent = await User.findOne({ email });
    if (checkUserPresent) {
      return res.status(401).json({
        success: false,
        message: "User already registered",
      });
    }

    let otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    let result = await OTP.findOne({ otp });

    while (result) {
      otp = otpGenerator.generate(6, { upperCaseAlphabets: false });
      result = await OTP.findOne({ otp });
    }

    const otpBody = await OTP.create({ email, otp });

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      otp,
    });

  } catch (error) {
    console.log(error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
};



// --------------------------------------------------
// CHANGE PASSWORD CONTROLLER
// --------------------------------------------------
exports.changePassword = async (req, res) => {
  try {
    const userDetails = await User.findById(req.user.id);
    const { oldPassword, newPassword } = req.body;

    // Validate old password
    const match = await bcrypt.compare(oldPassword, userDetails.password);
    if (!match) {
      return res.status(401).json({
        success: false,
        message: "Old password is incorrect",
      });
    }

    // Save new password
    userDetails.password = await bcrypt.hash(newPassword, 10);
    await userDetails.save();

    // Send email notification
    try {
      await mailSender(
        userDetails.email,
        "Password Updated",
        passwordUpdated(
          userDetails.email,
          `Password updated successfully for ${userDetails.firstName} ${userDetails.lastName}`
        )
      );
    } catch (err) {
      console.error("Mail error:", err);
    }

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });

  } catch (error) {
    console.error("Password update error:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating password",
      error: error.message,
    });
  }
};
