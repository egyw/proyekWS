const {Sequelize, Op, where} = require('sequelize');
const { Kamar, Kost, Fasilitas, Penghuni } = require('../models');

const getAllKost = async (req, res) => {
    try{
        const kost = await Kost.findAll({
            attributes: [
                'id_kost',
                'nama_kost',
                'alamat',
                [Sequelize.literal('(SELECT COUNT(*) FROM kamar WHERE kamar.id_kost = kost.id_kost)'), 'total_kamar'],
                [Sequelize.literal('(SELECT COUNT(*) FROM kamar WHERE kamar.id_kost = kost.id_kost AND kamar.status = "kosong")'), 'jumlah_kamar_kosong'],
                [Sequelize.literal('(SELECT SUM(kamar.harga) FROM kamar WHERE kamar.id_kost = kost.id_kost)'), 'total_harga_kamar'],
                [Sequelize.fn('GROUP_CONCAT', Sequelize.col('Fasilitas.nama_fasilitas')), 'fasilitas'],
                // ga bisa pakai fn buat total harga kamar, soalnya kalo di join banyak data di table (duplikat), hasil sum-nya jadi ngaco
            ],
            include: [
                {
                    model: Fasilitas,
                    attributes: [],
                    through: {attributes: []},
                },
            ],
            group: ['id_kost'],
        });

        if(kost.length === 0) {
            return res.status(404).json({message: 'Data kost masih kosong!'});
        }

        const formattedKost = kost.map(item => ({
            ...item.dataValues,
            total_harga_kamar: item.dataValues.total_harga_kamar ? new Intl.NumberFormat('id-ID').format(item.dataValues.total_harga_kamar) : 0,
            fasilitas: item.dataValues.fasilitas ? item.dataValues.fasilitas.split(',') : []
        }));
        
        return res.status(200).json({ kost: formattedKost });
    } catch (error) {
        return res.status(400).json({message: error.message});
    }
};


module.exports = {
    getAllKost,
};
