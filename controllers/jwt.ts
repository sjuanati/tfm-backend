import * as jwt from 'jwt-simple';
const moment = require('moment');
const auth = require('./authenticated');

interface User {
  id: string,
  name: string,
  pharmacy_desc: string
}

type Type = 'user' | 'pharmacy';

exports.createToken = function (user: User, type: Type) {
  const payload = {
    sub: user.id,
    name: '',
    iat: moment().unix(),
    exp: moment.duration().add(30, 'days')
  };

  if (type === 'user') {
    payload.name = user.name;
  } else if (type === 'pharmacy') {
    payload.name = user.pharmacy_desc;
  }

  return jwt.encode(payload, auth.random());
};
