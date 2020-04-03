'use strict'
const fs = require('fs');
const path = require('path');
const dgram = require("dgram");
const mqtt = require('mqtt')
const axios = require('axios')

var UDPServer;
const MQTTCs = {};

const HTTP = function (route, payload)
{

  const Copy = JSON.parse(JSON.stringify(payload));

  delete Copy.accessory.pincode;
  delete Copy.accessory.username;
  delete Copy.accessory.setupID;
  delete Copy.accessory.route;
  delete Copy.accessory.name;
  delete Copy.accessory.description;
  delete Copy.accessory.serialNumber;
  Copy["route_type"] = "HTTP"

  const CFG = {
    headers: {
      'Content-Type': 'application/json',
    },
    url: route.destinationURI,
    method: 'post',
    data: Copy
  }

  axios.request(CFG)
    .then(function (res) { })
    .catch(function (err) {
      console.log(" Could not send HTTP request : " + err);
    })

}

const UDP = function (route, payload)
{

  const Copy = JSON.parse(JSON.stringify(payload));

  delete Copy.accessory.pincode;
  delete Copy.accessory.username;
  delete Copy.accessory.setupID;
  delete Copy.accessory.route;
  delete Copy.accessory.name;
  delete Copy.accessory.description;
  delete Copy.accessory.serialNumber;
  Copy["route_type"] = "UDP"


  const JSONs = JSON.stringify(Copy);

  if (UDPServer == null)
  {
    UDPServer = dgram.createSocket("udp4");
    UDPServer.bind(function ()
    {
      UDPServer.setBroadcast(true);

      UDPServer.send(JSONs, 0, JSONs.length, route.port, route.address, function (e, n)
      {
        if (e)
        {
          console.log(" Could not broadcast UDP: " + e);
        }
      });
    });
  }
  else
  {
    UDPServer.send(JSONs, 0, JSONs.length, route.port, route.address, function (e, n)
    {
      if (e)
      {
        console.log(" Could not broadcast UDP: " + e);
      }
    });
  }
}

const MQTT = function (route, payload)
{
  const Copy = JSON.parse(JSON.stringify(payload));

  delete Copy.accessory.pincode;
  delete Copy.accessory.username;
  delete Copy.accessory.setupID;
  delete Copy.accessory.route;
  delete Copy.accessory.name;
  delete Copy.accessory.description;
  delete Copy.accessory.serialNumber;
  Copy["route_type"] = "MQTT"


  if (!MQTTCs.hasOwnProperty(route.broker))
  {
    if (!route.hasOwnProperty("MQTTOptions"))
    {
      route.MQTTOptions = {};
    }
    else if (route.MQTTOptions.hasOwnProperty("username") && route.MQTTOptions.username.length < 1)
    {
      delete route.MQTTOptions["username"]
      delete route.MQTTOptions["password"]
    }


    const MQTTC = mqtt.connect(route.broker, route.MQTTOptions)

    MQTTC.on('error', function (err)
    {
      console.log(" Could not connect to MQTT Broker : " + err);

    })

    MQTTC.on('connect', function ()
    {
      MQTTCs[route.broker] = MQTTC;
      MQTTC.publish(route.topic, JSON.stringify(Copy), null, function () { });

    })
  }
  else
  {
    MQTTCs[route.broker].publish(route.topic, JSON.stringify(Copy), null, function () { });

  }


}

const FILE = function (route, payload)
{

  let Copy = JSON.parse(JSON.stringify(payload));

  delete Copy.accessory.pincode;
  delete Copy.accessory.username;
  delete Copy.accessory.setupID;
  delete Copy.accessory.route;
  delete Copy.accessory.name;
  delete Copy.accessory.description;
  delete Copy.accessory.serialNumber;
  Copy["route_type"] = "FILE"



  const DT = new Date().getTime();
  const Path = path.join(route.directory, DT + '_' + payload.accessory.accessoryID + ".json")
  fs.writeFile(Path, JSON.stringify(Copy), 'utf8', function (err)
  {
    if (err)
    {

      console.log(" Could not write output to file.");


    }

  })
}



module.exports = {

  "HTTP": HTTP,
  "UDP": UDP,
  "FILE": FILE,
  "MQTT": MQTT

}