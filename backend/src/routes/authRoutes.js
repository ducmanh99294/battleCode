// routes/authRoutes.js

const express = require("express");

const {
  register,
  login,
  logout,
  changePassword,
  getMe,
} = require("../controllers/authController");

const authMiddleware = require("../middlewares/authMiddleware");

const router = express.Router();

/*
| Public Routes
*/

/*
 * POST /api/auth/register
 * Đăng ký tài khoản
 */
router.post(
  "/register",
  register
);

/*
 * POST /api/auth/login
 * Đăng nhập
 */
router.post(
  "/login",
  login
);

/*
 * POST /api/auth/logout
 * Đăng xuất
 *
 * Không bắt buộc authMiddleware nếu
 * logout chỉ đơn giản là xóa cookie.
 */
router.post(
  "/logout",
  logout
);

/*
| Protected Routes
*/

/*
 * GET /api/auth/me
 * Lấy thông tin user hiện tại
 */
router.get(
  "/me",
  authMiddleware,
  getMe
);

/*
 * PUT /api/auth/change-password
 * Đổi mật khẩu
 */
router.put(
  "/change-password",
  authMiddleware,
  changePassword
);

module.exports = router;
