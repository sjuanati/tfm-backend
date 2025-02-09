import * as pg from 'pg';
const logger = require('../shared/logRecorder');
const env = require('../Environment');
const Constants = require((env() === 'AWS') ? '/home/ubuntu/.ssh/Constants' : '../Constants');

// DB connection params
const pool = new pg.Pool(Constants.DB);

type Operation = 'insert' | 'update' | 'select' | undefined; 

const query = async (q: string, op: Operation, args: any) => {
    try {
        const client = await pool.connect();
        try {
            //console.log(q, ' args:',args)
            const result = await client.query(q, args);
            if ((op === 'insert') || (op == 'update')) { await client.query('COMMIT') }
            return result.rows;
        } catch (err) {
            if ((op === 'insert') || (op == 'update')) { await client.query('ROLLBACK') }
            console.log('Error at query.js: ', err, q);
            logger.save('ERR', 'BACK-END', `query.js: ${err}`, q);
            return 400;
        } finally {
            client.release();
        }
    } catch (err) {
        console.log('Error at queries.js -> query() with pool.connect(): ', err);
        logger.save('ERR', 'BACK-END', `query.js in pool.connect(): ${err}`, q);
    }
};

module.exports = {
    query,
}