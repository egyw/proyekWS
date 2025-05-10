const db  = {};
const databaseKost = require('../database/databaseKost.js');

const {DataTypes} = require('sequelize');
const Kost = require('./Kost.js');
const Fasilitas = require('./Fasilitas.js');
const KostFasilitas = require('./KostFasilitas.js');
const Kamar = require('./Kamar.js');
const Penghuni = require('./Penghuni.js');


db.Kost = Kost(databaseKost, DataTypes);
db.Fasilitas = Fasilitas(databaseKost, DataTypes);
db.KostFasilitas = KostFasilitas(databaseKost, DataTypes);
db.Kamar = Kamar(databaseKost, DataTypes);
db.Penghuni = Penghuni(databaseKost, DataTypes);

for (const key of Object.keys(db)) {
    db[key].associate(db);
}

module.exports = db;