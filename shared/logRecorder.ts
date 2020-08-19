import * as fs from 'fs';
import * as path from 'path';
import * as express from 'express';
const moment = require('moment');
const tz = require('moment-timezone');

// Receive logs from Front-End through post requests
const saveFront = async (req: express.Request, res: express.Response) => {

    const { type, source, msg, extra } = req.body;
    save(type, source, msg, extra);
}

type Type = 'LOG' | 'WRN' | 'ERR';
type Source = 'FRONT-USER' | 'FRONT-PHARMA' | 'BACK-END';

// Write logs into a file
// Type: LOG (info), WRN (warning), ERR (error)
// Source: FRONT-USER, FRONT-PHARMA, BACK-END
const save = (type: Type, source: Source, msg: string, extra: string) => {

    if (!extra) extra = '?';
    const _SHORT_DATE = moment().tz('Europe/Madrid').format('YYYY-MM-DD');
    const _LONG_DATE = moment().tz('Europe/Madrid').format('YYYY-MM-DD H:mm:ss');
    const _PATH = path.join(__dirname, `/../logs/${_SHORT_DATE}.log`);
    const _MSG = `${_LONG_DATE} | ${type} | ${source} | ${msg} | ${extra}\n`

    fs.appendFile(_PATH, _MSG, (err)=>{
        if (err) console.log('Error when writing log! (is folder /logs created?) :', err);
    });
}

module.exports = {
    saveFront,
    save,
};
