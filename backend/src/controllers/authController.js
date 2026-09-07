// controllers/authController.js
const jwt = require("jsonwebtoken");
const Player = require("../models/Player");
const bcrypt = require("bcrypt");
const User = require("../models/User");

/*
| REGISTER
*/

exports.register = async (req, res) => {
  try {
    let {
      username,
      email,
      password,
    } = req.body;

    /*
    | Validate input
    */

    if (!username || !email || !password) {
      return res.status(400).json({
        message:
          "Username, email and password are required",
      });
    }

    /*
    | Normalize
    */

    username = username.trim();

    email = email
      .trim()
      .toLowerCase();

    /*
    | Check password
    */

    if (password.length < 6) {
      return res.status(400).json({
        message:
          "Password must be at least 6 characters",
      });
    }

    /*
    | Check existing user
    */

    const existingUser =
      await User.findOne({
        $or: [
          { username },
          { email },
        ],
      });

    if (existingUser) {
      return res.status(400).json({
        message:
          "Username or email already exists",
      });
    }

    /*
    | Hash password
    */

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    /*
    | Create User
    */

    const user =
      await User.create({
        username,
        email,
        password: hashedPassword,
      });

    /*
    | Response
    */

    await Player.create({ userId: user._id });

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      token,
      playerId: user._id,
      username: user.username,
      message:
        "Register successfully",

      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Register error:",
      error
    );

    /*
    | Duplicate key
    */

    if (error.code === 11000) {
      return res.status(400).json({
        message:
          "Username or email already exists",
      });
    }

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/*
| LOGIN
*/

exports.login = async (req, res) => {
  try {
    const {
      username,
      password,
    } = req.body;

    /*
    | Validate
    */

    if (!username || !password) {
      return res.status(400).json({
        message:
          "Username and password are required",
      });
    }

    /*
    | Normalize Username
    */

    const normalizedUsername =
      username.trim();

    /*
    | Find User
    |
    | Password có select: false
    | nên phải select("+password")
    |
    */

    const user =
      await User.findOne({
        username: normalizedUsername,
      }).select("+password");

    /*
    | User Not Found
    */

    if (!user) {
      return res.status(401).json({
        message:
          "Invalid username or password",
      });
    }

    /*
    | Compare Password
    */

    const isMatch =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isMatch) {
      return res.status(401).json({
        message:
          "Invalid username or password",
      });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );
    /*
    | Update Last Login
    */

    user.lastLogin =
      new Date();

    await user.save();

    /*
    | Response
    */

    return res.status(200).json({
      token,
      playerId: user._id,
      username: user.username,
      message:
        "Login successfully",

      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        lastLogin:
          user.lastLogin,
      },
    });
  } catch (error) {
    console.error(
      "Login error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};


/*
| LOGOUT
*/

exports.logout = async (
  req,
  res
) => {
  try {
    /*
    | Clear Authentication Cookies
    */

    res.clearCookie(
      "accessToken"
    );

    res.clearCookie(
      "refreshToken"
    );

    return res.json({
      message:
        "Logged out successfully",
    });
  } catch (error) {
    console.error(
      "Logout error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/*
| CHANGE PASSWORD
*/

exports.changePassword = async (
  req,
  res
) => {
  try {
    const {
      oldPassword,
      newPassword,
    } = req.body;

    /*
    | Validate
    */

    if (
      !oldPassword ||
      !newPassword
    ) {
      return res.status(400).json({
        message:
          "Old password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        message:
          "New password must be at least 6 characters",
      });
    }

    /*
    | Get User
    |
    | Password có select: false
    | nên phải select thủ công.
    |
    */

    const user =
      await User.findById(
        req.user.id
      ).select("+password");

    if (!user) {
      return res.status(404).json({
        message:
          "User not found",
      });
    }

    /*
    | Check Old Password
    */

    const isMatch =
      await bcrypt.compare(
        oldPassword,
        user.password
      );

    if (!isMatch) {
      return res.status(400).json({
        message:
          "Old password is incorrect",
      });
    }

    /*
    | Prevent Same Password
    */

    const isSamePassword =
      await bcrypt.compare(
        newPassword,
        user.password
      );

    if (isSamePassword) {
      return res.status(400).json({
        message:
          "New password must be different from old password",
      });
    }

    /*
    | Hash New Password
    */

    user.password =
      await bcrypt.hash(
        newPassword,
        10
      );

    await user.save();

    return res.json({
      message:
        "Password changed successfully",
    });
  } catch (error) {
    console.error(
      "Change password error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};

/*
| GET ME
*/

exports.getMe = async (
  req,
  res
) => {
  try {
    const user =
      await User.findById(
        req.user.id
      ).select(
        "-password"
      );

    if (!user) {
      return res.status(404).json({
        message:
          "User not found",
      });
    }

    return res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
    });
  } catch (error) {
    console.error(
      "Get me error:",
      error
    );

    return res.status(500).json({
      message: "Server error",
    });
  }
};
