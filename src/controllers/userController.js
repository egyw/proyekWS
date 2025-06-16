const { User } = require("../models");
const { registerValidation, loginValidation, verifyOtpValidation } = require("../utils/validations");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const { sendOtpEmail } = require("../utils/mailer/mailer");

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    return res.status(200).json({
      message: "Berhasil mendapatkan semua pengguna",
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil data pengguna",
      error: error.message,
    });
  }
};

const registerUser = async (req, res) => {
  try {
    const validated = await registerValidation.validateAsync(req.body, {
      abortEarly: false,
    });
    if (!validated) {
      return res.status(400).json({
        message: "Validasi gagal!",
        error:
          "Data tidak valid. Harap masukkan username, email, dan password.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(validated.password, salt);

    const newUser = new User({
      username: validated.username,
      email: validated.email,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();

    return res.status(201).json({
      message: "Registrasi berhasil!",
      data: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        isPremium: savedUser.isPremium,
      },
    });
  } catch (error) {
    if (error.isJoi) {
      const errorMessages = {};
      error.details.forEach((detail) => {
        errorMessages[detail.path[0]] = detail.message;
      });

      return res.status(400).json({
        message: "Validasi gagal!",
        error: errorMessages,
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Terjadi kesalahan pada server!",
      error: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const validated = await loginValidation.validateAsync(req.body, {
      abortEarly: false,
    });
    if (!validated) {
      return res.status(400).json({
        message: "Validasi gagal!",
        error: "Data tidak valid. Harap masukkan username/email dan password.",
      });
    }

    const user = await User.findOne({
      $or: [
        { username: validated.identifier },
        { email: validated.identifier },
      ],
    });

    if (!user) {
      return res
        .status(404)
        .json({ message: "Username/Email atau Password salah!" });
    }

    const isPasswordValid = await bcrypt.compare(
      validated.password,
      user.password
    );
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ message: "Username/Email atau Password salah!" });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
      digits: true,
    });

    user.otp = otp;
    user.otpExpiresAt = Date.now() + 3 * 60 * 1000; // 3 menit
    await user.save();

    await sendOtpEmail(user.email, otp);

    return res.status(200).json({
      message: "Verifikasi berhasil. kode OTP telah dikirim ke email Anda.",
      data: {
        username: user.username,
        email: user.email,
      },
    })
  } catch (error) {
    if (error.isJoi) {
      const errorMessages = {};
      error.details.forEach((detail) => {
        errorMessages[detail.path[0]] = detail.message;
      });

      return res.status(400).json({
        message: "Validasi gagal!",
        error: errorMessages,
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Terjadi kesalahan pada server!",
      error: error.message,
    });
  }
};

const verifyOTP = async (req, res) => {
  try{
    const validated = await verifyOtpValidation.validateAsync(req.body, {
      abortEarly: false,
    });

    if (!validated) {
      return res.status(400).json({
        message: "Validasi gagal!",
        error: "Data tidak valid. Harap masukkan identifier dan OTP.",
      });
    }
    
    const user = await User.findOne({
      $or: [
        { username: validated.identifier },
        { email: validated.identifier },
      ],
      otp: validated.otp,
      otpExpiresAt: { $gt: Date.now() }, 
    });

    if (!user) {
      return res.status(400).json({
        message: "OTP tidak valid atau telah kedaluwarsa!",
      });
    }

    user.otp = null;
    user.otpExpiresAt = null;

    const payload = {
      id: user._id,
      username: user.username,
      email: user.email,
      isPremium: user.isPremium,
    };

    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "10h",
    });

    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "30d",
    });

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 hari
    });

    return res.status(200).json({
      message: "Login berhasil!",
      data: payload,
      accessToken: accessToken,
    });
  } catch (err) {
    if (error.isJoi) {
      const errorMessages = {};
      error.details.forEach((detail) => {
        errorMessages[detail.path[0]] = detail.message;
      });

      return res.status(400).json({
        message: "Validasi gagal!",
        error: errorMessages,
      });
    }

    console.error(error);
    return res.status(500).json({
      message: "Terjadi kesalahan pada server!",
      error: error.message,
    });
  }
}

const refreshToken = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      return res
        .status(401)
        .json({ message: "Refresh token tidak ditemukan!" });
    }

    const user = await User.findOne({ refreshToken: refreshToken });
    if (!user) {
      return res.status(403).json({ message: "Refresh token tidak valid!" });
    }

    jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      (err, decoded) => {
        if (err || user._id.toString() !== decoded.id) {
          return res
            .status(403)
            .json({ message: "Verifikasi refresh token gagal!" });
        }

        const payload = {
          id: user._id,
          username: user.username,
          email: user.email,
          isPremium: user.isPremium,
        };

        const newAccessToken = jwt.sign(
          payload,
          process.env.ACCESS_TOKEN_SECRET,
          {
            expiresIn: "15m",
          }
        );

        return res.status(200).json({
          message: "Refresh token berhasil!",
          accessToken: newAccessToken,
        });
      }
    );
  } catch (error) {
    console.error("Refresh token error:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan pada server saat merefresh token!",
      error: error.message,
    });
  }
};

const logoutUser = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) {
    return res.status(204);
  }

  const user = await User.findOne({ refreshToken: refreshToken });
  if (user) {
    user.refreshToken = null;
    await user.save();
  }

  res.clearCookie("refreshToken", { httpOnly: true });
  return res.status(200).json({ message: "Logout berhasil!" });
};

const getUserProfile = async (req, res) => {
  try {
    const userProfile = req.user;

    const profileData = {
      id: userProfile._id,
      username: userProfile.username,
      email: userProfile.email,
      isPremium: userProfile.isPremium,
    };

    return res.status(200).json({
      message: "Berhasil mendapatkan profil pengguna",
      data: profileData,
    });
  } catch (error) {
    console.error("gagal mendatkan profil pengguna:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil profil pengguna",
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getUserProfile,
  verifyOTP,
};
