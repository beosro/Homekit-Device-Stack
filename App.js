const util = require('./core/util');

// Fresh Environment ?
util.CheckNewEV();

const fs = require('fs');
const chalk = require('chalk');
const Server = require('./core/server');
const Accessory = require('./core/accessory');
const routes = require('./core/routes');
const config = require(util.ConfigPath);
const ip = require("ip");
const mqtt = require('./core/mqtt');
const path = require('path');

console.log('\033[2J');

// Check if we are being asked for a Reset.
if(util.checkReset())
{
    return; // stop (whilst we check they know what they are doing.)
}

// Check password reset
if(util.checkPassword())
{
    return; // stop
}

// Banner
console.log(chalk.keyword('orange')(" HomeKit"))
console.log(chalk.keyword('white')(" Device Stack"))
console.log(chalk.keyword('white')(" "))
console.log(chalk.keyword('white')(" For the Smart Home Enthusiast, For the curious."))
console.log(chalk.keyword('orange')(" _________________________________________________________________"))
console.log(" ")

'use strict'

if (config.bridgeConfig.pincode.length < 10)
{
    // Genertae a Bridge
    config.bridgeConfig.pincode = util.getRndInteger(100, 999) + "-" + util.getRndInteger(10, 99) + "-" + util.getRndInteger(100, 999);
    config.bridgeConfig.username = util.genMAC();
    config.bridgeConfig.setupID = util.makeID(4);
    config.bridgeConfig.serialNumber = util.makeID(12)
    util.saveBridgeConfig(config.bridgeConfig)

    // Create a demo accessory for new configs (accessories will heronin be created via the ui)
    const DemoAccessory = {

        "type": "SWITCH",
        "name": "Switch Accessory Demo",
        "description": "An example basic on/off accessory to get you started.",
        "route": "NodeRed",
        "pincode": util.getRndInteger(100, 999) + "-" + util.getRndInteger(10, 99) + "-" + util.getRndInteger(100, 999),
        "username": util.genMAC(),
        "setupID": util.makeID(4),
        "serialNumber": util.makeID(12)
    }

    config.accessories.push(DemoAccessory)
    util.appendAccessoryToConfig(DemoAccessory)

}

console.log(" Configuring Homekit Bridge")

// Configure Our Bridge
const Bridge = new Accessory.Bridge(config.bridgeConfig)
Bridge.on('PAIR_CHANGE', Paired)
Bridge.on('LISTENING', getsetupURI)

// Routes
const Routes = {
}
function SetupRoutes()
{

    // clear any Routes - to support updating them later
    const Keys = Object.keys(Routes);
    for(let i = 0;i<Keys.length;i++)
    {
        delete Routes[Keys[i]];
    }

    const RouteNames = Object.keys(config.routes);
    for(let i=0;i<RouteNames.length;i++)
    {
        Routes[RouteNames[i]] = routes[config.routes[RouteNames[i]].type];
    }

   
}
// This is also called externally (i.e when updating routes via the UI)
SetupRoutes();

// Configure Our Accessories 
const Accesories = {
}
for (let i = 0; i < config.accessories.length; i++)
{
    let AccessoryOBJ = config.accessories[i]

    console.log(" Configuring Accessory : " + AccessoryOBJ.name + " (" + AccessoryOBJ.type + ")")
    AccessoryOBJ.accessoryID = AccessoryOBJ.username.replace(/:/g, "");

    switch(AccessoryOBJ.type)
    {
        
       default:
            let Acc = new  Accessory.Types[AccessoryOBJ.type].Object(AccessoryOBJ);
            Acc.on('STATE_CHANGE', (PL,O) =>Change(PL, AccessoryOBJ,O))
            Acc.on('IDENTIFY', (P) =>Identify(P, AccessoryOBJ))
            Accesories[AccessoryOBJ.accessoryID] = Acc;
            Bridge.addAccessory(Acc.getAccessory())
            break;
    }
}

console.log(" Publishing Bridge")
Bridge.publish();

console.log(" Starting Client Services")

// Web Server (started later)
const UIServer = new Server.Server(Accesories,Change,Identify,Bridge,SetupRoutes);

// MQTT Client
const MQTTC = new mqtt.MQTT(Accesories, MQTTDone)
function MQTTDone()
{
    UIServer.Start(UIServerDone)
}

function UIServerDone()
{
    const BridgeFileName = path.join(util.HomeKitPath,"AccessoryInfo." + config.bridgeConfig.username.replace(/:/g, "") + ".json");
    if (fs.existsSync(BridgeFileName))
    {
        const IsPaired = Object.keys(require(BridgeFileName).pairedClients)
        UIServer.setBridgePaired(IsPaired.length>0);
    }
    
    // All done.
    const Address = chalk.keyword('red')("http://"+ ip.address()+":" + config.webInterfacePort+"/")
    
    console.log(" "+chalk.black.bgWhite("┌─────────────────────────────────────────────────────────────────────────┐"))
    console.log(" " + chalk.black.bgWhite("|    Goto "+Address+" to start managing your installation.     |"))
    console.log(" "+chalk.black.bgWhite("|    Default username and password is admin                               |"))
    console.log(" " + chalk.black.bgWhite("└─────────────────────────────────────────────────────────────────────────┘"))
}






process.on('exit', function (code)
{
    console.info(' Unpublishing Accessories...')
    console.info(' ')
    Bridge.unpublish(false);
   
});

function getsetupURI(port)
{
  
    config.bridgeConfig.QRData = Bridge.getAccessory().setupURI;
}

function Paired(IsPaired)
{
   
    UIServer.setBridgePaired(IsPaired);
}

function Change(PL, Object,Originator)
{
    if(Object.hasOwnProperty("route"))
    {
        const Payload = {
            "accessory": Object,
            "type": "change",
            "change": PL,
            "source":Originator
        }
    
        Routes[Object.route](config.routes[Object.route],Payload);
    }
   
}

function Identify(paired, Object)
{
    if(Object.hasOwnProperty("route"))
    {
        const Payload = {
            "accessory": Object,
            "type": "identify",
            "isPaired": paired,
        }
    
        Routes[Object.route](config.routes[Object.route],Payload);
    }
   
}



