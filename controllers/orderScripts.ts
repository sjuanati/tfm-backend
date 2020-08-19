import * as fs from 'fs';
import * as path from 'path';
import * as express from 'express';

const User = require('../models/user');
const Pharmacy = require('../models/pharmacy');
const Order = require('../models/order');
const { query } = require('./queries');
const trace = require('./ethOrderTrace');
const moment = require('moment');
const tz = require('moment-timezone');

interface OrderBase {
    order_id: number,
    order_item: number,
    order_id_app: number,
    status: number,
    item_desc: string,
    product_desc: string,
    photo: string,
    user_id: number,
    pharmacy_id: number,
    address_id: number,
    creation_date: Date,
    update_date: Date
    price: number,
    total_price: number,
    comments: string,
    pharmacy: number,
}

interface User {
    name: string,
    email: string,
    birthday: Date,
    gender: string,
    password: string,
    phone: string,
    dni: string,
    addresses: string[],
    token: string,
}

interface Order extends OrderBase, User {
    other: OrderBase[],
    user: User,
}

exports.getOrders = async (req: express.Request, res: express.Response) => {
    let user = req.body;
    let orders: Order[] = [];
    let lngth = 0;

    try {
        if (user.type === 'user') {
            let ordrs = await Order.findAll({
                where: {
                    user_id: user.id
                },
                order: [['creation_date', 'DESC']],
                raw: true
            });

            ordrs.forEach((ordr: Order, i: number, ordrsArray: Order[]) => {
                let order: Order;
                if (i === 0) {
                    order = ordr;
                    order.other = [];
                    orders.push(order);
                    lngth++;
                } else if (ordr.order_id !== ordrsArray[i - 1].order_id) {
                    order = ordr;
                    order.other = [];
                    orders.push(order);
                    lngth++;
                } else if (ordr.order_id === ordrsArray[i - 1].order_id) {
                    orders[lngth - 1].other.push(ordr);
                }

                if (ordrs.length === i + 1) {
                    orders.forEach(async (order, index) => {
                        order.pharmacy = await Pharmacy.findOne({
                            where: {
                                pharmacy_id: order.pharmacy_id
                            },
                            raw: true
                        });
                        if (orders.length === index + 1) {
                            res.status(200).send({ orders: orders });
                        }
                    });
                    if (orders.length === 0) {
                        res.status(200).send({ orders: [] });
                    }
                }
            });
            if (ordrs.length === 0) {
                res.status(200).send({ orders: [] });
            }
        } else if (user.type === 'pharmacy') {
            let ordrs: Order[] = await Order.findAll({
                where: {
                    pharmacy_id: user.id
                },
                order: [['creation_date', 'DESC']],
                raw: true
            });
            console.log(ordrs.length);

            ordrs.forEach((ordr: Order, i: number, ordrsArray: Order[]) => {
                let order: Order;
                if (i === 0) {
                    order = ordr;
                    order.other = [];
                    orders.push(order);
                    lngth++;
                } else if (ordr.order_id !== ordrsArray[i - 1].order_id) {
                    order = ordr;
                    order.other = [];
                    orders.push(order);
                    lngth++;
                } else if (ordr.order_id === ordrsArray[i - 1].order_id) {
                    orders[lngth - 1].other.push(ordr);
                }

                if (ordrs.length === i + 1) {
                    orders.forEach(async (order, index) => {
                        console.log(i, order);
                        order.user = await User.findOne({
                            where: {
                                id: order.user_id
                            },
                            raw: true
                        });
                        if (orders.length === index + 1) {
                            res.status(200).send({ orders: orders });
                        }
                    });
                    if (orders.length === 0) {
                        res.status(200).send({ orders: [] });
                    }
                }
            });
            if (ordrs.length === 0) {
                res.status(200).send({ orders: [] });
            }
        }
    } catch (e) {
        console.log(e);
        res.status(400).json({ error: 'Error finding orders' });
    }
};

exports.changeOrderStatus = async (req: express.Request, res: express.Response) => {

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
        if (await trace.saveOrderTrace(order_id, eth_address)) res.status(200).send({ order: orderItems });
        else res.status(400).send(`Error on Order Status change`);

    } catch (err) {

        console.log(err);
        res.status(400).json({ error: 'Error on Order Status change' });
    }
};


const getOrderItemsPharmacy = (pharmacy_id: number, order_id: string) => {
    return new Promise(async (resolve) => {
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_order_item_pharmacy.sql`), 'utf8');
        const results = await query(q, 'select', [pharmacy_id, order_id]);
        resolve(results);
    })
};
const getOrderItemsUser = (user_id: number, order_id: string) => {
    return new Promise(async (resolve) => {
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_order_item_user.sql`), 'utf8');
        const results = await query(q, 'select', [user_id, order_id]);
        resolve(results);
    })
};