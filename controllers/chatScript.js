const User = require('../models/user');
const Pharmacy = require('../models/pharmacy');
const Chat = require('../models/chat');
const Message = require('../models/message');
const sequelize = require('sequelize');
const op = sequelize.Op;

exports.getChats = async (req, res) => {
  let user = req.body;

  let chats = [];
  try {
    if(user.type === 'user') {
      chats = await Chat.findAll({
        where: {
          userId: user.id,
          lastMessage: { [op.ne]: null },
          lastMessageDate: { [op.ne]: null },
        },
        order:[['created', 'DESC']],
        raw: true
      });
      chats.forEach(async (chat, index) => {
        chat.pharmacy = await Pharmacy.findOne({
          where: {
            pharmacy_id: chat.pharmacyId
          },
          raw: true
        });
        let msgNotSeen = await Message.findAndCountAll({
          where: {
            chatId: chat.id,
            userId: user.id,
            to: 'user',
            seen: false
          }
        });
        chat.nonSeen = msgNotSeen.count;
        if(chats.length === index + 1) {
          //console.log('chats', chats);
          res.status(200).send({chats: chats});
        }
      });
      if(chats.length === 0) {
        res.status(200).send({chats: []});
      }
    } else if(user.type === 'pharmacy') {
      chats = await Chat.findAll({
        where: {
          pharmacyId: user.id,
          lastMessage: { [op.ne]: null },
          lastMessageDate: { [op.ne]: null },
        },
        order:[['created', 'DESC']],
        raw: true
      });
      chats.forEach(async (chat, index) => {
        chat.user = await User.findOne({
          where: {
            id: chat.userId
          },
          raw: true
        });
        let msgNotSeen = await Message.findAndCountAll({
          where: {
            chatId: chat.id,
            pharmacyId: user.id,
            to: 'pharmacy',
            seen: false
          }
        });

        chat.nonSeen = msgNotSeen.count;
        if(chats.length === index + 1) {
          res.status(200).send({chats: chats});
        }
      });
      if(chats.length === 0) {
        res.status(200).send({chats: []});
      }
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({error: 'Error finding chats'});
  }
};

exports.checkChatExistence = async (req, res) => {
  let body = req.body;
  let userId = body.userId;
  let pharmacyId = body.pharmacyId;

  if(userId && pharmacyId) {
    let room = "user" + userId + "pharma" + pharmacyId;

    let checkChat = await Chat.findOne({
      where: {
        room: room
      },
      raw: true
    });

    if(checkChat) {
      res.status(200).send({
        chat: checkChat
      });
    } else {
      res.status(200).send({});
    }
  } else {
    res.status(404).send('No userId or pharmacyId specified');
  }
};

exports.createChat = async (req, res) => {
  let body = req.body;
  let room;
  let userId = body.userId;
  let pharmacyId = body.pharmacyId;
  if(userId && pharmacyId) {
    room = "user" + userId + "pharma" + pharmacyId;

    let checkChat = await Chat.findOne({where: {room: room}});

    if(checkChat) {
      res.status(200).send({chat: checkChat.toJSON()});
    } else {
      let newChat = await Chat.create({
        room: room,
        created: new Date(),
        userId: userId,
        pharmacyId: pharmacyId,
        userLastView: new Date(),
        lastMessage: null,
        lastMessageDate: null,
      });
      res.status(200).send({ chat: newChat.toJSON() });
    }
  } else {
    res.status(404).send('No userId or pharmacyId specified');
  }
};

exports.getMessagesNotSeen = async (req, res) => {
  let data = req.body;

  if(data.id && data.type) {
    if(data.type === 'user') {
      let messages = await Message.findAndCountAll({ where: {userId: data.id, to: 'user', seen: false}}).count;
      res.status(200).send(messages);
    } else if (data.type === 'pharmacy') {
      let messages = await Message.findAndCountAll({ where: {pharmacyId: data.id, to: 'pharmacy', seen: false}}).count;
      res.status(200).send(messages);
    } else {
      res.status(404).send('No type of user specified');
    }
  } else {
    res.status(404).send('No userId or type attached');
  }
};

exports.lastView = async (req, res) => {
  let body = req.body;
  if(body && body.room && body.type) {
    if(body.type === 'user') {
      await Chat.update({
        userLastView: body.userLastView
      }, {
        where: {
          room: body.room,
          userId: body.userId
        },
        raw: true
      });

      await Message.update({
        seen: true
      }, {
        where: {
          chatId: body.chatId,
          to: 'user',
          userId: body.userId,
          seen: false
        },
        raw: true
      });
      res.status(200).send({});
    } else if(body.type === 'pharmacy') {
      await Chat.update({
        pharmacyLastView: body.pharmacyLastView
      }, {
        where: {
          room: body.room,
          pharmacyId: body.pharmacyId
        },
        raw: true
      });
      await Message.update({
        seen: true
      }, {
        where: {
          chatId: body.chatId,
          to: 'pharmacy',
          pharmacyId: body.pharmacyId,
          seen: false
        },
        raw: true
      });
      res.status(200).send({});
    } else {
      res.status(404).send('No type of user specified');
    }
  } else {
    res.status(404).send('No room userId or type attached');
  }
};

exports.getMessages = async (req, res) => {
  let body = req.body;
  if(body.chatId) {
    let messages = await Message.findAll({
      where: {
        chatId: body.chatId
      },
      raw: true
    });
    messages.forEach((message, index) => {
      if(message.messageType === 'image') {
        message.image = req.protocol + '://' + req.get('host') + '/images/' + message.image;
      } else if(message.messageType === 'audio') {
        message.audio = req.protocol + '://' + req.get('host') + '/audio/' + message.audio;
      }
      if(messages.length === index + 1) {
        res.status(200).send({messages: messages});
      }
    });
    if(messages.length === 0) {
      res.status(200).send({messages: []});
    }
  } else {
    res.status(404).send('No chatId specified');
  }
};

exports.getChatRoomByRoom = async (req, res) => {
  let body = req.body;

  if(body.room) {
    let chat = await Chat.findOne({
      where: {
        room: body.room
      },
      raw: true
    });
    res.status(200).send(chat);
  } else {
    res.status(404).send('No room specified');
  }


};

exports.getChatRoom = async (req, res) => {
  let body = req.body;

  if(body.userId && body.pharmacyId) {
    let room = "user" + body.userId + "pharma" + body.pharmacyId;

    let checkChat = await Chat.findOne({
      where: {
        room: room
      },
      raw: true
    });

    if(checkChat) {
      res.status(200).send(checkChat);
    } else {
      res.status(404).send('No chat found');
    }
  } else {
    res.status(404).send('No userId or pharmacyId attached');
  }
};

exports.uploadPhoto = async (req, res) => {
  if(req.file) {
    res.status(200).json({message: 'Image Upload'})
  } else {
    res.status(400).json({error: 'No file'});
  }
};
exports.uploadAudio = async (req, res) => {
  if(req.file) {
    res.status(200).json({message: 'Audio Upload'})
  } else {
    res.status(400).json({error: 'No file'});
  }
};