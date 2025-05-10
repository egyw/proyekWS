const jwt = require("jsonwebtoken");
require("dotenv").config();
const verifyJWT = (req, res, next) => {
  // 1. baca isi header kita lalu cari yang namanya authorization
  const authHeader = req.headers.authorization || req.headers.Authorization;
  //   2. cek apakah header tersebut diawali dengan prefix Bearer
  if (!authHeader?.startsWith("Bearer ")) {
    // jika header authorization kita TIDAK ADA ATAU TIDAK DIAWALI DENGAN KATA-KATA Bearer
    return res.status(401).json("Header tidak ditemukan");
  }

  //   3. access token ada, tapi bentuknya Bearer token123
  //   split ["Bearer", "token123"]
  const accessToken = authHeader.split(" ")[1]; // token123

  //   4. suruh jwt untuk verifikasi accessToken ini
  jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json("Token tidak valid");
    }

    req.yanglogin = decoded.pengguna;

    // jika tidak ada error pada saat verifikasi jwt, maka lanjutkan requestnya
    next();
  });
};

module.exports = verifyJWT;