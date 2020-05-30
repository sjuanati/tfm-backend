const Sequelize = require('sequelize');
// const db = require('../controllers/database');
const env = require('../Environment');
const Cons = require((env() === 'PROD') ? '/home/ubuntu/.ssh/Constants' : '../Constants');
const Message = require('../models/message');
const Chat = require('../models/chat');
const db = ((env() === 'PROD') 
    ? new Sequelize(Cons.DB_PROD_SEQ.db, Cons.DB_PROD_SEQ.user, Cons.DB_PROD_SEQ.password, Cons.DB_PROD_SEQ.params)
    : new Sequelize(Cons.DB_SIM_SEQ.db, Cons.DB_SIM_SEQ.user, Cons.DB_SIM_SEQ.password, Cons.DB_SIM_SEQ.params)
    );

const User = db.define('user', {
  name: {
    type: Sequelize.STRING
  },
  email: {
    type: Sequelize.STRING
  },
  birthday: {
    type: Sequelize.DATE
  },
  gender: {
    type: Sequelize.STRING
  },
  password: {
    type: Sequelize.STRING
  },
  phone: {
    type: Sequelize.STRING
  },
  dni: {
    type: Sequelize.STRING
  },
  addresses: {
    type: Sequelize.ARRAY(Sequelize.STRING)
  },
  token: {
    type: Sequelize.STRING
  },
}, {
  freezeTableName: true,
  tableName: 'user'
});


module.exports = User;