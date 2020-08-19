import * as express from 'express';
const User = require('../models/user');
const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');
const saltRounds = 10;
let jwt = require('./jwt');
const logger = require('../shared/logRecorder');

exports.register = async (req: express.Request, res: express.Response) => {
    let { name, email, password, phone } = req.body;
    let userFound = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!userFound) {
        bcrypt.hash(password, saltRounds).then(async (hash: string) => {
            try {
                let newUser = await User.create({
                    name: name,
                    email: email.toLowerCase(),
                    password: hash,
                    phone: phone
                });
                console.log(newUser.toJSON());
                newUser.token = jwt.createToken(newUser, 'user');
                res.status(200).json(newUser);
            } catch (e) {
                console.log(e);
                res.status(400).json(e);
            }

        }).catch((err: string) => {
            res.status(400).json(err)
            logger.save('ERR', 'BACK-END', `userScript.js -> register(): ${err}`, `user: ${userFound}`);
        });

    } else {
        res.status(404).send({ message: 'Email is in use' });
    }
};

exports.login = async (req: express.Request, res: express.Response) => {
    let user = req.body;
    let email = user.email;

    let userFound = await User.findOne({ where: { email: email.toLowerCase() } });

    if (!userFound) {
        res.status(404).send({ message: 'User not found' });
    } else {
        bcrypt.compare(user.password, userFound.password)
            .then(async (check: boolean) => {
                if (check) {
                    userFound.token = jwt.createToken(userFound, 'user');
                    res.status(200).json(userFound);
                } else {
                    res.status(401).send({ message: 'Incorrect credentials' });
                }
            })
            .catch((err: string) => {
                res.status(400).json(err)
                logger.save('ERR', 'BACK-END', `userScript.js -> login(): ${err}`, `user: ${userFound}`);
            });
    }
};

exports.findAll = async (req: express.Request, res: express.Response) => {
    let users = await User.findAll({
        raw: true
    });

    if (users && users.length !== 0) {
        res.status(200).json({ users: users });
    } else {
        res.status(404).send({ message: "There's no any User" })
    }
};


exports.findOneById = async (req: express.Request, res: express.Response) => {
    let body = req.body;

    if (body.userId) {
        let user = await User.findOne({
            where: {
                id: body.userId
            }
        });

        if (user) {
            res.status(200).send({
                user: user
            });
        } else {
            res.status(204).send({ user: {} })
        }

    } else {
        res.status(404).send('No userId specified');
    }
};