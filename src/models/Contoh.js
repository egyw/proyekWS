'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Fasilitas extends Model {
    static associate(models) {
        Fasilitas.belongsToMany(models.Kost, {
            foreignKey: 'id_fasilitas',
            otherKey: 'id_kost',
            through: models.KostFasilitas,
        });
    }
  }
  Fasilitas.init(
    {
      id_fasilitas: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      nama_fasilitas: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      }
    },
    {
      sequelize,
      modelName: 'Fasilitas',
      tableName: 'fasilitas',
      name: {
        singular: 'Fasilitas',
        plural: 'Fasilitas',
      },
      timestamps: false,
    }
  );
  return Fasilitas;
};
