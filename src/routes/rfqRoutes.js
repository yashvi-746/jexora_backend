const express = require('express');
const router = express.Router();
const auth = require("../middleware/auth");

const {
    createRFQ,
    getRFQs,
    getRFQById,
    updateRFQ,
    deleteRFQ,
    addItemsToRFQ,
    getRFQItems
} = require('../controller/rfqController');

router.post('/create', auth, createRFQ);
router.get('/', auth, getRFQs);
router.get('/:id', auth, getRFQById);
router.put('/:id', auth, updateRFQ);
router.delete('/:id', auth, deleteRFQ);

// Item routes
router.post('/:id/items', auth, addItemsToRFQ);
router.get('/:id/items', auth, getRFQItems);

module.exports = router;
