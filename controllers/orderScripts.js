const User = require('../models/user');
const Pharmacy = require('../models/pharmacy');
const Order = require('../models/order');
const Chat = require('../models/chat');
const Message = require('../models/message');
const {query} = require('./queries');
const eth = require('./ethereumScripts');

const pg = require('pg');
const fs = require('fs');
const path = require('path');

exports.getOrders = async (req, res) => {
  let user = req.body;

  console.log('user', user);
  let orders = [];
  let lngth = 0;
  try {
    if(user.type === 'user') {
      let ordrs = await Order.findAll({
        where: {
          user_id: user.id
        },
        order:[['creation_date', 'DESC']],
        raw: true
      });

      ordrs.forEach((ordr, i, ordrsArray) => {
        let order = {};
        if(i === 0) {
          order = ordr;
          order.other = [];
          orders.push(order);
          lngth++;
        } else if(ordr.order_id !== ordrsArray[i-1].order_id) {
          order = ordr;
          order.other = [];
          orders.push(order);
          lngth++;
        } else if(ordr.order_id === ordrsArray[i-1].order_id) {
          orders[lngth-1].other.push(ordr);
        }

        if(ordrs.length === i + 1) {
          orders.forEach(async (order, index) => {
            order.pharmacy = await Pharmacy.findOne({
              where: {
                pharmacy_id: order.pharmacy_id
              },
              raw: true
            });
            order.chat = await Chat.findOne({
              where: {
                room: 'user'+user.id+'pharma'+order.pharmacy.pharmacy_id
              },
              raw: true
            });
            if(order.chat) {
              let msgNotSeen = await Message.findAndCountAll({
                where: {
                  chatId: order.chat.id,
                  userId: user.id,
                  to: 'user',
                  seen: false
                }
              });
              order.nonSeen = msgNotSeen.count;
            }
            if(orders.length === index + 1) {
              res.status(200).send({orders: orders});
            }
          });
          if(orders.length === 0) {
            res.status(200).send({orders: []});
          }
        }
      });
      if(ordrs.length === 0) {
        res.status(200).send({orders: []});
      }
    } else if(user.type === 'pharmacy') {
      let ordrs = await Order.findAll({
        where: {
          pharmacy_id: user.id
        },
        order:[['creation_date', 'DESC']],
        raw: true
      });
      console.log(ordrs.length);

      ordrs.forEach((ordr, i, ordrsArray) => {
        let order = {};
        if(i === 0) {
          order = ordr;
          order.other = [];
          orders.push(order);
          lngth++;
        } else if(ordr.order_id !== ordrsArray[i-1].order_id) {
          order = ordr;
          order.other = [];
          orders.push(order);
          lngth++;
        } else if(ordr.order_id === ordrsArray[i-1].order_id) {
          orders[lngth-1].other.push(ordr);
        }

        if(ordrs.length === i + 1) {
          orders.forEach(async (order, index) => {
            console.log(i, order);
            order.user = await User.findOne({
              where: {
                id: order.user_id
              },
              raw: true
            });
            order.chat = await Chat.findOne({
              where: {
                room: 'user'+order.user.id+'pharma'+user.id
              },
              raw: true
            });
            if(order.chat) {
              let msgNotSeen = await Message.findAndCountAll({
                where: {
                  chatId: order.chat.id,
                  pharmacyId: user.id,
                  to: 'pharmacy',
                  seen: false
                }
              });
              order.nonSeen = msgNotSeen.count;
            }
            if(orders.length === index + 1) {
              res.status(200).send({orders: orders});
            }
          });
          if(orders.length === 0) {
            res.status(200).send({orders: []});
          }
        }
      });
      if(ordrs.length === 0) {
        res.status(200).send({orders: []});
      }
    }
  } catch (e) {
    console.log(e);
    res.status(400).json({error: 'Error finding orders'});
  }
};

exports.cancelOrder = async (req, res) => {
  let body = req.body;

  try {
    await Order.update({
      status: 6,
      comments: body.comments
    }, {
      where: {
        order_id: body.order_id,
        pharmacy_id: body.pharmacy_id
      }
    });
    let orderItems = await getItemOrders(body.pharmacy_id, body.order_id);

    // Add Order data into Log table and Order hash into Blockchain
    if (await eth.saveLog(body.order_id)) res.status(200).send({order: orderItems});
    else res.status(400).send(`Error al cancelar el pedido`);

  } catch (e) {
    console.log(e);
    res.status(400).json({error: 'Error canceling order'});
  }
};

exports.cancelOrderUser = async (req, res) => {
  let body = req.body;

  try {
    await Order.update({
      status: 6,
    }, {
      where: {
        order_id: body.order_id,
        user_id: body.user_id
      }
    });
    let orderItems = await getItemOrdersUser(body.user_id, body.order_id);

    // Add Order data into Log table and Order hash into Blockchain
    if (await eth.saveLog(body.order_id)) res.status(200).send({order: orderItems});
    else res.status(400).send(`Error al cancelar el pedido`);

  } catch (e) {
    console.log(e);
    res.status(400).json({error: 'Error canceling order'});
  }
};

exports.deliverOrder = async (req, res) => {
  let body = req.body;

  try {
    await Order.update({
      status: 5
    }, {
      where: {
        order_id: body.order_id,
        pharmacy_id: body.pharmacy_id
      }
    });
    let orderItems = await getItemOrders(body.pharmacy_id, body.order_id);
    
    // Add Order data into Log table and Order hash into Blockchain
    if (await eth.saveLog(body.order_id)) res.status(200).send({order: orderItems});
    else res.status(400).send(`Error al entregar el pedido`);

  } catch (e) {
    console.log(e);
    res.status(400).json({error: 'Error delivering order'});
  }
};

exports.informPriceOrder = async (req, res) => {
  let body = req.body;

  try {
    await Order.update({
      status: 2,
      total_price: body.totalPrice
    }, {
      where: {
        order_id: body.order_id,
        pharmacy_id: body.pharmacy_id
      }
    });
    let orderItems = await getItemOrders(body.pharmacy_id, body.order_id);

    // Add Order data into Log table and Order hash into Blockchain
    if (await eth.saveLog(body.order_id)) res.status(200).send({order: orderItems});
    else res.status(400).send(`Error al informar precio en el pedido`);

  } catch (e) {
    console.log(e);
    res.status(400).json({error: 'Error delivering order'});
  }
};

exports.acceptPriceOrder = async (req, res) => {
  let body = req.body;
  
  try {
    await Order.update({
      status: 3
    }, {
      where: {
        order_id: body.order_id,
        user_id: body.user_id
      }
    });
    let orderItems = await getItemOrdersUser(body.user_id, body.order_id);

    // Add Order data into Log table and Order hash into Blockchain
    if (await eth.saveLog(body.order_id)) res.status(200).send({order: orderItems});
    else res.status(400).send(`Error al acceptar precio en el pedido`);

  } catch (e) {
    console.log(e);
    res.status(400).json({error: 'Error delivering order'});
  }
};

exports.onTheWayOrder = async (req, res) => {
  let body = req.body;

  try {
    let orderUpdated = await Order.update({
      status: 3
    }, {
      where: {
        order_id: body.order_id,
        pharmacy_id: body.pharmacy_id
      }
    });
    let orderItems = await getItemOrders(body.pharmacy_id, body.order_id);

    // Add Order data into Log table and Order hash into Blockchain
    if (await eth.saveLog(body.order_id)) res.status(200).send({order: orderItems});
    else res.status(400).send(`Error al enviar el pedido`);

  } catch (e) {
    console.log(e);
    res.status(400).json({error: 'Error putting on the way an order'});
  }
};

exports.readyOrder = async (req, res) => {
  let body = req.body;

  try {
    let orderUpdated = await Order.update({
      status: 4
    }, {
      where: {
        status: 3,
        order_id: body.order_id,
        pharmacy_id: body.pharmacy_id
      }
    });
    let orderItems = await getItemOrders(body.pharmacy_id, body.order_id);

    // Add Order data into Log table and Order hash into Blockchain
    if (await eth.saveLog(body.order_id)) res.status(200).send({order: orderItems});
    else res.status(400).send(`Error al dejar el pedido listo`);

  } catch (e) {
    console.log(e);
    res.status(400).json({error: 'Error making ready order'});
  }
};

const getItemOrders = (pharmacy_id, order_id) => {
  return new Promise(async (resolve, reject) => {
    const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_order_item_pharmacy.sql`), 'utf8');
    const results = await query(q, 'select', [pharmacy_id, order_id]);
    console.log(results);
    resolve(results);
  })
};
const getItemOrdersUser = (user_id, order_id) => {
  return new Promise(async (resolve, reject) => {
    const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_order_item_user.sql`), 'utf8');
    const results = await query(q, 'select', [user_id, order_id]);
    console.log(results);
    resolve(results);
  })
};