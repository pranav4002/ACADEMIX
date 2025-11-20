const jwt = require("jsonwebtoken");
const User = require("../models/User");

exports.auth = async (req, res, next) => {
  try {
    let token = null;

    // extract token safely
    if (req.cookies.token) token = req.cookies.token;
    else if (req.body.token) token = req.body.token;
    else if (req.headers.authorization)
      token = req.headers.authorization.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Token missing",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded; // store user info

    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

exports.isInstructor = async (req, res, next) => {
  try {
    const userDetails = await User.findById(req.user.id);

    if (!userDetails || userDetails.accountType !== "Instructor") {
      return res.status(401).json({
        success: false,
        message: "This is a protected route for instructors",
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error verifying instructor role",
    });
  }
};

exports.isStudent = async (req, res, next) => {
  try {
    const userDetails = await User.findById(req.user.id);

    if (!userDetails || userDetails.accountType !== "Student") {
      return res.status(401).json({
        success: false,
        message: "This is a protected route for students",
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error verifying student role",
    });
  }
};

exports.isAdmin = async (req, res, next) => {
  try {
    const userDetails = await User.findById(req.user.id);

    if (!userDetails || userDetails.accountType !== "Admin") {
      return res.status(401).json({
        success: false,
        message: "This is a protected route for admin",
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error verifying admin role",
    });
  }
};
