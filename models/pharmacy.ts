export {};
const Sequelize = require('sequelize');
const env = require('../Environment');
const Cons = require((env() === 'PROD') ? '/home/ubuntu/.ssh/Constants' : '../Constants');
const db = (new Sequelize(Cons.DB_SEQ.db, Cons.DB_SEQ.user, Cons.DB_SEQ.password, Cons.DB_SEQ.params));

const Pharmacy = db.define('pharmacy', {
  pharmacy_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  status: {
    type: Sequelize.SMALLINT
  },
  pharmacy_code: {
    type: Sequelize.STRING
  },
  pharmacy_desc: {
    type: Sequelize.STRING
  },
  owner_name: {
    type: Sequelize.STRING
  },
  nif: {
    type: Sequelize.STRING
  },
  phone_number: {
    type: Sequelize.STRING
  },
  communication: {
    type: Sequelize.STRING
  },
  zip_code: {
    type: Sequelize.STRING
  },
  locality: {
    type: Sequelize.STRING
  },
  municipality: {
    type: Sequelize.STRING
  },
  province: {
    type: Sequelize.STRING
  },
  country: {
    type: Sequelize.STRING
  },
  gps_latitude: {
    type: Sequelize.DOUBLE
  },
  gps_longitude: {
    type: Sequelize.DOUBLE
  },
  opening_hours: {
    type: Sequelize.STRING
  },
  email: {
    type: Sequelize.STRING
  },
  web: {
    type: Sequelize.STRING
  },
  facebook: {
    type: Sequelize.STRING
  },
  instagram: {
    type: Sequelize.STRING
  },
  whatsapp: {
    type: Sequelize.STRING
  },
  password: {
    type: Sequelize.STRING
  },
  token: {
    type: Sequelize.STRING
  },
  creation_date: {
    type: Sequelize.DATE
  },
  update_date: {
    type: Sequelize.DATE
  }
}, {
  freezeTableName: true,
  tableName: 'pharmacy',
  timestamps: false
});

Pharmacy.sync();

module.exports = Pharmacy;