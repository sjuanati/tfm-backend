const Sequelize = require('sequelize');
//const db = require('../controllers/database');
const env = require('../Environment');
const Cons = require((env() === 'PROD') ? '/home/ubuntu/.ssh/Constants' : '../Constants');
const db = ((env() === 'PROD') 
    ? new Sequelize(Cons.DB_PROD_SEQ.db, Cons.DB_PROD_SEQ.user, Cons.DB_PROD_SEQ.password, Cons.DB_PROD_SEQ.params)
    : new Sequelize(Cons.DB_SIM_SEQ.db, Cons.DB_SIM_SEQ.user, Cons.DB_SIM_SEQ.password, Cons.DB_SIM_SEQ.params)
    );

const Message = db.define('message', {
  message: {
    type: Sequelize.STRING
  },
  seen: {
    type: Sequelize.BOOLEAN
  },
  created: {
    type: Sequelize.DATE
  },
  from: {
    type: Sequelize.STRING //user or pharmacy
  },
  to: {
    type: Sequelize.STRING //user or pharmacy
  },
  chatId: {
    type: Sequelize.INTEGER
  },
  userId: {
    type: Sequelize.INTEGER
  },
  pharmacyId: {
    type: Sequelize.INTEGER
  },
  messageType: {
    type: Sequelize.STRING
  },
  image: {
    type: Sequelize.STRING
  },
  audio: {
    type: Sequelize.STRING
  }
}, {
  freezeTableName: true,
  tableName: 'message'
});

Message.associate = (models) => {
  Message.belongsTo(models.Chat, {
    foreignKey: {
      name: 'chatId',
      field: 'chat_id',
    },
  });

  Message.belongsTo(models.User, {
    foreignKey: {
      name: 'userId',
      field: 'user_id',
    },
  });

  Message.belongsTo(models.Pharmacy, {
    foreignKey: {
      name: 'pharmacyId',
      field: 'pharmacy_id',
    },
  });
};

Message.sync();

module.exports = Message;