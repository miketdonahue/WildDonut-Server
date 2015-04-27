var Class = require('../../database/models/classModel.js');
var User = require('../../database/models/userModel.js');

module.exports.createUser = function(req, res, next){
  if(!req.body.username || !req.body.password){
    return res.status(400).send('username and password required for to create user');
  }

  var username = req.body.username;
  var password = req.body.password;

  User.findOne({username: username}, function(err, user){
    if(err){
      res.status(400).send('Bad request.');
    }else if(user){
      res.status(403).send('Username already exists, try another!');
    }else{
      var newUser = new User({ username: username, password: password });
      newUser.save(function(err, user){
        if(err || !user){
          res.status(400).send('Bad request');
        }
        else{
          next();
        }
      });
    }
  });
};

module.exports.updateUser = function(req, res, next){
  var username = req.params.username;

  User.findOneAndUpdate({ username: username }, req.body, function(err, user){
    username = req.body.username || username;

    User.findOne({ username: username}, function(err,user){
      if(err){
        res.status(400).send('Bad Request');
      }else if(!user){
        res.status(403).send('User not found');
      }else{
        res.status(201).send(user);
      }
    });
  });
};

module.exports.login = function(req, res, next){
  if (req.user) {
    res.cookie('user', JSON.stringify(req.user)).send(req.user);
  }
};

module.exports.logout = function(req, res, next){
  if (req.user){
    req.logout();
    res.send(200);
  }
};

module.exports.getUser = function(req, res, next){
  var username = req.params.username;

  User.findOne({ username: username })
  .populate('classes bookings')
  .exec(function(err, user){
    if(err){
      res.status(400).send('Bad request');
    }else if(!user){
      res.status(404).send('User not found');
    }
    res.json(user);
  });
};
