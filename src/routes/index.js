const express = require('express');
const { getAllKost, getKostDetail, addKost, addKamar, addPenghuni, changeKamarPrice, deletePenghuni, getAllFasilitas, getAllPenghuniByKost } = require('../controllers/controllers');
const router = express.Router();

router.get('/kost', getAllKost);
router.get('/kost/:id_kost', getKostDetail);
router.post('/kost', addKost);
router.post('/kamar', addKamar);
router.post('/penghuni', addPenghuni);
router.post('/kamar/:id_kamar', changeKamarPrice);
router.post('/penghuni/:id_penghuni', deletePenghuni);
router.get('/fasilitas', getAllFasilitas);
router.get('/kost/:id_kost/penghuni', getAllPenghuniByKost);

module.exports = router;