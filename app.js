let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');

let usersRouter = require('./routes/users');
let pharmacyRouter = require('./routes/pharmacy');
let chatRouter = require('./routes/chat');
let imageRouter = require('./routes/image');
let audioRouter = require('./routes/audio');
let orderRouter = require('./routes/order');
const logRouter = require('./routes/log');
const Chat = require('./models/chat');
const Message = require('./models/message');

let app = express();
let http = require('http').Server(app);
let https = require('https');
const fs = require('fs');
let io = require('socket.io')(http);
const Sequelize = require('sequelize');

const env = require('./Environment');
const Cons = require((env() === 'PROD') ? '/home/ubuntu/.ssh/Constants' : './Constants');

// Redis
// const redis = require('socket.io-redis');
// io.adapter(redis({ host: 'localhost', port: 6379 }));

// Database
const db = ((env() === 'PROD') 
    ? new Sequelize(Cons.DB_PROD_SEQ.db, Cons.DB_PROD_SEQ.user, Cons.DB_PROD_SEQ.password, Cons.DB_PROD_SEQ.params)
    : new Sequelize(Cons.DB_SIM_SEQ.db, Cons.DB_SIM_SEQ.user, Cons.DB_SIM_SEQ.password, Cons.DB_SIM_SEQ.params)
    );

// Test DB
db.authenticate()
    .then(async () => {
        console.log('Database AWS RDS connected...')
    })
    .catch(err => console.log('Error: ' + err));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/users', usersRouter);
app.use('/images', imageRouter);
app.use('/audio', audioRouter);
app.use('/pharmacy', pharmacyRouter);
app.use('/chat', chatRouter);
app.use('/order', orderRouter);
app.use('/log', logRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});


io.on('connection', (socket) => {
    socket.on('subscribe', async function (users) {
        console.log('llega users', users);
        let room;
        if (users && users.userId && users.pharmacyId) {
            room = "user" + users.userId + "pharma" + users.pharmacyId;

            let checkChat = await Chat.findOne({ where: { room: room } });

            if (checkChat) {
                if (users.me === 'user') {
                    checkChat.userLastView = new Date();
                    await Chat.update({
                        userLastView: checkChat.userLastView
                    }, { where: { room: room } });
                } else if (users.me === 'pharmacy') {
                    checkChat.pharmacyLastView = new Date();
                    await Chat.update({
                        pharmacyLastView: checkChat.pharmacyLastView
                    }, { where: { room: room } });
                }

                console.log('joining room', room);
                socket.join(room);
            } else {
                let newChat = await Chat.create({
                    room: room,
                    created: new Date(),
                    userId: users.userId,
                    userLastView: new Date(),
                    pharmacyId: users.pharmacyId
                });
                console.log(newChat.toJSON());

                console.log('joining room', room);
                socket.join(room);
            }
        }
    });

    socket.on('subscribeToYou', async (user) => {
        socket.join(user.id);
    });

    socket.on('numberMessages', async (data) => {
        if (data.id && data.type) {
            let messages;
            if (data.type === 'user') {
                messages = await Message.findAndCountAll({ where: { userId: data.id, to: 'user', seen: false } }).count;
            } else if (data.type === 'pharmacy') {
                messages = await Message.findAndCountAll({ where: { pharmacyId: data.id, to: 'pharmacy', seen: false } }).count;
            }
            console.log(data.id, messages);
            socket.to(data.id).emit('numberMessages', { number: messages });
        }
    });

    /*socket.on('disconnect', async function (username) {
        // await User.findOneAndUpdate({name: username}, {connected: false}, {new: true});
        // socket.emit('user-changed', {
        //     user: socket.username,
        //     event: 'left'
        // })
    });
  
    socket.on('set-username', async (username) => {
        // socket.username = username;
        // await User.findOneAndUpdate({name: username}, {connected: true}, {new: true});
        // socket.emit('users-changed', {
        //     user: username,
        //     event: 'joined'
        // });
    });*/

    socket.on('add-message', async (message) => {
        console.log('message', message);
        let msgSaved = await Message.create(message).catch(err => console.log('err', err));
        console.log('message 2', msgSaved);
        let msgSavedModified = msgSaved.get({ plain: true });
        console.log('msgSaved', msgSavedModified);

        await Chat.findOne({ where: { room: message.room } }).then((chat) => {
            if (chat) {
                chat.update({
                    lastMessage: msgSavedModified.message,
                    lastMessageDate: msgSavedModified.created
                }
                )
            }
        });

        if (msgSavedModified.to === 'user') {
            let messages = await Message.findAndCountAll({
                where: {
                    to: 'user',
                    userId: msgSavedModified.userId,
                    seen: false
                }
            }).count;
            socket.to(msgSavedModified.userId).emit('numberMessages', {
                number: messages
            });
        } else if (msgSavedModified.to === 'pharmacy') {
            let messages = await Message.findAndCountAll({
                where: {
                    to: 'pharmacy',
                    pharmacyId: msgSavedModified.pharmacyId,
                    seen: false
                }
            }).count;
            socket.to(msgSavedModified.pharmacyId).emit('numberMessages', {
                number: messages
            });
        }

        console.log('sending room post', message);
        socket.to(message.room).emit('message', msgSavedModified);
    });
});

http.listen(3001);

switch (env()) {
    // Non TLS - Simulation
    case 'SIM':
        app.listen(3000);
        console.log('Back-end (Simulation) running on port 3000');
        break;
    // TLS - Production
    case 'PROD':
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
                console.log('Back-end (Production, SSL) running on port 3000');
            });
        } catch (err) {
            console.log('Certificate not found. Is NodeJs running at AWS? ', err);
        }
        break;
    default:
        console.log('No environment to run the back-end');
        break;
}


// Non TLS (Simulation)
// app.listen(3000);

//TLS @ AWS (Production)
// try {
// const privateKey = fs.readFileSync('/etc/letsencrypt/live/doctormax.eu/privkey.pem', 'utf8');
// const certificate = fs.readFileSync('/etc/letsencrypt/live/doctormax.eu/cert.pem', 'utf8');
// const ca = fs.readFileSync('/etc/letsencrypt/live/doctormax.eu/chain.pem', 'utf8');
// const credentials = {
//         key: privateKey,
//         cert: certificate,
//         ca: ca
// };
// const httpsServer = https.createServer(credentials, app);
// httpsServer.listen(3000, () => {
//     console.log('HTTPS server running on port 3000');
// });
// } catch (err) {
//     console.log ('Certificate not found. Is NodeJs running at AWS? ', err);
// }

module.exports = app;

