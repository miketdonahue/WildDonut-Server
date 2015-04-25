var multer = require('multer'),
    imageController = require('./imageController');

module.exports = function(app) {

  app.post('/user/s3upload', multer({ limits: { fileSize: 10*1024*1024 } }), imageController.imageErrors, imageController.imageUpload);
  app.post('/class/s3upload', multer({ limits: { fileSize: 10*1024*1024 } }), imageController.imageErrors, imageController.imageUpload);

};
