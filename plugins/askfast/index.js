var fs         = require('fs');
var CheckEvent = require('../../models/checkEvent');
var ejs        = require('ejs');

exports.initWebApp = function(options) {
  var config = options.config.email;
  var mailer = nodemailer.createTransport(config.method, config.transport);
  var templateDir = __dirname + '/views/';
  CheckEvent.on('afterInsert', function(checkEvent) {
    if (!config.event[checkEvent.message]) return;
    checkEvent.findCheck(function(err, check) {
      if (err) return console.error(err);


    });
  });
  console.log('Enabled Email notifications');
};