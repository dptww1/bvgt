var Base64 = (function() {
  var _charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-.";

  // Create reverse lookup table from _charSet
  var _charValues = {};
  for (var i = 0; i < _charSet.length; ++i) {
    _charValues[_charSet.charAt(i)] = i;
  }


  function Encoder() {
    var _bytes   = [];    // accumulated bytes; first bits added are in [0]; bits are filled LSB to MSB
    var _idx     = -1;    // index of current byte within _bytes
    var _nextBit = -1;     // where next bit within _bytes[_idx] will be stored (7..0)
    var _str     = null;  // if non-null, the cached string value

    this.add = function(numBits, val) {
      if (numBits < 1) {
        throw "don't be a wiseguy";
      }

      // Get a string representation of the value in binary: 45 => "101101"
      var bstr = val.toString(2);

      // Left-pad the binary representation out to the field width.  If passed (3, 1), then
      // we need to put "001" into the string, not just "1".
      if (bstr.length > numBits) {
        throw "" + val + " doesn't fit in " + numBits + " bits";
      }
      while (bstr.length < numBits) {
        bstr = "0" + bstr;
      }

      _str = null;

      for (var i = 0; i < numBits; ++i) {
        if (_nextBit === -1) {
          _idx += 1;
          _bytes[_idx] = 0;
          _nextBit = 7;
        }

        _bytes[_idx] |= (bstr.charAt(i) === "1" ? 1 : 0) << _nextBit;

        _nextBit -= 1;
      }
    };

    this.getStr = function() {
      // Return cached copy if possible
      if (_str) {
        return _str;
      }

      // State 0: grab top 6 bits from cur char
      // State 1: grab bottom 2 bits from cur char, next char, grab top 4 bits
      // State 2: grab bottom 4 bit of cur char, next char, grab top 2 bits
      // State 3: grab bottom 6 bits of cur char
      var str = "";
      var state = 0;
      var bits;
      var lastIdx = _bytes.length - 1;

      DECODELOOP:
      for (var i = 0; i < _bytes.length; /*empty*/) {

        switch (state) {
        case 0:
          str += _charSet.charAt((_bytes[i] & 0xfc) >>> 2);
          if (i === lastIdx && _nextBit >= 1) { // bottom 2 bits were unused
            break DECODELOOP;
          }
          break;

        case 1:
          bits = (_bytes[i] & 0x3) << 4;
          if (++i < _bytes.length) {
            bits |= ((_bytes[i] & 0xf0) >>> 4);
          }

          str += _charSet.charAt(bits);

          if (i === lastIdx && _nextBit >= 3) { // bottom 4 bits were unused
            break DECODELOOP;
          }
          break;

        case 2:
          bits = (_bytes[i] & 0xf) << 2;
          if (++i < _bytes.length) {
            bits |= ((_bytes[i] & 0xc0) >>> 6);
          }

          str += _charSet.charAt(bits);

          if (i === lastIdx && _nextBit >= 5) { // bottom 6 bits were unused
            break DECODELOOP;
          }
          break;

        case 3:
          str += _charSet.charAt(_bytes[i++] & 0x3f);
          break;
        }

        state = (state + 1) % 4;
      }

      // Cache result
      _str = str;

      return str;
    };
  };

  function Decoder(str) {
    var _bytes = []; // str translated back from 6-bit characters into 8-bit bytes
    var _idx   = 0;  // index of byte where next read operation begins
    var _bit   = 7;  // bit within _bytes[_idx] where next read operation begins

    // State 0: cur char goes into top 6 bits
    // State 1: cur char's bit 5,4 go into low 2 bits, next byte, cur char's bits 3-0 go into top 4 bits
    // State 2: cur char's bits 5-2 go into low 4 bits, next byte, cur char's bit 1,0 go into top 2 bits
    // State 3: cur char goes into bottom 6 bits
    var state = 0;
    for (var i = 0; i < str.length; ++i) {

      var v = _charValues[str.charAt(i)];

      switch (state) {
      case 0:
        _bytes.push(v << 2);
        break;

      case 1:
        _bytes[_bytes.length - 1] |= ((v & 0x30) >>> 4);
        _bytes.push((v & 0x0f) << 4);
        break;

      case 2:
        _bytes[_bytes.length - 1] |= ((v & 0x3c) >>> 2);
        _bytes.push((v & 0x3) << 6);
        break;

      case 3:
        _bytes[_bytes.length - 1] |= v;
        break;
      }

      state = (state + 1) % 4;
    }

    this.read = function(numBits) {
      var v = 0;

      for (var i = 0; i < numBits; ++i) {
        // Did we run off the end of the array?
          if (_idx > _bytes.length)
            throw "out of data on bit " + i;

          v <<= 1;
          v |= (_bytes[_idx] >>> _bit) & 0x1;

          _bit -= 1;

          if (_bit < 0) {
            _idx += 1;
            _bit = 7;
          }
      }

      return v;
    };
  }

  return {
    getEncoder : function () {
      return new Encoder();
    },

    getDecoder : function (str) {
      return new Decoder(str);
    }
  };
})();