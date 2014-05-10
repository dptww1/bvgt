// BvGMapViewStatus
/*global BvGMapView */

function BvGMapViewStatus() {
    BvGMapView.call(this);
}
BvGMapViewStatus.prototype = new BvGMapView();

BvGMapViewStatus.prototype._changedCities          = {};
BvGMapViewStatus.prototype._objectiveText          = [null, null, null, null, null, null, null, null, null];
BvGMapViewStatus.prototype._csaObjectiveText       = "None";
BvGMapViewStatus.prototype._usaObjectiveText       = "None";
BvGMapViewStatus.prototype._netObjectives          = 0;
BvGMapViewStatus.prototype._usaDraw                = 5;
BvGMapViewStatus.prototype._csaProductionLabels    = ["Food", "Industry", "Contraband"];
BvGMapViewStatus.prototype._csaLostProductionFlags = [     0,          0,           0 ];

BvGMapViewStatus.prototype.changeCityStatus = function(cityName, newStatus) {
    this._changedCities[cityName] = (this._map.getCityDefaultStatus(cityName) != newStatus);
    this.updateHTML();
};

BvGMapViewStatus.prototype.changeDrawRestores = function(usaDraws, usaRestores, csaDraws, csaRestores) {
    this.updateHTML();
};

BvGMapViewStatus.prototype.changeDrawStatus = function(drawStatus, onOff) {
    this.updateHTML();
};

BvGMapViewStatus.prototype.changeSupply = function(side, supplyPts) {
    this.updateHTML();
};

BvGMapViewStatus.prototype.csaObjectiveChanged = function(objective, onOff) {
    this._netObjectives += (onOff ? -1 : 1);
    if (objective == this._map.OBJECTIVE_CSA_RAILNET) {
        this._csaObjectiveText =  onOff ? "Sever USA railnet" : "None";
        this._usaDraw += onOff ? -1 : 1;
    }
    this.updateHTML();
};

BvGMapViewStatus.prototype.navyChanged = function(theater, numSquadrons) {
    if (theater == this._map.THEATER_EAST) {
        // update because blockade status may have changed, which affects draws
        this.updateHTML();
    }
};

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

    // Mississippi is worth x2 value if CSA Trans-Mississippi requirements not met
    if (objective == this._map.OBJECTIVE_USA_MISSISSIPPI && !this._map._xMissFulfilled) {
        this._netObjectives += (onOff ? 1 : -1);

        if (onOff) {
            this._objectiveText[objective] += " (x2)";
        }
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

BvGMapViewStatus.prototype.xMissFulfilledChanged = function(onOff) {
    this.updateHTML();
};

BvGMapViewStatus.prototype.updateHTML = function() {
    var csaControl = [];
    var usaControl = [];

    for (var cityName in this._changedCities) {
        if (this._changedCities[cityName]) {
            var cityStatus = this._map.getCityStatus(cityName);
            if (cityStatus == this._map.STATUS_USA) {
                usaControl.push(cityName + (this._map.isCityUsaObjective(cityName) ? " <b>(+1 objective)</b>" : ""));
            } else if (cityStatus == this._map.STATUS_CSA) {
                csaControl.push(cityName + (this._map.isCityCsaObjective(cityName) ? " <b>(-1 objective)</b>" : ""));
            }
        }
    }

    var strs = [];

    for (var i = 0; i < 2; ++i) {
        var str = "";
        var numDraws    = this._map.getDraws(i);
        var numRestores = this._map.getRestores(i);

        str += "<b>" + this._map.getSideStr(i).toUpperCase() + " Draw:</b> ";
        str += numDraws + " draw" + (numDraws > 1 ? "s" : "");

        if (numRestores) {
            str += ", " + numRestores + " restore" + (numRestores > 1 ? "s" : "");
        }
        strs.push(str);
    }
    strs.push("<b>Net Objectives:</b> " + this._netObjectives);
    strs.push("<b>USA Control:</b> " + (usaControl.length > 0 ? usaControl.join(", ") : "None"));
    strs.push("<b>CSA Control:</b> " + (csaControl.length > 0 ? csaControl.join(", ") : "None"));
    strs.push("<b>Other USA Objectives:</b> " + this._usaObjectiveText);
    strs.push("<b>Other CSA Objectives:</b> " + this._csaObjectiveText);

    document.getElementById("debugDiv").innerHTML = strs.join("<p>");
};

var statusView = new BvGMapViewStatus();
