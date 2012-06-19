$(document).ready(function() {

    test('encode no data', function() {
    var enc = Base64.getEncoder();
    equal(enc.getStr(), "", "no data returns empty string");
  });

  test('encode no data in twelve bits', function() {
    var enc = Base64.getEncoder();
    enc.add(12, 0);
    equal(enc.getStr(), "AA");
  });

  test('encode one bit', function() {
    var enc = Base64.getEncoder();
    enc.add(1, 1);
    equal(enc.getStr().length, 1, "has one character");
    equal(enc.getStr(), "g");
  });

  test('encode three bits in six bits', function() {
    var enc = Base64.getEncoder();
    enc.add(6, 5);
    equal(enc.getStr().length, 1, "has one character");
    equal(enc.getStr(), "F");
  });

  test('encode three bits in eight bits', function() {
    var enc = Base64.getEncoder();
    enc.add(8, 5);
    equal(enc.getStr().length, 2, "has three characters");
    equal(enc.getStr(), "BQ");
  });

  test('encode random bits in multiple adds', function() {
    var enc = Base64.getEncoder();
    enc.add(3, 2); // => "010"
    enc.add(6, 9); // => "010001001"
    enc.add(1, 0); // => "0100010010"
    enc.add(2, 1); // => "010001001001"
    equal(enc.getStr(), "RJ");
  });

  test('decode no data in twelve bits', function() {
    var dec = Base64.getDecoder("AA");
    equal(dec.read(12), 0);
  });

  test('decode one bit', function() {
    var dec = Base64.getDecoder("g");
    equal(dec.read(1), 1);
  });

  test('decode three bits in six bits', function() {
    var dec = Base64.getDecoder("F");
    equal(dec.read(6), 5);
  });

  test('decode three bits in eight bits', function() {
    var dec = Base64.getDecoder("BQ");
    equal(dec.read(8), 5);
  });

  test('decode random bits in multiple reads', function() {
    var dec = Base64.getDecoder("RJ");
    equal(dec.read(3), 2);
    equal(dec.read(6), 9);
    equal(dec.read(1), 0);
    equal(dec.read(2), 1);
  });

});