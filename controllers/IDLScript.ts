import * as fs from 'fs';
const path = require('path');
const moment = require('moment');
const tz = require('moment-timezone');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../shared/query');


const loadProducts = () => {

    //ENHANCEMENT: convert JSON into TSV and insert data into DB in buffer mode
    try {
        const input = JSON.parse(fs.readFileSync(path.join(__dirname, `/../data/products.json`), 'utf8'));
        const q = fs.readFileSync(path.join(__dirname, `/../queries/load/load_products.sql`), 'utf8');

        input.forEach(async (elem: any) => {
            console.log(elem)
            const date = moment().tz('Europe/Madrid').format('YYYY-MM-DD H:mm:ss');
            let params = Object.keys(elem).map(function(k){return elem[k]});
            params.unshift(uuidv4());
            params.push(date, date);
            console.log(params)
            const res = await query(q, 'insert', params);
        })
    } catch (err) {
        console.log('Error in IDLScript.js: ', err);
    }

}

loadProducts();