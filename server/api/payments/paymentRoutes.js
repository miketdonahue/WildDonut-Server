var paymentController = require('./paymentController.js');

module.exports = function(app) {
  //app === paymentRouter injected form middleware.js

  // app.get('/', paymentController.getAllClasses);
  app.post('/charges', paymentController.createTransaction);
};