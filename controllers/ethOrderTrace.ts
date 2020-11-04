//import express = require('express');
import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';
const Web3 = require('web3');
const crypto = require('crypto');
const moment = require('moment');
const tz = require('moment-timezone');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../shared/query');
const { earnTokensOnPurchase } = require('./ethPCToken');
const { executeTX } = require('./ethUtils');

const env = require('../Environment');
const Cons = require((env() === 'AWS') ? '/home/ubuntu/.ssh/Constants' : '../Constants');

let hashOrderID = '';
let hashOrderValue = '';
interface OrderInput {
        trace_id: string,
        order_id: string,
        order_id_app: number,
        order_status: number,
        order_date: string,
        pharmacy_id: number,
        user_id: number,
        order_items: number[],
        product_ids: number[],
        update_date: Date,
        total_price: number,
        eth_address: string,
}
interface OrderOutput {
    orderID_hash: string,
    orderValue_hash: string,
    tx_hash: string
    block_number: number
}

// Blockchain settings
const OPTIONS = {
    defaultBlock: "latest",
    transactionConfirmationBlocks: 1,
    transactionBlockTimeout: 5
};
const web3 = new Web3(Cons.BLOCKCHAIN.URL_HTTP, null, OPTIONS);
const web3ws = new Web3(Cons.BLOCKCHAIN.URL_WS);
const ABI_DATA = fs.readFileSync(path.join(__dirname, `/../contracts/Trace/OrderTrace.abi`), 'utf8');
const Contract = new web3.eth.Contract(JSON.parse(ABI_DATA));
const ContractWS = new web3ws.eth.Contract(JSON.parse(ABI_DATA), Cons.BLOCKCHAIN.hashContractAddress);
Contract.options.address = Cons.BLOCKCHAIN.hashContractAddress;
// TODO: capture error if wrong address

/**
 * @dev Calculates the hash (SHA256) of the Order ID
 * Returns the Order ID hash
 * @param order_id ID of the target Order
 */
const generateHashOrderID = (order_id: string) => {
    return (
        '0x' + crypto
            .createHash('sha256')
            .update(
                order_id
            )
            .digest('hex')
    );
}

/**
 * @dev Calculates the hash (SHA256) of the Order values
 * @returns Order values hash
 * @param params Order values to calculate the hash (trace_id, order_id, order_date, etc)
 */
const generateHashOrderValues = (params: OrderInput) => {
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
 * @returns a boolean value indicating whether the operation succeeded.
 * @param order_id ID of created/updated Order
 */
const saveOrderTrace = async (order_id: string, eth_address: string) => {

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
        total_price: res[0].total_price,
        eth_address: eth_address,
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
const saveOrderTraceDB = (params: OrderInput) => {
    return new Promise<boolean>(async (resolve) => {
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

            // If Order data is successfully saved, call SaveOrderTraceEth asynchronously and return true
            if (res !== 400) {
                saveOrderTraceEth(
                    params.trace_id,
                    params.eth_address,
                    params.total_price,
                    params.order_status);
                resolve(true);
            } else {
                resolve(false);
            }

        } catch (err) {
            console.log('Error in ethOrderTrace.js -> saveOrderTraceDB(): ', err);
            resolve(false);
        }
    })
}

/**
 * @dev Calls method 'saveHash' from contract <OrderTrace> and saves the hashOrderID and hashOrderValue in the Blockchain as logs
 * @returns true if the log was successfully emitted in the Blockchain and the output was successfully saved into the DB
 * @param trace_id ID for the record to be saved into the DB (table <order_trace)
 */
const saveOrderTraceEth = async (log_id: string, eth_address: string, total_price: number, order_status: number) => {

    const params = {
        encodedABI: Contract.methods.saveHash(hashOrderID, hashOrderValue).encodeABI(),
        fromAddress: Cons.BLOCKCHAIN.appOwnerAddress,
        fromAddressKey: Cons.BLOCKCHAIN.appOwnerKey,
        contractAddress: Cons.BLOCKCHAIN.hashContractAddress,
    };

    const { result, error, output } = await executeTX(params);

    if (result) {
        // Save returned tx hash & block number from Ethereum into the DB (table order_trace)
        const q = fs.readFileSync(path.join(__dirname, `/../queries/update/update_order_trace.sql`), 'utf8');
        const update_date = moment().tz('Europe/Madrid').format('YYYY-MM-DD H:mm:ss');
        await query(q, 'update', [
            log_id,
            output.transactionHash,
            output.blockNumber,
            update_date,
        ]);
        console.log('Resultat: ', output);

        // Earn tokens for the purchase of Products
        if (order_status === 1) earnTokensOnPurchase('0x866863Adc9732995926Eb7CDa0e811e0e3FE419A', eth_address, total_price);
    } else {
        console.log('Errorin :', error);
    };
};


/**
 * @dev Parses error message and returns a 'more human' error description
 * @returns a description of the error message
 * @param err Error string provided by the System
 */
const decodeError = (err: string) => {

    err = err.toLowerCase();
    if (err.includes('invalid arrayify value'))
        return 'Invalid hash';
    else if ((err.includes('invalid json rpc response')) || (err.includes('connection not open on send')))
        return 'No connection to Blockchain';
    else if (err.includes('hash not found'))
        return 'Hash not found'
    else if (err.includes('incorrect data length'))
        return 'Incorrect data length'
    else
        return 'Unrecognized error';

};

/**
 * @dev Given an Order, it recreates the hash on the Order ID and Order values for every Order change stored in 
 * the DB (table <order_trace), and calls function 'getOrderTraceEth' to compare these values with the ones 
 * stored in the Blockchain
 * @returns true if hashes match
 * @param req Input parameters received from the Front-End: Order ID
 * @param res Output parameters to be sent to the Front-End: Order ID hash, Order values hash, Transaction hash, Block number
 */
const getOrderTraceDB = async (req: express.Request, res: express.Response) => {
    try {

        // Get Order data from the DB (table order_trace)
        const args = req.query;
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_order_trace.sql`), 'utf8');
        const resDB = await query(q, 'select', [args.order_id]);

        if (resDB && resDB !== 400) {
            console.log('args:', args);
            hashOrderID = generateHashOrderID(String(args.order_id));

            // For every Order change stored in table <order_trace>, compare the Order data value vs. the one stored in the Blockchain
            for (let i = 0; i < resDB.length; i++) {

                hashOrderValue = generateHashOrderValues(resDB[i]);

                const params = {
                    orderID_hash: hashOrderID,
                    orderValue_hash: hashOrderValue,  // resDB[i].db_hash,
                    tx_hash: resDB[i].tx_hash,
                    block_number: resDB[i].block_number,
                };

                if (params.tx_hash && params.block_number) {
                    const { result, error } = await getOrderTraceEth(params);
                    resDB[i].error = decodeError(String(error));
                    result ? resDB[i].checksum = 'OK' : resDB[i].checksum = 'NOK';
                } else {
                    resDB[i].checksum = 'PENDING';
                };

                console.log('item ', i, ' -> ', resDB[i]);
            };
        };

        res.status(200).json(resDB);
    } catch (err) {
        console.log('Error at ethOrderTrace.js -> getOrderTraceDB() :', err);
    };
};

/**
 * @dev Check if an Order ID hash and Order values hash is stored in the Blockchain logs
 * @returns true if Order ID hash and Order values hash are found
 * @param params.orderID_hash       Filter value (Order ID hash)
 * @param params.orderValue_hash    Filter value (Order values hash)
 * @param params.tx_hash            Transaction hash where the data was stored in the Blockchain logs
 * @param params.block_number       Block number where the data was stored in the Blockchain logs
 * 
 */
const getOrderTraceEth = (params: OrderOutput) => {
    return new Promise<{ result: boolean, error: string }>(async (resolve) => {

        try {
            ContractWS.getPastEvents('SaveHash', {
                filter: {
                    _orderID: params.orderID_hash,
                    _orderValue: params.orderValue_hash,
                },
                fromBlock: params.block_number,
                transactionHash: params.tx_hash,
            })
                .then((events: any) => {
                    console.log('Events: ', events);
                    (events.length > 0)
                        ? resolve({ result: true, error: '' })
                        : resolve({ result: false, error: 'Hash not found' });
                })
                .catch((err: string) => {
                    console.log('Error in ethOrderTrace.js (A) -> getOrderTraceEth()', err);
                    resolve({ result: false, error: err });
                });

        } catch (err) {
            console.log('Error in ethOrderTrace.js (B) -> getOrderTraceEth(): ', err, err.response);
            resolve({ result: false, error: err });
        };
    })
}

/**
 * @dev Checks global trace status of a given Order:
 * Status 'OK': all Order items are validated in the Blockchain
 * Status 'NOK': at least one of the Order items can't be validated in the Blockchain (wrong hash, no connection to the Blockchain, etc)
 * Status 'PENDING': at least one of the Order items is being validated in the Blockchain
 * @param req Input parameters received from the Front-End: All required Order values to perform the hash validation in the Blockchain
 * @param res Output parameters to be sent to the Front-End: Status ('OK', 'NOK' or 'PENDING')
 */
const checkGlobalOrderTrace = async (req: express.Request, res: express.Response) => {
    try {
        const args = req.query;
        const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_order_trace.sql`), 'utf8');
        const resDB = await query(q, 'select', [args.order_id]);
        let outcome = 'OK';

        hashOrderID = generateHashOrderID(String(args.order_id));

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
