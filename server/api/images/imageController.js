var Class = require('../../database/models/classModel.js'),
    User = require('../../database/models/userModel.js');
    awsConfig = require('./awsConfig');

module.exports.imageErrors = function(req, res, next){
  if(!req.files || !req.files.file){
    console.log('no req.files or req.files.file or both');
    return res.status(403).send('expected multipart/form-data encoding with an image file associated with the file key');
  }
  if(!req.body.name){
    console.log('no req.body.name');
    return res.status(403).send('expected a username or className with request to generate unique filename');
  }
  if (!/^image\/(jpe?g|png|gif)$/i.test(req.files.file.mimetype)) {
    console.log('wrong mimetype');
    return res.status(403).send('expected image file').end();
  }
  next();
};

module.exports.imageUpload = function(req, res, next){
  var type = req.path.split('/')[1] === 'user' ? '-profile.' : '-banner.';
  var photoId = req.body.name + type + req.files.file.extension;
  awsConfig.s3uploader(req.files.file.path, photoId, function(err, data){
    if(err){
      return res.status(500).send('failed to upload to s3').end();
    }
    res.status(200).send(data.Location.replace(/"/g, '&quot;')).end();
  });
};