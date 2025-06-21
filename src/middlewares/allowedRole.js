const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        message: "Akses ditolak. Informasi otentikasi tidak lengkap."
      });
    }

    const userRole = req.user.role;

    if (allowedRoles.includes(userRole)) {
      next(); 
    } else {
      return res.status(403).json({
        message: "Akses ditolak. Anda tidak memiliki izin untuk mengakses endpoint ini."
      });
    }
  };
};

module.exports = authorize;