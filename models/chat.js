const Sequelize = require('sequelize');
//const db = require('../controllers/database');
const env = require('../Environment');
const Cons = require((env() === 'PROD') ? '/home/ubuntu/.ssh/Constants' : '../Constants');
const User = require('../models/user');
const Message = require('../models/message');
const db = (new Sequelize(Cons.DB_SEQ.db, Cons.DB_SEQ.user, Cons.DB_SEQ.password, Cons.DB_SEQ.params));

const Chat = db.define('chat', {
  room: {
    type: Sequelize.STRING
  },
  created: {
    type: Sequelize.DATE
  },
  userId: {
    type: Sequelize.INTEGER
  },
  userLastView: {
    type: Sequelize.DATE
  },
  pharmacyId: {
    type: Sequelize.INTEGER
  },
  pharmacyLastView: {
    type: Sequelize.DATE
  },
  lastMessage: {
    type: Sequelize.STRING
  },
  lastMessageDate: {
    type: Sequelize.DATE
  }
}, {
  freezeTableName: true,
  tableName: 'chat'
});

Chat.associate = (models) => {
  Chat.belongsTo(models.User, {
    foreignKey: {
      name: 'userId',
      field: 'user_id',
    },
  });

  Chat.belongsTo(models.Pharmacy, {
    foreignKey: {
      name: 'pharmacyId',
      field: 'pharmacy_id',
    },
  });
};

Chat.sync();

module.exports = Chat;