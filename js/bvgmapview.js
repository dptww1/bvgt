function BvGMapView() { }

BvGMapView.prototype.activateCity          = function(cityName, status, type) { };
BvGMapView.prototype.activateMapCard       = function(letter, side) { };
BvGMapView.prototype.changeCityStatus      = function(cityName, newStatus) { };
BvGMapView.prototype.changeSupply          = function(side, supplyPts) { };
BvGMapView.prototype.changeDrawRestores    = function(usaDraws, usaRestores, csaDraws, csaRestores) { };
BvGMapView.prototype.changeDrawStatus      = function(drawStatus, onOff) { };
BvGMapView.prototype.cityHasFocus          = function(cityName) { };
BvGMapView.prototype.csaObjectiveChanged   = function(objective, onOff) { };
BvGMapView.prototype.navyChanged           = function(theater, numSquadrons) { };
BvGMapView.prototype.usaObjectiveChanged   = function(objective, onOff) { };
BvGMapView.prototype._deactivateCity       = function(cityName) { };
BvGMapView.prototype._deactivateMapCard    = function(mapLetter, status) { };
BvGMapView.prototype.canEmancipateChanged  = function(onOff) { };
BvGMapView.prototype.xMissFulfilledChanged = function(onOff) { };