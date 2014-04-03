/* 
 * response.js 
 * 
 * Response functions.
 */

exports.json         = responseJSON;
exports.dynamoDBItem = responseDynamoDBItem;
exports.s3Object     = responseS3Object;
exports.s3ObjectUrl  = responseS3ObjectUrl;

var util = require('util'),
    path = require('path'), 
    aws  = require('aws-sdk');

aws.config.loadFromPath(path.join(__dirname, 'awsconfig.json'));
var dynamodb = new aws.DynamoDB(), 
    s3       = new aws.S3();

function responseJSON(res, statusCode, msg) {
  var headers = {};
  headers['Content-Type'] = 'application/json; charset=utf-8';

  res.writeHead(statusCode, headers);
  res.end(JSON.stringify(msg));
  util.log(JSON.stringify(msg));
}

function responseDynamoDBItem(res, table, key) {
  var params = {};
  params.TableName = table;
  params.Key = key;
  dynamodb.getItem(params, function(err, item) {
    if (err) {
      responseJSON(res, 500, err);
      return;
    }
    if (item == null) {
      var err = {};
      err.message = 'DynamoDB can not find item.';
      responseJSON(res, 500, err);
      return;
    }

    responseJSON(res, 200, item);
  });
}

function responseS3Object(res, bucket, key) {
  var params = {};
  params.Bucket = bucket;
  params.Key = key;
  s3.getObject(params, function(err, data) {
    if (err) {
      responseJSON(res, 500, err);
      return;
    }

    var headers = {};
    headers['Content-Type']   = data.ContentType;
    headers['Content-Length'] = data.ContentLength;
    headers['ETag']           = data.ETag;
    headers['Last-Modified']  = data.LastModified;

    res.writeHead(200, headers);
    res.end(data.Body);
    util.log('done');
  });
}

function responseS3ObjectUrl(res, bucket, key) {
  var params = {};
  params.Bucket = buket;
  params.Key = key;
  s3.getObjectAcl(params, function(err, data) {
    if (err) {
      responseJSON(res, 500, err);
      return;
    }

    for (i in data.Grants) {
      if (Grants[i].Grantee.DisplayName == 'Everyone' && 
          Grants[i].Grantee.Permission == "READ") {
        var msg = {};
        msg.url = config.S3URLROOT + '/' + bucket + '/' + key;
        responseJSON(res, 200, msg);
        return;
      }
    }

    params.Expires = 60;
    s3.getSignedUrl(params, function(err, url) {
      if (err) {
        responseJSON(res, 500, err);
        return;
      }

      var msg = {};
      msg.url = url;
      msg.expires = 60;
      responseJSON(res, 200, msg);
    });
  });
}

