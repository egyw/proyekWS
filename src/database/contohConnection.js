const sequelize = require("sequelize");
const config = require("../config/config");

const host = config.koneksi_buku.host;
const username = config.koneksi_buku.username;
const password = config.koneksi_buku.password;
const database = config.koneksi_buku.database;
const dialect = config.koneksi_buku.dialect;
const port = config.koneksi_buku.port;

const contohConnection = new sequelize(database, username, password, {
    host: host,
    port: port,
    dialect: dialect,
});

// Test Database
contohConnection.authenticate()
  .then(() => console.log("Database connected!"))
  .catch(err => console.error("Connection error:", err));

module.exports = connectionBuku;
