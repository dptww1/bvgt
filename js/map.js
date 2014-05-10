// BvGMapViewMap
/*global BvGMapView */

// === Constructor
function BvGMapViewMap() {
    BvGMapView.call(this);
}

BvGMapViewMap.prototype = new BvGMapView();

BvGMapViewMap.prototype.initialize = function() {
    // HTML elements should be created only once.
    for (cityName in this._cityInfo) {
        var divName = cityName.replace(/[^A-Za-z0-9]/g, "");
        divName = divName.charAt(0).toLowerCase() + divName.substr(1) + "Div";
        var cityDiv = document.getElementById(divName);
        if (cityDiv) {
            var cityInfo = this._cityInfo[cityName];
            if (cityInfo.length > 2) {
                this._positionCityDiv(cityDiv, cityInfo);

                var safeCityName = cityName.replace(/\'/g, "\\'");

                var areaElt = document.createElement("area");
                areaElt.shape = cityInfo[2];
                areaElt.coords = this._getCityCoords(cityDiv, cityName, cityInfo);

                areaElt.href = "javascript:mapView.selectCity('" + safeCityName + "')";
                var mapElt = document.getElementById(divName + "Hotspots");
                mapElt.appendChild(areaElt);

                var imgElt = document.createElement("img");
                imgElt.id     = "imgId" + cityName;
                imgElt.border = 0;
                imgElt.useMap = "#" + divName + "Hotspots";

                cityDiv.appendChild(imgElt);
            }
        }
    }
}

BvGMapViewMap.prototype.activateCity = function(cityName, status, type) {
    if (this._cityInfo[cityName]) {
        var cityInfo = this._cityInfo[cityName];
        // Remember the default city status/type
        cityInfo[0] = status;
        cityInfo[1] = type;

        // Massage the city name to get the div name
        var divName = cityName.replace(/[^A-Za-z0-9]/g, "");
        divName = divName.charAt(0).toLowerCase() + divName.substr(1) + "Div";
        var cityDiv = document.getElementById(divName);
        if (cityDiv) {
            if (cityInfo.length > 2) {
                var imgElt = document.getElementById("imgId" + cityName);
                imgElt.src    = this._getCityImageFilename(cityInfo[1], status);

                cityDiv.style.display = "block";
                cityDiv.style.visibility = "visible";
            }
        } else {
            alert("Can't find map div for '" + cityName + "' ('" + divName + "')");
        }
    } else {
        alert("BvGMapView.ActivateCity(): unknown city name '" + cityName + "'");
    }
};

BvGMapViewMap.prototype.activateMapCard = function(mapLetter, mapSide) {
    // Ignore the standard at-start cards
    var ignoredCards = { "A":1, "B":1, "D":1, "E":1 };
    if (ignoredCards[mapLetter]) {
        return;
    }

    var mapFilename = "map_" + mapLetter.toLowerCase() + "_" + this._map.getSideStr(mapSide)  + ".png";
    var mapDiv = $("#mapCard" + mapLetter + "Div");
    mapDiv.html("<img src='images/" + mapFilename + "' usemap='#map" + mapLetter + "Hotspots' border='0'>");
    mapDiv.fadeIn();
};

BvGMapViewMap.prototype.changeCityStatus = function(cityName, newStatus) {
    var cityInfo = this._cityInfo[cityName];

    // Massage the city name to get the div name
    var divName = cityName.replace(/[^A-Za-z0-9]/g, "");
    divName = divName.charAt(0).toLowerCase() + divName.substr(1) + "Div";
    var cityDiv = document.getElementById(divName);
    if (cityDiv) {
        if (cityInfo.length > 2) {
            var imgElt = document.getElementById("imgId" + cityName);
            if (imgElt != null) {
                imgElt.src = this._getCityImageFilename(cityInfo[1], newStatus);
            }
        }
    } else {
        alert("Can't find map div for '" + cityName + "' ('" + divName + "')");
    }
};

BvGMapViewMap.prototype.selectCity = function(cityName) {
    this._map.setCityFocus(cityName);
};

BvGMapViewMap.prototype._deactivateCity = function(cityName) {
    // Massage the city name to get the div name
    var divName = cityName.replace(/[^A-Za-z0-9]/g, "");
    divName = divName.charAt(0).toLowerCase() + divName.substr(1) + "Div";
    var cityDiv = document.getElementById(divName);
    if (cityDiv) {
        cityDiv.style.visibility = "hidden";
    }
};

BvGMapViewMap.prototype._deactivateMapCard = function(mapLetter, status) {
    // Ignore the standard at-start cards
    var ignoredCards = { "A":1, "B":1, "D":1, "E":1 };
    if (ignoredCards[mapLetter]) {
        return;
    }

    $("#mapCard" + mapLetter + "Div").hide();
};

BvGMapViewMap.prototype._getCityCoords = function(div, cityName, cityInfo) {
    var str = "";
    switch (cityInfo[2]) {
    case "circle":
        str += (cityInfo[3] - parseInt(div.style.left, 10)) + ",";
        str += (cityInfo[4] - parseInt(div.style.top,  10))  + ",";
        str += cityInfo[5];
        break;
    case "rect":
        str += (cityInfo[3] - parseInt(div.style.left, 10)) + ",";
        str += (cityInfo[4] - parseInt(div.style.top,  10))  + ",";
        str += (cityInfo[5] - parseInt(div.style.left, 10)) + ",";
        str += (cityInfo[6] - parseInt(div.style.top,  10));
        break;
    }
    return str;
};

BvGMapViewMap.prototype._getCityAreaHTML = function(div, cityName, cityInfo) {
    var html = "";
    html += '<area href="javascript:mapView.selectCity(\'' + cityName.replace(/'/g, "\\'") + '\')"'; // ' help Emacs
    html += " shape='" + cityInfo[2] + "'";
    html += " coords='";
    switch (cityInfo[2]) {
    case "circle":
        html += (cityInfo[3] - parseInt(div.style.left, 10)) + ",";
        html += (cityInfo[4] - parseInt(div.style.top,  10))  + ",";
        html += cityInfo[5];
        break;
    case "rect":
        html += (cityInfo[3] - parseInt(div.style.left, 10)) + ",";
        html += (cityInfo[4] - parseInt(div.style.top,  10))  + ",";
        html += (cityInfo[5] - parseInt(div.style.left, 10)) + ",";
        html += (cityInfo[6] - parseInt(div.style.top,  10));
        break;
    }
    html += "'";
    html += ">";
    return html;
};

BvGMapViewMap.prototype._getCityImageFilename = function(cityType, cityStatus) {
    var name = "images/";
    switch (cityType) {
    case this._map.TYPE_CITY:      name += "city_";      break;
    case this._map.TYPE_CITY_FORT: name += "city_fort_"; break;
    case this._map.TYPE_PORT:      name += "port_";      break;
    case this._map.TYPE_PORT_FORT: name += "port_fort_"; break;
    case this._map.TYPE_PESTHOLE:  name += "pesthole_";  break;
    case this._map.TYPE_CAPITAL:   name += "capital_";   break;
    default: name += "???";
    }
    return name + this._map.getSideStr(cityStatus) + ".png";
};

BvGMapViewMap.prototype._positionCityDiv = function(div, cityInfo) {
    if (cityInfo && cityInfo.length >= 6) {
        switch (cityInfo[2]) {
        case "circle":
            // Already have center of circle, so just subtract off half of 27 (h and w of city/fort/etc images)
            div.style.left = (cityInfo[3] - Math.ceil(27 / 2)) + "px";
            div.style.top  = (cityInfo[4] - Math.ceil(27 / 2)) + "px";
            break;
        case "rect":
            // Convert upper left corner of rectangle to center of rectangle, then subtract off half of 29 (h and w of city/fort/etc images)
            div.style.left = ((cityInfo[3] + (cityInfo[5] - cityInfo[3]) / 2) - Math.ceil(27 / 2)) + "px";
            div.style.top  = ((cityInfo[4] + (cityInfo[6] - cityInfo[4]) / 2) - Math.ceil(27 / 2 )) + "px";
            break;
        }
    }
};

BvGMapView.prototype._cityInfo = { // anonymous hash; values are [originalOwner, type, hotspot data]
    "Atlanta"              : [null, null, "circle", 384, 454, 8],
    "Augusta"              : [null, null, "circle", 487, 482, 8],
    "Baltimore"            : [null, null, "rect", 723, 130, 738, 144],
    "Boston"               : [null, null, "circle", 402, 613, 8],
    "Bowling Green"        : [null, null, "circle", 284, 282, 8],
    "Cairo"                : [null, null, "circle", 168, 254, 8],
    "Centralia"            : [null, null, "circle", 182, 173, 8],
    "Charleston/Ft Sumter" : [null, null, "rect", 585, 509, 600, 524],
    "Chattanooga"          : [null, null, "circle", 347, 380, 8],
    "Cincinnati"           : [null, null, "circle", 390, 154, 8],
    "Cleveland"            : [null, null, "circle", 512, 21, 8],
    "Columbia"             : [null, null, "circle", 534, 444, 8],
    "Columbus (OH)"        : [null, null, "circle", 452, 101, 8],
    "Columbus (GA)"        : [null, null, "circle", 358, 537, 8],
    "Corinth"              : [null, null, "circle", 189, 388, 8],
    "Cumberland Gap"       : [null, null, "circle", 419, 290, 8],
    "Decatur"              : [null, null, "circle", 270, 399, 8],
    "Florence"             : [null, null, "circle", 600, 430, 8],
    "Ft Monroe"            : [null, null, "rect", 739, 250, 753, 265],
    "Ft Morgan"            : [null, null, "rect", 193, 634, 208, 648],
    "Ft Pickens"           : [null, null, "rect", 241, 643, 256, 657],
    "Fts Henry & Donelson" : [null, null, "circle", 221, 299, 8],
    "Goldsboro"            : [null, null, "circle", 684, 365, 8],
    "Greensboro"           : [null, null, "circle", 551, 333, 8],
    "Grenada"              : [null, null, "circle", 116, 442, 8],
    "Harper's Ferry"       : [null, null, "circle", 663, 130, 8],
    "Harrisburg"           : [null, null, "circle", 711,  80, 8],
    "Indianapolis"         : [null, null, "circle", 313, 111, 8],
    "Island No 10"         : [null, null, "circle", 159, 293, 8],
    "Jackson"              : [null, null, "circle",  94, 542, 8],
    "Knoxville"            : [null, null, "circle", 404, 331, 8],
    "Lexington"            : [null, null, "circle", 383, 212, 8],
    "Louisville"           : [null, null, "circle", 335, 199, 8],
    "Lynchburg"            : [null, null, "circle", 598, 247, 8],
    "Macon"                : [null, null, "circle", 413, 538, 8],
    "Manassas Jct"         : [null, null, "circle", 685, 173, 8],
    "Memphis"              : [null, null, "circle", 126, 363, 8],
    "Meridian"             : [null, null, "circle", 162, 544, 8],
    "Mobile"               : [null, null, "rect", 192, 610, 206, 625],
    "Montgomery"           : [null, null, "circle", 289, 546, 8],
    "Nashville"            : [null, null, "circle", 274, 312, 8],
    "New Berne"            : [null, null, "rect", 728, 386, 742, 401],
    "New Orleans"          : [null, null, "rect",  90, 642, 104, 656],
    "Norfolk"              : [null, null, "rect", 747, 267, 761, 282],
    "Pensacola"            : [null, null, "rect", 232, 622, 246, 637],
    "Petersburg"           : [null, null, "circle", 690, 260, 8],
    "Pittsburgh"           : [null, null, "circle", 589,  79, 8],
    "Port Hudson"          : [null, null, "circle",  41, 600, 8],
    "Raleigh"              : [null, null, "circle", 647, 339, 8],
    "Richmond"             : [null, null, "circle", 695, 233, 8],
    "Savannah"             : [null, null, "rect", 519, 560, 533, 574],
    "Selma"                : [null, null, "circle", 256, 540, 8],
    "Shenandoah Valley"    : [null, null, "circle", 626, 179, 8],
    "Toledo"               : [null, null, "circle", 431,  10, 8],
    "Tupelo"               : [null, null, "circle", 178, 434, 8],
    "Vicksburg"            : [null, null, "circle",  63, 535, 8],
    "Washington"           : [null, null, "circle", 709, 154, 8],
    "Wheeling"             : [null, null, "circle", 549,  99, 8],
    "Wilderness"           : [null, null, "circle", 667, 203, 8],
    "Wilmington"           : [null, null, "rect", 674, 428, 689, 443]
};

var mapView = new BvGMapViewMap();

// Preload images
var img = new Image();
img.src = "images/basemap.png";
img.src = "images/capital_csa.png";
img.src = "images/capital_usa.png";
img.src = "images/city_csa.png";
img.src = "images/city_neutral.png";
img.src = "images/city_usa.png";
img.src = "images/city_fort_csa.png";
img.src = "images/city_fort_usa.png";
img.src = "images/pesthole_csa.png";
img.src = "images/pesthole_usa.png";
img.src = "images/port_csa.png";
img.src = "images/port_usa.png";
img.src = "images/port_fort_csa.png";
img.src = "images/port_fort_usa.png";
img.src = "images/map_c_csa.png";
img.src = "images/map_c_neutral.png";
img.src = "images/map_c_usa.png";
img.src = "images/map_f_usa.png";
img.src = "images/map_f_csa.png";
img.src = "images/map_g_usa.png";
img.src = "images/map_g_csa.png";
img.src = "images/map_h_usa.png";
img.src = "images/map_h_csa.png";
img.src = "images/map_i_usa.png";
img.src = "images/map_i_csa.png";
img.src = "images/map_j_usa.png";
img.src = "images/map_j_csa.png";
img.src = "images/map_k_usa.png";
img.src = "images/map_k_csa.png";


function showVersionInfo() {
    window.open("versions.html", "bvgtVerWin");
}
