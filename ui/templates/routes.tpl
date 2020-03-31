<div class="TopBanner">Manage Routes</div>
<div class="Middle Dialog" style="width:600px;margin-top:80px">
    <div class="Title">Manage Accessory Routes.</div>

    <table class="Middle" style="width:450px;margin-top:30px;">
        <tbody>
            <tr>
                <td colspan="2">
                    Currently, routes are configured manually. The default configuration has all 4 Types configured. edit/add/delete as necessary
                </td>
            </tr>
            <tr>
                <td colspan="2">
                    &nbsp;
                </td>
            </tr>
            <tr>
                <td colspan="2">
                    <textarea id="RoutesConfig" class="Middle" style="width:100%;height:400px">{{Routes}}</textarea>
                </td>
            </tr>

            <tr>
                <td colspan="2" style="text-align: right;padding-bottom:20px">
                    <input  class="StyledButton" onclick="Main()" type="button" value="Cancel">
                    <input class="StyledButton" onclick="SaveRoutes()" type="button" value="Save">
                </td>
            </tr>

        </tbody>
    </table>
                

   
   
</div>