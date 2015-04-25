var Class = require('../../database/models/classModel.js');
var User = require('../../database/models/userModel.js');

module.exports.getStudent = function(req, res, next){
  var username = req.params.username;

  User.findOne({ username: username }, function(err, user){
    if(err){
      res.status(400).send('Bad request');
    }else if(!user){
      res.status(404).send('Student not found');
    }else{
      res.json(user);
    }
  });
};

module.exports.getBookings = function(req, res, next){
  var username = req.params.username;

  User.findOne({username: username}, function(err, user){
    if(err){
      res.status(400).send('Bad request');
    }else if(!user){
      res.status(404).send('USER not found');
    }else{
      Class.find({ student: user._id })
      .populate('teacher student')
      .exec(function(err, classInstance){
        if(err){
          res.status(400).send('Bad request');
        }else if(!user){
          res.status(404).send('Class not found');
        }else{
          res.json(classInstance);
        }
      });
    }
  });
};

module.exports.classesWithoutReviews = function(req, res, next){
  Class
    .find({student: user._id})
    .populate('student reviews')
    .where('date').lt(new Date())
    .where('reviews').lt([])
    .exec(function(err, classes) {
      if (err) {
        res.status(400).send('Bad request.');
      } else {
        res.status(200).json(classes);
      }
    });
}
