const Pharmacy = require('../models/pharmacy');
const Sequelize = require('sequelize');
const bcrypt = require('bcrypt');
const saltRounds = 10;
let jwt = require('./jwt');

exports.register = async (req, res) => {
  let { pharmacy_desc, email, password, phone } = req.body;

  let pharmacyFound = await Pharmacy.findOne({where: {email: email.toLowerCase()}});

  if(!pharmacyFound) {
    bcrypt.hash(password, saltRounds).then(async (hash) => {
      console.log('hash', hash);
      let newPharmacy = await Pharmacy.create({
        pharmacy_desc: pharmacy_desc,
        email: email.toLowerCase(),
        password: hash,
        phone: phone
      });
      console.log(newPharmacy.toJSON());

      try {
        newPharmacy.token = jwt.createToken(newPharmacy, 'pharmacy');
        res.status(200).json(newPharmacy);
      } catch (e) {
        console.log(e);
        res.status(400).json(e);
      }
    }).catch(error => res.status(400).json(error));
  } else {
    res.status(404).send({message: 'Email is in use'});
  }
};

exports.login = async (req, res) => {
  let user = req.body;
  let email = user.email;

  let pharmacyFound = await Pharmacy.findOne({where: {email: email.toLowerCase()}});

  if(!pharmacyFound) {
    res.status(404).send({message: 'Pharmacy not found'});
  } else {
    bcrypt.compare(user.password, pharmacyFound.password).then(async (check) => {
      if (check) {
        pharmacyFound.token = jwt.createToken(pharmacyFound, 'pharmacy');
        console.log(pharmacyFound.toJSON(), pharmacyFound.token);
        res.status(200).json(pharmacyFound.toJSON());
      } else {
        res.status(401).send({message: 'Incorrect credentials'});
      }
    });
  }
};

exports.findAll = async (req, res) => {
  let pharmacies = await Pharmacy.findAll({
    raw: true
  });

  if(pharmacies && pharmacies.length !== 0) {
    res.status(200).json({pharmacies: pharmacies});
  } else {
    res.status(404).send({ message: "There's no any Pharmacies"});
  }
};

exports.findOneById = async (req, res) => {
  let body = req.body;
  console.log('bodyFindPharma', body);

  if(body.pharmacyId) {
    let pharmacy = await Pharmacy.findOne({
      where: {
        pharmacy_id: body.pharmacyId
      }
    });

    if(pharmacy) {
      res.status(200).send({
        pharmacy: pharmacy
      });
    } else {
      res.status(204).send({pharmacy:{}})
    }

  } else {
    res.status(404).send('No pharmacyId specified');
  }
};