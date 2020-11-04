const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const os = require('os');
const app = express();
const http = require('http').Server(app);
const https = require('https');
const fs = require('fs');
const Sequelize = require('sequelize');

const usersRouter = require('./routes/users');
const pharmacyRouter = require('./routes/pharmacy');
const orderRouter = require('./routes/order');
const logRouter = require('./routes/log');
const traceRouter = require('./routes/trace');
const tokenRouter = require('./routes/token');
const prescriptionRouter = require('./routes/prescription');
const productRouter = require('./routes/product');
const Message = require('./models/message');

const env = require('./Environment');
const Cons = require((env() === 'AWS') ? '/home/ubuntu/.ssh/Constants' : './Constants');

// Database
const db = new Sequelize(Cons.DB_SEQ.db, Cons.DB_SEQ.user, Cons.DB_SEQ.password, Cons.DB_SEQ.params)

// Test DB
db.authenticate()
    .then(async () => {
        console.log('Database AWS RDS connected...')
    })
    .catch((err: string) => console.log('Error: ' + err));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// Express setup
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes definition
app.use('/users', usersRouter);
app.use('/pharmacy', pharmacyRouter);
app.use('/order', orderRouter);
app.use('/log', logRouter);
app.use('/trace', traceRouter);
app.use('/token', tokenRouter);
app.use('/prescription', prescriptionRouter);
app.use('/product', productRouter);

// Catch 404 and forward to error handler
app.use(function (req: any, res: any, next: any) {
    next(createError(404));
});

// Error handler
app.use(function (err: any, req: any, res: any, next: any) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

http.listen(3001);

switch (env()) {
    // Local, Non TLS
    case 'LOCAL':
        app.listen(3000);
        console.log('Back-end (Non-SSL) running on port 3000');
        break;
    // AWS, TLS
    case 'AWS':
        app.listen(3000);
        console.log('Back-end (Non-SSL yet) running on port 3000');
        try {
            const privateKey = fs.readFileSync('/etc/letsencrypt/live/doctormax.eu/privkey.pem', 'utf8');
            const certificate = fs.readFileSync('/etc/letsencrypt/live/doctormax.eu/cert.pem', 'utf8');
            const ca = fs.readFileSync('/etc/letsencrypt/live/doctormax.eu/chain.pem', 'utf8');
            const credentials = {
                key: privateKey,
                cert: certificate,
                ca: ca
            };
            const httpsServer = https.createServer(credentials, app);
            httpsServer.listen(3000, () => {
                console.log('Back-end (SSL) running on port 3000');
            });
        } catch (err) {
            console.log('Certificate not found. Is NodeJs running at AWS? ', err);
        }
        break;
    default:
        console.log('No environment to run the back-end');
        break;
}


// Show IP address in console
const ifaces = os.networkInterfaces();
const IPs = [];
Object.keys(ifaces).forEach(function (ifname) {
    var alias = 0;

    ifaces[ifname].forEach(function (iface: any) {
        if ('IPv4' !== iface.family || iface.internal !== false) {
            // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
            return;
        }
        if (alias >= 1) {
            // this single interface has multiple ipv4 addresses
            console.log(ifname + ':' + alias, iface.address);
            IPs.push(`${ifname} : ${alias}, ${iface.address}`);
        } else {
            // this interface has only one ipv4 adress
            console.log(ifname, iface.address);
            IPs.push(`${ifname}, ${iface.address}`);
        }
        ++alias;
    });
});

module.exports = app;

