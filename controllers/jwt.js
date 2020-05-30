'use strict';

let jwt = require('jwt-simple');
let moment = require('moment');
let auth = require('./authenticated');

exports.createToken = function (user, type) {
  let payload = {
    sub: user.id,
    name: '',
    iat: moment().unix(),
    exp: moment.duration().add(30, 'days')
  };

  if(type === 'user') {
    payload.name = user.name;
  } else if (type === 'pharmacy') {
    payload.name = user.pharmacy_desc;
  }
  return jwt.encode(payload, auth.random());
};
