const Sequelize = require('sequelize');
// const db = require('../controllers/database');
const env = require('../Environment');
const Cons = require((env() === 'PROD') ? '/home/ubuntu/.ssh/Constants' : '../Constants');
const db = (new Sequelize(Cons.DB_SEQ.db, Cons.DB_SEQ.user, Cons.DB_SEQ.password, Cons.DB_SEQ.params));

const Order = db.define('Order', {
  order_id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  order_item: {
    type: Sequelize.INTEGER,
    primaryKey: true
  },
  order_id_app: {
    type: Sequelize.INTEGER,
  },
  status: {
    type: Sequelize.SMALLINT
  },
  item_desc: {
    type: Sequelize.STRING
  },
  photo: {
    type: Sequelize.STRING
  },
  user_id: {
    type: Sequelize.INTEGER
  },
  pharmacy_id: {
    type: Sequelize.INTEGER
  },
  address_id: {
    type: Sequelize.INTEGER
  },
  creation_date: {
    type: Sequelize.DATE
  },
  update_date: {
    type: Sequelize.DATE
  },
  total_price: {
    type: Sequelize.INTEGER
  },
  comments: {
    type: Sequelize.STRING
  }
}, {
  freezeTableName: true,
  tableName: 'order',
  timestamps: false
});

Order.associate = (models) => {
  Order.belongsTo(models.User, {
    foreignKey: {
      name: 'user_id',
      field: 'user_id',
    },
  });

  Order.belongsTo(models.Pharmacy, {
    foreignKey: {
      name: 'pharmacy_id',
      field: 'pharmacy_id',
    },
  });
};

Order.sync();

module.exports = Order;