// {{{ BvGMapViewControl
/*global BvGMapView */
// {{{ Constructor
function BvGMapViewControl() {
    BvGMapView.call(this);
}

BvGMapViewControl.prototype = new BvGMapView();
// }}}
// {{{ activateMapCard() callback
BvGMapViewControl.prototype.activateMapCard = function(mapLetter, mapSide) {
    var str = "";
    var unplayedMapCards = this._map.getUnplayedMapCards();
    var lastMapLetter = undefined;
    for (var i = 0; i < unplayedMapCards.length; ++i) {
        var mapCard = unplayedMapCards[i];
        if (lastMapLetter && mapCard[0] != lastMapLetter) {
            str += "<br>";
        }
        str += "<a href='javascript:controlView._map.activateMapCard(\"" + mapCard[0] + "\"," + mapCard[1] + ")'>";
        str += "<img src='images/btn_" + mapCard[0].toLowerCase() + "_" + this._map.getSideStr(mapCard[1]) + ".png' border='0' style='margin: 0.1em'>";
        str += "</" + "a>";        // HTML Validation problem
        lastMapLetter = mapCard[0];
    }

    if (str) {
        str = "<span class='divHeader'>MAP CARDS</" + "span><br>" + str;  // HTML Validation problem
    }

    document.getElementById("mapButtonsDiv").innerHTML = str;
};
// }}}
// {{{ changeDrawStatus() callback
BvGMapViewControl.prototype.changeDrawStatus = function(drawStatus, onOff) {
    var f = document.f;
    var elt = null;
    switch (drawStatus) {
    case this._map.DRAWSTATUS_LATEWAR:   elt = f.isLateWar;         break;
    case this._map.DRAWSTATUS_IRONCLADS: elt = f.isIroncladsActive; break;
    case this._map.DRAWSTATUS_DIGGING:   elt = f.isDiggingActive;   break;
    }
    if (elt !== null) {
        elt.checked = onOff;
    }
};
// }}}
// {{{ changeSupply() callback
BvGMapViewControl.prototype.changeSupply = function(side, supplyPts) {
    // Don't change the value unless needed, to prevent endless pinging back and forth between the view and the model
    if (side == this._map.STATUS_USA) {
        if (document.f.usaSupply.value != supplyPts) {
            document.f.usaSupply.value = supplyPts;
        }
    } else {
        if (document.f.csaSupply.value != supplyPts) {
            document.f.csaSupply.value = supplyPts;
        }
    }
};
// }}}
// {{{ cityHasFocus() callback
BvGMapViewControl.prototype.cityHasFocus = function(cityName) {
    var html = "";
    html += "<span class='divHeader'>SELECTED CITY</" + "span><br>"; // HTML Validation problems
    html += "<span class='subHeader'>" + cityName + "</" + "span><br>";
    html += '<a href="javascript:controlView._map.setCityStatus(\'' + cityName.replace(/'/g, "\\'") + '\', controlView._map.STATUS_USA)"><img src="images/btn_control_usa.png" border="0" width="48" height="27"><' + '/a>';  // ' help Emacs
    html += '<a href="javascript:controlView._map.setCityStatus(\'' + cityName.replace(/'/g, "\\'") + '\', controlView._map.STATUS_CSA)"><img src="images/btn_control_csa.png" border="0" width="48" height="27"><' + '/a>';  // ' help Emacs
    document.getElementById("activeCityDiv").innerHTML = html;
};
// }}}
// {{{ navyChanged() callback
BvGMapViewControl.prototype.navyChanged = function(theater, numSquadrons) {
    var controlName = (theater == this._map.THEATER_WEST) ? "West" : "East";
    document.forms.f.elements["naval" + controlName].selectedIndex = numSquadrons;
};
// }}}
// {{{ canEmancipateChanged() callback
BvGMapView.prototype.canEmancipateChanged  = function(onOff) {
    document.forms.f.elements.canEmancipate.checked = onOff;
};
BvGMapView.prototype.xMissFulfilledChanged  = function(onOff) {
    document.forms.f.elements.xMiss.checked = onOff;
};
// }}}

var controlView = new BvGMapViewControl();

// {{{ BvGMapViewHeader
// {{{ Constructor
function BvGMapViewHeader() {
    BvGMapView.call(this);
}
BvGMapViewHeader.prototype = new BvGMapView();
// }}}
// {{{ activateMapCard() callback
BvGMapViewHeader.prototype.activateMapCard = function(mapLetter, mapSide) {
    document.forms.f.gameState.value = this._map.getConfiguration();
};
// }}}
// {{{ changeCityStatus() callback
BvGMapViewHeader.prototype.changeCityStatus = function(cityName, status) {
    document.forms.f.gameState.value = this._map.getConfiguration();
};
// }}}
// {{{ changeDrawStatus() callback
BvGMapViewHeader.prototype.changeDrawStatus = function(drawStatus, onOff) {
    document.forms.f.gameState.value = this._map.getConfiguration();
};
// }}}
// {{{ changeSupply() callback
BvGMapViewHeader.prototype.changeSupply = function(side, supplyPts) {
    document.forms.f.gameState.value = this._map.getConfiguration();
};
// }}}
// {{{ navyChanged() callback
BvGMapViewHeader.prototype.navyChanged = function(theater, numSquadrons) {
    document.forms.f.gameState.value = this._map.getConfiguration();
};
// }}}
// {{{ canEmancipateChanged() callback
BvGMapViewHeader.prototype.canEmancipateChanged = function(onOff) {
    document.forms.f.gameState.value = this._map.getConfiguration();
};
// }}}
// {{{ xMissFulfilledChanged() callback
BvGMapViewHeader.prototype.xMissFulfilledChanged = function(onOff) {
    document.forms.f.gameState.value = this._map.getConfiguration();
};
// }}}
// }}}

var headerView = new BvGMapViewHeader();

// {{{ Preload images
var img = new Image();
img.src = "btn_c_csa.png";
img.src = "btn_c_neutral.png";
img.src = "btn_c_usa.png";
img.src = "btn_f_csa.png";
img.src = "btn_f_usa.png";
img.src = "btn_g_csa.png";
img.src = "btn_g_usa.png";
img.src = "btn_h_csa.png";
img.src = "btn_h_usa.png";
img.src = "btn_i_csa.png";
img.src = "btn_i_usa.png";
img.src = "btn_j_csa.png";
img.src = "btn_j_usa.png";
img.src = "btn_k_csa.png";
img.src = "btn_k_usa.png";
// }}}
