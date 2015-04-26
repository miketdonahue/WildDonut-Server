var paymentController = require('./paymentController.js');

module.exports = function(app) {
  app.post('/charges', paymentController.createTransaction);
  app.post('/withdrawals', paymentController.createWithdrawal);
  app.get('/:id/balance', paymentController.getAccountBalance);
};
