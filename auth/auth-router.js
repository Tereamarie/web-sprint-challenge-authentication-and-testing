const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const secrets = require('../config/secrets.js');
const { restart } = require('nodemon');
const Users = require('../users/users-model.js');


router.post('/register', (req, res) => {
  let credentials = req.body;

  if (isValid(credentials)) {
    const rounds = process.env.BCRYPT_ROUNDS || 10;

    const hash = bcrypt.hashSync(credentials.password, rounds);
    credentials.password = hash;

    Users.add(credentials)
      .then(user => {
        res.status(201).json({data: user});
      })
      .catch(error => {
        res.status(500).json({message: error.message});
      });
  } else {
    res.status(400).json({
      message: "You must provide a username and password to gain access"
    });
  }
});

router.post('/login', (req, res) => {
  const {username, password} = req.body;

  if (isValid(req.body)) {
    Users.findBy({username: username})
      .then(([user]) => {
        if (user && bcrypt.compareSync(password, user.password)) {
          const token = generateToken(user);
          res.status(200).json({message: "Hey there!", token});
        } else {
          res.status(401).json({message: "Oops, invalid credentials"});
        }
      })
      .catch(error => {
        console.log(error);
        res.status(500).json({message: "whoopsie"});
      });
  } else {
      res.status(400).json({message: "you must provide a username and password to ENTER"});
  }
});

function generateToken(user) {
  const payload = {
    subject: user.id,
    username: user.username,
  };

  const options = {
    expiresIn: "4h"
  };

  return jwt.sign(payload, secrets.jwtSecret, options);
}

module.exports = router;
