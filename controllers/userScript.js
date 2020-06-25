const User = require('../models/user');
const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');
const saltRounds = 10;
let jwt = require('./jwt');
const logger = require('../controllers/logRecorder');

exports.register = async (req, res) => {
  let { name, email, password, phone } = req.body;

  let userFound = await User.findOne({where: {email: email.toLowerCase()}});

  console.log('User found:', userFound);

  if(!userFound) {
    bcrypt.hash(password, saltRounds).then(async (hash) => {
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

    }).catch(err => {
        res.status(400).json(err)
        logger.save('ERR', 'BACK-END', `userScript.js -> register(): ${err}`, `user: ${userFound}`);
    });

  } else {
    res.status(404).send({message: 'Email is in use'});
  }
};

// BACKUP
// exports.login = async (req, res) => {
//   let user = req.body;
//   let email = user.email;

//   let userFound = await User.findOne({where: {email: email.toLowerCase()}});

//   if(!userFound) {
//     res.status(404).send({message: 'User not found'});
//   } else {
//     bcrypt.compare(user.password, userFound.password).then(async (check) => {
//       if (check) {
//         userFound.token = jwt.createToken(userFound, 'user');
//         console.log('User found:', userFound.toJSON());
//         res.status(200).json(userFound);
//       } else {
//         res.status(401).send({message: 'Incorrect credentials'});
//       }
//     });
//   }
// };

exports.login = async (req, res) => {
    let user = req.body;
    let email = user.email;
  
    let userFound = await User.findOne({where: {email: email.toLowerCase()}});

    if(!userFound) {
      res.status(404).send({message: 'User not found'});
    } else {
      bcrypt.compare(user.password, userFound.password)
      .then(async (check) => {
        if (check) {
          userFound.token = jwt.createToken(userFound, 'user');
          console.log('User found:', userFound.toJSON());
          res.status(200).json(userFound);
        } else {
          res.status(401).send({message: 'Incorrect credentials'});
      }})
      .catch(err => {
            res.status(400).json(err)
            logger.save('ERR', 'BACK-END', `userScript.js -> login(): ${err}`, `user: ${userFound}`);
      });
    }
  };

exports.findAll = async (req, res) => {
  let users = await User.findAll({
    raw: true
  });

  if(users && users.length !== 0) {
    res.status(200).json({users: users});
  } else {
    res.status(404).send({ message: "There's no any User"})
  }
};


exports.findOneById = async (req, res) => {
  let body = req.body;

  if(body.userId) {
    let user = await User.findOne({
      where: {
        id: body.userId
      }
    });

    if(user) {
      res.status(200).send({
        user: user
      });
    } else {
      res.status(204).send({user:{}})
    }

  } else {
    res.status(404).send('No userId specified');
  }
};