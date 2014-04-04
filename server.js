/* 
 * server.js 
 * 
 * API server.
 */

var util = require('util'),
    path = require('path'),
    http = require('http'),
    url	 = require('url'), 

    config   = require(path.join(__dirname, 'config.json')), 
    response = require(path.join(__dirname, 'response.js')),
 
    image = require(path.join(__dirname, 'routes/image.js'));

util.log(JSON.stringify(config, null, 2));

var port = process.env.PORT || config.PORT;

http.createServer(function(req, res) {
  util.log(req.method + ' ' + req.url);
  req.parsedUrl = url.parse(req.url, true);
  switch (req.method + req.parsedUrl.pathname) {
  case 'GET/image/thumbnail':
    image.getThumbnail(req, res);
    return;
  default:
    response.json(res, 404, {message: '404 Not Found'});
    return;
  }
}).listen(port);

util.log(util.format('Image server running at %d port...', port));

