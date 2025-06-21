const Log = require("../../models/Log");

/**
 * Mencatat aktivitas pengguna ke database.
 * @param {object} logData - Data log yang akan disimpan.
 * @param {string} logData.userId - ID pengguna yang melakukan aksi.
 * @param {string} logData.action - Jenis aksi yang dilakukan (e.g., 'LOGIN', 'GANTI_PASSWORD').
 * @param {string} logData.status - Status aksi ('BERHASIL' atau 'GAGAL').
 * @param {string} [logData.ipAddress] - Alamat IP pengguna.
 * @param {string} [logData.details] - Detail tambahan tentang aksi.
 */

const logActivity = async ({ userId, action, status, ipAddress, details = '' }) => {
  try {
    await Log.create({
      userId,
      action,
      status,
      ipAddress,
      details,
    });
  } catch (error) {
    console.error("Gagal menyimpan log aktivitas:", error);
  }
};

module.exports = { logActivity };