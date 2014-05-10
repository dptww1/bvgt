// === BvGMapModel

function BvGMapModel() {
    //this._checkConnections();  // Debugging

    // List of city names which can be USA, CSA, or Neutral
    this._3StateCityArray = this._get3StateCityArray();

    // List of city names excluding the 3-state cities
    this._cityArray = this._getCityArray(this._3StateCityArray);

    this._csaObjectiveCities = this._computeCsaObjectiveCities();
    this._gulfPorts          = this._computeGulfPorts();
    this._atlanticPorts      = this._computeAtlanticPorts();
    // this._mississippiCities has to be set at initialize() time because Island No 10 can be different every game
    this._mississippiCities  = {};  // but needs to be preset so initial setCityStatus() calls don't die

    this._supply        = [0, 0];  // index via STATUS_USA and STATUS_CSA
    this._navy          = [0, 0];    // index via THEATER_WEST and THEATER_EAST
    this._usaObjectives = [false, false, false, false, false, false, false, false, false]; // index via OBJECTIVE_USA_XXX constants

    this._csaObjectives = {};  // index via USA City name, or pseudo-city "Railnet"
    for (var cityName in this._csaObjectiveCities) {
        this._csaObjectives[cityName] = false;
    }
    this._csaObjectives.Railnet = false;

    this._draws    = [0, 0];   // index via STATUS_USA and STATUS_CSA
    this._restores = [0, 0];   // index via STATUS_USA and STATUS_CSA

    this._drawStatus = [false, false, false]; // index via DRAWSTATUS_XXX

    this._canEmancipate  = false;
    this._xMissFulfilled = false;
}

// === Constants

// --- Theater Constants
BvGMapModel.prototype.THEATER_WEST = 0;
BvGMapModel.prototype.THEATER_EAST = 1;

// --- Status Constants
BvGMapModel.prototype.STATUS_USA      = 0;  // city or map card
BvGMapModel.prototype.STATUS_CSA      = 1;  // city or map card
BvGMapModel.prototype.STATUS_NEUTRAL  = 2;  // city or map card C
BvGMapModel.prototype.STATUS_UNPLAYED = 3;  // map card

// --- Type Constants
BvGMapModel.prototype.TYPE_CITY      = 0;
BvGMapModel.prototype.TYPE_CITY_FORT = 1;
BvGMapModel.prototype.TYPE_PORT      = 2;
BvGMapModel.prototype.TYPE_PORT_FORT = 3;
BvGMapModel.prototype.TYPE_PESTHOLE  = 4;
BvGMapModel.prototype.TYPE_CAPITAL   = 5;

// --- Objective Constants
BvGMapModel.prototype.OBJECTIVE_USA_MISSISSIPPI    = 1;
BvGMapModel.prototype.OBJECTIVE_USA_BLOCKADE       = 2;
BvGMapModel.prototype.OBJECTIVE_USA_RICHMOND       = 3;
BvGMapModel.prototype.OBJECTIVE_USA_ATLANTA        = 4;
BvGMapModel.prototype.OBJECTIVE_USA_SHENANDOAH     = 5;
BvGMapModel.prototype.OBJECTIVE_USA_RAILNET        = 6;
BvGMapModel.prototype.OBJECTIVE_USA_ATLANTIC_PORTS = 7;
BvGMapModel.prototype.OBJECTIVE_USA_GULF_PORTS     = 8;
BvGMapModel.prototype.OBJECTIVE_CSA_RAILNET        = "Railnet";

// -- Draw/Restore Status Index Constants
BvGMapModel.prototype.DRAWSTATUS_LATEWAR   = 0;
BvGMapModel.prototype.DRAWSTATUS_IRONCLADS = 1;
BvGMapModel.prototype.DRAWSTATUS_DIGGING   = 2;

// === View Housekeeping

BvGMapModel.prototype._views = [];

BvGMapModel.prototype.addView = function(view) {
    this._views.push(view);
    view._map = this;  // TBD: document and/or fix this
};

// === Map Housekeeping

BvGMapModel.prototype._mapCards = [
    // letter  status
    [ "A", BvGMapModel.prototype.STATUS_USA,     [[ "Indianapolis",         BvGMapModel.prototype.STATUS_USA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Cincinnati",           BvGMapModel.prototype.STATUS_USA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Columbus (OH)",        BvGMapModel.prototype.STATUS_USA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Cleveland",            BvGMapModel.prototype.STATUS_USA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Toledo",               BvGMapModel.prototype.STATUS_USA,     BvGMapModel.prototype.TYPE_CITY ]]],
    [ "B", BvGMapModel.prototype.STATUS_USA,     [[ "Wheeling",             BvGMapModel.prototype.STATUS_NEUTRAL, BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Pittsburgh",           BvGMapModel.prototype.STATUS_USA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Harrisburg",           BvGMapModel.prototype.STATUS_USA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Harper's Ferry",       BvGMapModel.prototype.STATUS_USA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Baltimore",            BvGMapModel.prototype.STATUS_USA,     BvGMapModel.prototype.TYPE_PORT_FORT ],
                                                  [ "Washington",           BvGMapModel.prototype.STATUS_USA,     BvGMapModel.prototype.TYPE_CAPITAL ]]],
    [ "C", BvGMapModel.prototype.STATUS_USA,     [[ "Centralia",            BvGMapModel.prototype.STATUS_USA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Cairo",                BvGMapModel.prototype.STATUS_USA,     BvGMapModel.prototype.TYPE_CITY_FORT ],
                                                  [ "Louisville",           BvGMapModel.prototype.STATUS_USA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Lexington",            BvGMapModel.prototype.STATUS_USA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Bowling Green",        BvGMapModel.prototype.STATUS_USA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Fts Henry & Donelson", BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Nashville",            BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ]]],
    [ "C", BvGMapModel.prototype.STATUS_NEUTRAL, [[ "Centralia",            BvGMapModel.prototype.STATUS_USA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Cairo",                BvGMapModel.prototype.STATUS_USA,     BvGMapModel.prototype.TYPE_CITY_FORT ],
                                                  [ "Louisville",           BvGMapModel.prototype.STATUS_NEUTRAL, BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Lexington",            BvGMapModel.prototype.STATUS_NEUTRAL, BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Bowling Green",        BvGMapModel.prototype.STATUS_NEUTRAL, BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Fts Henry & Donelson", BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Nashville",            BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ]]],
    [ "C", BvGMapModel.prototype.STATUS_CSA,     [[ "Centralia",            BvGMapModel.prototype.STATUS_USA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Cairo",                BvGMapModel.prototype.STATUS_USA,     BvGMapModel.prototype.TYPE_CITY_FORT ],
                                                  [ "Island No 10",         BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Louisville",           BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Lexington",            BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Bowling Green",        BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Fts Henry & Donelson", BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY_FORT ],
                                                  [ "Nashville",            BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ]]],
    [ "D", BvGMapModel.prototype.STATUS_CSA,     [[ "Cumberland Gap",       BvGMapModel.prototype.STATUS_NEUTRAL, BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Shenandoah Valley",    BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_PESTHOLE ],
                                                  [ "Lynchburg",            BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Knoxville",            BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Greensboro",           BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ]]],
    [ "E", BvGMapModel.prototype.STATUS_CSA,     [[ "Manassas Jct",         BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Wilderness",           BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_PESTHOLE ],
                                                  [ "Richmond",             BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CAPITAL ],
                                                  [ "Petersburg",           BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY_FORT ],
                                                  [ "Raleigh",              BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Norfolk",              BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_PORT ],
                                                  [ "Ft Monroe",            BvGMapModel.prototype.STATUS_USA,     BvGMapModel.prototype.TYPE_PORT_FORT ]]],
    [ "F", BvGMapModel.prototype.STATUS_USA,     [[ "Memphis",              BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Corinth",              BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Grenada",              BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_PESTHOLE ],
                                                  [ "Tupelo",               BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_PESTHOLE ]]],
    [ "F", BvGMapModel.prototype.STATUS_CSA,     [[ "Memphis",              BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY_FORT ],
                                                  [ "Corinth",              BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Grenada",              BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_PESTHOLE ],
                                                  [ "Tupelo",               BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_PESTHOLE ]]],
    [ "G", BvGMapModel.prototype.STATUS_USA,     [[ "Decatur",              BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Chattanooga",          BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Atlanta",              BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY_FORT ],
                                                  [ "Augusta",              BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ]]],
    [ "G", BvGMapModel.prototype.STATUS_CSA,     [[ "Decatur",              BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Chattanooga",          BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY_FORT ],
                                                  [ "Atlanta",              BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY_FORT ],
                                                  [ "Augusta",              BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ]]],
    [ "H", BvGMapModel.prototype.STATUS_USA,     [[ "New Berne",            BvGMapModel.prototype.STATUS_USA,     BvGMapModel.prototype.TYPE_PORT ],
                                                  [ "Goldsboro",            BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Wilmington",           BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_PORT_FORT ],
                                                  [ "Columbia",             BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Florence",             BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Charleston/Ft Sumter", BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_PORT_FORT ]]],
    [ "H", BvGMapModel.prototype.STATUS_CSA,     [[ "New Berne",            BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_PORT_FORT ],
                                                  [ "Goldsboro",            BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Wilmington",           BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_PORT_FORT ],
                                                  [ "Columbia",             BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Florence",             BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Charleston/Ft Sumter", BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_PORT_FORT ]]],
    [ "I", BvGMapModel.prototype.STATUS_USA,     [[ "Vicksburg",            BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY_FORT ],
                                                  [ "Jackson",              BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Port Hudson",          BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY_FORT ],
                                                  [ "New Orleans",          BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_PORT ]]],
    [ "I", BvGMapModel.prototype.STATUS_CSA,     [[ "Vicksburg",            BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY_FORT ],
                                                  [ "Jackson",              BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Port Hudson",          BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY_FORT ],
                                                  [ "New Orleans",          BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_PORT_FORT ]]],
    [ "J", BvGMapModel.prototype.STATUS_USA,     [[ "Meridian",             BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_PESTHOLE ],
                                                  [ "Selma",                BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Montgomery",           BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Columbus (GA)",        BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Mobile",               BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_PORT ],
                                                  [ "Ft Morgan",            BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_PORT_FORT ],
                                                  [ "Pensacola",            BvGMapModel.prototype.STATUS_USA,     BvGMapModel.prototype.TYPE_PORT_FORT ],
                                                  [ "Ft Pickens",           BvGMapModel.prototype.STATUS_USA,     BvGMapModel.prototype.TYPE_PORT_FORT ]]],
    [ "J", BvGMapModel.prototype.STATUS_CSA,     [[ "Meridian",             BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_PESTHOLE ],
                                                  [ "Selma",                BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_PESTHOLE ],
                                                  [ "Montgomery",           BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Columbus (GA)",        BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Mobile",               BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_PORT_FORT ],
                                                  [ "Ft Morgan",            BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_PORT_FORT ],
                                                  [ "Pensacola",            BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_PORT_FORT ],
                                                  [ "Ft Pickens",           BvGMapModel.prototype.STATUS_USA,     BvGMapModel.prototype.TYPE_PORT_FORT ]]],
    [ "K", BvGMapModel.prototype.STATUS_USA,     [[ "Macon",                BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Savannah",             BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_PORT ],
                                                  [ "Boston",               BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ]]],
    [ "K", BvGMapModel.prototype.STATUS_CSA,     [[ "Macon",                BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ],
                                                  [ "Savannah",             BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_PORT_FORT ],
                                                  [ "Boston",               BvGMapModel.prototype.STATUS_CSA,     BvGMapModel.prototype.TYPE_CITY ]]]
];

// === Configuration Functions

BvGMapModel.prototype.getConfiguration = function() {
    var encoder = Base64.getEncoder();
    var i;

    // Compute data for the map cards; 11 cards x 2 bits per card = 22 bits: DDCCBBAA|HHGGFFEE|KKJJII
    var mapCardLetters = "ABCDEFGHIJK";
    for (i = 0; i < mapCardLetters.length; ++i) {
        encoder.add(2, this.getMapCardState(mapCardLetters.charAt(i)));
    }

    // Compute data for the three-state cities; 5 cities (4 KY + Wheeling) x 2 bits per city = 10 bits (32 bits total)
    for (i = 0; i < this._3StateCityArray.length; ++i) {
        encoder.add(2, this.getCityStatus(this._3StateCityArray[i]));
    }

    // Compute data for normal cities; 55 cities x 1 bit per city = 55 bits (87 bits total)
    for (i = 0; i < this._cityArray.length; ++i) {
        encoder.add(1, (this.getCityStatus(this._cityArray[i]) & 1));
    }

    // There's one bit left in the current byte; let's use it for Trans-Mississippi fulfillment
    encoder.add(1, this._xMissFulfilled ? 1 : 0);

    // Compute data for supply
    encoder.add(4, Math.min(15, this._supply[this.STATUS_USA]));
    encoder.add(4, Math.min(15, this._supply[this.STATUS_CSA]));

    // Compute data for naval squadrons and drawstatus
    encoder.add(1, this._canEmancipate                         ? 1 : 0);
    encoder.add(1, this._drawStatus[this.DRAWSTATUS_DIGGING]   ? 1 : 0);
    encoder.add(1, this._drawStatus[this.DRAWSTATUS_IRONCLADS] ? 1 : 0);
    encoder.add(1, this._drawStatus[this.DRAWSTATUS_LATEWAR]   ? 1 : 0);
    encoder.add(2, this._navy[this.THEATER_WEST]);
    encoder.add(2, this._navy[this.THEATER_EAST]);

    return encoder.getStr();
};

BvGMapModel.prototype.initialize = function() {
    // Deactivate activated maps
    for (var mapLetter in this._activatedMaps) {
        this._deactivateMapCard(this._activatedMaps[mapLetter]);
    }

    // Make a new hash, since there's no way to remove keys
    this._activatedMaps    = {};
    this._numActivatedMaps = 0;
    this._activatedCities  = {};
    this._cityStatus       = {};

    // Activate the default cards
    this.activateMapCard("A", this.STATUS_USA, true);
    this.activateMapCard("B", this.STATUS_USA, true);
    this.activateMapCard("D", this.STATUS_CSA, true);
    this.activateMapCard("E", this.STATUS_CSA, true);

    // Set initial supply
    this.setSupply(this.STATUS_USA, 1);
    this.setSupply(this.STATUS_CSA, 0);

    // Set initial naval deployment
    this.setNavy(this.THEATER_WEST, 0);
    this.setNavy(this.THEATER_EAST, 1);

    // Set initial objectives
    for (var i = 1; i < this._usaObjectives.length; ++i) {
        this.setUsaObjective(i, false);
    }

    this._mississippiCities = { "Cairo"       : 1,
                                "Memphis"     : 1,
                                "Vicksburg"   : 1,
                                "Port Hudson" : 1,
                                "New Orleans" : 1 };

    // Calc railnet
    this.setUsaObjective(this.OBJECTIVE_USA_RAILNET, !this._checkCsaRailnet());
    this.setCsaObjective(this.OBJECTIVE_CSA_RAILNET, !this._checkUsaRailnet());

    this.setDrawStatus(this.DRAWSTATUS_LATEWAR,   false);
    this.setDrawStatus(this.DRAWSTATUS_IRONCLADS, false);
    this.setDrawStatus(this.DRAWSTATUS_DIGGING,   false);

    this.setCanEmancipate(false);
    this.setXMissFulfilled(false);

    this._recalcDrawRestores();
};

BvGMapModel.prototype.loadFromConfiguration = function(configStr) {
    var decoder = Base64.getDecoder(configStr);
    var i;

    this.initialize();

    // Read off map status; can ignore "A", "B", "D", "E" since initialize() took care of them
    decoder.read(4); // ignore A,B

    var mapStatus = {};
    mapStatus.C = decoder.read(2);
    decoder.read(4); // ignore D,E
    mapStatus.F = decoder.read(2);
    mapStatus.G = decoder.read(2);
    mapStatus.H = decoder.read(2);
    mapStatus.I = decoder.read(2);
    mapStatus.J = decoder.read(2);
    mapStatus.K = decoder.read(2);

    for (var mapLetter in mapStatus) {
        if (mapStatus[mapLetter] != this.STATUS_UNPLAYED) {
            this.activateMapCard(mapLetter, mapStatus[mapLetter], true);
        }
    }

    // Read off 3-state city status
    var cityStatusHash = {};
    for (i = 0; i < this._3StateCityArray.length; ++i) {
        cityStatusHash[this._3StateCityArray[i]] = decoder.read(2);
    }

    // Read off city status
    for (i = 0; i < this._cityArray.length; ++i) {
        cityStatusHash[this._cityArray[i]] = decoder.read(1);
    }

    // Read off Trans-Mississippi fulfillment; we know this is on a byte boundary
    this.setXMissFulfilled(decoder.read(1));

    // Read off supply
    this.setSupply(this.STATUS_USA, decoder.read(4));
    this.setSupply(this.STATUS_CSA, decoder.read(4));

    // Read off draw status
    this.setCanEmancipate(                        decoder.read(1));
    this.setDrawStatus(this.DRAWSTATUS_DIGGING,   decoder.read(1));
    this.setDrawStatus(this.DRAWSTATUS_IRONCLADS, decoder.read(1));
    this.setDrawStatus(this.DRAWSTATUS_LATEWAR,   decoder.read(1));

    // Read off navies
    this.setNavy(this.THEATER_WEST, decoder.read(2));
    this.setNavy(this.THEATER_EAST, decoder.read(2));

    // Now set city status on activated cards
    for (var mapLetter2 in this._activatedMaps) {
        var mapCities = this._activatedMaps[mapLetter2][2];
        for (i = 0; i < mapCities.length; ++i) {
            this.setCityStatus(mapCities[i][0], cityStatusHash[mapCities[i][0]], true);
        }
    }

    // Now check railnets
    this.setUsaObjective(this.OBJECTIVE_USA_RAILNET, !this._checkCsaRailnet());
    this.setCsaObjective(this.OBJECTIVE_CSA_RAILNET, !this._checkUsaRailnet());

    this._recalcDrawRestores();
};

BvGMapModel.prototype._getCityArray = function(excludedCities) {
    var a = [];
    var i;

    var excludedCityHash = {};
    for (i = 0; i < excludedCities.length; ++i) {
        excludedCityHash[excludedCities[i]] = 1;
    }

    for (i = 0; i < this._mapCards.length; ++i) {
        var mapCard = this._mapCards[i];
        var mapCities = mapCard[2];
        for (var cityI = 0; cityI < mapCities.length; ++cityI) {
            if (!excludedCityHash[mapCities[cityI][0]]) {
                a.push(mapCities[cityI][0]);
                excludedCityHash[mapCities[cityI][0]] = 1;  // avoid multiple copies
            }
        }
    }

    return a;
};

BvGMapModel.prototype._get3StateCityArray = function() {
    var a = [];
    for (var i = 0; i < this._mapCards.length; ++i) {
        var mapCard = this._mapCards[i];
        var mapCities = mapCard[2];
        for (var cityI = 0; cityI < mapCities.length; ++cityI) {
            if (mapCities[cityI][1] == this.STATUS_NEUTRAL) {
                a.push(mapCities[cityI][0]);
            }
        }
    }
    return a;
};

BvGMapModel.prototype._computeCsaObjectiveCities = function() {
    var cityHash = {};
    var nativeUSACityMaps = [["A", this.STATUS_USA],
                             ["B", this.STATUS_USA],
                             ["C", this.STATUS_NEUTRAL],
                             ["E", this.STATUS_CSA]];
    for (var i = 0; i < nativeUSACityMaps.length; ++i) {
        var mapCard = this.getMapCard(nativeUSACityMaps[i][0], nativeUSACityMaps[i][1]);
        var mapCities = mapCard[2];
        for (var cityI = 0; cityI < mapCities.length; ++cityI) {
            if (mapCities[cityI][1] == this.STATUS_USA) {
                cityHash[mapCities[cityI][0]] = 1;
            }
        }
    }

    return cityHash;
};

BvGMapModel.prototype._computeAtlanticPorts = function() {
    var cityHash = {};
    var maps = [["E", this.STATUS_CSA],
                ["H", this.STATUS_CSA],
                ["K", this.STATUS_CSA]];
    for (var i = 0; i < maps.length; ++i) {
        var mapCard = this.getMapCard(maps[i][0], maps[i][1]);
        var mapCities = mapCard[2];
        for (var cityI = 0; cityI < mapCities.length; ++cityI) {
            if (mapCities[cityI][2] == this.TYPE_PORT || mapCities[cityI][2] == this.TYPE_PORT_FORT) {
                cityHash[mapCities[cityI][0]] = 1;
            }
        }
    }
    return cityHash;
};

BvGMapModel.prototype._computeGulfPorts = function() {
    var cityHash = {};
    var maps = [["I", this.STATUS_USA],
                ["J", this.STATUS_USA]];
    for (var i = 0; i < maps.length; ++i) {
        var mapCard = this.getMapCard(maps[i][0], maps[i][1]);
        var mapCities = mapCard[2];
        for (var cityI = 0; cityI < mapCities.length; ++cityI) {
            if (mapCities[cityI][2] == this.TYPE_PORT || mapCities[cityI][2] == this.TYPE_PORT_FORT) {
                cityHash[mapCities[cityI][0]] = 1;
            }
        }
    }
    return cityHash;
};

// === Map Functions

BvGMapModel.prototype.activateMapCard = function(mapLetter, status, dontRecalcRailnet) {
    var mapCard = this.getMapCard(mapLetter, status);
    this._activatedMaps[mapLetter] = mapCard;
    this._numActivatedMaps++;

    var viewI;

    for (viewI = 0; viewI < this._views.length; ++viewI) {
        this._views[viewI].activateMapCard(mapCard[0], mapCard[1]);
    }

    var mapCities = mapCard[2];
    for (var cityI = 0; cityI < mapCities.length; ++cityI) {
        for (viewI = 0; viewI < this._views.length; ++viewI) {
            this._activatedCities[mapCities[cityI][0]] = 1;
            this._views[viewI].activateCity(mapCities[cityI][0], mapCities[cityI][1], mapCities[cityI][2]);
            this.setCityStatus(mapCities[cityI][0], mapCities[cityI][1], true);
        }
    }

    // Cumberland Gap has special rules
    if (mapLetter == "C") {
        if (status == this.STATUS_USA || status == this.STATUS_CSA) {
            this.setCityStatus("Cumberland Gap", status, true);
        }

        // Does Island # 10 now exist?
        if (status == this.STATUS_CSA) {
            this._mississippiCities["Island No 10"] = this.STATUS_CSA;
        }
    }

    // Now check railnets
    if (!dontRecalcRailnet) {
        this.setUsaObjective(this.OBJECTIVE_USA_RAILNET, !this._checkCsaRailnet());
        this.setCsaObjective(this.OBJECTIVE_CSA_RAILNET, !this._checkUsaRailnet());
    }
};

BvGMapModel.prototype.getMapCard = function(letter, status) {
    for (var i = 0; i < this._mapCards.length; ++i) {
        var mapCard = this._mapCards[i];
        if (mapCard[0] == letter && mapCard[1] == status) {
            return mapCard;
        }
    }
    return null;
};

BvGMapModel.prototype.getMapCardState = function(mapLetter) {
    if (this._activatedMaps[mapLetter]) {
        return this._activatedMaps[mapLetter][1];
    }
    return this.STATUS_UNPLAYED;
};

BvGMapModel.prototype.getUnplayedMapCards = function() {
    var mapCardList = [];

    for (var i = 0; i < this._mapCards.length; ++i) {
        var mapCard = this._mapCards[i];
        if (!this._activatedMaps[mapCard[0]]) {
            mapCardList.push(mapCard);
        }
    }

    return mapCardList;
};

BvGMapModel.prototype._deactivateMapCard = function(mapCard) {
    var mapCities = mapCard[2];
    var viewI;
    for (var cityI = 0; cityI < mapCities.length; ++cityI) {
        for (viewI = 0; viewI < this._views.length; ++viewI) {
            this._activatedCities[mapCities[cityI][0]] = undefined;
            this._views[viewI]._deactivateCity(mapCities[cityI][0]);
        }
    }
    for (viewI = 0; viewI < this._views.length; ++viewI) {
        this._views[viewI]._deactivateMapCard(mapCard[0], mapCard[1]);
    }
    this._numActivatedMaps--;
};

// === City Housekeeping

BvGMapModel.prototype._cityStatus = {};
BvGMapModel.prototype._connections = {
                           // [0] array of cities adjacent by road/rail  [1] array of cities adjacent by river only
    "Atlanta"              : [["Chattanooga", "Augusta", "Macon", "Columbus (GA)", "Montgomery", "Selma"]],
    "Augusta"              : [["Columbia", "Florence", "Charleston/Ft Sumter", "Atlanta"]],
    "Baltimore"            : [["Harper's Ferry", "Washington", "Harrisburg"]],
    "Boston"               : [["Savannah"]],
    "Bowling Green"        : [["Louisville", "Nashville", "Fts Henry & Donelson"]],
    "Cairo"                : [["Centralia", "Fts Henry & Donelson", "Corinth", "Memphis"], ["Louisville", "Island No 10"]],
    "Centralia"            : [["Cairo", "Indianapolis", "Cincinnati", "Louisville"]],
    "Charleston/Ft Sumter" : [["Florence", "Columbia", "Augusta", "Savannah"]],
    "Chattanooga"          : [["Knoxville", "Nashville", "Decatur", "Atlanta", "Selma"]],
    "Cincinnati"           : [["Centralia", "Indianapolis", "Louisville", "Columbus (OH)", "Harper's Ferry", "Lexington", "Wheeling"]],
    "Cleveland"            : [["Toledo", "Pittsburgh"]],
    "Columbia"             : [["Greensboro", "Florence", "Charleston/Ft Sumter", "Augusta"]],
    "Columbus (OH)"        : [["Indianapolis", "Cincinnati", "Wheeling"]],
    "Columbus (GA)"        : [["Atlanta", "Macon", "Montgomery"]],
    "Corinth"              : [["Cairo", "Fts Henry & Donelson", "Decatur", "Tupelo", "Grenada", "Memphis"]],
    "Cumberland Gap"       : [["Lexington", "Knoxville"]],
    "Decatur"              : [["Nashville", "Chattanooga", "Corinth"]],
    "Florence"             : [["Wilmington", "Charleston/Ft Sumter", "Augusta", "Columbia"]],
    "Ft Monroe"            : [["Richmond"]],
    "Ft Morgan"            : [["Mobile"]],
    "Ft Pickens"           : [["Pensacola"]],
    "Fts Henry & Donelson" : [["Cairo", "Bowling Green", "Nashville", "Corinth", "Memphis"]],
    "Goldsboro"            : [["Raleigh", "Petersburg", "Norfolk", "New Berne", "Wilmington"]],
    "Greensboro"           : [["Lynchburg", "Petersburg", "Raleigh", "Columbia"]],
    "Grenada"              : [["Memphis", "Corinth", "Jackson"]],
    "Harper's Ferry"       : [["Wheeling", "Cincinnati", "Baltimore", "Shenandoah Valley", "Washington"]],
    "Harrisburg"           : [["Pittsburgh", "Baltimore"]],
    "Indianapolis"         : [["Centralia", "Cincinnati", "Columbus (OH)", "Toledo", "Louisville"]],
    "Island No 10"         : [[], ["Cairo", "Memphis"]],
    "Jackson"              : [["Grenada", "Meridian", "New Orleans", "Vicksburg"]],
    "Knoxville"            : [["Cumberland Gap", "Lynchburg", "Chattanooga"]],
    "Lexington"            : [["Cincinnati", "Cumberland Gap", "Louisville"]],
    "Louisville"           : [["Centralia", "Indianapolis", "Cincinnati", "Lexington", "Bowling Green"], ["Cairo"]],
    "Lynchburg"            : [["Shenandoah Valley", "Wilderness", "Petersburg", "Greensboro", "Knoxville"]],
    "Macon"                : [["Atlanta", "Savannah", "Columbus (GA)"]],
    "Manassas Jct"         : [["Washington", "Wilderness", "Shenandoah Valley"]],
    "Memphis"              : [["Cairo", "Fts Henry & Donelson", "Corinth", "Grenada"], ["Island No 10", "Vicksburg"]],
    "Meridian"             : [["Tupelo", "Selma", "Mobile", "Jackson"]],
    "Mobile"               : [["Meridian", "Montgomery", "Pensacola", "Ft Morgan"]],
    "Montgomery"           : [["Atlanta", "Columbus (GA)", "Mobile", "Pensacola", "Selma"]],
    "Nashville"            : [["Bowling Green", "Chattanooga", "Decatur", "Fts Henry & Donelson"]],
    "New Berne"            : [["Goldsboro"]],
    "New Orleans"          : [["Jackson"], ["Port Hudson"]],
    "Norfolk"              : [["Petersburg", "Raleigh", "Goldsboro"]],
    "Pensacola"            : [["Ft Pickens", "Mobile", "Montgomery"]],
    "Petersburg"           : [["Richmond", "Norfolk", "Goldsboro", "Raleigh", "Greensboro", "Lynchburg"]],
    "Pittsburgh"           : [["Cleveland", "Harrisburg", "Wheeling"]],
    "Port Hudson"          : [[], ["Vicksburg", "New Orleans"]],
    "Raleigh"              : [["Petersburg", "Norfolk", "Goldsboro", "Greensboro"]],
    "Richmond"             : [["Wilderness", "Ft Monroe", "Petersburg"]],
    "Savannah"             : [["Charleston/Ft Sumter", "Macon", "Boston"]],
    "Selma"                : [["Chattanooga", "Atlanta", "Montgomery", "Meridian"]],
    "Shenandoah Valley"    : [["Harper's Ferry", "Manassas Jct", "Wilderness", "Lynchburg"]],
    "Toledo"               : [["Indianapolis", "Cleveland"]],
    "Tupelo"               : [["Corinth", "Meridian"]],
    "Vicksburg"            : [["Jackson"], ["Memphis", "Port Hudson"]],
    "Washington"           : [["Baltimore", "Harper's Ferry", "Manassas Jct"]],
    "Wheeling"             : [["Pittsburgh", "Harper's Ferry", "Cincinnati", "Columbus (OH)"]],
    "Wilderness"           : [["Shenandoah Valley", "Manassas Jct", "Richmond", "Lynchburg"]],
    "Wilmington"           : [["Goldsboro", "Florence"]]
};

// === City Functions

BvGMapModel.prototype.getCityDefaultStatus = function(cityName) {
    for (var mapLetter in this._activatedMaps) {
        var mapCityArray = this._activatedMaps[mapLetter][2];
        for (var i = 0; i < mapCityArray.length; ++i) {
            if (mapCityArray[i][0] == cityName) {
                return mapCityArray[i][1];
            }
        }
    }
    return this.STATUS_UNPLAYED;
};

BvGMapModel.prototype.getCityStatus = function(cityName) {
    if (typeof(this._cityStatus[cityName]) != "undefined") {
        return this._cityStatus[cityName];
    }
    return this.STATUS_UNPLAYED;
};

BvGMapModel.prototype.isCityCsaObjective = function(cityName) {
    return this._csaObjectiveCities[cityName];
};

BvGMapModel.prototype.isCityUsaObjective = function(cityName) {
    if (cityName == "Shenandoah Valley")  { return this.OBJECTIVE_USA_SHENANDOAH; }
    if (cityName == "Atlanta")            { return this.OBJECTIVE_USA_ATLANTA; }
    if (cityName == "Richmond")           { return this.OBJECTIVE_USA_RICHMOND; }
    return false;
};

BvGMapModel.prototype.setCityFocus = function(cityName) {
    // You can only put focus on cities on activated maps
    for (var mapLetter in this._activatedMaps) {
        var mapCityArray = this._activatedMaps[mapLetter][2];
        for (var i = 0; i < mapCityArray.length; ++i) {
            if (mapCityArray[i][0] == cityName) {
                for (var viewI = 0; viewI < this._views.length; ++viewI) {
                    this._views[viewI].cityHasFocus(cityName);
                }
                return;
            }
        }
    }
};

BvGMapModel.prototype.setCityStatus = function(cityName, status, dontCheckRailnet) {
    if (this._cityStatus[cityName] != status) {
        this._cityStatus[cityName] = status;
        for (var i = 0; i < this._views.length; ++i) {
            this._views[i].changeCityStatus(cityName, status);
        }

        // Process CSA objective cities (native northern cities + Ft Monroe)
        if (this.isCityCsaObjective(cityName)) {
            this.setCsaObjective(cityName, status == this.STATUS_CSA);
        }

        // Process USA objective cities (Atlanta, Richmond, Shenandoah Valley
        var usaObjective = this.isCityUsaObjective(cityName);
        if (usaObjective) {
            this.setUsaObjective(usaObjective, status == this.STATUS_USA);
        }

        // Is it a Gulf port?  If so, check USA Gulf Ports objective
        if (this._gulfPorts[cityName]) {
            var allGulfPortsOccupied = true;
            for (var gulfPortName in this._gulfPorts) {
                if (this.getCityStatus(gulfPortName) != this.STATUS_USA) {
                    allGulfPortsOccupied = false;
                    break;
                }
            }
            this.setUsaObjective(this.OBJECTIVE_USA_GULF_PORTS, allGulfPortsOccupied);
            this._checkBlockade();
        }

        // Is it an Atlantic port?  If so, check USA Atlantic Ports objective
        if (this._atlanticPorts[cityName]) {
            var allAtlanticPortsOccupied = true;
            for (var atlanticPortName in this._atlanticPorts) {
                if (this.getCityStatus(atlanticPortName) != this.STATUS_USA) {
                    allAtlanticPortsOccupied = false;
                    break;
                }
            }
            this.setUsaObjective(this.OBJECTIVE_USA_ATLANTIC_PORTS, allAtlanticPortsOccupied);
            this._checkBlockade();
        }

        // Is it a Mississippi city?  If so, check the USA Mississippi objective
        if (this._mississippiCities[cityName]) {
            this._checkMississippiControl();
        }

        // Now check railnets
        if (!dontCheckRailnet) {
            this.setUsaObjective(this.OBJECTIVE_USA_RAILNET, !this._checkCsaRailnet());
            this.setCsaObjective(this.OBJECTIVE_CSA_RAILNET, !this._checkUsaRailnet());
        }

        this._recalcDrawRestores();
    }
};

// === Supply Functions

BvGMapModel.prototype.setSupply = function(side, supplyPts) {
    if (this._supply[side] != supplyPts) {
        this._supply[side] = supplyPts;
        for (var i = 0; i < this._views.length; ++i) {
            this._views[i].changeSupply(side, supplyPts);
        }
    }
};

BvGMapModel.prototype.getSupply = function(side) {
    return this._supply[side];
};

// === Navy Functions

BvGMapModel.prototype.getNavy = function(theater) {
    return this._navy[theater];
};

BvGMapModel.prototype.setNavy = function(theater, numSquadrons) {
    if (numSquadrons != this._navy[theater]) {
        var oldNavy = this._navy[theater];
        this._navy[theater] = numSquadrons;
        for (var i = 0; i < this._views.length; ++i) {
            this._views[i].navyChanged(theater, numSquadrons);
        }

        if (theater == this.THEATER_EAST) {
            this._checkBlockade();
            this._recalcDrawRestores();
        }

        if (theater == this.THEATER_WEST && ((oldNavy > 0) != (numSquadrons > 0))) {
            this._checkMississippiControl();
        }
    }
};

// === Rail net function

BvGMapModel.prototype._checkCsaRailnet = function() {
    var seenHash = {};

    // Each city is the potential root of a railnet
    for (var cityName in this._activatedCities) {
        if (!seenHash[cityName] && this.getCityStatus(cityName) == this.STATUS_CSA) {
            // Prime the pump
            var railnetSize = 1;
            var cityQ = [ cityName ];
            seenHash[cityName] = 1;
            //var debugInfo = [ cityName ];  // Debugging

            while (cityQ.length > 0) {
                var nextCityName = cityQ.shift();

                // Add CSA-controlled adjacent cities to the queue
                var connections = this._connections[nextCityName];
                for (var i = 0; i < connections.length; ++i) {  // rail and water connections
                    // ignore water connections if rivers are interdicted
                    if (i == 1 && this.getNavy(this.THEATER_WEST) > 0) {
                        continue;
                    }

                    for (var j = 0; j < connections[i].length; ++j) {
                        var adjCityName = connections[i][j];
                        if (!seenHash[adjCityName] && this.getCityStatus(adjCityName) == this.STATUS_CSA) {
                            if (this.getCityDefaultStatus(adjCityName) == this.STATUS_CSA) {
                                //debugInfo.push(adjCityName);     // Debugging
                                if (++railnetSize >= this._numActivatedMaps) {
                                    //alert(debugInfo.join(","));   // Debugging
                                    return true;
                                }
                            }
                            cityQ.push(adjCityName);
                            seenHash[adjCityName] = 1;
                        }
                    }
                }
            }
        }
    }

    return false;
};

BvGMapModel.prototype._checkUsaRailnet = function() {
    var seenHash = {};

    // Each city is the potential root of a railnet
    for (var cityName in this._csaObjectiveCities) {
        if (!seenHash[cityName] && this.getCityStatus(cityName) == this.STATUS_USA) {
            // Prime the pump
            var railnetSize = 1;
            var cityQ = [ cityName ];
            seenHash[cityName] = 1;
            //var debugInfo = [ cityName ];  // Debugging

            while (cityQ.length > 0) {
                var nextCityName = cityQ.shift();

                // Add USA-controlled adjacent cities to the queue
                var connections = this._connections[nextCityName];
                for (var i = 0; i < connections.length; ++i) {  // check rail and water connections
                    for (var j = 0; j < connections[i].length; ++j) {
                        var adjCityName = connections[i][j];
                        if (!seenHash[adjCityName] && this.getCityStatus(adjCityName) == this.STATUS_USA) {
                            if (this._csaObjectiveCities[adjCityName]) {
                                //debugInfo.push(adjCityName);     // Debugging
                                if (++railnetSize > 8) {
                                    //alert(debugInfo.join(","));   // Debugging
                                    return true;
                                }
                            }
                            cityQ.push(adjCityName);
                            seenHash[adjCityName] = 1;
                        }
                    }
                }
            }
        }
    }

    return false;
};

// === Objectives Functions

// The blockade is more complicated than the other objectives because any of three
// independent conditions can fulfill it.  So you can't just turn it on/off based on
// just one of those conditions.
BvGMapModel.prototype._checkBlockade = function() {
    var fullBlockade = false;
    if (this._navy[this.THEATER_EAST] >= 2) {   // 2+ squadrons in the east is a full blockade
        fullBlockade = true;
    } else if (this._navy[this.THEATER_EAST] == 1) {  // 1 squadron in the east, plus Mississippi or Atlantic ports occupied is also a full blockadeo
        if (this._usaObjectives[this.OBJECTIVE_USA_ATLANTIC_PORTS] || this._usaObjectives[this.OBJECTIVE_USA_GULF_PORTS]) {
            fullBlockade = true;
        }
    }
    this.setUsaObjective(this.OBJECTIVE_USA_BLOCKADE, fullBlockade);
};

BvGMapModel.prototype._checkMississippiControl = function() {
    var allMississippiCitiesOccupied = true;
    for (var mississippiCityName in this._mississippiCities) {
        if (this.getCityStatus(mississippiCityName) != this.STATUS_USA) {
            allMississippiCitiesOccupied = false;
            break;
        }
    }
    this.setUsaObjective(this.OBJECTIVE_USA_MISSISSIPPI, allMississippiCitiesOccupied && this._navy[this.THEATER_WEST] > 0);
};

BvGMapModel.prototype.setCsaObjective = function(objective, onOff) {
    if (this._csaObjectives[objective] != onOff) {
        this._csaObjectives[objective] = onOff;
        for (var i = 0; i < this._views.length; ++i) {
            this._views[i].csaObjectiveChanged(objective, onOff);
        }
    }
};

BvGMapModel.prototype.setUsaObjective = function(objective, onOff) {
    if (this._usaObjectives[objective] != onOff) {
        this._usaObjectives[objective] = onOff;
        for (var i = 0; i < this._views.length; ++i) {
            this._views[i].usaObjectiveChanged(objective, onOff);
        }
    }
};

// === Draws/Restores

BvGMapModel.prototype.getDraws = function(side) {
    return this._draws[side];
};

BvGMapModel.prototype.getRestores = function(side) {
    return this._restores[side];
};

BvGMapModel.prototype.setDrawStatus = function(drawStatus, onOff) {
    if (this._drawStatus[drawStatus] != onOff) {
        this._drawStatus[drawStatus] = onOff;
        this._recalcDrawRestores();
        for (var i = 0; i < this._views.length; ++i) {
            this._views[i].changeDrawStatus(drawStatus, onOff);
        }
    }
};

BvGMapModel.prototype._recalcDrawRestores = function() {
    var oldDraws    = [ this._draws.length ];
    var oldRestores = [ this._restores.length ];
    var i;

    for (i = 0; i < this._draws.length; ++i) {
        oldDraws[i]    = this._draws[i];
        oldRestores[i] = this._restores[i];
    }

    // USA
    this._draws[this.STATUS_USA]    = 5;
    this._restores[this.STATUS_USA] = 1;

    // Extra draw in Late War
    if (this._drawStatus[this.DRAWSTATUS_LATEWAR]) {
        ++this._draws[this.STATUS_USA];
    }

    // Less one draw if railnet cut
    if (this._csaObjectives[this.OBJECTIVE_CSA_RAILNET]) {
        --this._draws[this.STATUS_USA];
    }

    // CSA
    // Begin with base of 4
    var numDraws    = 4;
    var numRestores = 0;

    // Check blockade status
    if (this._usaObjectives[this.OBJECTIVE_USA_BLOCKADE]) { // full blockade
        // no changes
    } else if (this.getNavy(this.THEATER_EAST) == 1 ||
               this._usaObjectives[this.OBJECTIVE_USA_ATLANTIC_PORTS] ||
               this._usaObjectives[this.OBJECTIVE_USA_GULF_PORTS]) { // partial blockade
        ++numRestores;
    } else { // no blockade
        ++numDraws;
    }

    // How many productions have been lost?
    var numLostProductions = 0;

    // Industry production
    if (this._usaObjectives[this.OBJECTIVE_USA_RICHMOND] && this._usaObjectives[this.OBJECTIVE_USA_ATLANTA]) {
        ++numLostProductions;
    }

    // Food production
    if (this._usaObjectives[this.OBJECTIVE_USA_SHENANDOAH] && this._usaObjectives[this.OBJECTIVE_USA_RAILNET]) {
        ++numLostProductions;
    }

    // Contraband check is a little harder; map C, F, and I have to be in play, plus all Mississippi cities USA-occupied
    var doContrabandCheck = true;
    var contrabandMapLetters = ["C", "F", "I"];
    for (i = 0; i < contrabandMapLetters.length; ++i) {
        var mapLetter = contrabandMapLetters[i];
        if (this.getMapCardState(mapLetter) == this.STATUS_UNPLAYED) {
            doContrabandCheck = false;
            break;
        }
    }

    if (doContrabandCheck) {
        var contrabandProductionLost = true;
        for (var cityName in this._mississippiCities) {
            if (this.getCityStatus(cityName) != this.STATUS_USA) {
                contrabandProductionLost = false;
                break;
            }
        }
        if (contrabandProductionLost) {
            ++numLostProductions;
        }
    }

    switch (numLostProductions) {
    case 0: /* no change */                  break;
    case 1: numDraws -= 1; numRestores += 1; break;
    case 2: numDraws -= 1;                   break;
    case 3: numDraws -= 2; numRestores += 2; break;
    }

    // Digging and/or Ironclads active?
    if (this._drawStatus[this.DRAWSTATUS_IRONCLADS]) {
        ++numRestores;
    }
    if (this._drawStatus[this.DRAWSTATUS_DIGGING]) {
        ++numRestores;
    }

    this._draws[this.STATUS_CSA]    = numDraws;
    this._restores[this.STATUS_CSA] = numRestores;

    // If any changes, notify observers
    for (i = 0; i < 2; ++i) {
        if (this._draws[i] != oldDraws[i] || this._restores[i] != oldRestores[i]) {
            for (var j = 0; j < this._views.length; ++j) {
                this._views[j].changeDrawRestores(this._draws[this.STATUS_USA], this._restores[this.STATUS_USA],
                                                  this._draws[this.STATUS_CSA], this._restores[this.STATUS_CSA]);
            }
            break;
        }
    }
};

// === Miscellaneous Functions

BvGMapModel.prototype.setXMissFulfilled = function(onOff) {
    // When the Trans Miss state changes and the USA has fulfilled their Mississippi objective,
    // we have to adjust the objectives count.  It seems easiest just to turn off the objective,
    // set the Trans Miss state, and the reset the objective.  It's a bit of a hack, though.
    // Have to make sure to set .xMissFulfulled in exactly the right spot, too.
    var mississippiHack = this._usaObjectives[this.OBJECTIVE_USA_MISSISSIPPI];

    if (mississippiHack) {
        this.setUsaObjective(this.OBJECTIVE_USA_MISSISSIPPI, false);
    }

    this._xMissFulfilled = onOff;

    for (var i = 0; i < this._views.length; ++i) {
        this._views[i].xMissFulfilledChanged(onOff);
    }

    if (mississippiHack) {
        this.setUsaObjective(this.OBJECTIVE_USA_MISSISSIPPI, true);
    }
};

BvGMapModel.prototype.setCanEmancipate = function(onOff) {
    this._canEmancipate = onOff;
    for (var i = 0; i < this._views.length; ++i) {
        this._views[i].canEmancipateChanged(onOff);
    }
};

BvGMapModel.prototype.getSideStr = function(status) {
    if (status == this.STATUS_USA)      { return "usa"; }
    if (status == this.STATUS_CSA)      { return "csa"; }
    if (status == this.STATUS_NEUTRAL)  { return "neutral"; }
    if (status == this.STATUS_UNPLAYED) { return "-"; }
    return "?";
};

BvGMapModel.prototype._checkConnections = function() {
    var str = "";
    var i, j, adjCityName, crossCheckSucceeded;

    for (var cityName in this._connections) {
        var adjArray = this._connections[cityName];
        if (adjArray.length < 1 || typeof(adjArray[0]) != "object") {
            str += cityName + " has bad adjacency array\n";
            continue;
        }

        for (i = 0; i < adjArray[0].length; ++i) {
            adjCityName = adjArray[0][i];
            if (this._connections[adjCityName]) {
                crossCheckSucceeded = false;
                for (j = 0; j < this._connections[adjCityName][0].length; ++j) {
                    if (this._connections[adjCityName][0][j] == cityName) {
                        crossCheckSucceeded = true;
                        break;
                    }
                }
                if (!crossCheckSucceeded) {
                    str += cityName + " is adjacent to " + adjCityName + ", but the reverse isn't true\n";
                }
            } else {
                str += cityName + " is adjacent to " + adjCityName + ", which doesn't exist\n";
            }
        }

        if (adjArray.length > 1) {
            for (i = 0; i < adjArray[1].length; ++i) {
                adjCityName = adjArray[1][i];
                if (this._connections[adjCityName] && this._connections[adjCityName].length > 1) {
                    crossCheckSucceeded = false;
                    for (j = 0; j < this._connections[adjCityName][1].length; ++j) {
                        if (this._connections[adjCityName][1][j] == cityName) {
                            crossCheckSucceeded = true;
                            break;
                        }
                    }
                    if (!crossCheckSucceeded) {
                        str += cityName + " is adjacent to " + adjCityName + " by river, but the reverse isn't true\n";
                    }
                } else {
                    str += cityName + " is adjacent to " + adjCityName + " by river, which doesn't exist\n";
                }
            }
        }
    }
    alert(str || "All connections check out!");
};
