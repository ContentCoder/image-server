/* 
 * image.js 
 * 
 * Image routes. 
 */

exports.getThumbnail = getThumbnail;

var util = require('util'),
    path = require('path'),
    mime = require('mime'),
    aws  = require('aws-sdk'),
    
    response = require(path.join(__dirname, '../response.js')), 

    tb = require(path.join(__dirname, '../modules/image-thumbnail-buffer/thumbnail-buffer.js'));

aws.config.loadFromPath(path.join(__dirname, '../awsconfig.json'));
var s3 = new aws.S3();

function getThumbnail(req, res) {
  if (!req.parsedUrl.query.imagebucket ||
      !req.parsedUrl.query.imagekey ||
      !req.parsedUrl.query.thumbbucket ||
      !req.parsedUrl.query.thumbkey) {
    response.json(res, 400, {message: '400 Bad Request'});
    return;
  }

  var image   = {},
      thumb   = {},
      options = {};
  image.Bucket    = req.parsedUrl.query.imagebucket;
  image.Key       = req.parsedUrl.query.imagekey;
  thumb.Bucket    = req.parsedUrl.query.thumbbucket;
  thumb.Key       = req.parsedUrl.query.thumbkey;
  options.width   = req.parsedUrl.query.width;
  options.height  = req.parsedUrl.query.height;
  options.crop    = req.parsedUrl.query.crop;
  thumbnail(image, thumb, options, function(err, data) {
    if (err) {
      response.json(res, 500, err);
    } else {
      response.json(res, 200, data);
    }
  });
}

/* 
 * Create S3 image thumbnail.
 * 
 * Parameters: 
 *  image - (Object) S3 image object
 *    Bucket - (String) image bucket
 *    Key - (String) image key
 *  thumb - (Object) S3 thumbnail object
 *    Bucket - (String) thumbnail bucket
 *    Key - (String) thumbnail key
 *  options - (Object) thumbnail options
 *    width - (Number) thumbnail width
 *    height - (Number) thumbnail height
 *    crop - (String) crop method, 'Center' or 'North'
 * 
 * Callback:
 *  callback - (Function) function(e) {}
 *    err - (Object) error object, set to null if succeed
 *    data - (Object) extra data
 *      imageETag - (String) image etag
 *      thumbETag - (String) thumbnail etag
 *      thumbType - (String) thumbnail mime type
 */
function thumbnail(image, thumb, options, callback) {
  s3.getObject(image, function(err, imageData) {
    if (err) {
      callback(err, null);
      return;
    }

    var data = {};
    data.imageETag = imageData.ETag;
    tb.create(imageData.Body, options, function(err, buf, info) {
      if (err) {
        callback(err, null);
        return;
      }

      data.thumbType    = mime.lookup(info.format);
      thumb.Body        = buf;
      thumb.ContentType = data.thumbType;
      s3.putObject(thumb, function(err, thumbData) {
        if (err) {
          callback(err, null);
          return;
        }

        data.thumbETag = thumbData.ETag;
        callback(null, data);
      });   // s3.putObject
    });   // tb.create
  });   // s3.getObject
}

