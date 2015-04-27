var Class = require('../../database/models/classModel.js');
var User = require('../../database/models/userModel.js');
var Options = require('../../database/models/optionModel.js');

module.exports.getAllClasses = function(req, res, next){
  Class.find({})
       .populate({path: 'teacher', select: 'username picture_url'})
       .exec(function(err, classInstances){
      if(err){
        res.status(400).send('Bad request');
      }else if(!classInstances){
        res.status(404).send('No classes found');
      }else{
        res.json(classInstances);
      }
  });
};
