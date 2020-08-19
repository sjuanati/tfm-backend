import * as express from 'express';
import * as pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';
const moment = require('moment');
const tz = require('moment-timezone');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const trace = require('./ethOrderTrace');

// Environment params
const env = require('../Environment');
const Constants = require((env() === 'AWS') ? '/home/ubuntu/.ssh/Constants' : '../Constants');

// DB connection params
const pool = new pg.Pool(Constants.DB);

// S3 connection params
const s3 = new AWS.S3(Constants.S3);
const bucket = (Constants.S3_BUCKET);

// Add additional information into logs, such as user_id, order_id or pharmacy_id
let logExtra = '';

const getOrderUser = async (req: express.Request, res: express.Response) => {
    try {
        // Get User ID
        const args = req.query;
        logExtra = `user: ${args.user_id}`;
        // Get Order from User
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_order_user.sql`), 'utf8');
        const results = await query(q, 'select', [args.user_id]);
        res.status(200).json(results);
    } catch (err) {
        console.log('Error at queries.js -> getOrderUser() :');
    }
};

const getOrderItemUser = async (req: express.Request, res: express.Response) => {
    try {
        // Get User ID
        const args = req.query;
        logExtra = `user: ${args.user_id} order: ${args.order_id}`;
        // Get Order from User
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_order_item_user.sql`), 'utf8');
        const results = await query(q, 'select', [args.user_id, args.order_id]);
        res.status(200).json(results);
    } catch (err) {
        console.log('Error at queries.js -> getOrderItemUser() :');
    }
};

const getOrderPharmacy = async (req: express.Request, res: express.Response) => {
    try {
        const args = req.query;
        logExtra = `pharmacy: ${args.pharmacy_id}`;
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_order_pharmacy.sql`), 'utf8');
        const results = await query(q, 'select', [args.pharmacy_id]);
        res.status(200).json(results);
    } catch (err) {
        console.warn('Error on queries.js -> getOrderPharmacy() : ', err);
    }
};

const getOrderItemPharmacy = async (req: express.Request, res: express.Response) => {
    try {
        const args = req.query;
        logExtra = `pharmacy: ${args.pharmacy_id} order: ${args.order_id}`;
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_order_item_pharmacy.sql`), 'utf8');
        const results = await query(q, 'select', [args.pharmacy_id, args.order_id]);
        res.status(200).json(results);
    } catch (err) {
        console.warn('Error on queries.js -> getOrderItemPharmacy() : ', err);
    }
};

// Insert ORDER by previously getting the order ID from PostgreSQL sequence.
// Table is denormalized to enhance performance when inserting/selecting (1 unique table)
const addOrder = async (req: express.Request, res: express.Response) => {
    try {
        const { order, user, total_price } = req.body;
        logExtra = `user: ${user.id} `;

        // Save items with photo in an array, to be sent back to the front-end, from where axios call
        // will be performed at multer routes to save photos in server and send them to S3.
        const result = [];

        if (order && user) {

            const seq: any = await query(`SELECT NEXTVAL('order_order_id_seq');`, 'select', []);
            //const order_id_app = parseInt(seq[0].nextval, 10);
            const order_id_app = seq[0].nextval;
            const order_id = uuidv4();              // RFC-compliant UUID
            const order_status = 1;                 // Status: 1 'Pending'
            const pharmacy_id = user.favPharmacyID;
            const address_id = user.id;
            const creation_date = moment().tz('Europe/Madrid').format('YYYY-MM-DD H:mm:ss');
            const update_date = creation_date;

            logExtra += `order: ${order_id} pharmacy: ${pharmacy_id}`;

            for (let i = 0; i < order.length; i++) {

                // Set parameters to be saved at Order item level
                const order_item = i + 1;
                const item_desc = order[i].item_desc;
                const product_id = order[i].product_id;
                const product_desc = order[i].product_desc;
                const photo_url = order[i].itemPhoto;
                const price = order[i].price;
                const photo_url_db = (photo_url) ? `${order_id}_${order_item}.jpg` : '';
                const args = [
                    order_id,
                    order_item,
                    pharmacy_id,
                    user.id,
                    address_id,
                    order_status,
                    product_id,
                    product_desc,
                    item_desc,
                    photo_url_db,
                    order_id_app,
                    price,
                    total_price,
                    creation_date,
                    update_date
                ];

                // Save Order item into PostgreSQL
                const q = fs.readFileSync(path.join(__dirname, `/../queries/insert/insert_order.sql`), 'utf8');
                await query(q, 'insert', args);

                // Send back Order ID with all Order Items & Photo URLs (a second call from the front-end will be done to AWS S3 to save the photos)
                result.push({
                    order_id: order_id,
                    order_item: order_item,
                    photo_url: photo_url
                })                
            }
            
            // Add Order data into Log table and Order hash into Blockchain
            if (await trace.saveOrderTrace(order_id, user.eth_address)) res.status(201).send(result);
            else res.status(400).send(`Error al confirmar el pedido`);
            
        } else {
            console.log('Warning on queries.js -> addOrder(): Missing fields to complete Order');
            res.status(400).send(`Error al confirmar el pedido`);
        }
    } catch (err) {
        res.status(400).send(`Error al confirmar el pedido`);
        console.log('Error at queries.js -> addOrder(): ', err);
    }
};

const getPrescription = async (req: express.Request, res: express.Response) => {
    try {
        const args = req.query;
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_prescription.sql`), 'utf8');
        const results = await query(q, 'select', [args.ean13]);
        res.status(200).json(results);
    } catch (err) {
        console.log('Error at queries.js -> getPrescription() :', err);
    }
};

const getPharmacy = async (req: express.Request, res: express.Response) => {
    try {
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_pharmacies.sql`), 'utf8');
        const results = await query(q, 'select', []);
        res.status(200).json(results);
    } catch (err) {
        console.log('Error at queries.js -> getPharmacy() :', err);
    }
};

const getPharmacySchedule = async (req: express.Request, res: express.Response) => {
    try {
        const args = req.query;
        logExtra = `pharmacy: ${args.pharmacy_id}`;
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_pharmacy_schedule.sql`), 'utf8');
        const results = await query(q, 'select', [args.pharmacy_id]);
        res.status(200).json(results);
    } catch (err) {
        console.log('Error at queries.js -> getPharmacySchedule() :', err);
    }
};

const getUserPharmacy = async (req: express.Request, res: express.Response) => {
    try {
        const args = req.query;
        logExtra = `user: ${args.user_id}`;
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_user_pharmacy.sql`), 'utf8');
        const results = await query(q, 'select', [args.user_id]);
        res.status(200).json(results);
    } catch (err) {
        console.log('Error at queries.js -> getUserPharmacy() :', err);
    }
};

const setUserPharmacy = async (req: express.Request, res: express.Response) => {
    try {
        const { user_id, pharmacy_id } = req.body;
        logExtra = `user: ${user_id} pharmacy: ${pharmacy_id}`;
        const q = fs.readFileSync(path.join(__dirname, `/../queries/update/update_user_pharmacy.sql`), 'utf8');
        const results = await query(q, 'update', [user_id, pharmacy_id]);
        res.status(201).send(`Pharmacy ${pharmacy_id} assigned successfully`);
    } catch (err) {
        console.log('Error at queries.js -> setUserPharmacy() :', err);
    }
};

const getUserProfile = async (req: express.Request, res: express.Response) => {
    try {
        const args = req.query;
        logExtra = `user: ${args.user_id}`;
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_user_profile.sql`), 'utf8');
        const results = await query(q, 'select', [args.user_id]);
        res.status(200).json(results);
    } catch (err) {
        console.log('Error at queries.js -> getUserProfile() :', err);
    }
}

// Save User's data from Profile screen
const setUserProfile = async (req: express.Request, res: express.Response) => {
    try {
        const { user } = req.body;
        logExtra = `user: ${user.id}`;
        const update_date = moment().tz('Europe/Madrid').format('YYYY-MM-DD H:mm:ss');
        const q = fs.readFileSync(path.join(__dirname, `/../queries/update/update_user_profile.sql`), 'utf8');
        const results = await query(q, 'update',
            [user.id,
            user.name,
            user.gender,
            user.email,
            user.birthday,
            user.phone,
            update_date]);
        if (results === 400) {
            res.status(202).send(`User ${user.id} NOT updated`);
        } else {
            res.status(201).send(`User ${user.id} updated successfully`);
        }
    } catch (err) {
        console.log('Error at queries.js -> setUserPharmacy() :', err);
    }
}

const getPharmacyProfile = async (req: express.Request, res: express.Response) => {
    try {
        const args = req.query;
        logExtra = `pharmacy: ${args.pharmacy_id}`;
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_pharmacy_profile.sql`), 'utf8');
        const results = await query(q, 'select', [args.pharmacy_id]);
        res.status(200).json(results);
    } catch (err) {
        console.log('Error at queries.js -> getPharmacyProfile() :', err);
    }
}

// Save User's data from Profile screen
const setPharmacyProfile = async (req: express.Request, res: express.Response) => {
    try {
        const { pharmacy } = req.body;
        logExtra = `pharmacy: ${pharmacy.id}`;
        const update_date = moment().tz('Europe/Madrid').format('YYYY-MM-DD H:mm:ss');
        const q = fs.readFileSync(path.join(__dirname, `/../queries/update/update_pharmacy_profile.sql`), 'utf8');
        const results = await query(q, 'update', [
            pharmacy.pharmacy_id,
            pharmacy.name,
            pharmacy.phone,
            pharmacy.email,
            update_date]);
        if (results === 400) {
            res.status(202).send(`User ${pharmacy.pharmacy_id} NOT updated`);
        } else {
            res.status(201).send(`User ${pharmacy.pharmacy_id} updated successfully`);
        }
    } catch (err) {
        console.log('Error at queries.js -> setPharmacyProfile() :', err);
    }
}

// Get User's address, where address_id is equivalent to user_id
const getUserAddress = async (req: express.Request, res: express.Response) => {
    try {
        const args = req.query;
        logExtra = `address_id: ${args.address_id}`;
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_user_address.sql`), 'utf8');
        const results = await query(q, 'select', [args.address_id]);
        res.status(200).json(results);
    } catch (err) {
        console.log('Error at queries.js -> getUserAddress() :', err);
    }
}

// Save User's address from Profile screen
const setUserAddress = async (req: express.Request, res: express.Response) => {
    try {

        // Get params
        const { address } = req.body;
        logExtra = `address: ${address.id}`;

        // Check if address already exists
        const q_select = fs.readFileSync(path.join(__dirname, `/../queries/select/select_user_address.sql`), 'utf8');
        const count: any = await query(q_select, 'select', [address.id]);
        const update_date = moment().tz('Europe/Madrid').format('YYYY-MM-DD H:mm:ss');
        let results;

        // Do insert or update depending whether the address exists or not
        if (count.length > 0) {
            // User address exists -> update
            const q = fs.readFileSync(path.join(__dirname, `/../queries/update/update_user_address.sql`), 'utf8');
            results = await query(q, 'update', [
                address.id,
                address.street,
                address.locality,
                address.zipcode,
                address.country,
                update_date]);
        } else {
            // User address does not exist -> insert
            const q = fs.readFileSync(path.join(__dirname, `/../queries/insert/insert_user_address.sql`), 'utf8');
            results = await query(q, 'insert', [
                address.id,
                address.street,
                address.locality,
                address.zipcode,
                address.country,
                update_date]);
        }
        // Send back response
        if (results === 400) {
            res.status(202).send(`Address ${address.id} NOT updated`);
        } else {
            res.status(201).send(`Address ${address.id} updated successfully`);
        }
    } catch (err) {
        res.status(400).send(`Error al guardar domicilio`);
        console.log('Error at queries.js -> setUserAddress() :', err);
    }
}

const checkUserEmail = async (req: express.Request, res: express.Response) => {
    try {
        const args = req.query;
        logExtra = `user_id: ${args.user_id} email: ${args.email}`;
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_check_user_email.sql`), 'utf8');
        const results = await query(q, 'select', [args.email]);
        res.status(200).json(results);
    } catch (err) {
        console.log('Error at queries.js -> checkUserEmail() :', err);
    }
}

const checkPharmacyEmail = async (req: express.Request, res: express.Response) => {
    try {
        const args = req.query;
        logExtra = `pharmacy_id: ${args.pharmacy_id} email: ${args.email}`;
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_check_pharmacy_email.sql`), 'utf8');
        const results = await query(q, 'select', [args.email]);
        res.status(200).json(results);
    } catch (err) {
        console.log('Error at queries.js -> checkPharmacyEmail() :', err);
    }
}

// Get Pharmacy's count on unseen & total chats
const getPharmacyChats = async (req: express.Request, res: express.Response) => {
    try {
        const args = req.query;
        logExtra = `address_id: ${args.pharmacy_id}`;
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_pharmacy_chats.sql`), 'utf8');
        const results = await query(q, 'select', [args.pharmacy_id]);
        res.status(200).json(results);
    } catch (err) {
        console.log('Error at queries.js -> getPharmacyChats() :', err);
    }
}

// Get Pharmacy's count on unseen & total chats
const getPharmacyOrders = async (req: express.Request, res: express.Response) => {
    try {
        const args = req.query;
        logExtra = `address_id: ${args.pharmacy_id}`;
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_pharmacy_orders.sql`), 'utf8');
        const results = await query(q, 'select', [args.pharmacy_id]);
        res.status(200).json(results);
    } catch (err) {
        console.log('Error at queries.js -> getPharmacyOrders() :', err);
    }
}

const getProduct = async (req: express.Request, res: express.Response) => {
    try {
        const args = req.query;
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_product.sql`), 'utf8');
        const results = await query(q, 'select', [args.searchCriteria]);
        res.status(200).json(results);
    } catch (err) {
        console.log('Error at queries.js -> getProduct() :', err);
    }
}

const getProductLast5 = async (req: express.Request, res: express.Response) => {
    try {
        const args = req.query;
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_product_last5.sql`), 'utf8');
        const results = await query(q, 'select', [args.user_id]);
        res.status(200).json(results);
    } catch (err) {
        console.log('Error at queries.js -> getProductLast5() :', err);
    }
}

type Operation = 'insert' | 'update' | 'select' | undefined; 

// Use of 'pool.connect' to be able to rollback same pool of transactions in case of failure
const query = async (q: string, op: Operation, args: any) => {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query(q, args);
            if ((op === 'insert') || (op == 'update')) { await client.query('COMMIT') }
            return result.rows;
        } catch (err) {
            if ((op === 'insert') || (op == 'update')) { await client.query('ROLLBACK') }
            console.log('Error at queries.js -> query(): ', err, q);
            return 400;
        } finally {
            client.release();
        }
    } catch (err) {
        console.log('Error at queries.js -> query() with pool.connect(): ', err);
    }
};

module.exports = {
    getOrderUser,
    getOrderItemUser,
    getOrderPharmacy,
    getOrderItemPharmacy,
    addOrder,
    getPrescription,
    getPharmacy,
    getPharmacySchedule,
    getUserPharmacy,
    setUserPharmacy,
    getUserAddress,
    setUserAddress,
    getUserProfile,
    setUserProfile,
    getPharmacyProfile,
    setPharmacyProfile,
    checkUserEmail,
    checkPharmacyEmail,
    getPharmacyChats,
    getPharmacyOrders,
    getProduct,
    getProductLast5,
    query,
};

