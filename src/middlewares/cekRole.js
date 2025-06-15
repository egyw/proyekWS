const cekPremium = (req, res, next) => {
  const user = req.user;

  if (!user) {
    return res
      .status(401)
      .json({ message: "Akses ditolak. Pengguna tidak ditemukan." });
  }
  console.log("User premium status:", user.isPremium);

  if (!user.isPremium) {
    return res.status(403).json({
      message:
        "AI Food Suggestion is available for premium users only. Please upgrade your account.",
    });
  }
  next();
};

module.exports = cekPremium;
