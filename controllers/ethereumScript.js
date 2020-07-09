// Libraries
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const tz = require('moment-timezone');
const Web3 = require('web3');
const crypto = require('crypto');
const { query } = require('../shared/query');

// Blockchain settings (Ganache)
const URL_HTTP = 'http://127.0.0.1:7545';
const URL_WEBSOCKET = 'ws://127.0.0.1:7545';
const web3 = new Web3(URL_HTTP);
const web3ws = new Web3(URL_WEBSOCKET);
const fromAddress = '0x1D3eFf2b566b5107EDBA436f125B8182A42dB045';  // TODO: capture error if wrong address
//const contractAddress = '0xB8eE700312Eed7B15448345ffe0c9C856529794c';  // Hash.sol
//const contractAddress = '0x814e872e41a311448e5cC0e209F7c0ad78A6574a';  // Hash2.sol
//const contractAddress = '0xBD512D02A57Df2E6C4Aea9065996b5A000787DD8';  // Hash3.sol
const contractAddress = '0xf9adbCC0B2E390f0CA8E38C630fE9c3099229d1C';  // Hash4.sol
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const NULL_DATE = '0';
const ABI_DATA = fs.readFileSync(path.join(__dirname, `/../contracts/Hash4.abi`), 'utf8');
const HashContract = new web3.eth.Contract(JSON.parse(ABI_DATA));
const HashContractWS = new web3ws.eth.Contract(JSON.parse(ABI_DATA), contractAddress);
HashContract.options.address = contractAddress;


// Save Order hash into Ethereum and save returned Tx hash into the DB
const saveOrderTraceEth = (hashOrderID, hashOrderValue, log_id) => {
    return new Promise(async (resolve) => {

        // Save Order hash into Ethereum within the Hash Contract
        HashContract.methods.saveHash(hashOrderID, hashOrderValue).send({ from: fromAddress })
            .then(async res => {

                // Save transaction hash into DB
                const q = fs.readFileSync(path.join(__dirname, `/../queries/update/update_order_trace.sql`), 'utf8');
                const update_date = moment().tz('Europe/Madrid').format('YYYY-MM-DD H:mm:ss');
                const txhash = res.transactionHash;
                const resDB = await query(q, 'update', [
                    log_id,
                    txhash,
                    update_date,
                ]);
                console.log('Result: ', res);
                console.log('Events: ', res.events.SaveHash.returnValues);
                if (resDB !== 400) resolve(true);
                else resolve(false);
            })
            .catch(err => {
                console.log('Error in ethereumScript.js -> saveOrderTraceEth(): ', err);
                resolve(false);
            });
    })
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
                // TODO: OPTIMIZATION: SAVE BLOCK IN DB TO SEARCH ONLY IN THE CORRESPONDING BLOCK
                fromBlock: 0,
                toBlock: 'latest',
                transactionHash: params.tx_hash,
            })
                .then(events => {
                    console.log('Events: ', events);
                    (events.length > 0) 
                        ? resolve({ result: true, error: null })
                        : resolve({ result: false, error: 'Hash not found'});
                })
                .catch(err => {
                    console.log('Error in ethereumScript.js -> getOrderTraceEth()', err);
                    resolve({ result: false, error: err });
                });

        } catch (err) {
            console.log('Error in ethereumScript.js -> getOrderTraceEth(): ', err);
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
//                     console.log('Error in ethereumScript.js -> getOrderTraceEth(): ', err);
//                     console.log('Error response: ', err.response);
//                     resolve({
//                         result: false,
//                         error: err
//                     });
//                 });
//         } catch (err) { 
//             console.log('Error in ethereumScript.js -> getOrderTraceEth(): ', err);
//             console.log('Error response: ', err.response);
//             resolve({
//                 result: false,
//                 error: err
//             });
//         };
//     })

// }

module.exports = {
    saveOrderTraceEth,
    getOrderTraceEth,
}


    //let url = 'https://mainnet.infura.io/v3/6749ea86b49e4c08823580aa47b09041';
    //let address = '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8';

    // Get account balance
    // web3.eth.getBalance(address1, (err, val) => {

    //     // Convert balance to ether
    //     let balance = web3.utils.fromWei(val, 'ether');
    //     console.log(balance);
    // })

    // Build the transaction
    // const txObject = {
    //     from: address1,
    //     to: address2,
    //     value: web3.utils.toWei('1', 'ether')
    // }

        // Send the transaction
    // web3.eth.sendTransaction(txObject, (err, val) => {
    //     if (err) console.log('Errorin: ', err)
    //     else console.log('Value: ', val);
    // })

    // web3.eth.getTransactionCount(address1, (err, txCount) => {
    //     if (err) console.log('Errorin 2:', err);
    //     else {
    //         console.log('txCount: ', txCount);
    //         console.log('txCountHex: ', web3.utils.toHex(txCount));
    //     }
    // })