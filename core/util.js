'use strict'
const fs = require('fs');
const path = require('path');
const readline = require("readline");
const chalk = require('chalk');
const crypto = require('crypto')
const os = require('os');

const RootPath = path.join(os.homedir(),"HomeKitDeviceStack");
const ConfigPath = path.join(RootPath,"config.json");
const HomeKitPath = path.join(RootPath,"HomeKitPersist");

const CheckNewEV = function()   
{
    if(!fs.existsSync(ConfigPath))
    {
    
        fs.mkdirSync(RootPath)
        Reset();
    }
}

const getRndInteger = function (min, max)
{
    return Math.floor(Math.random() * (max - min)) + min;
}
const genMAC = function ()
{
    var hexDigits = "0123456789ABCDEF";
    var macAddress = "";
    for (var i = 0; i < 6; i++)
    {
        macAddress += hexDigits.charAt(Math.round(Math.random() * 15));
        macAddress += hexDigits.charAt(Math.round(Math.random() * 15));
        if (i != 5) macAddress += ":";
    }

    return macAddress;
}
const makeID = function (length)
{
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++)
    {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const updateRouteConfig = function(Config)
{
    const CFF = fs.readFileSync(ConfigPath, 'utf8');
    const ConfigOBJ = JSON.parse(CFF);

    ConfigOBJ.routes = Config;

    saveConfig(ConfigOBJ);

}

const updateMQTT = function(Config)
{
    const CFF = fs.readFileSync(ConfigPath, 'utf8');
    const ConfigOBJ = JSON.parse(CFF);

    ConfigOBJ.enableIncomingMQTT = Config.enableIncomingMQTT;
    ConfigOBJ.MQTTBroker = Config.MQTTBroker;
    ConfigOBJ.MQTTTopic = Config.MQTTTopic;

    if(!ConfigOBJ.hasOwnProperty('MQTTOptions'))
    {
        ConfigOBJ.MQTTOptions = {}
    }

    ConfigOBJ.MQTTOptions.username = Config.username
    ConfigOBJ.MQTTOptions.password = Config.password

    saveConfig(ConfigOBJ);

}

const appendAccessoryToConfig = function(Accessory)
{
    const CFF = fs.readFileSync(ConfigPath, 'utf8');
    const ConfigOBJ = JSON.parse(CFF);

    ConfigOBJ.accessories.push(Accessory);

    saveConfig(ConfigOBJ);

}

const editAccessory = function(Accessory, username)
{
    const CFF = fs.readFileSync(ConfigPath, 'utf8');
    const ConfigOBJ = JSON.parse(CFF);

  
    const TargetAc = ConfigOBJ.accessories.filter(a => a.username == username)[0]
   

    const Keys = Object.keys(Accessory);

    for(let i = 0;i<Keys.length;i++)
    {
        if(TargetAc.hasOwnProperty(Keys[i]))
        {
            TargetAc[Keys[i]] = Accessory[Keys[i]];
        }
    }

   

    saveConfig(ConfigOBJ);
  

}

const saveBridgeConfig = function(config)
{
    const CFF = fs.readFileSync(ConfigPath, 'utf8');
    const ConfigOBJ = JSON.parse(CFF);

    ConfigOBJ.bridgeConfig = config;

    saveConfig(ConfigOBJ);
}

const saveConfig = function(config)
{
    fs.writeFileSync(ConfigPath, JSON.stringify(config), 'utf8', function (err)
    {
        if (err)
        {
            console.log(" Could not right to the config file.");
            process.exit(0);

        }
        
    })
}



const _deleteFolderRecursive = function (path)
{
    try
    {
        if (fs.existsSync(path))
        {
            fs.readdirSync(path).forEach(function (file, index)
            {
                const curPath = path + "/" + file;
                if (fs.lstatSync(curPath).isDirectory())
                {
                    _deleteFolderRecursive(curPath);
                }
                else
                {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    }
    catch(er)
    {
        console.log(" Could not fully wipe Cache data.");
        process.exit(0);
    }
   
};


const checkPassword = function()
{
    if (process.argv.length > 3)
    {
        if(process.argv[2] == "passwd")
        {
            const NPWD =  process.argv[3];
            const PW = crypto.createHash('md5').update(NPWD).digest("hex");

            const CFF = fs.readFileSync(ConfigPath, 'utf8');
            const ConfigOBJ = JSON.parse(CFF);

            ConfigOBJ.loginPassword = PW;
            saveConfig(ConfigOBJ);

            console.log(chalk.keyword('yellow')(" Password has been set."))
            console.log('')

            process.exit(0);


        }

    }
}

const deleteAccessory = function(id)
{
    const CFF = fs.readFileSync(ConfigPath, 'utf8');
    const ConfigOBJ = JSON.parse(CFF);

    
    const NA =  ConfigOBJ.accessories.filter(a=> a.username != id)
    ConfigOBJ.accessories = NA;
    
    saveConfig(ConfigOBJ);

    
}

const checkReset = function ()
{
    if (process.argv.length > 2)
    {
        if (process.argv[2] == "reset")
        {


            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });

            console.log(chalk.keyword('yellow')(" -- WARNING --"))
            console.log('')
            console.log(chalk.keyword('yellow')(" HomeKit Device Stack is about to be RESET!!."))
            console.log(chalk.keyword('yellow')(" This will."))
            console.log('')
            console.log(chalk.keyword('yellow')(" - Delete all your Accessories (Including any CCTV Cameras)."))
            console.log(chalk.keyword('yellow')(" - Destroy the Bridge hosting those Accessories."))
            console.log(chalk.keyword('yellow')(" - Delete all HomeKit cache data."))
            console.log(chalk.keyword('yellow')(" - Delete all HomeKit Device Stack Configuration."))
            console.log(chalk.keyword('yellow')(" - Discard any Accessory identification."))
            console.log(chalk.keyword('yellow')(" - Reset the login details for the UI."))
            console.log('')
            console.log(chalk.keyword('yellow')(" Evan if you recreate Accessories, you will need to re-enroll HomeKit Device Stack on your iOS device."))
            console.log('')

            rl.question(" Continue? (y/n) :: ", function (value)
            {
                if (value.toUpperCase() == 'Y')
                {
                    console.log('')
                    Reset();
                    console.log(' Homekit Device Stack has been reset.');
                    console.log('')
                    process.exit(0);

                }
                else
                {
                    process.exit(0);
                }

            });

            return true
        }
        else{
            return false;
        }
    }
}

const Config = {
    "loginUsername": "admin",
    "loginPassword": "21232f297a57a5a743894a0e4a801fc3",
    "wsCommPort": 7990,
    "webInterfacePort": 7989,
    "enableIncomingMQTT": "false",
    "MQTTBroker": "mqtt://test.mosquitto.org",
    "MQTTTopic": "homekit-device-stack/+",
    "MQTTOptions": {
        "username":"",
        "password":""
    },
    "bridgeConfig": {
        "pincode": "",
        "username": "",
        "setupID": "",
        "serialNumber": ""
    },
    "routes": {
        "NodeRed": {
            "type": "HTTP",
            "destinationURI": "http://10.0.0.2:1880/HKDS"
        },
        "UDPBroadcast": {
            "type": "UDP",
            "address": "255.255.255.255",
            "port": 34322
        },
        "FileOutput": {
            "type": "FILE",
            "directory": "DeviceChangeEvents"
        },
        "MQTTBroker": {
            "type": "MQTT",
            "broker": "mqtt://test.mosquitto.org",
            "topic": "homekitdevicestack",
            "MQTTOptions": {
                "username":"",
                "password":""
            }
        }
    },
    "accessories": []
}

const Reset = function ()
{
    if(fs.existsSync(ConfigPath))
    {
        console.log(' Clearing Configuration')

        try
        {
    
            fs.unlinkSync(ConfigPath);
        }
        catch(er)
        {
            console.log(" Could not delete config file.");
            process.exit(0);
        }
    }
   
    
    saveConfig(Config);
   

    console.log(' Wiping HomeKit cache.')
    
    _deleteFolderRecursive(HomeKitPath)

}

module.exports = {
    getRndInteger: getRndInteger,
    genMAC: genMAC,
    makeID: makeID,
    saveConfig: saveConfig,
    appendAccessoryToConfig:appendAccessoryToConfig,
    checkReset:checkReset,
    editAccessory:editAccessory,
    saveBridgeConfig:saveBridgeConfig,
    updateRouteConfig:updateRouteConfig,
    checkPassword:checkPassword,
    deleteAccessory:deleteAccessory,
    updateMQTT:updateMQTT,
    ConfigPath:ConfigPath,
    HomeKitPath:HomeKitPath,
    RootPath:RootPath,
    CheckNewEV:CheckNewEV
}
