var Class = require('../../database/models/classModel.js');
var User = require('../../database/models/userModel.js');

var stripe = require("stripe")("sk_test_tIKHKvXQwEKRQP1QtSYeZomu"); //test key

module.exports.createTransaction = function(req, res, next){
  
  // Get the stripe token with credit card details submitted by the client form
  var stripeToken = req.body.payRequest.token;
  var class_id = req.body.payRequest.class_id;
  console.log(class_id);
  console.log(stripeToken);

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
        } else if (err) {
          res.status(403).send(err);
        } else {
          req.body.transaction_id = charge.id;
          req.body.transaction_amount = charge.amount/100;
          bookClass(req, res, next);
        }
      });
    }
  });
};

module.exports.createWithdrawal = function(req, res, next){
  // Look up the user and get his balance
  // Create a "stripe" recipient 
  // After succesfully creating a recipient, create a "stripe" transaction
  // On succesful transaction, decrease the user's account balance
  var stripeToken = req.body.payRequest.token;
  var user_id = req.user;

  User.findById(user_id, function(err, user){
    if(err){
      res.status(400).send('Bad Request');
    } else if(!user){
      res.status(403).send('User not found');
    } else{
      //Create a recipient
      if(user.account_balance > 0) {
        stripe.recipients.create({
          name: user.first_name + ' ' + user.last_name, 
          type: "individual",
          card: stripeToken,
          email: 'example@yahoo.com'
        }, function(err, recipient) {
          if (err) {
            res.status(403).send("can't create recipient:", err);
          } else {
            stripe.transfers.create({
              amount: user.account_balance*100, // amount in cents
              currency: "usd",
              recipient: recipient.id,
              statement_descriptor: "Refund from Miyagi for $" + user.account_balance
            }, function(err, withdrawal) {
              if (err) {
                res.send("can't create withdrawal:", err);
              } else {
                req.body.transaction_amount = - withdrawal.amount/100;
                req.body.user_id = user_id;
                modifyUserBalance(req, res, next);
              }
            });
          }
        });  
      } else {
        res.status(403).send("You have insuficient funds");
      }
    }
  });
};

module.exports.getAccountBalance = function(req, res, next){
  var user_id = req.user;

  User.findById(user_id)
  .exec(function(err, user){
    if(err){
      res.status(400).send('Bad request');
    } else if(!user){
      res.status(404).send('Account Balance not found, user could not be found');
    } else {
      res.json({ 
        '_id' : user._id, 
        'username' : user.username,
        'account_balance' : user.account_balance 
      });
    }
  }); 
};

var modifyUserBalance = function(req, res, next){
  var user_id = req.body.user_id;
  var transaction_id = req.body.transaction_id;
  var transaction_amount = req.body.transaction_amount;

  User.findById(user_id, function(err, user){
    if(err){
      res.status(400).send('Bad request');
    } else if(!user){
      res.status(404).send('User could not be found');
    } else {
      user.account_balance += transaction_amount; 
      user.transaction_history.push(transaction_id);
      user.save(function(err, user){
        if(err){
          console.log('server error on user save');
        } else if(!user){
          console.log('server error finding user to process the transaction');
        } else{
          res.status(201).send("Successfully transaction,  transaction id:", req.body); 
        }
      });
    }
  });
};

var bookClass = function(req, res, next){
  var class_id = req.body.payRequest.class_id;
  var student_id = req.body.payRequest.student_id;
  var obj = {is_booked: true, student: student_id};

  Class.findByIdAndUpdate(class_id, obj, {new: true} ,function(err, classObject){
    console.log(classObject);
    console.log(err);
    if(err){
      res.status(400).send('Bad Request');
    } else if(!classObject){
      res.status(403).send('Class not found');
    } else{
      req.body.user_id = classObject.teacher;
      modifyUserBalance(req, res, next);
    }
  });  
};