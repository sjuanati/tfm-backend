const fs = require('fs');
const path = require('path');
const Web3 = require('web3');
const crypto = require('crypto');
const moment = require('moment');
const tz = require('moment-timezone');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../shared/query');

const env = require('../Environment');
const Cons = require((env() === 'AWS') ? '/home/ubuntu/.ssh/Constants' : '../Constants');

let hashOrderID = '';
let hashOrderValue = '';

// Blockchain settings (Ganache)
const web3 = new Web3(Cons.BLOCKCHAIN.URL_HTTP);
const web3ws = new Web3(Cons.BLOCKCHAIN.URL_WS);
const ABI_DATA = fs.readFileSync(path.join(__dirname, `/../contracts/OrderTrace.abi`), 'utf8');
const Contract = new web3.eth.Contract(JSON.parse(ABI_DATA));
const ContractWS = new web3ws.eth.Contract(JSON.parse(ABI_DATA), Cons.BLOCKCHAIN.hashContractAddress);
Contract.options.address = Cons.BLOCKCHAIN.hashContractAddress;
// TODO: capture error if wrong address


const generateHashOrderID = (order_id) => {
    return (
        '0x' + crypto
            .createHash('sha256')
            .update(
                order_id
            )
            .digest('hex')
    );
}

const generateHashOrderValues = (params) => {
    return (
        '0x' + crypto
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
        .digest('hex')
    );
}

/**
 * @dev This function is called every time an Order is created or updated
 * 1) Gets Order data from the DB with the latest status
 * 2) Creates two arrays (order items and products) to save them into array fields in the DB (table <order_trace>)
 * 3) Calls two functions in order to save all data in the DB (table <order_trace>) and Blockchain (through logs)
 * Returns a boolean value indicating whether the operation succeeded.
 * @param order_id ID of created/updated Order
 */
const saveOrderTrace = async (order_id) => {

    // Get Order data from the DB
    const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_order.sql`), 'utf8');
    const res = await query(q, 'select', [order_id]);

    // If Order is found in DB, build two arrays (order items & product id's) to be saved into array fields 
    // in table <order_trace> (fields order_items & product_ids)
    let order_items = [];
    let product_ids = [];
    if (res && res !== 400) {
        for (let i = 0; i < res.length; i++) {
            order_items.push(res[i].order_item);
            product_ids.push(res[i].product_id || 0);
        }
    }

    // Build Order data structure to be saved into table <order_trace>
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

    // Return true if Order data was successfully saved into the DB
    return (await saveOrderTraceDB(params)) ? true : false;
}

/**
 * @dev Saves Order data into the DB (table order_trace)
 * 1) Generates a hash on the Order ID to be used afterwards in the Blockchain as indexed identifier
 * 2) Generates a hash on a set of relevant Order data to be used afterwards as integrity check
 * 3) Saves Order data (including the hash on the Order data) into the DB (table order_trace)
 * Returns a boolean value indicating whether the operation succeeded.
 * @param order_id ID of created/updated Order
 */
const saveOrderTraceDB = (params) => {
    return new Promise(async (resolve) => {

        try {

            // Generate a hash on the Order ID (hashOrderID)
            hashOrderID = generateHashOrderID(params.order_id);

            // Generate a hash on a set of relevant Order data (hashOrderValue)
            hashOrderValue = generateHashOrderValues(params);

            // Save Order data into the DB
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
                hashOrderValue,
                params.update_date,
            ]);

            // Save hash on Order ID and Order vales in Ethereum asynchronously
            saveOrderTraceEth(params.trace_id);

            // Return true if Order data was successfully saved into the DB
            (res !== 400) ? resolve(true) : resolve(false);

        } catch (err) {
            console.log('Error in ethOrderTrace.js -> saveOrderTraceDB(): ', err);
            resolve(false);
        }
    })
}

/**
 * @dev Calls method 'saveHash' from contract <Hash> and saves the hashOrderID and hashOrderValue in the Blockchain as logs
 * Returns true if the log was successfully emitted in the Blockchain and the output was successfully saved into the DB
 * @param trace_id ID for the record to be saved into the DB (table <order_trace)
 */
const saveOrderTraceEth = (log_id) => {

    // Call 'Hash' contract to emmit the hashes for Order ID and Order values
    Contract.methods.saveHash(hashOrderID, hashOrderValue).send({ from: Cons.BLOCKCHAIN.appOwnerAddress })
        .then(async res => {

            // Save returned tx hash & block number from Ethereum into the DB (table order_trace)
            const txhash = res.transactionHash;
            const blockNumber = res.blockNumber;
            const q = fs.readFileSync(path.join(__dirname, `/../queries/update/update_order_trace.sql`), 'utf8');
            const update_date = moment().tz('Europe/Madrid').format('YYYY-MM-DD H:mm:ss');
            /*const resDB = */ await query(q, 'update', [
                log_id,
                txhash,
                blockNumber,
                update_date,
            ]);

            // Show results in console
            console.log('Result: ', res);
            console.log('Events: ', res.events.SaveHash.returnValues);

            // TODO: manage if error when saving into DB
            // if (resDB !== 400) resolve(true);
            // else resolve(false);
        })
        .catch(err => {
            console.log('Error in ethOrderTrace.js -> saveOrderTraceEth(): ', err);
        });
}

/**
 * @dev Parses error message and returns a 'more human' error description
 * Returns a description of the error message
 * @param err Error string provided by the System
 */
const decodeError = (err) => {

    err = err.toLowerCase();
    if (err.includes('invalid arrayify value'))
        return 'Invalid hash';
    else if ((err.includes('invalid json rpc response')) || (err.includes('connection not open on send')))
        return 'No connection to Blockchain';
    else if (err.includes('hash not found'))
        return 'Hash mismatch'
    else if (err.includes('incorrect data length'))
        return 'Incorrect data length'
    else
        return 'Unrecognized error';

}

/**
 * @dev Given an Order, it recreates the hash on the Order ID and Order values for every Order change stored in 
 * the DB (table <order_trace), and calls function 'getOrderTraceEth' to compare these values with the ones 
 * stored in the Blockchain
 * Returns true if hashes match
 * @param req Input parameters received from the Front-End: Order ID
 * @param res Output parameters to be sent to the Front-End: Order ID hash, Order values hash, Transaction hash, Block number
 */
const getOrderTraceDB = async (req, res) => {
    try {
        
        // Get Order data from the DB (table order_trace)
        const args = req.query;
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_order_trace.sql`), 'utf8');
        const resDB = await query(q, 'select', [args.order_id]);

        if (resDB && resDB !== 400) {

            hashOrderID = generateHashOrderID(args.order_id);

             // For every Order change stored in table <order_trace>, compare the Order data value vs. the one stored in the Blockchain
            for (let i = 0; i < resDB.length; i++) {

                hashOrderValue = generateHashOrderValues(resDB[i]);

                const params = {
                    orderID_hash: hashOrderID,
                    //orderValue_hash: resDB[i].db_hash,
                    orderValue_hash: hashOrderValue,
                    tx_hash: resDB[i].tx_hash,
                    block_number: resDB[i].block_number,
                }

                if (params.tx_hash && params.block_number) {
                    const { result, error } = await getOrderTraceEth(params);
                    resDB[i].error = decodeError(String(error));
                    result ? resDB[i].checksum = 'OK' : resDB[i].checksum = 'NOK';
                } else {
                    resDB[i].checksum = 'PENDING';
                }

                console.log('item ', i, ' -> ', resDB[i]);
            }
        }

        res.status(200).json(resDB);
    } catch (err) {
        console.log('Error at ethOrderTrace.js -> getOrderTraceDB() :', err);
    }
}

// 
/**
 * @dev Check if an Order ID hash and Order values hash is stored in the Blockchain logs
 * Returns true if Order ID hash and Order values hash are found
 * @param params.orderID_hash       Filter value (Order ID hash)
 * @param params.orderValue_hash    Filter value (Order values hash)
 * @param params.tx_hash            Transaction hash where the data was stored in the Blockchain logs
 * @param params.block_number       Block number where the data was stored in the Blockchain logs
 * 
 */
const getOrderTraceEth = (params) => {
    return new Promise(async (resolve) => {

        try {
            ContractWS.getPastEvents('SaveHash', {
                filter: {
                    _orderID: params.orderID_hash,
                    _orderValue: params.orderValue_hash,
                },
                fromBlock: params.block_number,
                toBlock: params.block_number,
                transactionHash: params.tx_hash,
            })
                .then(events => {
                    console.log('Events: ', events);
                    (events.length > 0)
                        ? resolve({ result: true, error: null })
                        : resolve({ result: false, error: 'Hash not found' });
                })
                .catch(err => {
                    console.log('Error in ethOrderTrace.js (A) -> getOrderTraceEth()', err);
                    resolve({ result: false, error: err });
                });

        } catch (err) {
            console.log('Error in ethOrderTrace.js (B) -> getOrderTraceEth(): ', err, err.response);
            resolve({ result: false, error: err });
        };
    })
}


const checkGlobalOrderTrace = async (req, res) => {
    try {
        const args = req.query;
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_order_trace.sql`), 'utf8');
        const resDB = await query(q, 'select', [args.order_id]);
        let outcome = 'OK';

        hashOrderID = generateHashOrderID(args.order_id);

        for (let i = 0; i < resDB.length; i++) {

            hashOrderValue = generateHashOrderValues(resDB[i]);

            const params = {
                orderID_hash: hashOrderID,
                orderValue_hash: hashOrderValue,
                tx_hash: resDB[i].tx_hash,
                block_number: resDB[i].block_number,
            }
            
            if (params.tx_hash && params.block_number) {
                const { error } = await getOrderTraceEth(params);
                if (error) outcome = 'NOK';
            } else {
                outcome = 'PENDING';
            }
        }

        res.status(200).json(outcome);

    } catch (err) {
        console.log('Error in ethOrderTrace.js (B) -> checkGlobalOrderTrace(): ', err);
    }
}


module.exports = {
    saveOrderTrace,
    getOrderTraceDB,
    checkGlobalOrderTrace,
}
