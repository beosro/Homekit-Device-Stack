const mqtt = require('mqtt')
const util = require('./util');
const config = require(util.ConfigPath);

const MQTT = function(Accesories, CB)
{
    const _Accessories = Accesories;

    if(config.hasOwnProperty("enableIncomingMQTT") && config.enableIncomingMQTT == 'true')
    {
        if(!config.hasOwnProperty("MQTTOptions"))
        {
            config.MQTTOptions = {};
        }
        else if(config.MQTTOptions.username.length<1)
        {
            delete config.MQTTOptions["username"]
            delete config.MQTTOptions["password"]
        }
        
        console.log(" Starting MQTT Client")

        try
        {
            const MQTTC = mqtt.connect(config.MQTTBroker,config.MQTTOptions)

            MQTTC.on('error',function(err)
            {
                console.log(" Could not connect to MQTT Broker : "+err);
                process.exit(0);
            })
            
            MQTTC.on('connect',function()
            {
                MQTTC.subscribe(config.MQTTTopic,function(err)
                {
                    if(!err)
                    {
                        MQTTC.on('message',function(topic,message)
                        {
                            const sPL = message.toString();
                            const PL = JSON.parse(sPL);
                            const TargetAccessory = topic.split('/')[1];
    
                            const Ac = _Accessories[TargetAccessory]
                            Ac.setCharacteristics(PL)
    
    
                        })
    
                        CB();
                    }
                    else
                    {
                        console.log(" Could not subscribe to Topic : "+err);
                        process.exit(0);
                    }
                })
            })
        }
        catch(err)
        {
            console.log(" Could not connect to MQTT Broker : "+err);
            process.exit(0);
        }
        
    }
    else
    {
        CB();
    }
    
}

module.exports = {
    MQTT: MQTT
}