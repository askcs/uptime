var _ = require('underscore');
var CheckEvent = require('../../models/checkEvent');
var Docker = require('dockerode');
var AWS = require('aws-sdk');
AWS.config.region = 'eu-west-1';
var ec2 = new AWS.EC2();

exports.initWebApp = function(options) {
  var config = options.config.docker;

  CheckEvent.on('afterInsert', function(checkEvent) {
    checkEvent.findCheck(function (err, check) {
      if (err) return console.error(err);

      // Only reboot when it's down
      if(checkEvent.message == "down") {

        _.each(checkEvent.tags, function(tag){
          var tagparts = tag.split(":");
          if(tagparts[0] == "docker") {
            collectIPAddresses(tagparts[1], function(ips){
              _.each(ips, function(ip){
                var docker = new Docker({host: 'http://' + ip, port: 2375});
                var container = docker.getContainer('askbackend');
                if(container) {
                  console.log("Starting container at url: http://" + ip + ":2375" );
                  container.restart(function (err, data) {
                    if(err) console.error("Failed to restart container: ",err);
                    else console.log(data);
                  });
                }
              });
            })
          }
        });
      }
    });
  });
  console.log('Enabled Docker actions');
};

function collectIPAddresses(tag, callback) {
  var params = {
    Filters : [
      {
        Name: 'tag-key',
        Values: [
          'monitor',
        ]
      },
      {
        Name: 'tag-value',
        Values: [
          tag,
        ]
      }
    ]
  }
  ec2.describeInstances(params, function(err, data) {
    var ips = [];
    if (err) console.log(err, err.stack); // an error occurred
    else {
      _.each(data.Reservations, function (reservation) {
        _.each(reservation.Instances, function (instance) {
          if (instance.State.Code == 16) {
            ips.push(instance.PrivateIpAddress);
          }
        });
      });

      callback(ips)
    }
  });
}
