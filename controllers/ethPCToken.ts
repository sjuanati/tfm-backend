import * as fs from 'fs';
import express = require('express');
const path = require('path');
const Web3 = require('web3');
const crypto = require('crypto');
const moment = require('moment');
const tz = require('moment-timezone');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../shared/query');
const { executeTX } = require('./ethUtils');

const env = require('../Environment');
const Cons = require((env() === 'AWS') ? '/home/ubuntu/.ssh/Constants' : '../Constants');

// Blockchain settings (Ganache)
const web3 = new Web3(Cons.BLOCKCHAIN.URL_HTTP);
const web3ws = new Web3(Cons.BLOCKCHAIN.URL_WS);
const ABI_DATA = fs.readFileSync(path.join(__dirname, `/../contracts/Token/PCToken.abi`), 'utf8');
const Contract = new web3.eth.Contract(JSON.parse(ABI_DATA));
const ContractWS = new web3ws.eth.Contract(JSON.parse(ABI_DATA), Cons.BLOCKCHAIN.pctokenContractAddress);
Contract.options.address = Cons.BLOCKCHAIN.pctokenContractAddress;

const checkBalance = async (req: express.Request, res: express.Response) => {
    const args = req.query;

    Contract.methods.balanceOf(args.recipient).call()
        .then((resDB: number) => {
            const amount = Web3.utils.fromWei(resDB);
            console.log('Resultat: ', amount);
            res.send(amount);
        })
        .catch((err: string) => {
            console.log('Error in ethPCToken.js (A) -> checkBalance(): ', err);
            res.status(400).json('Error in ethPCToken.js -> checkBalance()');
        });
}

const showEarnTokens = async (req: express.Request, res: express.Response) => {
    //const args = req.query;
    const q = fs.readFileSync(path.join(__dirname, `/../queries/select/select_earn_tokens.sql`), 'utf8');
    const results = await query(q, 'select', []);
    (results === 400) ? res.status(202).send('') : res.status(201).send(results);
}

const buyTokens = async (req: express.Request, res: express.Response) => {
    const args = req.query;

    // Add 18 decimals to the amount in order to be compliant with the 18 decimals in the ERC20 contract
    const amount = Web3.utils.toWei(String(args.amount));

    const params = {
        encodedABI: Contract.methods.buyTokens(args.recipient, amount).encodeABI(),
        fromAddress: Cons.BLOCKCHAIN.appOwnerAddress,
        fromAddressKey: Cons.BLOCKCHAIN.appOwnerKey,
        contractAddress: Cons.BLOCKCHAIN.pctokenContractAddress,
    };

    const { result, error } = await executeTX(params);

    (result) ? res.status(200).json('OK') : res.status(400).json(error);
}

// TODO1: ***** INTEGRATE buyTokens with SpendTokens in the same function, and add buy or spend as param
// TODO2: ***** Manage User & Pharmacy's private keys somewhere (and securely)
const spendTokens = async (req: express.Request, res: express.Response) => {
    const args = req.query;

    // Add 18 decimals to the amount in order to be compliant with the 18 decimals in the ERC20 contract
    const amount = Web3.utils.toWei(String(args.amount));

    const params = {
        encodedABI: Contract.methods.spendTokensOnPurchase(args.recipient, amount).encodeABI(),
        fromAddress: args.sender,
        fromAddressKey: '0212bcffd0d67510871a05ac095ef1620ea1201bee9d265a03c6fb6a16f3ddee',
        contractAddress: Cons.BLOCKCHAIN.pctokenContractAddress,
    };

    const { result, error } = await executeTX(params);

    (result) ? res.status(200).json('OK') : res.status(400).json(error);
}

const earnTokensOnPurchase = async (eth_address_pharmacy: string, eth_address_user: string, total_price: number) => {
    try {
        // Add 18 decimals to the amount in order to be compliant with the 18 decimals in the ERC20 contract
        const amount = Web3.utils.toWei(total_price.toString());

        const params = {
            encodedABI: Contract.methods.earnTokensOnPurchase(
                eth_address_pharmacy, 
                eth_address_user, 
                amount).encodeABI(),
            fromAddress: Cons.BLOCKCHAIN.appOwnerAddress,
            fromAddressKey: Cons.BLOCKCHAIN.appOwnerKey,
            contractAddress: Cons.BLOCKCHAIN.pctokenContractAddress,
        };

        const { result, error, output } = await executeTX(params);

    } catch (err) {
        console.log('Error on ethPCToken.js -> earnTokensOnPurchase(): ', err)
    }
}

module.exports = {
    checkBalance,
    showEarnTokens,
    buyTokens,
    spendTokens,
    earnTokensOnPurchase,
}

