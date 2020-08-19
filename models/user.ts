export {};
const Sequelize = require('sequelize');
const env = require('../Environment');
const Cons = require((env() === 'PROD') ? '/home/ubuntu/.ssh/Constants' : '../Constants');
const db = (new Sequelize(Cons.DB_SEQ.db, Cons.DB_SEQ.user, Cons.DB_SEQ.password, Cons.DB_SEQ.params));

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