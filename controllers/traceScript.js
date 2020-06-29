// Libraries
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const tz = require('moment-timezone');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../shared/query');
const eth = require('../controllers/ethereumScript');
let hash = '';

const saveOrderTrace = async (order_id) => {

    let order_items = [];
    let product_ids = [];

    // Get Order from DB
    const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_order.sql`), 'utf8');
    const res = await query(q, 'select', [order_id]);

    // If Order is found in DB
    if (res && res !== 400) {

        // Get Order items
        for (let i = 0; i < res.length; i++) {

            order_items.push(res[i].order_item);
            product_ids.push(res[i].product_id || 0);
        }
    }

    // Build Order data structure to be saved into the Trace table
    const params = {
        trace_id: uuidv4(),
        order_id: res[0].order_id,
        order_id_app: res[0].order_id_app,
        order_status: res[0].status,
        order_date: moment(res[0].update_date, 'YYYY-MM-DD H:mm:ss').unix(),
        pharmacy_id: res[0].pharmacy_id,
        user_id: res[0].user_id,
        order_items: order_items,
        product_ids: product_ids,
        update_date: res[0].update_date,
    }

    // Save Order data into DB and save Order hash into Blockchain
    return (await saveOrderTraceDB(params) && await eth.saveOrderTraceEth(hash, params.trace_id)) ? true : false;
}

// Save Order data into trace table (DB)
const saveOrderTraceDB = (params) => {
    return new Promise(async (resolve, reject) => {

        try {

            // Create hash on log record
            hash = crypto
                .createHash('sha256')
                .update(
                    params.trace_id +
                    params.order_id +
                    params.order_id_app +
                    params.order_status +
                    params.order_date +
                    params.pharmacy_id +
                    params.user_id +
                    params.order_items.join('') +
                    params.product_ids.join(''))
                .digest('hex');

            // Save Order data into DB including its hash
            const q = fs.readFileSync(path.join(__dirname, `/../queries/insert/insert_order_trace.sql`), 'utf8');
            const res = await query(q, 'insert', [
                params.trace_id,
                params.order_id,
                params.order_id_app,
                params.order_status,
                params.order_date,
                params.pharmacy_id,
                params.user_id,
                params.order_items,
                params.product_ids,
                hash,
                params.update_date,
            ]);

            // If insert into DB successful, return 'true' to go ahead
            if (res !== 400) resolve(true);
            else reject(false);

        } catch (err) {
            console.log('Error in traceScript.js -> saveOrderTraceDB(): ', err);
            reject(false);
        }
    })
}

const getOrderTraceDB = async (req, res) => {
    try {
        const args = req.query;

        // Get Order Trace from DB
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_order_trace.sql`), 'utf8');
        const resDB = await query(q, 'select', [args.order_id]);
        
        // Check DB Hash vs. Ethereum Hash for data integrity
        if (resDB && resDB !== 400) {
            for (let i=0; i<resDB.length; i++) {
                console.log('item ',i,' -> ', resDB[i]);
                if (await eth.getOrderTraceEth('0x' + resDB[i].db_hash)) {
                    resDB[i].checksum = true;
                    console.log('OK');
                } else {
                    resDB[i].checksum = false;
                    console.log('NOK');
                }
            }
        }
console.log('Returned value: ', resDB);
        res.status(200).json(resDB);
    } catch (err) {
        console.log('Error at traceScript.js -> getOrderTraceDB() :', err);
    }
}

module.exports = {
    saveOrderTrace,
    saveOrderTraceDB,
    getOrderTraceDB,
}
