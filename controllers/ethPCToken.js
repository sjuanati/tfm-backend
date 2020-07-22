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

// Blockchain settings (Ganache)
const web3 = new Web3(Cons.BLOCKCHAIN.URL_HTTP);
const web3ws = new Web3(Cons.BLOCKCHAIN.URL_WS);
const ABI_DATA = fs.readFileSync(path.join(__dirname, `/../contracts/Token/PCToken.abi`), 'utf8');
const Contract = new web3.eth.Contract(JSON.parse(ABI_DATA));
const ContractWS = new web3ws.eth.Contract(JSON.parse(ABI_DATA), Cons.BLOCKCHAIN.pctokenContractAddress);
Contract.options.address = Cons.BLOCKCHAIN.pctokenContractAddress;

const checkBalance = async (req, res) => {
    const args = req.query;

    Contract.methods.balanceOf(args.recipient).call()
        .then(resDB => {
            console.log('Resultat: ', resDB);
            res.send(resDB);
        })
        .catch(err => {
            console.log('Error in ethPCToken.js (A) -> checkBalance(): ', err);
            res.status(400).json('Error in ethPCToken.js -> checkBalance()');
        });

}

const earnTokensOnPurchase = async (eth_address, total_price) => {
    try {
        //TODO: decimal values from the total price into tokens!
        //let wei = 1000000000000000000;
        //let tokens = bn(String(total_price)).times(String(wei));
        const tokens = Math.round(total_price);
        Contract.methods.earnTokensOnPurchase(eth_address, tokens).send({ from: Cons.BLOCKCHAIN.appOwnerAddress })
            .then(res => {
                console.log('Resultat: ', res);
                console.log('Events approval: ', res.events.Approval);
                //console.log('Events transfer: ', res.events.Transfer.returnValues);
            })
            .catch(err => {
                console.log('Error in ethPCToken.js (A) -> checkBalance(): ', err);
            });
    } catch (err) {
        console.log('Error in ethPCToken.js (B) -> ', err);
    }
}

const earnTokens = async (req, res) => {
    const args = req.query;

    const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_earn_tokens.sql`), 'utf8');
    const results = await query(q, 'select', []);
    (results === 400) ? res.status(202).send('') : res.status(201).send(results);
}

module.exports = {
    checkBalance,
    earnTokensOnPurchase,
    earnTokens
}

