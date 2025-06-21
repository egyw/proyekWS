const { User } = require("../models");
const { registerValidation, loginValidation, verifyOtpValidation, updatePasswordValidation, updateEmailValidation } = require("../utils/validations");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const otpGenerator = require("otp-generator");
const { sendOtpEmail } = require("../utils/mailer/mailer");
const path = require("path");
const fs = require("fs");
const { logActivity } = require("../utils/logger/logger");
const Log = require("../models/Log");

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

    await logActivity({
      userId: savedUser._id,
      action: "REGISTER",
      status: "BERHASIL",
      ipAddress: req.ip,
      details: `Pengguna ${savedUser.username} berhasil terdaftar.`,
    });

    return res.status(201).json({
      message: "Registrasi berhasil!",
      data: {
        id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        isPremium: savedUser.isPremium,
        role: savedUser.role,
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
      await logActivity({
        userId: user._id,
        action: "LOGIN_GAGAL",
        status: "GAGAL",
        ipAddress: req.ip,
        details: `Login gagal untuk pengguna ${user.username}. Password salah.`,
      });

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

    await sendOtpEmail(user.email, otp, "Login");

    await logActivity({
      userId: user._id,
      action: "LOGIN_OTP_DIKIRIM",
      status: "BERHASIL",
      ipAddress: req.ip,
      details: `Kode OTP untuk login telah dikirim ke email pengguna ${user.username}.`,
    });

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
      const tempUser = await User.findOne({
        $or: [
          { username: validated.identifier },
          { email: validated.identifier },
        ],
      });

      if (tempUser) {
        await logActivity({
          userId: tempUser._id,
          action: "LOGIN_GAGAL",
          status: "GAGAL",
          ipAddress: req.ip,
          details: `Login gagal untuk pengguna ${tempUser.username}. OTP tidak valid atau telah kedaluwarsa.`,
        });
      }

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
      role: user.role,
    };

    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, {
      expiresIn: "24h",
    });

    const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: "30d",
    });

    user.refreshToken = refreshToken;
    await user.save();

    await logActivity({
      userId: user._id,
      action: "LOGIN_BERHASIL",
      status: "BERHASIL",
      ipAddress: req.ip,
      details: `Login berhasil untuk pengguna ${user.username}.`,
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 hari
    });

    return res.status(200).json({
      message: "Login berhasil!",
      data: payload,
      accessToken: accessToken,
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
      async (err, decoded) => {
        if (err || user._id.toString() !== decoded.id) {

          await logActivity({
            userId: user._id,
            action: "REFRESH_TOKEN",
            status: "GAGAL",
            ipAddress: req.ip,
            details: `Refresh token gagal untuk pengguna ${user.username}. Token tidak valid atau tidak cocok.`,
          });

          return res
            .status(403)
            .json({ message: "Verifikasi refresh token gagal!" });
        }

        const payload = {
          id: user._id,
          username: user.username,
          email: user.email,
          isPremium: user.isPremium,
          role: user.role,
        };

        const newAccessToken = jwt.sign(
          payload,
          process.env.ACCESS_TOKEN_SECRET,
          {
            expiresIn: "15m",
          }
        );

        await logActivity({
          userId: user._id,
          action: "REFRESH_TOKEN",
          status: "BERHASIL",
          ipAddress: req.ip,
          details: `Refresh token berhasil untuk pengguna ${user.username}.`,
        });

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
    return res.status(200).json({ message: "Pengguna sudah logout (tidak ada token ditemukan)." });
  }

  const user = await User.findOne({ refreshToken: refreshToken });
  if (user) {
    user.refreshToken = null;
    await user.save();

    await logActivity({
      userId: user._id,
      action: "LOGOUT",
      status: "BERHASIL",
      ipAddress: req.ip,
      details: `Pengguna ${user.username} berhasil logout.`,
    });
  }

  res.clearCookie("refreshToken", { httpOnly: true });
  return res.status(200).json({ message: "Logout berhasil!" });
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }

    let profilePictureUrl = null;
    if (user.profilePicture) {
      profilePictureUrl = `${req.protocol}://${req.get('host')}${user.profilePicture}`;
    }


    const profileData = {
      id: user._id,
      username: user.username,
      email: user.email,
      isPremium: user.isPremium,
      profilePicture: profilePictureUrl, 
      saldo: user.saldo,
      role: user.role,
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

const getUserProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select('profilePicture');

    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }

    if (!user.profilePicture) {
      return res.status(404).json({ message: "Gambar profil tidak ditemukan." });
    }

    const imagePath = `public/${user.profilePicture}`;
    return res.status(200).sendFile(imagePath, { root: '.' });

  } catch (error) {
    console.error("Gagal mendapatkan gambar profil:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan pada server saat mengambil gambar profil.",
      error: error.message,
    });
  }
}

const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Tidak ada file yang diunggah atau format file tidak didukung." });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);

    if (user && user.profilePicture) {
      const oldPicturePath = path.join(__dirname, '..', '..', 'public', user.profilePicture);
      console.log(oldPicturePath)
      if (fs.existsSync(oldPicturePath)) {
        fs.unlink(oldPicturePath, (err) => {
          if (err) {
            console.error("Gagal menghapus gambar lama:", err);
          } else {
            console.log("Gambar profil lama berhasil dihapus:", oldPicturePath);
          }
        });
      }
    }

    const newProfilePicturePath = `/images/profiles/${req.user.id}/${req.file.filename}`;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePicture: newProfilePicturePath },
      { new: true } 
    ).select('-password -otp -refreshToken -otpExpiresAt'); 

    if (!updatedUser) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }

    return res.status(200).json({
      message: "Gambar profil berhasil diupdate!",
      data: {
        profilePicture: updatedUser.profilePicture
      }
    });

  } catch (error) {
    console.error("Gagal update gambar profil:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan pada server saat mengupdate gambar profil.",
      error: error.message,
    });
  }
};

const deleteProfilePicture = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }

    if (!user.profilePicture) {
      return res.status(400).json({ message: "Tidak ada gambar profil untuk dihapus." });
    }

    const picturePath = path.join(process.cwd(), 'public', user.profilePicture);

    if (fs.existsSync(picturePath)) {
      fs.unlink(picturePath, (err) => {
        if (err) {
          console.error("Gagal menghapus file fisik gambar profil:", err);
        } else {
          console.log("File gambar profil fisik berhasil dihapus:", picturePath);
        }
      });
    } else {
      console.log("File fisik gambar profil tidak ditemukan, hanya akan mengupdate database.");
    }

    user.profilePicture = null;
    await user.save();

    return res.status(200).json({
      message: "Gambar profil berhasil dihapus.",
    });

  } catch (error) {
    console.error("Gagal menghapus gambar profil:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan pada server saat menghapus gambar profil.",
      error: error.message,
    });
  }
};

const updatePassword = async (req, res) => {
  try{
    const validated = await updatePasswordValidation.validateAsync(req.body, {
      abortEarly: false,
    });

    if (!validated) {
      return res.status(400).json({
        message: "Validasi gagal!",
        error:
          "Data tidak valid. Harap masukkan password lama, password baru, dan konfirmasi password baru.",
      });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);

    if(!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }

    const isPasswordValid = await bcrypt.compare(validated.currentPassword, user.password);
    if(!isPasswordValid){
      return res.status(401).json({ message: "Password saat ini salah!" });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(validated.newPassword, salt);

    user.password = hashedNewPassword;
    user.refreshToken = null; 
    await user.save();

    await logActivity({
      userId: user._id,
      action: "GANTI_PASSWORD",
      status: "BERHASIL",
      ipAddress: req.ip,
      details: `Password untuk pengguna ${user.username} berhasil diupdate.`,
    });

    res.clearCookie("refreshToken", { httpOnly: true });

    return res.status(200).json({ message: "Password berhasil diupdate!" });

  } catch (error){
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

const updateEmail = async (req, res) => {
  try{
    const validated = await updateEmailValidation.validateAsync(req.body, {
      abortEarly: false,
    });

    if (!validated) {
      return res.status(400).json({
        message: "Validasi gagal!",
        error: "Data tidak valid. Harap masukkan email baru.",
      });
    }

    const userId = req.user.id;
    const user = await User.findById(userId);

    if(!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }

    const otp = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
      digits: true,
    });
    
    user.pendingEmail = validated.newEmail;
    user.otp = otp;
    user.otpExpiresAt = Date.now() + 3 * 60 * 1000; // 3 menit
    await user.save();

    await sendOtpEmail(validated.newEmail, otp, "Update Email");

    await logActivity({
      userId: user._id,
      action: "GANTI_EMAIL_REQUEST",
      status: "BERHASIL",
      ipAddress: req.ip,
      details: `Permintaan perubahan email untuk pengguna ${user.username} telah dibuat. Kode OTP telah dikirim ke email baru.`,
    });

    return res.status(200).json({
      message: "Verifikasi berhasil. Kode OTP telah dikirim ke email baru Anda.",
      data: {
        newEmail: validated.newEmail,
      },
    });
  } catch (error){
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

const verifyEmailOTP = async (req, res) => {
  try{
    const { otp } = req.body;
    if(!otp) {
      return res.status(400).json({ message: "OTP tidak boleh kosong!" });
    }
    if(otp.length !== 6 || isNaN(otp)) {
      return res.status(400).json({ message: "OTP harus berupa angka 6 digit!" });
    }

    const userId = req.user.id;
    const user = await User.findOne({
      _id: userId,
      otp: otp,
      otpExpiresAt: { $gt: Date.now() }, 
    });

    if(!user) {
      return res.status(400).json({ message: "OTP tidak valid atau telah kedaluwarsa!" });
    }

    const isOtpValid = user.otp === otp;
    const isOtpNotExpired = user.otpExpiresAt && user.otpExpiresAt > Date.now();
    if (!isOtpValid || !isOtpNotExpired) {
      await logActivity({
        userId: user._id,
        action: "GANTI_EMAIL_GAGAL",
        status: "GAGAL",
        ipAddress: req.ip,
        details: `Upaya verifikasi OTP untuk email baru (${user.pendingEmail}) gagal.`,
      });

      return res
        .status(400)
        .json({ message: "OTP tidak valid atau telah kedaluwarsa!" });
    }

    user.email = user.pendingEmail;
    user.pendingEmail = null;
    user.otp = null;
    user.otpExpiresAt = null;
    await user.save();

    await logActivity({
      userId: user._id,
      action: "GANTI_EMAIL_BERHASIL",
      status: "BERHASIL",
      ipAddress: req.ip,
      details: `Email untuk pengguna ${user.username} berhasil diupdate ke ${user.email}.`,
    });

    return res.status(200).json({
      message: "Email berhasil diperbarui!",
      data: {
        email: user.email,
      },
    });

  } catch (err){
    console.error(err);
    return res.status(500).json({
      message: "Terjadi kesalahan pada server!",
      error: err.message,
    });
  }
}

const getUserLogs = async(req, res) => {
  try{
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }

    const logs = await Log.find({ userId: userId }).sort({ createdAt: -1 });
    if (!logs || logs.length === 0) {
      return res.status(404).json({ message: "Tidak ada log aktivitas untuk pengguna ini." });
    }

    return res.status(200).json({
      message: `Berhasil mendapatkan log aktivitas untuk pengguna ${user.username}`,
      data: logs,
    });
  } catch (error){
    console.error("Gagal mendapatkan log pengguna:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan saat mengambil log aktivitas pengguna",
      error: error.message,
    });
  }
}

const updateUserRole = async (req, res) => {
  try{
    const { userId } = req.params;
    const { role } = req.body;    

    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({
        message: "Input tidak valid. Harap berikan role 'user' atau 'admin'."
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Pengguna dengan ID tersebut tidak ditemukan." });
    }

    if (req.user.id === userId) {
        return res.status(400).json({ message: "Anda tidak dapat mengubah role Anda sendiri melalui endpoint ini." });
    }

    user.role = role;
    await user.save();

    await logActivity({
      userId: req.user.id, 
      action: "UPDATE_ROLE",
      status: "BERHASIL",
      ipAddress: req.ip,
      details: `Admin '${req.user.username}' mengubah role pengguna '${user.username}' (ID: ${userId}) menjadi '${role}'.`
    });

    return res.status(200).json({
      message: `Role untuk pengguna ${user.username} berhasil diubah menjadi ${role}.`,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Gagal mengubah role pengguna:", error);
    return res.status(500).json({
      message: "Terjadi kesalahan pada server saat mengubah role pengguna.",
      error: error.message,
    });
  }
}

module.exports = {
  getAllUsers,
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  getUserProfile,
  getUserProfilePicture,
  verifyOTP,
  updateProfilePicture,
  deleteProfilePicture,
  updatePassword,
  updateEmail,
  verifyEmailOTP,
  getUserLogs,
  updateUserRole,
};
