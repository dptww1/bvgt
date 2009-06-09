// $Id: bvgmapmodel.js,v 1.7 2004/12/22 02:58:55 DaveT Exp $

// {{{ BvGMapModel
// {{{ Constructor
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
	this._mississippiCities  = new Object();  // but needs to be preset so initial setCityStatus() calls don't die

    this._supply        = new Array(2);  // index via STATUS_USA and STATUS_CSA
	this._navy          = new Array(2);    // index via THEATER_WEST and THEATER_EAST
	this._usaObjectives = new Array(false, false, false, false, false, false, false, false, false); // index via OBJECTIVE_USA_XXX constants

    this._csaObjectives = new Object();  // index via USA City name, or pseudo-city "Railnet"
	for (var cityName in this._csaObjectiveCities)
		this._csaObjectives[cityName] = false;
	this._csaObjectives["Railnet"] = false;

	this._draws    = new Array(2);   // index via STATUS_USA and STATUS_CSA
	this._restores = new Array(2);   // index via STATUS_USA and STATUS_CSA

	this._drawStatus = new Array(3); // index via DRAWSTATUS_XXX
}
// }}}
// {{{ Constants
// {{{     Theater Constants
BvGMapModel.prototype.THEATER_WEST = 0;
BvGMapModel.prototype.THEATER_EAST = 1;
// }}}
// {{{     Status Constants
BvGMapModel.prototype.STATUS_USA      = 0;  // city or map card
BvGMapModel.prototype.STATUS_CSA      = 1;  // city or map card
BvGMapModel.prototype.STATUS_NEUTRAL  = 2;  // city or map card C
BvGMapModel.prototype.STATUS_UNPLAYED = 3;  // map card
// }}}
// {{{     Type Constants
BvGMapModel.prototype.TYPE_CITY      = 0;
BvGMapModel.prototype.TYPE_CITY_FORT = 1;
BvGMapModel.prototype.TYPE_PORT      = 2;
BvGMapModel.prototype.TYPE_PORT_FORT = 3;
BvGMapModel.prototype.TYPE_PESTHOLE  = 4;
BvGMapModel.prototype.TYPE_CAPITAL   = 5;
// }}}
// {{{     Objective Constants
BvGMapModel.prototype.OBJECTIVE_USA_MISSISSIPPI    = 1;
BvGMapModel.prototype.OBJECTIVE_USA_BLOCKADE       = 2;
BvGMapModel.prototype.OBJECTIVE_USA_RICHMOND       = 3;
BvGMapModel.prototype.OBJECTIVE_USA_ATLANTA        = 4;
BvGMapModel.prototype.OBJECTIVE_USA_SHENANDOAH     = 5;
BvGMapModel.prototype.OBJECTIVE_USA_RAILNET        = 6;
BvGMapModel.prototype.OBJECTIVE_USA_ATLANTIC_PORTS = 7;
BvGMapModel.prototype.OBJECTIVE_USA_GULF_PORTS     = 8;
BvGMapModel.prototype.OBJECTIVE_CSA_RAILNET        = "Railnet";
// }}}
// {{{     Draw/Restore Status Index Constants
BvGMapModel.prototype.DRAWSTATUS_LATEWAR   = 0;
BvGMapModel.prototype.DRAWSTATUS_IRONCLADS = 1;
BvGMapModel.prototype.DRAWSTATUS_DIGGING   = 2;
// }}}
// }}}
// {{{ View Housekeeping
BvGMapModel.prototype._views = new Array();
// {{{     addView()
BvGMapModel.prototype.addView = function(view) {
	this._views.push(view);
	view._map = this;  // TBD: document and/or fix this
}
// }}}
// }}}
// {{{ Map Housekeeping
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
// }}}
// {{{ Configuration Functions
// {{{     _charSet [private]
BvGMapModel.prototype._charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-.";
// }}}
// {{{     getConfiguration()
BvGMapModel.prototype.getConfiguration = function() {
	var rawBytes = new Array();
	var unusedBitsThisByte = 8;
	var newByte = 0;

	// Compute data for the map cards
	var mapCardLetters = "ABCDEFGHIJK";
	for (var i = 0; i < mapCardLetters.length; ++i) {
		newByte <<= 2;
		newByte |= this.getMapCardState(mapCardLetters.charAt(i));
		if ((unusedBitsThisByte -= 2) <= 0) {
			rawBytes.push(newByte);
			newByte = 0;
			unusedBitsThisByte = 8;
		}
	}

	// Compute data for the three-state cities
	for (var i = 0; i < this._3StateCityArray.length; ++i) {
		newByte <<= 2;
		newByte |= this.getCityStatus(this._3StateCityArray[i]);
		if ((unusedBitsThisByte -= 2) <= 0) {
			rawBytes.push(newByte);
			newByte = 0;
			unusedBitsThisByte = 8;
		}
	}

	// Compute data for normal cities
	for (var i = 0; i < this._cityArray.length; ++i) {
		newByte <<= 1;
		// The & 1 will convert UNPLAYED cities to CSA, but since they are, well, not in play that's OK
		newByte |= (this.getCityStatus(this._cityArray[i]) & 1);
		if ((unusedBitsThisByte -= 1) <= 0) {
			rawBytes.push(newByte);
			newByte = 0;
			unusedBitsThisByte = 8;
		}
	}

	// Remember to add on incomplete last byte, if needed
	if (unusedBitsThisByte != 8)
    	rawBytes.push(newByte << unusedBitsThisByte);

	// Compute data for supply
	rawBytes.push((Math.min(15, this._supply[this.STATUS_USA]) << 4) | Math.min(15, this._supply[this.STATUS_CSA]));

	// Compute data for naval squadrons and drawstatus
	rawBytes.push(((this._drawStatus[this.DRAWSTATUS_DIGGING]   ? 1 : 0) << 6) |
				  ((this._drawStatus[this.DRAWSTATUS_IRONCLADS] ? 1 : 0) << 5) |
				  ((this._drawStatus[this.DRAWSTATUS_LATEWAR]   ? 1 : 0) << 4) |
				  (this._navy[this.THEATER_WEST]                         << 2) | 
				  this._navy[this.THEATER_EAST]);

	// Now uuencode (sorta) the raw bytes
	// State 0: grab top 6 bits from cur char
	// State 1: grab bottom 2 bits from cur char, next char, grab top 4 bits
	// State 2: grab bottom 4 bit of cur char, next char, grab top 2 bits
	// State 3: grab bottom 6 bits of cur char
	var str = "";
	var state = 0;
	for (var i = 0; i < rawBytes.length; /*empty*/) {
		switch (state) {
		case 0:
			str += this._charSet.charAt((rawBytes[i] & 0xfc) >>> 2);
			break;
		case 1:
			var bits = (rawBytes[i] & 0x3) << 4;
			if (++i < rawBytes.length)
				bits |= ((rawBytes[i] & 0xf0) >>> 4);
			str += this._charSet.charAt(bits);
			break;
		case 2:
			var bits = (rawBytes[i] & 0xf) << 2;
			if (++i < rawBytes.length)
				bits |= ((rawBytes[i] & 0xc0) >>> 6);
			str += this._charSet.charAt(bits);
			break;
		case 3:
			str += this._charSet.charAt(rawBytes[i++] & 0x3f);
			break;
		}
		state = (state + 1) % 4;
	}
	
	return str;
}
// }}}
// {{{     initialize()
BvGMapModel.prototype.initialize = function() {
	// Deactivate activated maps
	for (var mapLetter in this._activatedMaps) {
		this._deactivateMapCard(this._activatedMaps[mapLetter]);
	}

	// Make a new hashe, since there's no way to remove keys
	this._activatedMaps = new Object();
	this._numActivatedMaps = 0;
	this._activatedCities = new Object();
	this._cityStatus = new Object();

	// Activate the default cards
	this.activateMapCard("A", map.STATUS_USA, true);
	this.activateMapCard("B", map.STATUS_USA, true);
	this.activateMapCard("D", map.STATUS_CSA, true);
	this.activateMapCard("E", map.STATUS_CSA, true);

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
}
// }}}
// {{{     loadFromConfiguration()
BvGMapModel.prototype.loadFromConfiguration = function(configStr) {
	var str = "";

	// Create reverse lookup table from _charset
	var charValues = new Object();
	for (var i = 0; i < this._charSet.length; ++i) {
		charValues[this._charSet.charAt(i)] = i;
	}

	// Make a place for unencoded values
	var rawBytes = new Array();

	// State 0: cur char goes into top 6 bits
	// State 1: cur char's bit 5,4 go into low 2 bits, next byte, cur char's bits 3-0 go into top 4 bits
	// State 2: cur char's bits 5-2 go into low 4 bits, next byte, cur char's bit 1,0 go into top 2 bits
	// State 3: cur char goes into bottom 6 bits
	var state = 0;
	for (var i = 0; i < configStr.length; ++i) {
		var v = charValues[configStr.charAt(i)];
		switch (state) {
		case 0:
			rawBytes.push(v << 2);
			break;
		case 1:
			rawBytes[rawBytes.length - 1] |= ((v & 0x30) >>> 4);
			rawBytes.push((v & 0x0f) << 4);
			break;
		case 2:
			rawBytes[rawBytes.length - 1] |= ((v & 0x3c) >>> 2);
			rawBytes.push((v & 0x3) << 6);
			break;
		case 3:
			rawBytes[rawBytes.length - 1] |= v;
			break;
		}
		state = (state + 1) % 4;
	}

	this.initialize();

	// Read off map status; can ignore "A", "B", "D", "E" since initialize() took care of them
	var mapStatus = new Object();
	mapStatus["C"] = (rawBytes[0] >>> 2) & 3;
	mapStatus["F"] = (rawBytes[1] >>> 4) & 3;
	mapStatus["G"] = (rawBytes[1] >>> 2) & 3;
	mapStatus["H"] = rawBytes[1] & 3;
	mapStatus["I"] = (rawBytes[2] >>> 6) & 3;
	mapStatus["J"] = (rawBytes[2] >>> 4) & 3;
	mapStatus["K"] = (rawBytes[2] >>> 2) & 3;

	for (var mapLetter in mapStatus) {
		if (mapStatus[mapLetter] != this.STATUS_UNPLAYED)
			this.activateMapCard(mapLetter, mapStatus[mapLetter], true);
	}
	
	// Read off 3-state city status
	var cityStatusHash = new Object();
	var shiftAmt = 0;
	var rawI = 2;
	for (var i = 0; i < this._3StateCityArray.length; ++i) {
		cityStatusHash[this._3StateCityArray[i]] = (rawBytes[rawI] >>> shiftAmt) & 3;
		if ((shiftAmt -= 2) < 0) {
			++rawI;
			shiftAmt = 6;
		}
	}

	// Read off city status
	++shiftAmt;
	for (var i = 0; i < this._cityArray.length; ++i) {
		cityStatusHash[this._cityArray[i]] = (rawBytes[rawI] >>> shiftAmt) & 1;
		if ((shiftAmt -= 1) < 0) {
			++rawI;
			shiftAmt = 7;
		}
	}

	// Read off supply
	++rawI;
	this.setSupply(this.STATUS_USA, (rawBytes[rawI] >>> 4) & 0xf);
	this.setSupply(this.STATUS_CSA, rawBytes[rawI] & 0xf);

	// Read off navies
	++rawI;
	this.setNavy(this.THEATER_WEST, (rawBytes[rawI] >>> 2) & 0x3);
	this.setNavy(this.THEATER_EAST, rawBytes[rawI] & 0x3);

	// Read off draw status
	this.setDrawStatus(this.DRAWSTATUS_LATEWAR,   (this.DRAWSTATUS_LATEWAR,   rawBytes[rawI] >>> 4) & 0x1);
	this.setDrawStatus(this.DRAWSTATUS_IRONCLADS, (this.DRAWSTATUS_IRONCLADS, rawBytes[rawI] >>> 5) & 0x1);
	this.setDrawStatus(this.DRAWSTATUS_DIGGING,   (this.DRAWSTATUS_DIGGING,   rawBytes[rawI] >>> 6) & 0x1);

	// Now set city status on activated cards
	for (var mapLetter in this._activatedMaps) {
		var mapCities = this._activatedMaps[mapLetter][2];
		for (var i = 0; i < mapCities.length; ++i) {
			this.setCityStatus(mapCities[i][0], cityStatusHash[mapCities[i][0]], true);
		}
	}

	// Now check railnets
	this.setUsaObjective(this.OBJECTIVE_USA_RAILNET, !this._checkCsaRailnet());
	this.setCsaObjective(this.OBJECTIVE_CSA_RAILNET, !this._checkUsaRailnet());
}
// }}}
// {{{     _getCityArray() [private]
BvGMapModel.prototype._getCityArray = function(excludedCities) {
	var a = new Array();

	var excludedCityHash = new Object();
	for (var i = 0; i < excludedCities.length; ++i)
    	excludedCityHash[excludedCities[i]] = 1;
	
	for (var i = 0; i < this._mapCards.length; ++i) {
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
}
// }}}
// {{{     _get3StateCityArray() [private]
BvGMapModel.prototype._get3StateCityArray = function() {
	var a = new Array();
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
}
// }}}
// {{{    _computeCsaObjectiveCities()
BvGMapModel.prototype._computeCsaObjectiveCities = function() {
	var cityHash = new Object();
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
}
// }}}
// {{{    _computeAtlanticPorts()
BvGMapModel.prototype._computeAtlanticPorts = function() {
	var cityHash = new Object();
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
}
// }}}
// {{{    _computeGulfPorts()
BvGMapModel.prototype._computeGulfPorts = function() {
	var cityHash = new Object();
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
}
// }}}
// }}}
// {{{ Map Functions
// {{{     activateMapCard()
BvGMapModel.prototype.activateMapCard = function(mapLetter, status, dontRecalcRailnet) {
	var mapCard = this.getMapCard(mapLetter, status);
	this._activatedMaps[mapLetter] = mapCard;
	this._numActivatedMaps++;

	for (var viewI = 0; viewI < this._views.length; ++viewI)
	    this._views[viewI].activateMapCard(mapCard[0], mapCard[1]);

	var mapCities = mapCard[2];
	for (var cityI = 0; cityI < mapCities.length; ++cityI) {
		for (var viewI = 0; viewI < this._views.length; ++viewI) {
			this._activatedCities[mapCities[cityI][0]] = 1;
			this._views[viewI].activateCity(mapCities[cityI][0], mapCities[cityI][1], mapCities[cityI][2]);
			this.setCityStatus(mapCities[cityI][0], mapCities[cityI][1], true);
		}
	}

	// Cumberland Gap has special rules
	if (mapLetter == "C") {
		if (status == this.STATUS_USA || status == this.STATUS_CSA)
		    this.setCityStatus("Cumberland Gap", status, true);

		// Does Island # 10 now exist?
		if (status == this.STATUS_CSA)
		    this._mississippiCities["Island No 10"] = this.STATUS_CSA;
	}

	// Now check railnets
	if (!dontRecalcRailnet) {
    	this.setUsaObjective(this.OBJECTIVE_USA_RAILNET, !this._checkCsaRailnet());
	    this.setCsaObjective(this.OBJECTIVE_CSA_RAILNET, !this._checkUsaRailnet());
	}
}
// }}}
// {{{     getMapCard()
BvGMapModel.prototype.getMapCard = function(letter, status) {
	for (var i = 0; i < this._mapCards.length; ++i) {
		var mapCard = this._mapCards[i];
		if (mapCard[0] == letter && mapCard[1] == status)
    		return mapCard;
	}
    return null;
}
// }}}
// {{{     getMapCardState()
BvGMapModel.prototype.getMapCardState = function(mapLetter) {
    if (this._activatedMaps[mapLetter])
        return this._activatedMaps[mapLetter][1];
    return this.STATUS_UNPLAYED;
}
// }}}
// {{{     getUnplayedMapCards()
BvGMapModel.prototype.getUnplayedMapCards = function() {
    var mapCardList = new Array();

    for (var i = 0; i < this._mapCards.length; ++i) {
        var mapCard = this._mapCards[i];
        if (!this._activatedMaps[mapCard[0]]) {
            mapCardList.push(mapCard);
        }
    }
    
    return mapCardList;
}
// }}}
// {{{ _deactivateMapCard()
BvGMapModel.prototype._deactivateMapCard = function(mapCard) {
	var mapCities = mapCard[2];
	for (var cityI = 0; cityI < mapCities.length; ++cityI) {
		for (var viewI = 0; viewI < this._views.length; ++viewI) {
			this._activatedCities[mapCities[cityI][0]] = undefined;
			this._views[viewI]._deactivateCity(mapCities[cityI][0]);
		}
	}
	for (var viewI = 0; viewI < this._views.length; ++viewI) {
		this._views[viewI]._deactivateMapCard(mapCard[0], mapCard[1]);
	}
	this._numActivatedMaps--;
}
// }}}
// }}}
// {{{ City Housekeeping
BvGMapModel.prototype._cityStatus = new Object();
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
// }}}
// {{{ City Functions
// {{{     getCityDefaultStatus()
BvGMapModel.prototype.getCityDefaultStatus = function(cityName) {
    for (var mapLetter in this._activatedMaps) {
        var mapCityArray = this._activatedMaps[mapLetter][2];
        for (var i = 0; i < mapCityArray.length; ++i) {
            if (mapCityArray[i][0] == cityName)
                return mapCityArray[i][1];
        }
    }
    return this.STATUS_UNPLAYED;
}
// }}}
// {{{     getCityStatus()
BvGMapModel.prototype.getCityStatus = function(cityName) {
	if (typeof(this._cityStatus[cityName]) != "undefined")
	    return this._cityStatus[cityName]; 
	return this.STATUS_UNPLAYED;
}
// }}}
// {{{     isCityCsaObjective()
BvGMapModel.prototype.isCityCsaObjective = function(cityName) {
	return this._csaObjectiveCities[cityName];
}
// }}}
// {{{     isCityUsaObjective()
BvGMapModel.prototype.isCityUsaObjective = function(cityName) {
	if (cityName == "Shenandoah Valley")  return this.OBJECTIVE_USA_SHENANDOAH;
	if (cityName == "Atlanta")            return this.OBJECTIVE_USA_ATLANTA;
	if (cityName == "Richmond")           return this.OBJECTIVE_USA_RICHMOND;
	return false;
}
// }}}
// {{{     setCityFocus()
BvGMapModel.prototype.setCityFocus = function(cityName) {
	// You can only put focus on cities on activated maps
	for (var mapLetter in this._activatedMaps) {
		var mapCityArray = this._activatedMaps[mapLetter][2];
        for (var i = 0; i < mapCityArray.length; ++i) {
            if (mapCityArray[i][0] == cityName) {
				for (var viewI = 0; viewI < this._views.length; ++viewI)
					this._views[viewI].cityHasFocus(cityName);
				return;
			}
        }
	}
}
// }}}
// {{{     setCityStatus()
BvGMapModel.prototype.setCityStatus = function(cityName, status, dontCheckRailnet) {
	if (this._cityStatus[cityName] != status) {
		this._cityStatus[cityName] = status;
		for (var i = 0; i < this._views.length; ++i)
			this._views[i].changeCityStatus(cityName, status);

		// Process CSA objective cities (native northern cities + Ft Monroe)
		if (this.isCityCsaObjective(cityName)) 
    	    this.setCsaObjective(cityName, status == this.STATUS_CSA);

		// Process USA objective cities (Atlanta, Richmond, Shenandoah Valley
		var usaObjective = this.isCityUsaObjective(cityName)
		if (usaObjective)
			this.setUsaObjective(usaObjective, status == this.STATUS_USA);

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
}
// }}}
// }}}
// {{{ Supply Functions
// {{{     setSupply()
BvGMapModel.prototype.setSupply = function(side, supplyPts) {
	if (this._supply[side] != supplyPts) {
    	this._supply[side] = supplyPts;
	    for (var i = 0; i < this._views.length; ++i) {
		    this._views[i].changeSupply(side, supplyPts);
		}
	}
}
// }}}
// {{{     getSupply()
BvGMapModel.prototype.getSupply = function(side) {
	return this._supply[side];
}
// }}}
// }}}
// {{{ Navy Functions
// {{{     getNavy()
BvGMapModel.prototype.getNavy = function(theater) {
	return this._navy[theater];
}
// }}}
// {{{     setNavy()
BvGMapModel.prototype.setNavy = function(theater, numSquadrons) {
	if (numSquadrons != this._navy[theater]) {
		var oldNavy = this._navy[theater];
		this._navy[theater] = numSquadrons;
		for (var i = 0; i < this._views.length; ++i)
			this._views[i].navyChanged(theater, numSquadrons);
		
		if (theater == this.THEATER_EAST) {
			this._checkBlockade();
			this._recalcDrawRestores();
		}

		if (theater == this.THEATER_WEST && ((oldNavy > 0) != (numSquadrons > 0)))
			this._checkMississippiControl();
	}
}
// }}}
// }}}
// {{{ Rail net function
// {{{     _checkCsaRailnet()
BvGMapModel.prototype._checkCsaRailnet = function() {
	var seenHash = new Object();

	// Each city is the potential root of a railnet
	for (var cityName in this._activatedCities) {
		if (!seenHash[cityName] && this.getCityStatus(cityName) == this.STATUS_CSA) {
			// Prime the pump
			var railnetSize = 1;
			var cityQ = new Array(cityName);
			seenHash[cityName] = 1;
			//var debugInfo = new Array(cityName);  // Debugging

			while (cityQ.length > 0) {
				var nextCityName = cityQ.shift();

				// Add CSA-controlled adjacent cities to the queue
				var connections = this._connections[nextCityName];
				for (var i = 0; i < connections.length; ++i) {  // rail and water connections
					// ignore water connections if rivers are interdicted
					if (i == 1 && this.getNavy(this.THEATER_WEST) > 0)
						continue;

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
}
// }}}
// {{{     _checkUsaRailnet()
BvGMapModel.prototype._checkUsaRailnet = function() {
	var seenHash = new Object();

	// Each city is the potential root of a railnet
	for (var cityName in this._csaObjectiveCities) {
		if (!seenHash[cityName] && this.getCityStatus(cityName) == this.STATUS_USA) {
			// Prime the pump
			var railnetSize = 1;
			var cityQ = new Array(cityName);
			seenHash[cityName] = 1;
			//var debugInfo = new Array(cityName);  // Debugging

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
}
// }}}
// }}}
// {{{ Objectives Functions
// {{{     _checkBlockade()
// The blockade is more complicated than the other objectives because any of three
// independent conditions can fulfill it.  So you can't just turn it on/off based on
// just one of those conditions
BvGMapModel.prototype._checkBlockade = function() {
	var fullBlockade = false;
	if (this._navy[this.THEATER_EAST] >= 2) {	// 2+ squadrons in the east is a full blockade
		fullBlockade = true;
	} else if (this._navy[this.THEATER_EAST] == 1) {  // 1 squadron in the east, plus Mississippi or Atlantic ports occupied is also a full blockadeo
		if (this._usaObjectives[this.OBJECTIVE_USA_ATLANTIC_PORTS] || this._usaObjectives[this.OBJECTIVE_USA_GULF_PORTS])
			fullBlockade = true;
	}
	this.setUsaObjective(this.OBJECTIVE_USA_BLOCKADE, fullBlockade);
}
// }}}
// {{{     _checkMississippiControl()
BvGMapModel.prototype._checkMississippiControl = function() {
	var allMississippiCitiesOccupied = true;
	for (var mississippiCityName in this._mississippiCities) {
		if (this.getCityStatus(mississippiCityName) != this.STATUS_USA) {
			allMississippiCitiesOccupied = false;
			break;
		}
	}
	this.setUsaObjective(this.OBJECTIVE_USA_MISSISSIPPI, allMississippiCitiesOccupied && this._navy[this.THEATER_WEST] > 0);
}
// }}}
// {{{     setCsaoObjective()
BvGMapModel.prototype.setCsaObjective = function(objective, onOff) {
	if (this._csaObjectives[objective] != onOff) {
		this._csaObjectives[objective] = onOff;
		for (var i = 0; i < this._views.length; ++i) {
			this._views[i].csaObjectiveChanged(objective, onOff);
		}
	}
}
// }}}
// {{{     setUsaObjective()
BvGMapModel.prototype.setUsaObjective = function(objective, onOff) {
	if (this._usaObjectives[objective] != onOff) {
		this._usaObjectives[objective] = onOff;
		for (var i = 0; i < this._views.length; ++i) {
			this._views[i].usaObjectiveChanged(objective, onOff);
		}
	}
}
// }}}
// }}}
// {{{ Draws/Restores
// {{{     getDraws()
BvGMapModel.prototype.getDraws = function(side) {
	return this._draws[side];
}
// }}}
// {{{     getRestores()
BvGMapModel.prototype.getRestores = function(side) {
	return this._restores[side];
}
// }}}
// {{{     setDrawStatus()
BvGMapModel.prototype.setDrawStatus = function(drawStatus, onOff) {
	if (this._drawStatus[drawStatus] != onOff) {
		this._drawStatus[drawStatus] = onOff;
		this._recalcDrawRestores();
		for (var i = 0; i < this._views.length; ++i)
			this._views[i].changeDrawStatus(drawStatus, onOff);
	}
}
// }}}
// {{{     _recalcDrawRestores()
BvGMapModel.prototype._recalcDrawRestores = function() {
	var oldDraws    = new Array(this._draws.length);
	var oldRestores = new Array(this._restores.length);
	for (var i = 0; i < this._draws.length; ++i) {
		oldDraws[i]    = this._draws[i];
		oldRestores[i] = this._restores[i];
	}

	// USA
	this._draws[this.STATUS_USA]    = 5;
	this._restores[this.STATUS_USA] = 1;
	
	// Extra draw in Late War
	if (this._drawStatus[this.DRAWSTATUS_LATEWAR])
		++this._draws[this.STATUS_USA];

	// Less one draw if railnet cut
	if (this._csaObjectives[this.OBJECTIVE_CSA_RAILNET])
		--this._draws[this.STATUS_USA];

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
	if (this._usaObjectives[this.OBJECTIVE_USA_RICHMOND] && this._usaObjectives[this.OBJECTIVE_USA_ATLANTA])
		++numLostProductions;

	// Food production
	if (this._usaObjectives[this.OBJECTIVE_USA_SHENANDOAH] && this._usaObjectives[this.OBJECTIVE_USA_RAILNET])
		++numLostProductions;

	// Contraband check is a little harder; map C, F, and I have to be in play, plus all Mississippi cities USA-occupied
	var doContrabandCheck = true;
	var contrabandMapLetters = ["C", "F", "I"];
	for (var i = 0; i < contrabandMapLetters.length; ++i) {
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
		if (contrabandProductionLost)
			++numLostProductions;
	}

	switch (numLostProductions) {
	case 0: /* no change */                  break;
	case 1: numDraws -= 1; numRestores += 1; break;
	case 2: numDraws -= 1;                   break;
	case 3: numDraws -= 2; numRestores += 2; break;
	}

	// Digging and/or Ironclads active?
	if (this._drawStatus[this.DRAWSTATUS_IRONCLADS])
		++numRestores;
	if (this._drawStatus[this.DRAWSTATUS_DIGGING])
		++numRestores;

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
}
// }}}
// }}}
// {{{ Miscellaneous Functions
// {{{     getMapStatusSummary()
BvGMapModel.prototype.getMapStatusSummary = function() { // TBD:
}
// }}}
// {{{     getSideStr()
BvGMapModel.prototype.getSideStr = function(status) {
    if (status == this.STATUS_USA)      return "usa";
    if (status == this.STATUS_CSA)      return "csa";
    if (status == this.STATUS_NEUTRAL)  return "neutral";
    if (status == this.STATUS_UNPLAYED) return "-";
    return "?";
}
// }}}
// {{{     _checkConnections
BvGMapModel.prototype._checkConnections = function() {
	var str = "";
	for (var cityName in this._connections) {
		var adjArray = this._connections[cityName];
		if (adjArray.length < 1 || typeof(adjArray[0]) != "object") {
			str += cityName + " has bad adjacency array\n";
			continue;
		}
			
		for (var i = 0; i < adjArray[0].length; ++i) {
			var adjCityName = adjArray[0][i];
			if (this._connections[adjCityName]) {
				var crossCheckSucceeded = false;
				for (var j = 0; j < this._connections[adjCityName][0].length; ++j) {
					if (this._connections[adjCityName][0][j] == cityName) {
						crossCheckSucceeded = true;
						break;
					}
				}
				if (!crossCheckSucceeded)
					str += cityName + " is adjacent to " + adjCityName + ", but the reverse isn't true\n";
			} else
				str += cityName + " is adjacent to " + adjCityName + ", which doesn't exist\n";
		}

		if (adjArray.length > 1) {
			for (var i = 0; i < adjArray[1].length; ++i) {
				var adjCityName = adjArray[1][i];
				if (this._connections[adjCityName] && this._connections[adjCityName].length > 1) {
					var crossCheckSucceeded = false;
					for (var j = 0; j < this._connections[adjCityName][1].length; ++j) {
						if (this._connections[adjCityName][1][j] == cityName) {
							crossCheckSucceeded = true;
							break;
						}
					}
					if (!crossCheckSucceeded)
						str += cityName + " is adjacent to " + adjCityName + " by river, but the reverse isn't true\n";
				} else
					str += cityName + " is adjacent to " + adjCityName + " by river, which doesn't exist\n";
			}
		}
	}
	alert(str || "All connections check out!");
}
// }}}
// }}}
// }}}
