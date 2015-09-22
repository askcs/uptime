var CM = require('ask-cm');
var _ = require('underscore');
var CheckEvent = require('../../models/checkEvent');

exports.initWebApp = function(options) {
  var config = options.config.sms;
  var cm = new CM(config.userId, config.username, config.password);

  CheckEvent.on('afterInsert', function(checkEvent) {
    if(config.needsTag === false || checkEvent.tags.indexOf("sms") > -1) {
      checkEvent.findCheck(function (err, check) {
        if (err) return console.error(err);

        var message = check.name + ' ';
        switch (checkEvent.message) {
          case 'down':
            message += 'went down ' + checkEvent.details;
            break;
          case 'up':
            if (checkEvent.downtime) {
              message += 'went back up after ' + Math.floor(checkEvent.downtime / 1000) + 's of downtime';
            } else {
              message += 'is now up';
            }
            break;
        }

        var numbers = config.numbers;
        _.each(numbers, function(number){
          cm.sendSMS("ASK Monitor", number, message, function(err, res) {
            if(err) {
              return console.log(err);
            }

            console.log("Message send to: ", number);
          });
        })
      });
    }
  });
  console.log('Enabled SMS notifications');
};