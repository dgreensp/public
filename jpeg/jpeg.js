var hexbyte = function (b) {
  var result = b.toString(16).toUpperCase();
  return result.length === 1 ? ("0" + result) : result;
};

var Marker = function (twoByteCode) {
  this.code = twoByteCode; // e.g. 0xD8 for SOI
};
Marker.prototype.typeName = "Marker";
Marker.prototype.symbol = function () {
  return _.has(MARKER_SYMBOLS, this.code) ? MARKER_SYMBOLS[this.code] :
    null;
};
Marker.prototype.hasSegment = function () {
  var symbol = this.symbol();
  return ! (symbol === "SOI" || symbol === "EOI");
};
Marker.prototype.name = function () {
  return this.symbol() || ("0x" + hexbyte(this.code));
};

var Segment = function (marker, data) {
  this.marker = marker; // Marker
  this.data = data; // Uint8Array

  if (this.marker.symbol() === "DQT") {
    this.params = new DQTParams(data);
  } else {
    this.params = new HexParams(data);
  }
};
Segment.prototype.typeName = "Segment";

var CodedData = function (data) {
  this.data = data; // Uint8Array
};
CodedData.prototype.typeName = "CodedData";

var HexParams = function (data) {
  this.data = data;
};
HexParams.prototype.typeName = "HexParams";

var DQTParams = function (data) {
  // sec B.2.4.1
  this.tables = [];
  var i = 0;
  while (i < data.length) {
    var Pq = data[i] >> 4; // 8-bit or 16-bit table?
    var Tq = data[i] & 0xf; // which table is this, 0-3?
    i++;
    var elements = new Array(64);
    var nbits;
    if (Pq === 0) {
      nbits = 8;
      for (var j = 0; j < 64; j++) {
        elements[j] = (data[i] | 0);
        i++;
      }
    } else if (Pq === 1) {
      nbits = 16;
      for (var j = 0; j < 64; j++) {
        elements[j] = (data[i] << 8) | data[i+1];
        i += 2;
      }
    } else {
      throw new Error("Unknown Pq: " + Pq);
    }
    this.tables.push({num: Tq, nbits: nbits, elements: elements});
  }
};
DQTParams.prototype.typeName = "DQTParams";

MARKER_SYMBOLS = {};
// sec B.1.1.3
MARKER_SYMBOLS[0xC4] = "DHT";
MARKER_SYMBOLS[0xC8] = "JPG";
MARKER_SYMBOLS[0xCC] = "DAC";
for (var i = 0; i < 15; i++) {
  if (i !== 4 && i !== 8 && i !== 12) {
    MARKER_SYMBOLS[0xC0 + i] = "SOF" + i;
  }
}
MARKER_SYMBOLS[0xD8] = "SOI";
MARKER_SYMBOLS[0xD9] = "EOI";
MARKER_SYMBOLS[0xDA] = "SOS";
MARKER_SYMBOLS[0xDB] = "DQT";
for (var i = 0; i < 15; i++) {
  MARKER_SYMBOLS[0xE0 + i] = "APP" + i;
}


var Hex = function (data) {
  this.data = data; // Uint8Array
};
Hex.prototype.typeName = "Hex";

var assert = function (value, msg/*, ...*/) {
  if (! value) {
    throw new Error(_.toArray(arguments).slice(1).join(''));
  }
};

parseJPEG = function (wholeFile) {
  var parts = []; // sec B.1
  var i = 0;
  while (i < wholeFile.length) {
    if (wholeFile[i] === 0xff) {
      // Read a Marker
      assert(wholeFile[i] === 0xff,
             "Expected FF byte at ", i);
      while (wholeFile[i] === 0xff) {
        i++; // sec B.1.1.2
      }
      var marker = new Marker(wholeFile[i]);
      i++;
      if (marker.hasSegment()) {
        // sec B.1.1.4
        var segmentLen = (wholeFile[i] << 8) | (wholeFile[i+1]);
        var segment = new Segment(marker, wholeFile.subarray(
          i+2, i+segmentLen));
        i += segmentLen;
        parts.push(segment);
      } else {
        parts.push(marker);
      }
    } else {
      var destuffedLength = 0;
      var dataStart = i;
      while (wholeFile[i] !== 0xff || wholeFile[i+1] === 0) {
        if (wholeFile[i] === 0xff && wholeFile[i+1] === 0) {
          i += 2;
        } else {
          i++;
        }
        destuffedLength++;
      }
      var dataEnd = i;
      var destuffedData = new Uint8Array(destuffedLength);
      i = dataStart;
      var j = 0;
      while (i < dataEnd) {
        var b = destuffedData[j] = wholeFile[i];
        i++;
        j++;
        if (b === 0xff) {
          i++;
        }
      }
      parts.push(new CodedData(destuffedData));
    }
  }
  parts.push(new Hex(wholeFile.subarray(i)));
  return parts;
};


if (Meteor.isClient) {
  IMAGE = ReactiveVar(null);
  Meteor.startup(function () {
    Meteor.call('getFile', 'coast.jpg', function (error, result) {
      if (error) {
        console.log(error);
      } else {
        IMAGE.set(result);
      }
    });
  });

  Template.body.helpers({
    IMAGE: function () {
      return IMAGE.get();
    },
    parsedImage: function () {
      return parseJPEG(IMAGE.get());
    }
  });

  Template.hexdump.helpers({
    dump: function () {
      var data = this; // Uint8Array
      var result = "";
      for (var i = 0; i < data.length; i++) {
        if (i > 0) {
          if (i % 32 === 0) {
            result += '\n';
          } else if (i % 4 === 0) {
            result += ' ';
          }
        }
        result += hexbyte(data[i]);
      }
      return result;
    }
  });

  Template.Marker.helpers({
    code: function () {
      return hexbyte(this.code);
    }
  });

  Template.DQTParams.helpers({
    elementsString: function () {
      return '[' + this.elements.join(', ') + ']';
    }
  });
}

if (Meteor.isServer) {
  Meteor.methods({
    getFile: function (fileName) {
      return Assets.getBinary(fileName);
    }
  });
}
