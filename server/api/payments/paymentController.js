var Class = require('../../database/models/classModel.js');
var studentController = require('../users/studentController');
var User = require('../../database/models/userModel.js');

var stripe = require("stripe")("sk_test_tIKHKvXQwEKRQP1QtSYeZomu"); //test key

module.exports.createTransaction = function(req, res, next){
  
  // Get the stripe token with credit card details submitted by the client form
  var stripeToken = req.body.payRequest.token;
  var class_id = req.body.payRequest.class_id;

  Class.findById(class_id, function(err, classObject){
    if(err){
      res.status(400).send('Bad Request');
    }else if(!classObject){
      res.status(403).send('Class not found');
    }else{
      stripe.charges.create({
        amount: classObject.rate*100, // amount in cents
        currency: "usd",
        source: stripeToken,
        description: classObject.description
      }, function(err, charge) {
        if (err && err.type === 'StripeCardError') {
          // The card has been declined
          res.send("card declined:", err);
        }
        console.log(charge);
        req.body.student_id = req.body.payRequest.user_id;
        req.body.class_id = req.body.payRequest.class_id;
        req.body.transaction_id = charge.id;
        req.body.transaction_amount = charge.amount/100;
        // res.status(201).send("Successfully booked a class", charge);
        studentController.bookClass(req, res, next);
      });
    }
  });
};


module.exports.modifyUserBalance = function(req, res, next){
  var user_id = req.body.teacher_id;
  var transaction_id = req.body.transaction_id;
  var transaction_amount = req.body.transaction_amount;

  User.findById(user_id, function(err, user){
    user.account_balance += transaction_amount; 
    user.transaction_history.push(transaction_id);
    user.save(function(err, user){
      if(err){
        console.log('server error on user save');
      }else if(!user){
        console.log('server error finding user to process the transaction');
      }else{
        res.status(201).send("Successfully booked a class, here is the transaction id:", transaction_id); 

      }
    });
    
  });
};

module.exports.getAccountBalance = function(req, res, next){
  var user_id = req.params.id;

  User.findById(user_id)
  .exec(function(err, user){
    if(err){
      res.status(400).send('Bad request');
    }else if(!user){
      res.status(404).send('Account Balance not found, user could not be found');
    }
    res.json({ '_id' : user._id, 
      'username' : user.username,
      'account_balance' : user.account_balance });
  });
};