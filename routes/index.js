const express = require('express');
const router = express.Router();
const lapController = require('../controllers/lapController');

router.get('/', lapController.getLapList);
router.get('/record', lapController.getRecordForm);
router.post('/laps', lapController.postLap);
router.delete('/laps/:id', lapController.deleteLap);
router.get('/stats', lapController.getStats);

module.exports = router;
