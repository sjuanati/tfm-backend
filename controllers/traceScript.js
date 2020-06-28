// Libraries
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const tz = require('moment-timezone');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../shared/query');
const eth = require('../controllers/ethereumScript');

// Global variables
let trace_id = '';
let hash = '';

const saveOrderTrace = async (order_id) => {

    // Get Order from DB
    const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_order.sql`), 'utf8');
    const res = await query(q, 'select', [order_id]);

    // If Order is found in DB
    if (res && res !== 400) {

        // Save each Order item into the Order Trace table
        for (let i = 0; i < res.length; i++) {

            // Set parameters to be sent to saveOrderTrace function
            const params = {
                order_id: res[i].order_id,
                order_id_app: res[i].order_id_app,
                order_item: res[i].order_item,
                order_status: res[i].status,
                order_date: moment(res[i].update_date, 'YYYY-MM-DD H:mm:ss').unix(),
                //order_date: res[i].update_date,
                pharmacy_id: res[i].pharmacy_id,
                user_id: res[i].user_id,
                product_id: res[i].pack_id,
                update_date: res[i].update_date,
            }

            // Add Order item into Order Trace table (DB) and save hash into Contract (Blockchain)
            //if (!(await saveOrderTraceDB(params)) || !(await eth.saveOrderTraceEth(hash, trace_id))) return false;
            if (await saveOrderTraceDB(params)) {
                if (!await eth.saveOrderTraceEth(hash, trace_id)) return false
            } else return false;

        }
    } else return false;

    return true;
}

// Save Order data into trace table (DB)
const saveOrderTraceDB = (params) => {
    return new Promise(async (resolve, reject) => {

        try {
            // Generate GUID for log record
            trace_id = uuidv4();

            // Create hash on log record
            hash = crypto
                .createHash('sha256')
                .update(
                    trace_id ||
                    params.order_id ||
                    params.order_item ||
                    params.order_status ||
                    params.order_date ||
                    params.pharmacy_id ||
                    params.user_id ||
                    params.product_id)
                .digest('hex');

            // Save Order data into DB including its hash
            const q = fs.readFileSync(path.join(__dirname, `/../queries/insert/insert_order_trace.sql`), 'utf8');
            const res = await query(q, 'insert', [
                trace_id,
                params.order_id,
                params.order_id_app,
                params.order_item,
                params.order_status,
                params.order_date,
                params.pharmacy_id,
                params.user_id,
                params.product_id,
                hash,
                params.update_date,
            ]);

            console.log('res:', res);

            // If insert into DB successful, return 'true' to go ahead
            if (res !== 400) resolve(true);
            else reject(false);

        } catch (err) {
            console.log('Error on ethereumScript.js: ', err);
            reject(false);
        }
    })
}

const getOrderTraceDB = async (req, res) => {
    try {
        const args = req.query;

        // Get Order Trace from DB
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_order_txhash.sql`), 'utf8');
        const resDB = await query(q, 'select', [args.order_id]);
        console.log('Resssss: ', resDB);
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
