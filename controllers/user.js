const models = require('../models');
const config = require('../config/config');
const utils = require('../utils');

module.exports = {
  get: (req, res, next) => {
    models.User.find().populate('createdAircraft')
      .then((users) => res.send(users))
      .catch(next)
  },
  getOne: (req, res, next) => {
    const { _id } = req.user;
    
    models.User.findOne({_id: _id}).populate('createdAircraft')
    .then(userData => res.send(userData))
    .catch(next)
  },

  post: {
    register: (req, res, next) => {
      const { username, password } = req.body;
      models.User.create({ username, password })
        .then((createdUser) => res.send(createdUser))
        .catch(error => {
          if(error.name === 'MongoError' && error.code === 11000){
            res.status(400).send('That username already excists')
          }
        })
     
    },

    login: (req, res, next) => {
      const { username, password } = req.body;
      models.User.findOne({ username })
        .then((user) => !!user ? Promise.all([user, user.matchPassword(password)]) : [null, false])
        .then(([user, match]) => {
          if (!match) {
            res.status(401).send('Invalid username or password');
            return;
          }

          const token = utils.jwt.createToken({ id: user._id });
        
          res.cookie(config.authCookieName, token, {
			  sameSite: 'none',
			  secure: true});
		  res.send([user,token]);
        })
        .catch(next);
    },

    logout: (req, res, next) => {
      const token = req.cookies[config.authCookieName];
      models.TokenBlacklist.create({ token })
        .then(() => {
          res.clearCookie(config.authCookieName).send('Logout successfully!');
        })
        .catch(next);
    }
  },

  put: (req, res, next) => {
    const id = req.params.id;
    const { username, password } = req.body;
    models.User.update({ _id: id }, { username, password })
      .then((updatedUser) => res.send(updatedUser))
      .catch(next)
  },

  delete: (req, res, next) => {
    const id = req.params.id;
    models.User.deleteOne({ _id: id })
      .then((removedUser) => res.send(removedUser))
      .catch(next)
  }
};