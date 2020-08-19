import express = require('express');
let jwt = require('jwt-simple');
let moment = require('moment');
let constants = require('../Constants');

exports.ensureAuth = function (req: any, res: express.Response, next: express.NextFunction) {
    let payload;

    if (!req.headers.authorization) {
        return res.status(403).send({ message: 'Petition has not an authentication header' });
    }

    let token = req.headers.authorization.replace(/['"]+/g, '');

    try {
        payload = jwt.decode(token, constants.RANDOM);
        if (payload.exp >= moment().unix) {
            return res.status(401).send({
                message: 'Token expired'
            })
        }
    } catch (ex) {
        return res.status(401).send({
            message: 'Token not valid'
        })
    }
    req.user = payload; // WHY?

    next();
};

exports.random = function () {
    console.log(constants.RANDOM);
    return constants.RANDOM;
};