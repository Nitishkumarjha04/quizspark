const router = require('express').Router();
const { protect, optionalAuth } = require('../middleware/auth');
const { createRoom, getRoom, getMyRooms, getRoomResults } = require('../controllers/roomController');

router.post('/',            protect,      createRoom);
router.get('/my',           protect,      getMyRooms);
router.get('/:code',        optionalAuth, getRoom);
router.get('/:code/results', optionalAuth, getRoomResults);

module.exports = router;
