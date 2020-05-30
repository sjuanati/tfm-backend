let express = require('express');
let router = express.Router();

let md_auth = require('../controllers/authenticated');
let chatScripts = require('../controllers/chatScript');


let multer  = require('multer');
const path = require('path');

// let upload = multer({ dest: 'uploads' });
// Multer Settings for file upload
let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});
let upload = multer({
  storage: storage
});

let storage2 = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'audio')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
});
let upload2 = multer({
  storage: storage2
});

router.post('/getChats', md_auth.ensureAuth, chatScripts.getChats);
router.post('/getRoom', md_auth.ensureAuth, chatScripts.getChatRoom);
router.post('/getRoomById', md_auth.ensureAuth, chatScripts.getChatRoomByRoom);
router.post('/getMessages', md_auth.ensureAuth, chatScripts.getMessages);
router.post('/messagesNotSeen', md_auth.ensureAuth, chatScripts.getMessagesNotSeen);
router.post('/lastView', md_auth.ensureAuth, chatScripts.lastView);
router.post('/newChat', md_auth.ensureAuth, chatScripts.createChat);
router.post('/checkChatExistence', md_auth.ensureAuth, chatScripts.checkChatExistence);
router.post('/uploadPhoto', upload.single('image'), chatScripts.uploadPhoto);
router.post('/uploadAudio', upload2.single('audio'), chatScripts.uploadAudio);

module.exports = router;
