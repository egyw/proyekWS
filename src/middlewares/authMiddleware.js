const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak. Tidak ada token yang diberikan.' });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decodedPayload) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token kedaluwarsa.' });
      }
      return res.status(403).json({ message: 'Token tidak valid.' });
    }

    req.user = decodedPayload;

    next();
  });
};

module.exports = verifyToken;