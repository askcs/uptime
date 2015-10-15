var _ = require('underscore');
var CheckEvent = require('../../models/checkEvent');
var AWS = require('aws-sdk');
AWS.config.region = 'eu-west-1';
var ec2 = new AWS.EC2();

exports.initWebApp = function(options) {
  var config = options.config.aws;

  console.log(config['backend-experiment']);

  CheckEvent.on('afterInsert', function(checkEvent) {
    checkEvent.findCheck(function (err, check) {
      if (err) return console.error(err);

      // Only reboot when it's down
      if(checkEvent.message == "down") {

        _.each(checkEvent.tags, function(tag){
          var tagparts = tag.split(":");
          if(tagparts[0] == "aws") {
            var type = tagparts[1];

            if(_.has(config, type)) {
              var conf = config[type];
              createNewInstance(conf);
            } else {
              console.console("No config found for type: ",type);
            }
          }
        });
      }
    });
  });
  console.log('Enabled AWS actions');
};

function createNewInstance(config) {

  config.params.MaxCount = 1;
  config.params.MinCount = 1;

  ec2.runInstances(config.params, function(err, data) {
    if (err) {
      console.log("Could not create instance", err);
      return;
    }

    var instanceId = data.Instances[0].InstanceId;
    console.log("Created instance", instanceId);

    // Add tags to the instance
    if (config.tags) {
      var params = {
        Resources: [instanceId], Tags: config.tags
      };
      ec2.createTags(params, function (err) {
        console.log("Tagging instance", err ? "failure" : "success");
      });
    }

    // Associate EIP
    if (config.eip) {

      var params = {
        InstanceIds: [instanceId]
      }
      ec2.waitFor('instanceRunning', params, function(err, data) {

        if (err) {
          console.log("Failed waiting for instance to be running", err);
          return;
        }

        console.log("Instance Running: ", data);

        var eipParams = {
          InstanceId: instanceId,
          AllocationId: config.eip,
          AllowReassociation: true
        }
        ec2.associateAddress(eipParams, function (err, data) {
          if (err) {
            console.log("Failed Associating eip", err);
            return;
          }
          console.log("Successfully Associating eip");
        });
      });
    }

    if(config.elb) {
      var params = {
        Instances: [ {
          InstanceId: instanceId
        },
        ],
        LoadBalancerName: config.elb
      };
      elb.registerInstancesWithLoadBalancer(params, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else     console.log(data);           // successful response
      });
    }
  });
}