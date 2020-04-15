'use strict'
const express = require('express')
const websocket = require('ws')
const crypto = require('crypto')
const mustache = require('mustache');
const fs = require('fs');
const bodyParser = require('body-parser')
const Accessory = require('./accessory');
const util = require('./util');
const config = require(util.ConfigPath);



const Server = function (Accesories, ChangeEvent, IdentifyEvent, Bridge, RouteSetup)
{

    const _Clients = {};
    
    let _Paired = false;
    const _Accessories = Accesories
    const _ChangeEvent = ChangeEvent;
    const _IdentifyEvent = IdentifyEvent
    const _Bridge = Bridge;
    const _RouteSetup = RouteSetup

     // Template Files
     const Templates = {
        "Login": process.cwd() + "/ui/templates/login.tpl",
        "Index": process.cwd() + "/ui/templates/index.tpl",
        "Main": process.cwd() + "/ui/templates/main.tpl",
        "Setup": process.cwd() + "/ui/templates/setup.tpl",
        "Routes": process.cwd() + "/ui/templates/routes.tpl",
        "MQTT": process.cwd() + "/ui/templates/mqtt.tpl"
    }


    this.Start = function(CB)
    {
        console.log(" Starting Web Server")
        console.log(" ")
        // Express
        const app = express()
        app.use(bodyParser.json())
        app.use('/static', express.static(process.cwd() + '/ui/static'))
        app.get('/:pwd/accessories/', _processAccessoriesGet);
        app.get('/:pwd/accessories/:id', _processAccessoryGet);
        app.put('/:pwd/accessories/:id', _processAccessorySet);
        app.get('/', _sendIndex);
        try
        {
            app.listen(config.webInterfacePort)
        }
        catch (err)
        {
            console.log(" Could not start Web Server : "+err);
            process.exit(0);
        }
    
    
    
        // Comms Socket
        const WS = new websocket.Server({ port: config.wsCommPort });

        function heartbeat()
        {
            this.isAlive = true;
        }
    
        // Once a WS is connected - send them the Login page
        WS.on('connection', function (client,req)
        {
            const Address = req.connection.remoteAddress

            _Clients[Address] = {};
            
            _Clients[Address].connection = client;
            _Clients[Address].connection.isAlive = true;
            _Clients[Address].connection.on('pong',heartbeat)
            _sendLogin(Address)
            _Clients[Address].connection.on('message', (m) => _processClientMessage(m, Address));
        });
    
        setInterval(function()
        {
            const ClientKeys = Object.keys(_Clients)

            for (let i = 0; i < ClientKeys.length; i++)
            {
                if(_Clients[ClientKeys[i]].connection.isAlive == false)
                {
                    _Clients[ClientKeys[i]].connection.terminate();
                    delete _Clients[ClientKeys[i]];
                }
                else
                {
                    _Clients[ClientKeys[i]].connection.isAlive = false;
                    _Clients[ClientKeys[i]].connection.ping(null);

                }
            }


        },15000)
       
    
        CB();
    }

    function _sendLogin(client)
    {
        const TPL = fs.readFileSync(Templates.Login, 'utf8');
        const HTML = mustache.render(TPL);

        const PL = {
            "type": "page",
            "content": HTML
        }
        _Clients[client].connection.send(JSON.stringify(PL))
        
    }



    // Send Index Page (Starts the WS connection in doing so)
    function _sendIndex(req, res)
    {
        const TPL = fs.readFileSync(Templates.Index, 'utf8');
        const HTML = mustache.render(TPL, { "Config": config });

        res.send(HTML)
    }

    function _processClientMessage(message, client)
    {
       

        const Req = JSON.parse(message)

        switch (Req.type)
        {
            case "mqtt":
                if(!_Clients[client].hasOwnProperty("Authed"))
                {
                   _sendLogin(client);
                   return;
                }

                _RenderStaticUI(client, Templates.MQTT)

                break;
            case "main":
                if(!_Clients[client].hasOwnProperty("Authed"))
                {
                   _sendLogin(client);
                   return;
                }

                _RenderStaticUI(client, Templates.Main)
                break;

            case "routes":
                if(!_Clients[client].hasOwnProperty("Authed"))
                {
                   _sendLogin(client);
                   return;
                }

                _RenderStaticUI(client, Templates.Routes);
                break;

            case "login":
                _login(Req, client);
                break;

            case "add":
                if(!_Clients[client].hasOwnProperty("Authed"))
                {
                   _sendLogin(client);
                   return;
                }

                _showAdd(Req, client)
                break;

            case "edit":
                if(!_Clients[client].hasOwnProperty("Authed"))
                {
                   _sendLogin(client);
                   return;
                }

                _showEdit(Req, client)
                break;

            case "createAccessory":
                if(!_Clients[client].hasOwnProperty("Authed"))
                {
                   _sendLogin(client);
                   return;
                }

                _createAccessory(Req.config, client)
                break;

            case "editAccessory":
                if(!_Clients[client].hasOwnProperty("Authed"))
                {
                   _sendLogin(client);
                   return;
                }

                _editAccessory(Req.config, Req.username, client)
                break;

            case "saveRoutes":
                if(!_Clients[client].hasOwnProperty("Authed"))
                {
                   _sendLogin(client);
                   return;
                }

                _saveRoutes(Req.routeConfig, client);
                break;

            case "deleteaccessory":
                if(!_Clients[client].hasOwnProperty("Authed"))
                {
                   _sendLogin(client);
                   return;
                }

                _deleteAccessory(Req.accessory, client);
                break;

            case "savemqtt":
                if(!_Clients[client].hasOwnProperty("Authed"))
                {
                   _sendLogin(client);
                   return;
                }

                _saveMQTT(Req.MQTTConfig,client);
                break;


        }
    }

    function _RenderStaticUI(client, template)
    {
        const TypeArray = [];
        const Keys = Object.keys(Accessory.Types);
        for (let i = 0; i < Keys.length; i++)
        {
            TypeArray.push({ "Key": Keys[i], "Value": Accessory.Types[Keys[i]] })
        }

       

        const TPL = fs.readFileSync(template, 'utf8');
        const HTML = mustache.render(TPL, { "TemplateLookup": JSON.stringify(Accessory.Types,null, 2), "AvailableTypes": TypeArray, "Config": config, "Routes": JSON.stringify(config.routes, null, 2) });

        const PL = {
            "type": "page",
            "content": HTML
        }

        _Clients[client].connection.send(JSON.stringify(PL))

        
    }

    function _saveMQTT(Config,client)
    {

        config.enableIncomingMQTT = Config.enableIncomingMQTT;
        config.MQTTBroker = Config.MQTTBroker;
        config.MQTTTopic = Config.MQTTTopic;
    
        if(!config.hasOwnProperty('MQTTOptions'))
        {
            config.MQTTOptions = {}
        }
    
        config.MQTTOptions.username = Config.username
        config.MQTTOptions.password = Config.password


        util.updateMQTT(Config);
        _RenderStaticUI(client, Templates.Main)

    }

    function _deleteAccessory(accessoryId, client)
    {
        //removeAccessory
        const Acs = _Bridge.getAccessories();
        const TargetBAcs = Acs.filter(a => a.username == accessoryId)[0];
        _Bridge.removeAccessory(TargetBAcs);

        delete _Accessories[accessoryId.replace(/:/g, "")];

        // Remove from config
        util.deleteAccessory(accessoryId)

        const NA = config.accessories.filter(a => a.username != accessoryId)
        config.accessories = NA;

        _RenderStaticUI(client, Templates.Main)

    }


    function _saveRoutes(Config, client)
    {
        config.routes = Config;
        util.updateRouteConfig(Config);
        _RouteSetup();
        _RenderStaticUI(client, Templates.Main)

    }

    function _createAccessory(AccessoryOBJ, client)
    {
        AccessoryOBJ["pincode"] = util.getRndInteger(100, 999) + "-" + util.getRndInteger(10, 99) + "-" + util.getRndInteger(100, 999);
        AccessoryOBJ["username"] = util.genMAC();
        AccessoryOBJ["setupID"] = util.makeID(4);
        AccessoryOBJ["serialNumber"] = util.makeID(12);


        util.appendAccessoryToConfig(AccessoryOBJ)

        AccessoryOBJ.accessoryID = AccessoryOBJ.username.replace(/:/g, "");

        config.accessories.push(AccessoryOBJ)

        switch (AccessoryOBJ.type)
        {

            default:
                let Acc = new Accessory.Types[AccessoryOBJ.type].Object(AccessoryOBJ);
                Acc.on('STATE_CHANGE', (PL, O) => _ChangeEvent(PL, AccessoryOBJ, O))
                Acc.on('IDENTIFY', (P) => _IdentifyEvent(P, AccessoryOBJ))
                _Accessories[AccessoryOBJ.accessoryID] = Acc;
                _Bridge.addAccessory(Acc.getAccessory())
                break;
        }


        _RenderStaticUI(client, Templates.Main)
    }

    function _editAccessory(AccessoryOBJ, username, client)
    {



        util.editAccessory(AccessoryOBJ, username)

        const TargetAc = config.accessories.filter(a => a.username == username)[0]


        const Keys = Object.keys(AccessoryOBJ);

        for (let i = 0; i < Keys.length; i++) {
            if (TargetAc.hasOwnProperty(Keys[i])) {
                TargetAc[Keys[i]] = AccessoryOBJ[Keys[i]];
            }
        }


        //removeAccessory
        const Acs = _Bridge.getAccessories();
        const TargetBAcs = Acs.filter(a => a.username == username)[0];
        _Bridge.removeAccessory(TargetBAcs);

        // re-add
        const Acc = new Accessory.Types[TargetAc.type].Object(TargetAc);
        Acc.on('STATE_CHANGE', (PL, O) => _ChangeEvent(PL, TargetAc, O))
        Acc.on('IDENTIFY', (P) => _IdentifyEvent(P, TargetAc))
        _Accessories[TargetAc.accessoryID] = Acc;
        _Bridge.addAccessory(Acc.getAccessory())








        _RenderStaticUI(client, Templates.Main)
    }

    function _login(Req, client)
    {
        const UN = Req.username;
        const PW = crypto.createHash('md5').update(Req.password).digest("hex");

        if (UN == config.loginUsername && PW == config.loginPassword)
        {
            _Clients[client].Authed = true;

            var TPL;
            if (_Paired)
            {
                _RenderStaticUI(client, Templates.Main)
            }
            else
            {

                _RenderStaticUI(client, Templates.Setup)
            }
        }
        else
        {
            const PL = {
                "type": "message",
                "content": "Sorry, those detail were incorrect. "
            }

            _Clients[client].connection.send(JSON.stringify(PL))
            
        }
    }

    function _processAccessoriesGet(req, res)
    {
        const PW = crypto.createHash('md5').update(req.params.pwd).digest("hex");
        if (PW != config.loginPassword)
        {
            res.sendStatus(401);
            return;
        }

        const TPL = [];
        const Names = Object.keys(_Accessories);
        for (let i = 0; i < Names.length; i++)
        {
            const PL = {
                "id": Names[i],
                "name": _Accessories[Names[i]].getAccessory().displayName,
                "characteristics": _Accessories[Names[i]].getProperties()
            }
            TPL.push(PL)
        }

        res.contentType("application/json");
        res.send(JSON.stringify(TPL));
    }

    function _processAccessoryGet(req, res)
    {
        const PW = crypto.createHash('md5').update(req.params.pwd).digest("hex");
        if (PW != config.loginPassword)
        {
            res.sendStatus(401);
            return;
        }

        const Ac = _Accessories[req.params.id]

        const PL = {
            "id": req.params.id,
            "name": Ac.getAccessory().displayName,
            "characteristics": Ac.getProperties()
        }
        res.contentType("application/json");
        res.send(JSON.stringify(PL));
    }

    function _processAccessorySet(req, res)
    {
        const PW = crypto.createHash('md5').update(req.params.pwd).digest("hex");
        if (PW != config.loginPassword)
        {
            res.sendStatus(401);
            return;
        }

        const Ac = _Accessories[req.params.id]
        Ac.setCharacteristics(req.body)

        res.contentType("application/json");
        res.send(JSON.stringify({ ok: true }));
    }




    function _showEdit(Req, client)
    {
        const Template = Req.template;
        const RouteNames = Object.keys(config.routes)

        const A = config.accessories.filter(a => a.username == Req.username);


        const Payload = {

            "Title": Req.title,
            "Description": Req.description,
            "Type": Req.actype,
            "Routes": RouteNames,
            "CurrentConfig": JSON.stringify(A[0])
        }

        const TPL = fs.readFileSync(process.cwd() + "/ui/templates/device_config/" + Template + ".tpl", 'utf8');
        const HTML = mustache.render(TPL, Payload);

        const PL = {
            "type": "page",
            "content": HTML
        }
        _Clients[client].connection.send(JSON.stringify(PL));
    }


    function _showAdd(Req, client)
    {
        const Template = Req.template;
        const RouteNames = Object.keys(config.routes)

        const Payload = {

            "Title": Req.title,
            "Description": Req.description,
            "Type": Req.actype,
            "Routes": RouteNames,
            "CurrentConfig": JSON.stringify({})
        }

        const TPL = fs.readFileSync(process.cwd() + "/ui/templates/device_config/" + Template + ".tpl", 'utf8');
        const HTML = mustache.render(TPL, Payload);

        const PL = {
            "type": "page",
            "content": HTML
        }
        
        _Clients[client].connection.send(JSON.stringify(PL));
    }



    this.setBridgePaired = function (IsPaired)
    {
        _Paired = IsPaired;
        const ClientKeys = Object.keys(_Clients)

        if (_Paired)
        {
            for (let i = 0; i < ClientKeys.length; i++)
            {
                if(_Clients[ClientKeys[i]].hasOwnProperty("Authed"))
                {
                    _RenderStaticUI(ClientKeys[i], Templates.Main)
                }
                else
                {
                    _sendLogin(ClientKeys[i])
                }
            }
        }
        else
        {
            for (let i = 0; i < ClientKeys.length; i++)
            {
                if(_Clients[ClientKeys[i]].hasOwnProperty("Authed"))
                {
                    _RenderStaticUI(ClientKeys[i], Templates.Setup)
                }
                else
                {
                    _sendLogin(ClientKeys[i])
                }
            }

        }


    }

    this.push = function (payload)
    {

        for (let i = 0; i < _Clients.length; i++)
        {
            _Clients[i].send(JSON.stringify(payload))
        }
    }


}

module.exports = {
    Server: Server
}
