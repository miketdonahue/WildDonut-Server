var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');
var Class = require('./classModel.js');

// Defines the number of iterations the key setup phase uses.
// Ten is the default value.
var SALT_WORK_FACTOR = 10;

var UserSchema = new mongoose.Schema({
  username: { type: String, index: { unique: true } },
  password: { type: String},
  // email: { type: String},
  first_name: { type: String },
  last_name: { type: String },
  location: { type: String },
  bio: { type: String },
  picture_url: { type: String },
  is_teacher: { type: Boolean, default: false },
  skills: { type: Array },
  avg_rating: { type: Number, default: null },
  total_ratings: { type: Number, default: null },
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
  account_balance: { type: Number, default: 0 },
  transaction_history: { type: Array }
});

// convert password to a hash before saving.
UserSchema.pre('save', function(next){
  var user = this;
  if (user.password){ //for local bcrypt strategy only
    // if the password hasn't changed, then there's no need to proceed with salt generation
    if(!user.isModified('password')){
      return next();
    }

    // generate the salt
    bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt){
      if(err){ return next(err); }

      // hash the passowrd along with the newly generated salt
      bcrypt.hash(user.password, salt, null, function(err, hash){
        if(err){ return next(err); }

        // the password associated with the model is stored at user.password
        // we need to replace that value with the new hash before saving
        user.password = hash;
        next();
      });
    });
  }else{
    next();
  }
});

UserSchema.methods.comparePassword = function(guessedPassword, cb){
  bcrypt.compare(guessedPassword, this.password, function(err, isMatch){
    if(err){ return cb(err); }
    cb(null, isMatch);
  });
};

// compile schema into a model, which is a class from which we construct documents.
// export the model to make available to others.
module.exports = mongoose.model('User', UserSchema);


