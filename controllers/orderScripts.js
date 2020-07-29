const User = require('../models/user');
const Pharmacy = require('../models/pharmacy');
const Order = require('../models/order');
const Chat = require('../models/chat');
const Message = require('../models/message');
const {query} = require('./queries');
const trace = require('./ethOrderTrace');
const moment = require('moment');
const tz = require('moment-timezone');

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

/*
  All these functions are replace by exports.changeOrderStatus()
*/

// exports.cancelOrder = async (req, res) => {
//   let body = req.body;
//   const order_id = body.order_id
//   const update_date = moment().tz('Europe/Madrid').format('YYYY-MM-DD H:mm:ss');

//   try {
//     // Update Order status in DB
//     const q = fs.readFileSync(path.join(__dirname, `/../queries/update/update_order_status.sql`), 'utf8');
//     await query(q, 'select', [order_id, 6, update_date]);

//     // Refresh Order items
//     let orderItems = await getOrderItemsPharmacy(body.pharmacy_id, body.order_id);

//     // Add Order data into Log table and Order hash into Blockchain
//     if (await trace.saveOrderTrace(body.order_id)) res.status(200).send({order: orderItems});
//     else res.status(400).send(`Error al cancelar el pedido`);

//   } catch (e) {
//     console.log(e);
//     res.status(400).json({error: 'Error canceling order'});
//   }
// };

// exports.cancelOrderUser = async (req, res) => {
//   let body = req.body;
//   const order_id = body.order_id;
//   const user_id = body.user_id;
//   const eth_address = body.eth_address;
//   const update_date = moment().tz('Europe/Madrid').format('YYYY-MM-DD H:mm:ss');

//   console.log(order_id,user_id,eth_address,update_date);

//    try {
//     // Update Order status in DB
//     const q = fs.readFileSync(path.join(__dirname, `/../queries/update/update_order_status.sql`), 'utf8');
//     await query(q, 'select', [order_id, 6, update_date]);

//     // Refresh Order items
//     let orderItems = await getOrderItemsUser(user_id, order_id);

//     // Add Order data into Log table and Order hash into Blockchain
//     if (await trace.saveOrderTrace(order_id, eth_address)) res.status(200).send({order: orderItems});
//     else res.status(400).send(`Error al cancelar el pedido`);

//   } catch (e) {
//     console.log(e);
//     res.status(400).json({error: 'Error canceling order'});
//   }
  
// };

// exports.deliverOrder = async (req, res) => {
//   let body = req.body;
//   const order_id = body.order_id
//   const update_date = moment().tz('Europe/Madrid').format('YYYY-MM-DD H:mm:ss');

//   try {

//     // Update Order status in DB
//     const q = fs.readFileSync(path.join(__dirname, `/../queries/update/update_order_status.sql`), 'utf8');
//     await query(q, 'select', [order_id, 5, update_date]);

//     // Refresh Order items
//     let orderItems = await getOrderItemsPharmacy(body.pharmacy_id, body.order_id);
    
//     // Add Order data into Log table and Order hash into Blockchain
//     if (await trace.saveOrderTrace(body.order_id)) res.status(200).send({order: orderItems});
//     else res.status(400).send(`Error al entregar el pedido`);

//   } catch (e) {
//     console.log(e);
//     res.status(400).json({error: 'Error delivering order'});
//   }
// };

// exports.confirmOrder = async (req, res) => {
// //exports.informPriceOrder = async (req, res) => {
//   let body = req.body;

//   try {
//     await Order.update({
//       status: 2,
//       //total_price: body.totalPrice,
//       update_date: moment().tz('Europe/Madrid').format('YYYY-MM-DD H:mm:ss')
//     }, {
//       where: {
//         order_id: body.order_id,
//         pharmacy_id: body.pharmacy_id
//       }
//     });
//     let orderItems = await getOrderItemsPharmacy(body.pharmacy_id, body.order_id);

//     // Add Order data into Log table and Order hash into Blockchain
//     if (await trace.saveOrderTrace(body.order_id)) res.status(200).send({order: orderItems});
//     else res.status(400).send(`Error confirming order`);

//   } catch (e) {
//     console.log(e);
//     res.status(400).json({error: 'Error confirming order'});
//   }
// };


// exports.onTheWayOrder = async (req, res) => {
//   let body = req.body;

//   try {
//     await Order.update({
//       status: 3,
//       update_date: moment().tz('Europe/Madrid').format('YYYY-MM-DD H:mm:ss')
//     }, {
//       where: {
//         order_id: body.order_id,
//         pharmacy_id: body.pharmacy_id
//       }
//     });
//     let orderItems = await getOrderItemsPharmacy(body.pharmacy_id, body.order_id);

//     // Add Order data into Log table and Order hash into Blockchain
//     if (await trace.saveOrderTrace(body.order_id)) res.status(200).send({order: orderItems});
//     else res.status(400).send(`Error shipping Order`);

//   } catch (e) {
//     console.log(e);
//     res.status(400).json({error: 'Error shipping Order'});
//   }
// };

// exports.readyOrder = async (req, res) => {
//   let body = req.body;

//   try {
//     await Order.update({
//       status: 4,
//       update_date: moment().tz('Europe/Madrid').format('YYYY-MM-DD H:mm:ss')
//     }, {
//       where: {
//         order_id: body.order_id,
//         pharmacy_id: body.pharmacy_id
//       }
//     });
//     let orderItems = await getOrderItemsPharmacy(body.pharmacy_id, body.order_id);

//     // Add Order data into Log table and Order hash into Blockchain
//     if (await trace.saveOrderTrace(body.order_id)) res.status(200).send({order: orderItems});
//     else res.status(400).send(`Error delivering order`);

//   } catch (e) {
//     console.log(e);
//     res.status(400).json({error: 'Error delivering order'});
//   }
// };


exports.changeOrderStatus = async (req, res) => {

    // Retrieve parameters
    let body = req.body;
    const status = body.status;
    const user_id = body.user_id;
    const order_id = body.order_id;
    const pharmacy_id = body.pharmacy_id;
    const eth_address = body.eth_address;
    const update_date = moment().tz('Europe/Madrid').format('YYYY-MM-DD H:mm:ss');
  
    try {
  
      // Update Order status in DB
      const q = fs.readFileSync(path.join(__dirname, `/../queries/update/update_order_status.sql`), 'utf8');
      await query(q, 'update', [order_id, status, update_date]);

      // Refresh Order items
      const orderItems = (user_id) 
        ? await getOrderItemsUser(user_id, order_id)
        : await getOrderItemsPharmacy(pharmacy_id, order_id);
      
      // Add Order data into Log table and Order hash into Blockchain
      if (await trace.saveOrderTrace(order_id, eth_address)) res.status(200).send({order: orderItems});
      else res.status(400).send(`Error on Order Status change`);
  
    } catch (err) {

      console.log(err);
      res.status(400).json({error: 'Error on Order Status change'});
    }
  };


const getOrderItemsPharmacy = (pharmacy_id, order_id) => {
  return new Promise(async (resolve) => {
    const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_order_item_pharmacy.sql`), 'utf8');
    const results = await query(q, 'select', [pharmacy_id, order_id]);
    resolve(results);
  })
};
const getOrderItemsUser = (user_id, order_id) => {
  return new Promise(async (resolve) => {
    const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_order_item_user.sql`), 'utf8');
    const results = await query(q, 'select', [user_id, order_id]);
    resolve(results);
  })
};