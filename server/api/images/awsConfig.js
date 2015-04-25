// required modules
var fs = require('fs'),
    aws = require('aws-sdk');

// import aws credentials
var AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID || require('./credentials').aws_access_key_id,
    AWS_SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY || require('./credentials').aws_secret_access_key;

// configure aws and instantiate photoBucket instance
aws.config.update({accessKeyId: AWS_ACCESS_KEY, secretAccessKey: AWS_SECRET_KEY});
var photoBucket = new aws.S3({params: {Bucket: 'miyagi-photos'}});

module.exports.s3uploader = function(file, newName, callback){
  photoBucket.upload({
    ACL: 'public-read',
    Body: fs.createReadStream(file),
    Key: newName.toString(),
    ContentType: 'application/octet-stream'
  }).send(callback);
};
