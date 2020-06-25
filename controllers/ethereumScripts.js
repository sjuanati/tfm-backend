
const fs = require('fs');
const path = require('path');
const Web3 = require('web3');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../shared/query');

// Blockchain settings (Ganache)
const url = 'http://127.0.0.1:7545';
const web3 = new Web3(url);
const address1 = '0x1D3eFf2b566b5107EDBA436f125B8182A42dB045';
const address2 = '0x892368edb8e1FF600E8899d2691a683B46ad1BC0';
const contractAddress = '0xB8eE700312Eed7B15448345ffe0c9C856529794c';
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
const NULL_DATE = '0';
const ABI_DATA = fs.readFileSync(path.join(__dirname, `/../contracts/Hash.abi`), 'utf8');
const HashContract = new web3.eth.Contract(JSON.parse(ABI_DATA));
HashContract.options.address = contractAddress;


const saveLog = async (params) => {

    const hash = await saveLogDB(params);
    console.log('hash: ', hash);
    if (hash) saveLogEth(hash);
}

// Save log record into DB
const saveLogDB = (params) => {
    return new Promise(async (resolve, reject) => {

        try {
            // GUID for log record
            const log_id = uuidv4();

            // Create hash on log record
            const hash = crypto
                .createHash('sha256')
                .update(
                    log_id ||
                    params.order_id ||
                    params.order_item ||
                    params.pharmacy_id ||
                    params.user_id ||
                    params.product_id ||
                    params.user_ip ||
                    params.creation_date)
                .digest('hex');

            // Save Order item into DB
            const q = fs.readFileSync(path.join(__dirname, `/../queries/insert/insert_log.sql`), 'utf8');
            await query(q, 'insert', [
                log_id,
                params.order_id,
                params.order_item,
                params.pharmacy_id,
                params.user_id,
                params.product_id,
                params.user_ip,
                params.creation_date,
                hash
            ]);

            resolve(hash);

        } catch (err) {
            console.log('Error on ethereumScript.js: ', err);
            reject();
        }
    })
}

// Save hash record into Ethereum
const saveLogEth = (hash) => {

    HashContract.methods.saveHash('0x' || hash).send({from: address1})
        .then(res => {
            console.log('Hash saved');
            console.log('Result: ', res)
        })
        .catch(err => console.log('Errorinin: ', err));
}

// Retrieve hash record from Ethereum
const getLogEth = (hash) => {

    HashContract.methods.getHash(hash).call()
        .then(res => {
            if (res && (res[0] === NULL_ADDRESS || res[1] === NULL_DATE) ) {
                console.log('No hash found');
            } else {
                console.log('Hash found');
            }
            console.log(res);
        })
        .catch(err => console.log('Errorinin: ', err));
}

module.exports = {
    saveLog,
    saveLogDB,
    saveLogEth,
    getLogEth,
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