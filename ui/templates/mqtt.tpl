<div class="TopBanner">MQTT Client</div>
<div class="Middle Dialog" style="width:600px;margin-top:80px">
    <div class="Title">Configure the MQTT Client.</div>

  
     
        <table class="Middle" style="width:450px;margin-top:30px;">
            <tbody>
                <tr>
                    <td colspan="2">
                        Note : Changes to the MQTT Client will require a restart of HomeKit Device Stack.
                    </td>
                </tr>
                <tr>
                    <td colspan="2">
                        &nbsp;
                    </td>
                </tr>
                <tr>
                    <td style="text-align:left;">MQTT Broker</td>
                    <td style="text-align:right;">
                        <input id="Broker" class="config" type="text" value="{{Config.MQTTBroker}}">
                    </td>
                </tr>
                <tr>
                    <td style="text-align:left;">Topic</td>
                    <td style="text-align:right;">
                        <input id="Topic" class="config" type="text" value="{{Config.MQTTTopic}}">
                    </td>
                </tr>
                <tr>
                    <td style="text-align:left;">Username</td>
                    <td style="text-align:right;">
                        <input id="Username" class="config" type="text" value="{{Config.MQTTOptions.username}}">
                    </td>
                </tr>
                <tr>
                    <td style="text-align:left;">Password</td>
                    <td style="text-align:right;">
                        <input id="Password" class="config" type="password" value="{{Config.MQTTOptions.password}}">
                    </td>
                </tr>
                <tr>
                    <td style="text-align:left;">Enable</td>
                    <td style="text-align:right;">
                        <select id="Enable" class="config">
                            <option value="false">No</option>
                            <option value="true">Yes</option>
                        </select>
                    </td>
                </tr>

                <tr>
                  
                    <td colspan="2" style="text-align:right;padding-bottom:20px">
                        <input class="StyledButton" onclick="Main()" type="button" value="Cancel">
                        <input class="StyledButton" onclick="SaveMQTT()" type="button" value="Save">
                    </td>
                </tr>
                </tbody>
        </table>
    
        
        
   
   
</div>

<script>
    $('#Enable').val("{{Config.enableIncomingMQTT}}")
</script>