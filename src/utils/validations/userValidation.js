const Joi = require("joi");
const { User } = require("../../models");

// custom validation -----------------------------------------------------------------------
const isEmailExists = async (value, helpers) => {
    try{
        const user = await User.findOne({ email: value });
        if(user){
            throw new Error("Email sudah terdaftar, silakan gunakan email lain!");
        }
        return value;
    } catch (error){
        throw new Error("Terjadi kesalahan saat memeriksa email: " + error.message);
    }
};

const isUsernameExists = async (value, helpers) => {
    try{
        const user = await User.findOne({ username: value });
        if(user){
            throw new Error("Username sudah terdaftar, silakan gunakan username lain!");
        }
        return value;
    }
    catch (error){
        throw new Error("Terjadi kesalahan saat memeriksa username: " + error.message);
    }
}

// joi validation --------------------------------------------------------------------------
const registerValidation = Joi.object({
    username: Joi.string()
        .min(3)
        .max(20)
        .alphanum()
        .required()
        .external(isUsernameExists)
        .messages({
            "string.min": "panjang username minimal 3 karakter!",
            "string.max": "panjang username maksimal 20 karakter!",
            "string.alphanum": "username hanya boleh mengandung huruf dan angka!",
            "any.required": "username harus diisi!",
            "string.empty": "username tidak boleh kosong!",
        }),
        
    email: Joi.string()
        .email()
        .required()
        .external(isEmailExists)
        .messages({
            "string.email": "format email tidak valid!",
            "any.required": "email harus diisi!",
            "string.empty": "email tidak boleh kosong!",
        }),
    
    password: Joi.string()
        .min(6)
        .max(20)
        .required()
        .messages({
            "string.min": "panjang password minimal 6 karakter!",
            "string.max": "panjang password maksimal 20 karakter!",
            "any.required": "password harus diisi!",
            "string.empty": "password tidak boleh kosong!",
        }),
});

const loginValidation = Joi.object({
    identifier: Joi.string()
        .required()
        .messages({
            "any.required": "Username atau Email harus diisi!",
            "string.empty": "Username atau Email tidak boleh kosong!",
        }),

    password: Joi.string()
        .required()
        .messages({
            "any.required": "Password harus diisi!",
            "string.empty": "Password tidak boleh kosong!",
        }),
});

const verifyOtpValidation = Joi.object({
    identifier: Joi.string()
        .required()
        .messages({
            "any.required": "Username atau Email harus diisi!",
            "string.empty": "Username atau Email tidak boleh kosong!",
        }),

    otp: Joi.string()
        .required()
        .messages({
            "any.required": "Kode OTP harus diisi!",
            "string.empty": "Kode OTP tidak boleh kosong!",
        }),
});

const updatePasswordValidation = Joi.object({
    currentPassword: Joi.string()
        .required()
        .messages({
            "any.required": "Password saat ini harus diisi!",
            "string.empty": "Password saat ini tidak boleh kosong!",
        }),
    newPassword: Joi.string()
        .required()
        .min(6)
        .max(20)
        .messages({
            "any.required": "Password baru harus diisi!",
            "string.empty": "Password baru tidak boleh kosong!",
            "string.min": "Panjang password baru minimal 6 karakter!",
            "string.max": "Panjang password baru maksimal 20 karakter!",
        }),
    confirmNewPassword: Joi.string()
        .required()
        .valid(Joi.ref('newPassword'))
        .messages({
            "any.required": "Konfirmasi password baru harus diisi!",
            "string.empty": "Konfirmasi password baru tidak boleh kosong!",
            "any.only": "Konfirmasi password tidak cocok dengan password baru!",
        }),
});

const updateEmailValidation = Joi.object({
    newEmail: Joi.string()
        .email()
        .required()
        .external(isEmailExists)
        .messages({
            "string.email": "Format email tidak valid!",
            "any.required": "Email baru harus diisi!",
            "string.empty": "Email baru tidak boleh kosong!",
        }),
});

module.exports = {
    registerValidation,
    loginValidation,
    verifyOtpValidation,
    updatePasswordValidation,
    updateEmailValidation,
};