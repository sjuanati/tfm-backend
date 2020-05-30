// Libs
const pg = require('pg');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const env = require('../Environment');
const Cons = require((env() === 'PROD') ? '/home/ubuntu/.ssh/Constants' : '../Constants');
const logRecorder = require('../shared/logRecorder');

// DB connection settings
const pool = new pg.Pool(Cons.DB_CONFIG);


const getOrder = async (req, res) => {
    try {
        const results = await query('select * from public.order', 'select');
        res.status(200).json(results);
    } catch (err) {
        console.log('Error at queries.js -> getOrder() :');
    }
};

// Insert ORDER by previously getting the order ID from PostgreSQL sequence.
// Table is denormalized to enhance performance when inserting/selecting (1 unique table)
const addOrder = async (req, res) => {
    try {
        const seq = await query(`SELECT NEXTVAL('order_order_id_seq');`, 'select');

        logRecorder('LOG', 1, 'Testing');
        console.log('HIIIIII');
        
        const { order, pharmacy, user } = req.body;
        console.log('order : ', order)
        console.log('pharma : ', pharmacy)
        console.log('user : ', user)

        if ((order.length > 0) && (pharmacy.length > 0)) {

            const pharmacy_id = pharmacy[0].favPharmacyID;
            const user_id = 1;      //TODO
            const address_id = 5;   //TODO
            const status = 1;       //TODO
            const creation_date = moment().format('YYYY-MM-DD H:mm:ss');
            const update_date = creation_date;

            for (let i = 0; i < order.length; i++) {

                const order_id = parseInt(seq[0].nextval, 10);
                const order_item = i + 1;
                const item_desc = order[i].itemDescription;
                const photo = order[i].itemPhoto;
                const args = [order_id,
                    order_item,
                    pharmacy_id,
                    user_id,
                    address_id,
                    status,
                    item_desc,
                    photo,
                    creation_date,
                    update_date];
                const q = fs.readFileSync(path.join(__dirname, `/../queries/insert/insert_order.sql`), 'utf8');
                await query(q, 'insert', args);
            }
            res.status(201).send(`Order added successfully`);
        } else {
            console.log('Warning on queries.js -> addOrder(): Missing fields to complete Order');
            res.status(400).send(`Error al confirmar el pedido`);
        }
    } catch (err) {
        res.status(400).send(`Error al confirmar el pedido`);
        console.log('Error at queries.js -> addOrder(): ', err);
    }
};

const getPharmacy = async (req, res) => {
    try {
        const results = await query('select * from public.pharmacy', 'select');
        res.status(200).json(results);
    } catch (err) {
        console.log('Error at queries.js -> getPharmacy() :', err);
        res.status(400).json({error: 'Error at getPharmacy()'});
    }
};

const getPharmacySchedule = async (req, res) => {
    try {
        const args = req.query;
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_pharmacy_schedule.sql`), 'utf8');
        const results = await query(q, 'select', [args.pharmacy_id]);
        res.status(200).json(results);
    } catch (err) {
        console.log('Error at queries.js -> getPharmacySchedule() :', err);
    }
};

const getUserPharmacy = async (req, res) => {
    try {
        const args = req.query;
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_user_pharmacy.sql`), 'utf8');
        const results = await query(q, 'select', [args.user_id]);
        res.status(200).json(results);
    } catch (err) {
        console.log('Error at queries.js -> getUserPharmacy() :', err);
        res.status(400).json({error: 'Error at getUserPharmacy()'});
    }
};

const setUserPharmacy = async (req, res) => {
    try {
        console.log('body: ', req.body)
        const { user_id, pharmacy_id } = req.body;
        const q = fs.readFileSync(path.join(__dirname, `/../queries/update/update_user_pharmacy.sql`), 'utf8');
        const results = await query(q, 'update', [user_id, pharmacy_id]);
        console.log(results)
        res.status(201).send(`Last Pharmacy updated successfully`);
    } catch (err) {
        console.log('Error at queries.js -> setUserPharmacy() :', err);
        res.status(400).json({error: 'Error at setUserPharmacy()'});
    }
};

// Use of 'pool.connect' to be able to rollback same pool of transactions in case of failure
const query = async (q, op, args) => {
    try {
        const client = await pool.connect();
        try {
            //console.log(q, ' args:',args)
            const result = await client.query(q, args);
            if ((op === 'insert') || (op == 'update')) { await client.query('COMMIT') }
            return result.rows;
        } catch (err) {
            if ((op === 'insert') || (op == 'update')) { await client.query('ROLLBACK') }
            console.log('Error at queries.js -> query(): ', err);
        } finally {
            client.release();
        }
    } catch (err) {
        console.log('Error at queries.js -> query() with pool.connect(): ', err);
    }
};

module.exports = {
    getOrder,
    addOrder,
    getPharmacy,
    getPharmacySchedule,
    getUserPharmacy,
    setUserPharmacy,
};

