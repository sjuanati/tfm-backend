// Libraries
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const tz = require('moment-timezone');
const Web3 = require('web3');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../shared/query');
const env = require('../Environment');

const Cons = require((env() === 'AWS') ? '/home/ubuntu/.ssh/Constants' : '../Constants');

let hashOrderID = '';
let hashOrderValue = '';

// Blockchain settings (Ganache)
const web3 = new Web3(Cons.BLOCKCHAIN.URL_HTTP);
const web3ws = new Web3(Cons.BLOCKCHAIN.URL_WS);
const ABI_DATA = fs.readFileSync(path.join(__dirname, `/../contracts/Hash4.abi`), 'utf8');
const HashContract = new web3.eth.Contract(JSON.parse(ABI_DATA));
const HashContractWS = new web3ws.eth.Contract(JSON.parse(ABI_DATA), Cons.BLOCKCHAIN.hashContractAddress);
HashContract.options.address = Cons.BLOCKCHAIN.hashContractAddress;
// TODO: capture error if wrong address


const saveOrderTrace = async (order_id) => {

    // Get Order from DB
    const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_order.sql`), 'utf8');
    const res = await query(q, 'select', [order_id]);

    // If Order is found in DB, build two arrays (order items & product id's) to be added in the Order data structure
    let order_items = [];
    let product_ids = [];
    if (res && res !== 400) {
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
    return (await saveOrderTraceDB(params) && await saveOrderTraceEth(hashOrderID, hashOrderValue, params.trace_id)) ? true : false;
}

const decodeError = (err) => {

    // Parses error and returns a 'more human' error description
    err = err.toLowerCase();
    if (err.includes('invalid arrayify value'))
        return 'Invalid hash';
    else if (err.includes('invalid json rpc response'))
        return 'No connection to Blockchain';
    else if (err.includes('connection not open on send'))
        return 'Blockchain unavailable at Order creation/update';
    else if (err.includes('hash not found'))
        return 'Hash mismatch'
    else if (err.includes('incorrect data length'))
        return 'Incorrect data length'
    else
        return 'Unrecognized error';

}

// Save Order data into trace table (DB)
const saveOrderTraceDB = (params) => {
    return new Promise(async (resolve) => {

        try {

            hashOrderID = '0x' + crypto
                .createHash('sha256')
                .update(
                    params.order_id
                )
                .digest('hex');

            // Create hash on log record
            hashOrderValue = '0x' + crypto
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
                hashOrderValue,
                params.update_date,
            ]);

            // If insert into DB is successful, return 'true' to go ahead
            (res !== 400) ? resolve(true) : resolve(false);

        } catch (err) {
            console.log('Error in ethOrderTrace.js -> saveOrderTraceDB(): ', err);
            resolve(false);
        }
    })
}

// Save Order hash into Ethereum and save returned Tx hash into the DB
const saveOrderTraceEth = (hashOrderID, hashOrderValue, log_id) => {
    return new Promise(async (resolve) => {

        // Save Order hash into Ethereum within the Hash Contract
        HashContract.methods.saveHash(hashOrderID, hashOrderValue).send({ from: Cons.BLOCKCHAIN.appOwnerAddress })
            .then(async res => {

                // Save returned tx hash & block number from Ethereum into DB
                const txhash = res.transactionHash;
                const blockNumber = res.blockNumber;

                const q = fs.readFileSync(path.join(__dirname, `/../queries/update/update_order_trace.sql`), 'utf8');
                const update_date = moment().tz('Europe/Madrid').format('YYYY-MM-DD H:mm:ss');
                const resDB = await query(q, 'update', [
                    log_id,
                    txhash,
                    blockNumber,
                    update_date,
                ]);

                console.log('Result: ', res);
                console.log('Events: ', res.events.SaveHash.returnValues);

                if (resDB !== 400) resolve(true);
                else resolve(false);
            })
            .catch(err => {
                console.log('Error in ethOrderTrace.js -> saveOrderTraceEth(): ', err);
                resolve(false);
            });
    })
}

const getOrderTraceDB = async (req, res) => {
    try {
        const args = req.query;

        // Get Order Trace from DB
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_order_trace.sql`), 'utf8');
        const resDB = await query(q, 'select', [args.order_id]);

        //TODO: Optionally re-build the hash through the order data stored in the DB, instead of getting the hash directly from the DB

        // *** REWRITE!! *** Check DB Hash vs. Ethereum Hash for Order data integrity (check every order status change)
        if (resDB && resDB !== 400) {

            hashOrderID = '0x' + crypto
                .createHash('sha256')
                .update(
                    args.order_id
                )
                .digest('hex');

            for (let i = 0; i < resDB.length; i++) {
                const params = {
                    orderID_hash: hashOrderID,
                    tx_hash: resDB[i].tx_hash,
                    orderValue_hash: resDB[i].db_hash,
                    block_number: resDB[i].block_number,
                }
                console.log('item ', i, ' -> ', resDB[i]);
                const { result, error } = await getOrderTraceEth(params);
                resDB[i].error = decodeError(String(error));
                result ? resDB[i].checksum = true : resDB[i].checksum = false;
            }
        }

        res.status(200).json(resDB);
    } catch (err) {
        console.log('Error at ethOrderTrace.js -> getOrderTraceDB() :', err);
    }
}

// Retrieve Order hash from Ethereum
const getOrderTraceEth = (params) => {
    return new Promise(async (resolve) => {

        try {
            HashContractWS.getPastEvents('SaveHash', {
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
                        : resolve({ result: false, error: 'Hash not found'});
                })
                .catch(err => {
                    console.log('Error in ethOrderTrace.js -> getOrderTraceEth()', err);
                    resolve({ result: false, error: err });
                });

        } catch (err) {
            console.log('Error in ethOrderTrace.js -> getOrderTraceEth(): ', err);
            console.log('Error response: ', err.response);
            resolve({ result: false, error: err });
        };
    })
}


// const getOrderTraceEth = (hash) => {
//     return new Promise(async (resolve) => {
//         try {
//             HashContract.methods.getHash(hash).call()
//                 .then(res => {
//                     if (res && (res[0] === NULL_ADDRESS || res[1] === NULL_DATE)) {
//                         console.log('No hash found', res);
//                         resolve({
//                             result: false,
//                             error: 'Hash not found'
//                         });
//                     } else {
//                         console.log('Hash found: ', res);
//                         resolve({
//                             result: true,
//                             error: null
//                         })
//                     }
//                 })
//                 .catch(err => {
//                     console.log('Error in ethOrderTrace.js -> getOrderTraceEth(): ', err);
//                     console.log('Error response: ', err.response);
//                     resolve({
//                         result: false,
//                         error: err
//                     });
//                 });
//         } catch (err) { 
//             console.log('Error in ethOrderTrace.js -> getOrderTraceEth(): ', err);
//             console.log('Error response: ', err.response);
//             resolve({
//                 result: false,
//                 error: err
//             });
//         };
//     })

// }


module.exports = {
    saveOrderTrace,
    saveOrderTraceDB,
    getOrderTraceDB,
    //saveOrderTraceEth,
    //getOrderTraceEth,
}
