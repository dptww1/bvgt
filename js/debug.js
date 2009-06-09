// {{{ BvGMapViewStatus
/*global BvGMapView */
// {{{ Constructor
function BvGMapViewStatus() {
    BvGMapView.call(this);
}
BvGMapViewStatus.prototype = new BvGMapView();
// }}}
// {{{ tracking data
BvGMapViewStatus.prototype._changedCities          = {};
BvGMapViewStatus.prototype._objectiveText          = [null, null, null, null, null, null, null, null, null];
BvGMapViewStatus.prototype._csaObjectiveText       = "None";
BvGMapViewStatus.prototype._usaObjectiveText       = "None";
BvGMapViewStatus.prototype._netObjectives          = 0;
BvGMapViewStatus.prototype._usaDraw                = 5;
BvGMapViewStatus.prototype._csaProductionLabels    = ["Food", "Industry", "Contraband"];
BvGMapViewStatus.prototype._csaLostProductionFlags = [     0,          0,           0 ];
// }}}
// {{{ changeCityStatus() callback
BvGMapViewStatus.prototype.changeCityStatus = function(cityName, newStatus) {
    this._changedCities[cityName] = (this._map.getCityDefaultStatus(cityName) != newStatus);
    this.updateHTML();
};
// }}}
// {{{ changeDrawRestores() callback
BvGMapViewStatus.prototype.changeDrawRestores = function(usaDraws, usaRestores, csaDraws, csaRestores) {
    this.updateHTML();
};
// }}}
// {{{ changeDrawStatus() callback
BvGMapViewStatus.prototype.changeDrawStatus = function(drawStatus, onOff) {
    this.updateHTML();
};
// }}}
// {{{ changeSupply() callback
BvGMapViewStatus.prototype.changeSupply = function(side, supplyPts) {
    this.updateHTML();
};
// }}}
// {{{ csaObjectiveChanged() callback
BvGMapViewStatus.prototype.csaObjectiveChanged = function(objective, onOff) {
    this._netObjectives += (onOff ? -1 : 1);
    if (objective == this._map.OBJECTIVE_CSA_RAILNET) {
        this._csaObjectiveText =  onOff ? "Sever USA railnet" : "None";
        this._usaDraw += onOff ? -1 : 1;
    }
    this.updateHTML();
};
// }}}
// {{{ navyChanged() callback
BvGMapViewStatus.prototype.navyChanged = function(theater, numSquadrons) {
    if (theater == this._map.THEATER_EAST) {
        // update because blockade status may have changed, which affects draws
        this.updateHTML();
    }
};
// }}}
// {{{ usaObjectiveChanged() callback
BvGMapViewStatus.prototype.usaObjectiveChanged = function(objective, onOff) {
    this._netObjectives += (onOff ? 1 : -1);
    switch (objective) {
    case this._map.OBJECTIVE_USA_MISSISSIPPI:    this._objectiveText[objective] = (onOff ? "Control Mississippi" : null);  break;
    case this._map.OBJECTIVE_USA_BLOCKADE:       this._objectiveText[objective] = (onOff ? "Blockade"            : null);  break;
    case this._map.OBJECTIVE_USA_RAILNET:        this._objectiveText[objective] = (onOff ? "Sever CSA Railnet"   : null);  break;
    case this._map.OBJECTIVE_USA_ATLANTIC_PORTS: this._objectiveText[objective] = (onOff ? "Atlantic Ports"      : null);  break;
    case this._map.OBJECTIVE_USA_GULF_PORTS:     this._objectiveText[objective] = (onOff ? "Gulf Ports"          : null);  break;
    // Richmond/Atlanta handled by city name display code
    }

    var str = "";
    for (var i = 0; i < this._objectiveText.length; ++i) {
        if (this._objectiveText[i]) {
            if (str !== "") {
                str += ", ";
            }
            str += this._objectiveText[i];
        }
    }
    this._usaObjectiveText = str ? str : "None";
    this.updateHTML();
};
// }}}
// {{{ updateHTML()
BvGMapViewStatus.prototype.updateHTML = function() {
    var csaControl = [];
    var usaControl = [];

    for (var cityName in this._changedCities) {
        if (this._changedCities[cityName]) {
            var cityStatus = this._map.getCityStatus(cityName);
            if (cityStatus == this._map.STATUS_USA) {
                usaControl.push(cityName + (this._map.isCityUsaObjective(cityName) ? " (+1 objective)" : ""));
            } else if (cityStatus == this._map.STATUS_CSA) {
                csaControl.push(cityName + (this._map.isCityCsaObjective(cityName) ? " (-1 objective)" : ""));
            }
        }
    }

    var str = "";
    str += "USA Control: " + (usaControl.length > 0 ? usaControl.join(", ") : "None") + "<br>";
    str += "CSA Control: " + (csaControl.length > 0 ? csaControl.join(", ") : "None") + "<br>";
    //str += "USA Supply: " + this._map.getSupply(this._map.STATUS_USA) + "<br>";
    //str += "CSA Supply: " + this._map.getSupply(this._map.STATUS_CSA) + "<br>";

    str += "Other USA Objectives: " + this._usaObjectiveText + "<br>";
    str += "Other CSA Objectives: " + this._csaObjectiveText + "<br>";

    str += "Net Objectives: " + this._netObjectives + "<br>";

    for (var i = 0; i < 2; ++i) {
        var numDraws    = this._map.getDraws(i);
        var numRestores = this._map.getRestores(i);

        str += this._map.getSideStr(i).toUpperCase() + " Draw: ";
        str += numDraws + " draw" + (numDraws > 1 ? "s" : "");

        if (numRestores) {
            str += ", " + numRestores + " restore" + (numRestores > 1 ? "s" : "");
        }

        str += "<br>";
    }

    document.getElementById("debugDiv").innerHTML = str;
};
// }}}
// }}}

var statusView = new BvGMapViewStatus();
