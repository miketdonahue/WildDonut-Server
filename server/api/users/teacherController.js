var Class = require('../../database/models/classModel.js');
var User = require('../../database/models/userModel.js');
var Options = require('../../database/models/optionModel.js');
var Review = require('../../database/models/reviewModel.js');

module.exports.allTeacherClasses = function(req, res, next){
  var teacher = req.params.username;

  User.findOne({ username: teacher })
  .populate('classes')
  .exec(function(err, user){
    User.populate(user, { path:'classes.student', model:'User' }, function(err, data){
      if(err){
        res.status(400).send('Bad request.');
      }else if(!user){
        res.status(403).send('User not found');
      }else{
        res.json(user.classes);
      }
    });
  });
};

module.exports.allBookedClasses = function(req, res, next){
  var teacher = req.params.username;
  var is_booked = true;

  User.findOne({ username: teacher })
  .exec(function(err, user){
    Class.find({ teacher: user._id, is_booked: is_booked })
    .populate('student')
    .exec(function(err, classes){
      if(err){
        res.status(400).send('Bad request.');
      }else if(!classes){
        res.status(403).send('User not found');
      }else{
        res.json(classes);
      }
    });
  });
};

module.exports.allOpenClasses = function(req, res, next){
  var teacher = req.params.username;
  var is_booked = false;

  User.findOne({ username: teacher })
  .exec(function(err, user){
    Class.find({ teacher: user._id, is_booked: is_booked })
    .populate('student')
    .exec(function(err, classes){
      if(err){
        res.status(400).send('Bad request.');
      }else if(!classes){
        res.status(403).send('User not found');
      }else{
        res.json(classes);
      }
    });
  });
};

module.exports.createClass = function(req, res, next){
  // class_name, description, rate ($), date, time, location
  var teacher = req.params.username;

  User.findOne({ username: teacher })
  .exec(function(err, user){
    var newClass = new Class({
      name: req.body.name,
      description: req.body.description,
      rate: req.body.rate,
      date: req.body.date,
      start_time: req.body.start_time,
      end_time: req.body.end_time,
      teacher: user._id,
      location: req.body.location,
      picture_url: req.body.picture_url,
      is_booked: false
    });

    newClass.save(function(err, newClass){
      if(err){
        res.status(400).send('Bad request.');
      }else if(!user){
        res.status(403).send('Teacher not found');
      }else{
        user.classes.push(newClass._id);
        user.save(function(err, user){
          if(err){
            console.log('server error on user save');
          }else if(!user){
            console.log('server error finding user to save class');
          }else{
            res.json(newClass);
            console.log('successfully added class to user');
          }
        });
      }
    });
  });
};


// update class does not sync changes between class documents in the classes collection
// and the individual instances of classes pushed onto the student's bookings and
// existing in the teacher's classes array.
// this functionality will be added in a future commit.
module.exports.updateClass = function(req, res, next){
  var classId = req.params.id;

  // Need to eventually parse req.boy to handle new times.
  Class.findByIdAndUpdate(classId, req.body)
  .exec(function(err, classInstance){
    if(err){
      res.status(400).send('Bad request.');
    }else if(!classInstance){
      res.status(403).send('Class not found');
    }else{
      Class.findById(classId, function(err, classInstance){
        if(err){
          res.status(400).send('Bad request.');
        }else if(!classInstance){
          res.status(403).send('Class not found');
        }else{
          res.json(classInstance);
        }
      });
    }
  });
};

// delete class does not sync deletions between class documents in the classes collection
// and the individual instances of classes pushed onto the student's bookings and
// existing in the teacher's classes array.
// this functionality will be added in a future commit.
module.exports.deleteClass = function(req, res, next){
  var classId = req.params.id;

  Class.findByIdAndRemove(classId)
  .exec(function(err, classInstance){
    if(err){
      res.status(400).send('Bad request.');
    }else if(!classInstance){
      res.status(403).send('Class not found');
    }else{
      res.json(classInstance);
    }
  });
};

module.exports.getClass = function(req, res, next){
  var classId = req.params.id;

  Class.findById(classId)
  .populate('teacher student')
  .exec(function(err, classInstance){
    if(err){
      res.status(400).send('Bad request.');
    }else if(!classInstance){
      res.status(403).send('Class not found');
    }else{
      res.json(classInstance);
    }
  });
};

module.exports.getReviews = function(req, res, next){
  var class_id = req.params.id;

  Review
    .find({class_id: class_id})
    .limit(10)
    .select('rating review date student_name')
    .exec(function(err, reviews) {
      if (err) {
        res.status(400).send('Bad request.');
      } else {
        res.status(200).json(reviews);
      }
    });
};

module.exports.createReview = function(req, res, next){
  var teacher_username = req.params.username;
  var class_id = req.params.id;

  var newReview = new Review({
    rating: req.body.rating,
    review: req.body.review,
    date: req.body.date,
    student_name: req.body.student_name,
    teacher_username: teacher_username,
    class_id: class_id
  });

  Class.findOne({_id: class_id})
    .populate('teacher')
    .exec(function(err, model) {
      newReview.save(function(err, review) {
        if (err) {
          res.status(400).send('Bad request.');
        } else {
          res.status(201);
          console.log('Review has been created.');
          res.end();

          // Push the review into the class.reviews array
          model.reviews.push(review._id);
          model.save();

          // Start
          // Calculate totals and averages for class and teacher on review creation
          Review
            .aggregate([
              { "$match": { "class_id": class_id } },
              { "$group": { "_id": "$class_id", "avgClassRating": { "$avg": "$rating" } } }
            ])
            .exec(function(err, result) {
              model.avg_rating = result[0].avgClassRating;
              model.save();
            });

          Review
            .aggregate([
              { "$match": { "class_id": class_id } },
              { "$group": { "_id": "$class_id", "totalClassRatings": { "$sum": 1 } } }
            ])
            .exec(function(err, result) {
              model.total_ratings = result[0].totalClassRatings;
              model.save();
            });

            Review
              .aggregate([
                { "$match": { "teacher_username": teacher_username } },
                { "$group": { "_id": "$teacher_username", "avgTeacherRating": { "$avg": "$rating" } } }
              ])
              .exec(function(err, result) {
                model.teacher.avg_rating = result[0].avgTeacherRating;
                model.teacher.save();
              });

              Review
                .aggregate([
                  { "$match": { "teacher_username": teacher_username } },
                  { "$group": { "_id": "$teacher_username", "totalTeacherRatings": { "$sum": 1 } } }
                ])
                .exec(function(err, result) {
                  model.teacher.total_ratings = result[0].totalTeacherRatings;
                  model.teacher.save();
                });
                // End
                // Calculate totals and averages for class and teacher on review creation
        }
      });
    });
};
