(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.bundle = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const HEADERS =  {
  "OTBM_MAP_HEADER": "0x00",
  "OTBM_MAP_DATA": "0x02",
  "OTBM_TILE_AREA": "0x04",
  "OTBM_TILE": "0x05",
  "OTBM_ITEM": "0x06",
  "OTBM_TOWNS": "0x0C",
  "OTBM_TOWN": "0x0D",
  "OTBM_HOUSETILE": "0x0E",
  "OTBM_WAYPOINTS": "0x0F",
  "OTBM_WAYPOINT": "0x10",
  
  "OTBM_ATTR_DESCRIPTION": "0x01",
  "OTBM_ATTR_EXT_FILE": "0x02",
  "OTBM_ATTR_TILE_FLAGS": "0x03",
  "OTBM_ATTR_ACTION_ID": "0x04",
  "OTBM_ATTR_UNIQUE_ID": "0x05",
  "OTBM_ATTR_TEXT": "0x06",
  "OTBM_ATTR_DESC": "0x07",
  "OTBM_ATTR_TELE_DEST": "0x08",
  "OTBM_ATTR_ITEM": "0x09",
  "OTBM_ATTR_DEPOT_ID": "0x0A",
  "OTBM_ATTR_EXT_SPAWN_FILE": "0x0B",
  "OTBM_ATTR_EXT_HOUSE_FILE": "0x0D",
  "OTBM_ATTR_HOUSEDOORID": "0x0E",
  "OTBM_ATTR_COUNT": "0x0F",
  "OTBM_ATTR_RUNE_CHARGES": "0x16",
  
  "TILESTATE_NONE": "0x0000",
  "TILESTATE_PROTECTIONZONE": "0x0001",
  "TILESTATE_DEPRECATED": "0x0002",
  "TILESTATE_NOPVP": "0x0004",
  "TILESTATE_NOLOGOUT": "0x0008",
  "TILESTATE_PVPZONE": "0x0010",
  "TILESTATE_REFRESH": "0x0020"
}

Object.keys(HEADERS).forEach(function(x) {
  HEADERS[x] = Number(HEADERS[x]);
});

module.exports = HEADERS;

},{}],2:[function(require,module,exports){
(function (Buffer){
const fs = require("fs");
const HEADERS = require("./lib/headers");

const NODE_ESC = 0xFD;
const NODE_INIT = 0xFE;
const NODE_TERM = 0xFF;

__VERSION__ = "1.0.0";

function writeOTBM(__OUTFILE__, json) {
 
  /* FUNCTION writeOTBM
   * Writes OTBM from intermediary JSON structure
   */
  
  // Write all nodes
  fs.writeFileSync(__OUTFILE__, serializeOTBM(json));
  
}

function serializeOTBM(data) {

  /* FUNCTION serializeOTBM
   * Serializes OTBM from intermediary JSON structure
   */

  function writeNode(node) {

    /* FUNCTION writeNode
     * Recursively writes all JSON nodes to OTBM node structure
     */

    // Concatenate own data with children (recursively)
    // and pad the node with start & end identifier
    return Buffer.concat([
      Buffer.from([NODE_INIT]),
      writeElement(node),
      Buffer.concat(getChildNode(node).map(writeNode)),
      Buffer.from([NODE_TERM])
    ]);

  }

  function getChildNode(node) {

    /* FUNCTION getChildNode
     * Returns child node or dummy array if child does not exist
     */

    return getChildNodeReal(node) || new Array();

  }

  function getChildNodeReal(node) {

    /* FUNCTION getChildNodeReal
     * Give children of a node a particular identifier
     */

    switch(node.type) {
      case HEADERS.OTBM_TILE_AREA:
        return node.tiles;
      case HEADERS.OTBM_TILE:
      case HEADERS.OTBM_HOUSETILE:
        return node.items;
      case HEADERS.OTBM_TOWNS:
        return node.towns;
      case HEADERS.OTBM_ITEM:
        return node.content;
      case HEADERS.OTBM_MAP_DATA:
        return node.features;
      default:
        return node.nodes;
    }

  }

  function writeElement(node) {

    /* FUNCTION Node.setChildren
     * Give children of a node a particular identifier
     */

    var buffer;

    // Write each node type
    switch(node.type) {
      case HEADERS.OTBM_MAP_HEADER:
        buffer = Buffer.alloc(17); 
        buffer.writeUInt8(HEADERS.OTBM_MAP_HEADER, 0);
        buffer.writeUInt32LE(node.version, 1);
        buffer.writeUInt16LE(node.mapWidth, 5);
        buffer.writeUInt16LE(node.mapHeight, 7);
        buffer.writeUInt32LE(node.itemsMajorVersion, 9);
        buffer.writeUInt32LE(node.itemsMinorVersion, 13);
        break;
      case HEADERS.OTBM_MAP_DATA:
        buffer = Buffer.alloc(1); 
        buffer.writeUInt8(HEADERS.OTBM_MAP_DATA, 0);
        buffer = Buffer.concat([buffer, writeAttributes(node)]);
        break;
      case HEADERS.OTBM_TILE_AREA:
        buffer = Buffer.alloc(6); 
        buffer.writeUInt8(HEADERS.OTBM_TILE_AREA, 0);
        buffer.writeUInt16LE(node.x, 1);
        buffer.writeUInt16LE(node.y, 3);
        buffer.writeUInt8(node.z, 5);
        break;
      case HEADERS.OTBM_TILE:
        buffer = Buffer.alloc(3); 
        buffer.writeUInt8(HEADERS.OTBM_TILE, 0);
        buffer.writeUInt8(node.x, 1);
        buffer.writeUInt8(node.y, 2);
        buffer = Buffer.concat([buffer, writeAttributes(node)]);
        break;
      case HEADERS.OTBM_HOUSETILE:
        buffer = Buffer.alloc(7);
        buffer.writeUInt8(HEADERS.OTBM_HOUSETILE, 0);
        buffer.writeUInt8(node.x, 1);
        buffer.writeUInt8(node.y, 2);
        buffer.writeUInt32LE(node.houseId, 3);
        buffer = Buffer.concat([buffer, writeAttributes(node)]);
        break;
      case HEADERS.OTBM_ITEM:
        buffer = Buffer.alloc(3); 
        buffer.writeUInt8(HEADERS.OTBM_ITEM, 0);
        buffer.writeUInt16LE(node.id, 1);
        buffer = Buffer.concat([buffer, writeAttributes(node)]);
        break;
      case HEADERS.OTBM_WAYPOINT:
        buffer = Buffer.alloc(3 + node.name.length + 5);
        buffer.writeUInt8(HEADERS.OTBM_WAYPOINT, 0);
        buffer.writeUInt16LE(node.name.length, 1)
        buffer.write(node.name, 3, "ASCII");
        buffer.writeUInt16LE(node.x, 3 + node.name.length);
        buffer.writeUInt16LE(node.y, 3 + node.name.length + 2);
        buffer.writeUInt8(node.z, 3 + node.name.length + 4);
        break;
      case HEADERS.OTBM_WAYPOINTS:
        buffer = Buffer.alloc(1); 
        buffer.writeUInt8(HEADERS.OTBM_WAYPOINTS, 0);
        break;
      case HEADERS.OTBM_TOWNS:
        buffer = Buffer.alloc(1);
        buffer.writeUInt8(HEADERS.OTBM_TOWNS, 0);
        break;
      case HEADERS.OTBM_TOWN:
        buffer = Buffer.alloc(7 + node.name.length + 5);
        buffer.writeUInt8(HEADERS.OTBM_TOWN, 0);
        buffer.writeUInt32LE(node.townid, 1);
        buffer.writeUInt16LE(node.name.length, 5)
        buffer.write(node.name, 7, "ASCII");
        buffer.writeUInt16LE(node.x, 7 + node.name.length);
        buffer.writeUInt16LE(node.y, 7 + node.name.length + 2);
        buffer.writeUInt8(node.z, 7 + node.name.length + 4);
        break;
      default:
        throw("Could not write node. Unknown node type: " + node.type); 
    }

    return escapeCharacters(buffer);

  }

  function escapeCharacters(buffer) {

    /* FUNCTION escapeCharacters
     * Escapes special 0xFD, 0xFE, 0xFF characters in buffer
     */

    for(var i = 0; i < buffer.length; i++) {
      if(buffer.readUInt8(i) === NODE_TERM || buffer.readUInt8(i) === NODE_INIT || buffer.readUInt8(i) === NODE_ESC) {
        buffer = Buffer.concat([buffer.slice(0, i), Buffer.from([NODE_ESC]), buffer.slice(i)]); i++;
      }
    }

    return buffer;

  }

  function writeASCIIString16LE(string) {

    /* FUNCTION writeASCIIString16LE
     * Writes an ASCII string prefixed with its string length (2 bytes)
     */

    var buffer = Buffer.alloc(2 + string.length);
    buffer.writeUInt16LE(string.length, 0);
    buffer.write(string, 2, string.length, "ASCII");
    return buffer;

  }

  function writeAttributes(node) {

    /* FUNCTION writeAttributes
     * Writes additional node attributes
     */

    var buffer;
    var attributeBuffer = Buffer.alloc(0); 

    if(node.destination) {
      buffer = Buffer.alloc(6);
      buffer.writeUInt8(HEADERS.OTBM_ATTR_TELE_DEST);
      buffer.writeUInt16LE(node.destination.x, 1);
      buffer.writeUInt16LE(node.destination.y, 3);
      buffer.writeUInt8(node.destination.z, 5);
      attributeBuffer = Buffer.concat([attributeBuffer, buffer]);
    }

    // Write description property
    if(node.description) {
      buffer = Buffer.alloc(1);
      buffer.writeUInt8(HEADERS.OTBM_ATTR_DESCRIPTION, 0);
      attributeBuffer = Buffer.concat([attributeBuffer, buffer, writeASCIIString16LE(node.description)])
    }

    // Node has an unique identifier
    if(node.uid) {
      buffer = Buffer.alloc(3);
      buffer.writeUInt8(HEADERS.OTBM_ATTR_UNIQUE_ID, 0);
      buffer.writeUInt16LE(node.uid, 1);
      attributeBuffer = Buffer.concat([attributeBuffer, buffer]);
    }

    // Node has an action identifier
    if(node.aid) {
      buffer = Buffer.alloc(3);
      buffer.writeUInt8(HEADERS.OTBM_ATTR_ACTION_ID, 0);
      buffer.writeUInt16LE(node.aid, 1);
      attributeBuffer = Buffer.concat([attributeBuffer, buffer]);
    }

    // Node has rune charges
    if(node.runeCharges) {
      buffer = Buffer.alloc(3);
      buffer.writeUInt8(HEADERS.OTBM_ATTR_RUNE_CHARGES);
      buffer.writeUInt16LE(node.runeCharges, 1);
      attributeBuffer = Buffer.concat([attributeBuffer, buffer]);
    }

    // Spawn file
    if(node.spawnfile) {
      buffer = Buffer.alloc(1);
      buffer.writeUInt8(HEADERS.OTBM_ATTR_EXT_SPAWN_FILE, 0);
      attributeBuffer = Buffer.concat([attributeBuffer, buffer, writeASCIIString16LE(node.spawnfile)])
    }

    // Text attribute
    if(node.text) {
      buffer = Buffer.alloc(1);
      buffer.writeUInt8(HEADERS.OTBM_ATTR_TEXT, 0);
      attributeBuffer = Buffer.concat([attributeBuffer, buffer, writeASCIIString16LE(node.text)])
    }

    // House file
    if(node.housefile) {
      buffer = Buffer.alloc(1);
      buffer.writeUInt8(HEADERS.OTBM_ATTR_EXT_HOUSE_FILE, 0);
      attributeBuffer = Buffer.concat([attributeBuffer, buffer, writeASCIIString16LE(node.housefile)])
    }

    // Write HEADERS.OTBM_ATTR_ITEM
    if(node.tileid) {
      buffer = Buffer.alloc(3);
      buffer.writeUInt8(HEADERS.OTBM_ATTR_ITEM, 0);
      buffer.writeUInt16LE(node.tileid, 1);
      attributeBuffer = Buffer.concat([attributeBuffer, buffer]);
    }

    // Write node count
    if(node.count) {
      buffer = Buffer.alloc(2);
      buffer.writeUInt8(HEADERS.OTBM_ATTR_COUNT, 0);
      buffer.writeUInt8(node.count, 1);
      attributeBuffer = Buffer.concat([attributeBuffer, buffer]);
    }

    // Write the zone fields
    if(node.zones) {
      buffer = Buffer.alloc(5);
      buffer.writeUInt8(HEADERS.OTBM_ATTR_TILE_FLAGS, 0);
      buffer.writeUInt32LE(writeFlags(node.zones), 1);
      attributeBuffer = Buffer.concat([attributeBuffer, buffer]);
    }

    return attributeBuffer;

  }

  function writeFlags(zones) {
  
    /* FUNCTION writeFlags
     * Writes OTBM tile bit-flags to integer
     */
  
    var flags = HEADERS.TILESTATE_NONE;
  
    flags |= zones.protection && HEADERS.TILESTATE_PROTECTIONZONE;
    flags |= zones.noPVP && HEADERS.TILESTATE_NOPVP;
    flags |= zones.noLogout && HEADERS.TILESTATE_NOLOGOUT;
    flags |= zones.PVPZone && HEADERS.TILESTATE_PVPZONE;
    flags |= zones.refresh && HEADERS.TILESTATE_REFRESH;
  
    return flags;
  
  }

  // OTBM Header
  const VERSION = Buffer.alloc(4).fill(0x00);

  return Buffer.concat([VERSION, writeNode(data.data)]);

}

function readOTBM(__INFILE__) {

  /* FUNCTION readOTBM
   * Reads OTBM file to intermediary JSON structure
   */

  var Node = function(data, children) {

    /* CLASS Node
     * Holds a particular OTBM node of type (see below)
     */

    // Remove the escape character from the node data string
    data = this.removeEscapeCharacters(data);

    switch(data.readUInt8(0)) {

      case HEADERS.OTBM_MAP_HEADER:
        this.type = HEADERS.OTBM_MAP_HEADER;
        this.version = data.readUInt32LE(1),
        this.mapWidth = data.readUInt16LE(5),
        this.mapHeight = data.readUInt16LE(7),
        this.itemsMajorVersion = data.readUInt32LE(9),
        this.itemsMinorVersion = data.readUInt32LE(13)
        break;

      // High level map data (e.g. areas, towns, and waypoints)
      case HEADERS.OTBM_MAP_DATA:
        this.type = HEADERS.OTBM_MAP_DATA;
        Object.assign(this, readAttributes(data.slice(1)));
        break;

      // A tile area
      case HEADERS.OTBM_TILE_AREA:
        this.type = HEADERS.OTBM_TILE_AREA;
        this.x = data.readUInt16LE(1);
        this.y = data.readUInt16LE(3);
        this.z = data.readUInt8(5);
        break;

      // A specific tile at location inside the parent tile area
      case HEADERS.OTBM_TILE:
        this.type = HEADERS.OTBM_TILE;
        this.x = data.readUInt8(1);
        this.y = data.readUInt8(2);
        Object.assign(this, readAttributes(data.slice(3)));
        break;

      // A specific item inside the parent tile
      case HEADERS.OTBM_ITEM:
        this.type = HEADERS.OTBM_ITEM;
        this.id = data.readUInt16LE(1);
        Object.assign(this, readAttributes(data.slice(3)));
        break;

      // Parse HEADERS.OTBM_HOUSETILE entity
      case HEADERS.OTBM_HOUSETILE:
        this.type = HEADERS.OTBM_HOUSETILE;
        this.x = data.readUInt8(1);
        this.y = data.readUInt8(2);
        this.houseId = data.readUInt32LE(3);
        Object.assign(this, readAttributes(data.slice(7)));
        break;

      // Parse HEADERS.OTBM_WAYPOINTS structure
      case HEADERS.OTBM_WAYPOINTS:
        this.type = HEADERS.OTBM_WAYPOINTS;
        break;

      // Single waypoint entity
      case HEADERS.OTBM_WAYPOINT:
        this.type = HEADERS.OTBM_WAYPOINT;
        this.name = readASCIIString16LE(data.slice(1));
        this.x = data.readUInt16LE(3 + this.name.length);
        this.y = data.readUInt16LE(5 + this.name.length);
        this.z = data.readUInt8(7 + this.name.length);
        break;

      // Parse HEADERS.OTBM_TOWNS
      case HEADERS.OTBM_TOWNS:
        this.type = HEADERS.OTBM_TOWNS;
        break;

      // Single town entity
      case HEADERS.OTBM_TOWN:
        this.type = HEADERS.OTBM_TOWN;
        this.townid = data.readUInt32LE(1);
        this.name = readASCIIString16LE(data.slice(5));
        this.x = data.readUInt16LE(7 + this.name.length);
        this.y = data.readUInt16LE(9 + this.name.length);
        this.z = data.readUInt8(11 + this.name.length);
        break;
    }

    // Set node children
    if(children.length) {
      this.setChildren(children);
    }

  }

  Node.prototype.removeEscapeCharacters = function(nodeData) {

    /* FUNCTION removeEscapeCharacter
     * Removes 0xFD escape character from the byte string
     */

    var iEsc = 0;
    var index;

    while(true) {

      // Find the next escape character
      index = nodeData.slice(++iEsc).indexOf(NODE_ESC);

      // No more: stop iteration
      if(index === -1) {
        return nodeData;
      }

      iEsc = iEsc + index;

      // Remove the character from the buffer
      nodeData = Buffer.concat([
        nodeData.slice(0, iEsc),
        nodeData.slice(iEsc + 1)
      ]);

    }

  };

  Node.prototype.setChildren = function(children) {

    /* FUNCTION Node.setChildren
     * Give children of a node a particular identifier
     */

    switch(this.type) {
      case HEADERS.OTBM_TILE_AREA:
        this.tiles = children;
        break;
      case HEADERS.OTBM_TILE:
      case HEADERS.OTBM_HOUSETILE:
        this.items = children;
        break;
      case HEADERS.OTBM_TOWNS:
        this.towns = children;
        break;
      case HEADERS.OTBM_ITEM:
        this.content = children;
        break;
      case HEADERS.OTBM_MAP_DATA:
        this.features = children;
        break;
      default:
        this.nodes = children;
        break;
    }

  };

  function readASCIIString16LE(data) {

    /* FUNCTION readASCIIString16LE
     * Reads a string of N bytes with its length
     * deteremined by the value of its first two bytes
     */

    return data.slice(2, 2 + data.readUInt16LE(0)).toString("ASCII");

  }

  function readAttributes(data) {

    /* FUNCTION readAttributes
     * Parses a nodes attribute structure
     */

    var i = 0;

    // Collect additional properties
    var properties = new Object();

    // Read buffer from beginning
    while(i + 1 < data.length) {

      // Read the leading byte
      switch(data.readUInt8(i++)) {

        // Text is written
        case HEADERS.OTBM_ATTR_TEXT:
          properties.text = readASCIIString16LE(data.slice(i));
          i += properties.text.length + 2;
          break;

        // Spawn file name
        case HEADERS.OTBM_ATTR_EXT_SPAWN_FILE:
          properties.spawnfile = readASCIIString16LE(data.slice(i));
          i += properties.spawnfile.length + 2;
          break;

        // House file name
        case HEADERS.OTBM_ATTR_EXT_HOUSE_FILE:
          properties.housefile = readASCIIString16LE(data.slice(i));
          i += properties.housefile.length + 2;
          break;

        // House door identifier (1 byte)
        case HEADERS.OTBM_ATTR_HOUSEDOORID:
          properties.houseDoorId = data.readUInt8(i);
          i += properties.houseDoorId.length + 2;
          break;

        // Description is written (N bytes)
        // May be written multiple times
        case HEADERS.OTBM_ATTR_DESCRIPTION:
          var descriptionString = readASCIIString16LE(data.slice(i));
          if(properties.description) {
            properties.description = properties.description + " " + descriptionString;
          } else {
            properties.description = descriptionString;
          }
          i += descriptionString.length + 2;
          break;

        // Description is written (N bytes)
        case HEADERS.OTBM_ATTR_DESC:
          properties.text = readASCIIString16LE(data.slice(i));
          i += properties.text.length + 2;
          break;

        // Depot identifier (2 byte)
        case HEADERS.OTBM_ATTR_DEPOT_ID:
          properties.depotId = data.readUInt16LE(i);
          i += 2;
          break;

        // Tile flags indicating the type of tile (4 Bytes)
        case HEADERS.OTBM_ATTR_TILE_FLAGS:
          properties.zones = readFlags(data.readUInt32LE(i));
          i += 4;
          break;

        // N (2 Bytes)
        case HEADERS.OTBM_ATTR_RUNE_CHARGES:
          properties.runeCharges = data.readUInt16LE(i);
          i += 2;
          break;

        // The item count (1 byte)
        case HEADERS.OTBM_ATTR_COUNT:
          properties.count = data.readUInt8(i);
          i += 1;
          break;

        // The main item identifier	(2 bytes)
        case HEADERS.OTBM_ATTR_ITEM:
          properties.tileid = data.readUInt16LE(i);
          i += 2;
          break;

        // Action identifier was set (2 bytes)
        case HEADERS.OTBM_ATTR_ACTION_ID:
          properties.aid = data.readUInt16LE(i);
          i += 2;
          break;

        // Unique identifier was set (2 bytes)
        case HEADERS.OTBM_ATTR_UNIQUE_ID:
          properties.uid = data.readUInt16LE(i);
          i += 2;
          break;

        // Teleporter given destination (x, y, z using 2, 2, 1 bytes respectively)
        case HEADERS.OTBM_ATTR_TELE_DEST:
          properties.destination = {
            "x": data.readUInt16LE(i),
            "y": data.readUInt16LE(i + 2),
            "z": data.readUInt8(i + 4)
          }
          i += 5;
          break;
      }

    }

    return properties;

  }

  function readFlags(flags) {

    /* FUNCTION readFlags
     * Reads OTBM bit flags
     */

    // Read individual tile flags using bitwise AND &
    return {
      "protection": flags & HEADERS.TILESTATE_PROTECTIONZONE,
      "noPVP": flags & HEADERS.TILESTATE_NOPVP,
      "noLogout": flags & HEADERS.TILESTATE_NOLOGOUT,
      "PVPZone": flags & HEADERS.TILESTATE_PVPZONE,
      "refresh": flags & HEADERS.TILESTATE_REFRESH
    }

  }

  function readNode(data) {

    /* FUNCTION readNode
     * Recursively parses OTBM nodal tree structure
     */

    // Cut off the initializing 0xFE identifier
    data = data.slice(1);

    var i = 0;
    var children = new Array();
    var nodeData = null;
    var child;

    // Start reading the array
    while(i < data.length) {

      var cByte = data.readUInt8(i);

      // Data belonging to the parent node, between 0xFE and (OxFE || 0xFF)
      if(nodeData === null && (cByte === NODE_INIT || cByte === NODE_TERM)) {
        nodeData = data.slice(0, i);
      }

      // Escape character: skip reading this and following byte
      if(cByte === NODE_ESC) {
        i = i + 2;
        continue;
      }

      // A new node is started within another node: recursion
      if(cByte === NODE_INIT) {
        child = readNode(data.slice(i));
        children.push(child.node);

        // Skip index over full child length
        i = i + 2 + child.i;
        continue;
      }

      // Node termination
      if(cByte === NODE_TERM) {
        return {
          "node": new Node(nodeData, children),
          "i": i
        }
      }

      i++;

    }

  }

  const data = fs.readFileSync(__INFILE__);

  // First four magic bytes are the format identifier
  const MAP_IDENTIFIER = data.readUInt32LE(0);

  // Confirm OTBM format by reading magic bytes (NULL or "OTBM")
  if(MAP_IDENTIFIER !== 0x00000000 && MAP_IDENTIFIER !== 0x4D42544F) {
    throw("Unknown OTBM format: unexpected magic bytes.");
  }

  // Create an object to hold the data
  var mapData = {
    "version": __VERSION__,
    "identifier": MAP_IDENTIFIER,
    "data": readNode(data.slice(4)).node
  }

  return mapData;

}

module.exports.read = readOTBM;
module.exports.write = writeOTBM;
module.exports.serialize = serializeOTBM;
module.exports.HEADERS = HEADERS;
module.exports.__VERSION__ = __VERSION__;

}).call(this,require("buffer").Buffer)
},{"./lib/headers":1,"buffer":11,"fs":10}],3:[function(require,module,exports){
const otbm2json = require("./OTBM2JSON/otbm2json");
const noise = require("./lib/noise").noise;
const border = require("./lib/border");
const clutter = require("./lib/clutter");
const ITEMS = require("./json/items");
const VERSIONS = require("./json/versions");

const __VERSION__ = "1.1.0";

var OTMapGenerator = function() {

  /* Class OTMapGenerator
   * Container for the OTMapGenerator class
   */

  // Check OTBM2JSON version
  if(otbm2json.__VERSION__ !== "1.0.0") {
    console.log("Incompatible version of otbm2json; please update.");
  }

  // Constant size of RME tile area (255x255)
  this.TILE_AREA_SIZE = 0xFF;

  // Default configuration to be overwritten
  this.CONFIGURATION = {
    "SEED": 0,
    "WIDTH": 256,
    "HEIGHT": 256,
    "VERSION": "10.98",
    "TERRAIN_ONLY": false,
    "GENERATION": {
      "A": 0.05,
      "B": 2.00,
      "C": 2.00,
      "CAVE_DEPTH": 12,
      "CAVE_ROUGHNESS": 0.45,
      "CAVE_CHANCE": 0.005,
      "SAND_BIOME": true,
      "EUCLIDEAN": true,
      "SMOOTH_COASTLINE": true,
      "ADD_CAVES": false,
      "WATER_LEVEL": 0.0,
      "EXPONENT": 1.00,
      "LINEAR": 8.0,
      "FREQUENCIES": [
        {"f": 1, "weight": 0.30 },
        {"f": 2, "weight": 0.20 },
        {"f": 4, "weight": 0.20 },
        {"f": 8, "weight": 0.10 },
        {"f": 16, "weight": 0.10 },
        {"f": 32, "weight": 0.05 },
        {"f": 64, "weight": 0.05 }
      ]
    },
  }

}

OTMapGenerator.prototype.generateMinimap = function(configuration) {

  /* OTMapGenerator.generateMinimapmap
   * Generates clamped UInt8 buffer with RGBA values to be sent to canvas
   */

  const OUTLINE_COLOR = 0x80;

  var color, byteArray;

  // Set the configuration
  this.CONFIGURATION = configuration;

  // Create temporary layers
  var layers = this.generateMapLayers();

  var pngLayers = new Array();

  // Only go over the base layer for now
  for(var i = 0; i < layers.length; i++) {

    // Create a buffer the size of w * h * 4 bytes
    byteArray = new Uint8ClampedArray(4 * this.CONFIGURATION.WIDTH * this.CONFIGURATION.HEIGHT);

    for(var j = 0; j < layers[i].length; j++) {

      // Set alpha value to 0xFF
      byteArray[4 * j + 3] = 0xFF;

      if(layers[i][j] === 0) {
        if(layers[i][j - 1] || layers[i][j + 1] || layers[i][j - 1 - this.CONFIGURATION.WIDTH] || layers[i][j + 1 - this.CONFIGURATION.WIDTH] || layers[i][j + this.CONFIGURATION.WIDTH] || layers[i][j - this.CONFIGURATION.WIDTH] || layers[i][j + 1 + this.CONFIGURATION.WIDTH] || layers[i][j - 1 + this.CONFIGURATION.WIDTH]) {
          byteArray[4 * j + 0] = OUTLINE_COLOR;
          byteArray[4 * j + 1] = OUTLINE_COLOR;
          byteArray[4 * j + 2] = OUTLINE_COLOR;
        }
        continue;
      }

      // Color is the 6 byte hex RGB representation
      hexColor = this.getMinimapColor(layers[i][j]);

      // Write RGBA in the buffer (always 0xFF for A)
      byteArray[4 * j + 0] = (hexColor >> 16) & 0xFF;
      byteArray[4 * j + 1] = (hexColor >> 8) & 0xFF;
      byteArray[4 * j + 2] = (hexColor >> 0) & 0xFF;

    }

    pngLayers.push(byteArray);

  }

  return {
    "data": pngLayers,
    "metadata": this.CONFIGURATION
  }

}

OTMapGenerator.prototype.getMinimapColor = function(id) {

  /* OTMapGenerator.getMinimapColor
   * Maps tile identifier to minimap color
   */

  // Color constants
  const WATER_COLOR = 0x0148C2;
  const GRASS_COLOR = 0x00FF00;
  const SAND_COLOR = 0xFFCC99;
  const MOUNTAIN_COLOR = 0x666666;
  const GRAVEL_COLOR = 0x999999;

  // Map tile to minimap color
  // default to black
  switch(id) {
    case ITEMS.WATER_TILE_ID:
      return WATER_COLOR;
    case ITEMS.GRASS_TILE_ID:
      return GRASS_COLOR;
    case ITEMS.SAND_TILE_ID:
      return SAND_COLOR;
    case ITEMS.MOUNTAIN_TILE_ID:
      return MOUNTAIN_COLOR;
    case ITEMS.GRAVEL_TILE_ID:
    case ITEMS.STONE_TILE_ID:
      return GRAVEL_COLOR;
    default:
      return 0x000000;
  }

}

OTMapGenerator.prototype.generate = function(configuration) {

  /* FUNCTION OTMapGenerator.generate
   * Generates OTBM map and returns OTBMJSON representation
   */

  this._initialized = Date.now();

  if(configuration !== undefined) {
    this.CONFIGURATION = configuration;
  }

  // Default blueprint for OTBMJSON
  var json = require("./json/header");

  // Create temporary layers
  var layers = this.generateMapLayers();

  // Convert layers to tile areas
  var tileAreas = this.generateTileAreas(layers);

  // Add all tile areas to the JSON2OTBM structure
  Object.keys(tileAreas).forEach(function(area) {
    json.data.nodes[0].features.push(tileAreas[area]);
  });

  // Write the map header
  this.setMapHeader(json.data);

  console.log("Finished generation in " + (Date.now()  - this._initialized) + "ms. Writing output to map.otbm");

  // Write the JSON using the OTBM2JSON lib
  return otbm2json.serialize(json);

}

OTMapGenerator.prototype.setMapHeader = function(data) {

  /* FUNCTION setMapHeader
   * Writes RME map header OTBM_MAP_DATA
   */

  if(!VERSIONS.hasOwnProperty(this.CONFIGURATION.VERSION)) {
    throw("Map version not supported.");
  }

  data.mapWidth = this.CONFIGURATION.WIDTH;
  data.mapHeight = this.CONFIGURATION.HEIGHT;

  var versionAttributes = VERSIONS[this.CONFIGURATION.VERSION];

  data.version = versionAttributes.version;
  data.itemsMajorVersion = versionAttributes.itemsMajorVersion;
  data.itemsMinorVersion = versionAttributes.itemsMinorVersion;

  // Save the time & seed
  data.nodes[0].description += new Date().toISOString() + " (" + this.CONFIGURATION.SEED + ")";

}

OTMapGenerator.prototype.generateMapLayers = function() {

  /* FUNCTION generateMapLayers
   * Generates temporary layer with noise seeded tiles
   * Layers are later converted to area tiles for OTBM2JSON
   */

  function createLayer() {
  
    /* FUNCTION createLayer
     * Creates an empty layer of map size (WIDTH x HEIGHT)
     */
  
    return new Array(this.CONFIGURATION.WIDTH * this.CONFIGURATION.HEIGHT).fill(0);
  
  }

  var z, id;

  // Seed the noise function
  noise.seed(this.CONFIGURATION.SEED);

  // Create 8 zero filled layers
  var layers = new Array(8).fill(0).map(createLayer.bind(this));

  // Loop over the requested map width and height
  for(var y = 0; y < this.CONFIGURATION.HEIGHT; y++) {
    for(var x = 0; x < this.CONFIGURATION.WIDTH; x++) {

      // Get the elevation
      z = this.zNoiseFunction(x, y);
      b = this.CONFIGURATION.GENERATION.SAND_BIOME ? 5 * this.zNoiseFunction(y, x) : 0;

      id = this.mapElevation(z, b);

      // Clamp the value
      z = Math.max(Math.min(z, 7), 0);

      // Fill the column with tiles
      this.fillColumn(layers, x, y, z, id);

    }
  }

  // Option to smooth coast line
  if(this.CONFIGURATION.GENERATION.SMOOTH_COASTLINE) {
    layers = this.smoothCoastline(layers);
  }

  if(this.CONFIGURATION.GENERATION.ADD_CAVES) {
    layers = this.digCaves(layers);
  }

  return layers;

}

OTMapGenerator.prototype.smoothCoastline = function(layers) {

  /* FUNCTION smoothCoastline
   * Algorithm that smoothes the coast line
   * to get rid of impossible water borders
   */

  var iterate = 1;
  var c = 0;
  var self = this;

  // Constant iteration to remove impossible coastline tiles
  while(iterate) {

    iterate = 0;

    layers = layers.map(function(layer, i) {

      // Coastline only on the lowest floor
      if(i !== 0) {
        return layer;
      }

      return layer.map(function(x, i) {

        // Skip anything that is not a grass tile
        if(x !== ITEMS.GRASS_TILE_ID && x !== ITEMS.SAND_TILE_ID) {
          return x;
        }

        // Get the coordinate and the neighbours
        var coordinates = self.getCoordinates(i);
        var neighbours = self.getAdjacentTiles(layer, coordinates);

        // If the tile needs to be eroded, we will need to reiterate
        if(self.tileShouldErode(neighbours)) {
          x = ITEMS.WATER_TILE_ID;
          iterate++;
        }

        return x;

      });

    });

    console.log("Smoothing coastline <iteration " + c++ + ">" + " <" + iterate + " tiles eroded>");

  }

  return layers;

}

OTMapGenerator.prototype.countNeighboursNegative = function(neighbours, id) {

  /* FUNCTION countNeighboursNegative
   * Counts the number of neighbours that do not have a particular ID 
   */

  return Object.keys(neighbours).filter(function(x) {
    return neighbours[x] !== ITEMS.GRAVEL_TILE_ID && neighbours[x] !== id;
  }).length;

}

OTMapGenerator.prototype.countNeighbours = function(neighbours, id) {

  /* FUNCTION countNeighbours
   * Counts the number of neighbours with particular ID
   */

  return Object.keys(neighbours).filter(function(x) {
    return neighbours[x] === id;
  }).length;

}

OTMapGenerator.prototype.mapElevation = function(z, b) {

  /* FUNCTION mapElevation 
   * Maps particular elevation to tile id 
   */

  switch(true) {
    case (z < 0):
      return ITEMS.WATER_TILE_ID;
    case (z > 3):
      return ITEMS.STONE_TILE_ID;
    default:
      if(b < -1.5) {
        return ITEMS.SAND_TILE_ID;
      } else {
        return ITEMS.GRASS_TILE_ID;
      }
  }

}

OTMapGenerator.prototype.digCaves = function(layers) {

  /* FUNCTION digCaves
   * Slow and pretty crappy algorithm to dig caves (FIXME)
   */

  // Keep a reference to cave entrances
  var entrances = new Array();
  var self = this;

  for(var k = 0; k < this.CONFIGURATION.GENERATION.CAVE_DEPTH; k++) { 

    console.log("Eroding caves <iteration " + k + ">");

    layers = layers.map(function(layer, z) {
    
      return layer.map(function(x, i) {
    
        if(x !== ITEMS.MOUNTAIN_TILE_ID) {
          return x;
        }
    
        var coordinates = self.getCoordinates(i);
        var neighbours = self.getAdjacentTiles(layer, coordinates);
    
        if(self.countNeighbours(neighbours, ITEMS.GRAVEL_TILE_ID) > 0 && self.countNeighboursNegative(neighbours, ITEMS.MOUNTAIN_TILE_ID) === 0 && Math.random() < self.CONFIGURATION.GENERATION.CAVE_ROUGHNESS) {
          return ITEMS.GRAVEL_TILE_ID;
        }

        // Get neighbouring neighbours ;)
        var NL = self.getAdjacentTiles(layer, {"x": coordinates.x - 1, "y": coordinates.y});
        var NR = self.getAdjacentTiles(layer, {"x": coordinates.x + 1, "y": coordinates.y});
        var NN = self.getAdjacentTiles(layer, {"x": coordinates.x, "y": coordinates.y - 1});
        var NS = self.getAdjacentTiles(layer, {"x": coordinates.x, "y": coordinates.y + 1});
    
        if(Math.random() < self.CONFIGURATION.GENERATION.CAVE_CHANCE && NR.E === ITEMS.MOUNTAIN_TILE_ID && NL.W === ITEMS.MOUNTAIN_TILE_ID && x === ITEMS.MOUNTAIN_TILE_ID && self.countNeighbours(neighbours, ITEMS.MOUNTAIN_TILE_ID) === 5 && neighbours.W === ITEMS.MOUNTAIN_TILE_ID && neighbours.E === ITEMS.MOUNTAIN_TILE_ID) {
          entrances.push({"z": z, "c": coordinates});
          return ITEMS.GRAVEL_TILE_ID;
        } else if(Math.random() < self.CONFIGURATION.GENERATION.CAVE_CHANCE && NS.S === ITEMS.MOUNTAIN_TILE_ID && NN.N === ITEMS.MOUNTAIN_TILE_ID && x === ITEMS.MOUNTAIN_TILE_ID && self.countNeighbours(neighbours, ITEMS.MOUNTAIN_TILE_ID) === 5 && neighbours.S === ITEMS.MOUNTAIN_TILE_ID && neighbours.N === ITEMS.MOUNTAIN_TILE_ID) {
          entrances.push({"z": z, "c": coordinates});
          return ITEMS.GRAVEL_TILE_ID;
        }
    
        return x;
    
      });
    
    });

  }

  // Open 3x3 around the cave entrance
  entrances.forEach(function(x) {
    self.fillNeighbours(layers[x.z], x.c, ITEMS.GRAVEL_TILE_ID);
  });

  return layers;

}

OTMapGenerator.prototype.fillNeighbours = function(layer, coordinates, id) {

  /* FUNCTION fillNeighbours
   * Fills all neighbouring tiles with particular ID
   */

  layer[this.getIndex(coordinates.x - 1, coordinates.y)] = id;
  layer[this.getIndex(coordinates.x + 1, coordinates.y)] = id;
  layer[this.getIndex(coordinates.x, coordinates.y - 1)] = id;
  layer[this.getIndex(coordinates.x, coordinates.y + 1)] = id;

  layer[this.getIndex(coordinates.x + 1, coordinates.y + 1)] = id;
  layer[this.getIndex(coordinates.x + 1, coordinates.y - 1)] = id;
  layer[this.getIndex(coordinates.x - 1, coordinates.y + 1)] = id;
  layer[this.getIndex(coordinates.x - 1, coordinates.y - 1)] = id;

}

OTMapGenerator.prototype.tileShouldErode = function(neighbours) {

  /* FUNCTION tileShouldErode
   * Returns whether a tile should be eroded by the coastline
   */

  return (
   (neighbours.N === ITEMS.WATER_TILE_ID && neighbours.S === ITEMS.WATER_TILE_ID) ||
   (neighbours.E === ITEMS.WATER_TILE_ID && neighbours.W === ITEMS.WATER_TILE_ID) ||
   ((neighbours.E !== ITEMS.WATER_TILE_ID || neighbours.S !== ITEMS.WATER_TILE_ID) && neighbours.NE === ITEMS.WATER_TILE_ID && neighbours.SW === ITEMS.WATER_TILE_ID) ||
   ((neighbours.W !== ITEMS.WATER_TILE_ID || neighbours.N !== ITEMS.WATER_TILE_ID) && neighbours.SE === ITEMS.WATER_TILE_ID && neighbours.NW === ITEMS.WATER_TILE_ID) ||
   (neighbours.N === ITEMS.WATER_TILE_ID && neighbours.E === ITEMS.WATER_TILE_ID && neighbours.S === ITEMS.WATER_TILE_ID) ||
   (neighbours.E === ITEMS.WATER_TILE_ID && neighbours.S === ITEMS.WATER_TILE_ID && neighbours.W === ITEMS.WATER_TILE_ID) ||
   (neighbours.S === ITEMS.WATER_TILE_ID && neighbours.W === ITEMS.WATER_TILE_ID && neighbours.N === ITEMS.WATER_TILE_ID) ||
   (neighbours.W === ITEMS.WATER_TILE_ID && neighbours.N === ITEMS.WATER_TILE_ID && neighbours.E === ITEMS.WATER_TILE_ID)
  );

}

OTMapGenerator.prototype.fillColumn = function(layers, x, y, z, id) {

  /* FUNCTION fillColumn 
   * Fills a column at x, y until z, with id on top 
   */

  // Get the index of the tile
  var index = this.getIndex(x, y);

  // Set top item
  layers[z][index] = id;

  // Fill downwards with mountain
  for(var i = 0; i < z; i++) {
    layers[i][index] = ITEMS.MOUNTAIN_TILE_ID;
  }

}

OTMapGenerator.prototype.getIndex = function(x, y) {

  /* FUNCTION getIndex
   * Converts x, y to layer index
   */

  return x + y * this.CONFIGURATION.WIDTH;

}

OTMapGenerator.prototype.getAdjacentTiles = function(layer, coordinates) {

  /* FUNCTION getAdjacentTiles
   * Returns adjacent tiles of another tile
   */

  var x = coordinates.x;
  var y = coordinates.y;

  return {
    "N": this.getTile(layer, x, y - 1),
    "NE": this.getTile(layer, x + 1, y - 1),
    "E": this.getTile(layer, x + 1, y),
    "SE": this.getTile(layer, x + 1, y + 1),
    "S": this.getTile(layer, x, y + 1),
    "SW": this.getTile(layer, x - 1, y + 1),
    "W": this.getTile(layer, x - 1, y),
    "NW": this.getTile(layer, x - 1, y - 1)
  }

}

OTMapGenerator.prototype.getTile = function(layer, x, y) {

  /* FUNCTION getTile
   * Returns tile at layer & coordinates
   */

  return layer[this.getIndex(x, y)];

}

OTMapGenerator.prototype.zNoiseFunction = function(x, y) {

  /* FUNCTION zNoiseFunction
   * Returns noise as a function of x, y
   *
   * MODIFY THESE PARAMETERS TO CREATE DIFFERENT MAPS!
   * I DON'T KNOW ABOUT THE SENSITIVITY OF THESE PARAMETERS: JUST PLAY!
   * See this: https://www.redblobgames.com/maps/terrain-from-noise/
   */

  // Island parameters
  const a = this.CONFIGURATION.GENERATION.A;
  const b = this.CONFIGURATION.GENERATION.B;
  const c = this.CONFIGURATION.GENERATION.C;
  const e = this.CONFIGURATION.GENERATION.EXPONENT;
  const f = this.CONFIGURATION.GENERATION.LINEAR;
  const w = this.CONFIGURATION.GENERATION.WATER_LEVEL;

  // Scaled coordinates between -0.5 and 0.5
  var nx = x / (this.CONFIGURATION.WIDTH - 1) - 0.5;
  var ny = y / (this.CONFIGURATION.HEIGHT - 1) - 0.5;

  // Manhattan distance
  if(this.CONFIGURATION.GENERATION.EUCLIDEAN) {
    var d = Math.sqrt(nx * nx + ny * ny);
  } else {
    var d = 2 * Math.max(Math.abs(nx), Math.abs(ny));
  }

  var noise = this.CONFIGURATION.GENERATION.FREQUENCIES.reduce(function(total, x) {
    return total + this.simplex2freq(x.f, x.weight, nx, ny);
  }.bind(this), 0);

  // Some exponent for mountains?
  noise = Math.pow(noise, e);

  // Use distance from center to create an island
  return Math.round(f * (noise + a) * (1 - b * Math.pow(d, c))) - (w | 0);

}

OTMapGenerator.prototype.getCoordinates = function(index) {

  /* FUNCTION getCoordinates
   * Returns coordinates for a given layer index
   */

  return {
    "x": index % this.CONFIGURATION.WIDTH,
    "y": Math.floor(index / this.CONFIGURATION.WIDTH)
  }

}

OTMapGenerator.prototype.simplex2freq = function(f, weight, nx, ny) {

  /* FUNCTION simplex2freq
   * Returns simplex noise on position nx, ny scaled between -0.5 and 0.5
   * at a given frequency
   */

  // Scale the frequency to the map size
  fWidth = f * this.CONFIGURATION.WIDTH / this.TILE_AREA_SIZE;
  fHeight = f * this.CONFIGURATION.HEIGHT / this.TILE_AREA_SIZE;

  return weight * noise.simplex2(fWidth * nx, fHeight * ny);

}

OTMapGenerator.prototype.generateTileAreas = function(layers) {

  /* FUNCTION generateTileAreas
   * Converts layers to OTBM tile areas
   */

  function createOTBMItem(id) {
  
    /* FUNCTION createOTBMItem
     * Creates OTBM_ITEM object for OTBM2JSON
     */
  
    return {
      "type": otbm2json.HEADERS.OTBM_ITEM,
      "id": id
    }
  
  }

  console.log("Creating OTBM tile areas and adding clutter.");

  // Create hashmap for the tile areas
  var tileAreas = new Object();
  var self = this;

  // Convert layers to OTBM tile areas
  layers.forEach(function(layer, z) {
  
    // For all tiles on each layer
    layer.forEach(function(x, i) {

      // Transform layer index to x, y coordinates
      var coordinates = self.getCoordinates(i);  
  
      // Convert global x, y coordinates to tile area coordinates (0, 255, 510, 765)
      var areaX = self.TILE_AREA_SIZE * Math.floor(coordinates.x / self.TILE_AREA_SIZE);
      var areaY = self.TILE_AREA_SIZE * Math.floor(coordinates.y / self.TILE_AREA_SIZE);
  
      // Invert the depth
      var areaZ = 7 - z;
  
      // Create a tile area identifier for use in a hashmap
      var areaIdentifier = areaX + "." + areaY + "." + areaZ;
  
      // If the tile area does not exist create it
      if(!tileAreas.hasOwnProperty(areaIdentifier)) {
        tileAreas[areaIdentifier] = {
          "type": otbm2json.HEADERS.OTBM_TILE_AREA,
          "x": areaX,
          "y": areaY,
          "z": areaZ,
          "tiles": new Array()
        }
      }
  
      // Items to be placed on a tile (e.g. borders)
      var items = new Array();

      if(!self.CONFIGURATION.TERRAIN_ONLY) {

        // Get the tile neighbours and determine bordering logic
        var neighbours = self.getAdjacentTiles(layer, coordinates);
        
        // Mountain tile: border outside 
        if(!items.length && x !== ITEMS.MOUNTAIN_TILE_ID) {
          items = items.concat(border.getMountainWallOuter(neighbours).map(createOTBMItem));
        }
        
        // Empty tiles can be skipped now
        if(x === 0) {
          return;
        }
        
        // Mountain tile: border inside  
        if(!items.length && x === ITEMS.MOUNTAIN_TILE_ID) {
          items = items.concat(border.getMountainWall(neighbours).map(createOTBMItem));
        }
        
        n = (self.simplex2freq(8, 3, coordinates.x, coordinates.y) + self.simplex2freq(16, 0.5, coordinates.x, coordinates.y) + self.simplex2freq(32, 0.5, coordinates.x, coordinates.y)) / 4;
        
        // Crappy noise map to put forests (FIXME)
        // Check if the tile is occupied
        if(!items.length && x === ITEMS.GRASS_TILE_ID) {
          if(n > 0) {
            items.push(createOTBMItem(clutter.randomTree()));
          }
        }
        
        // Add a random water plant
        if(!items.length && x === ITEMS.WATER_TILE_ID) {
          items.push(createOTBMItem(clutter.randomWaterPlant(self.countNeighbours(neighbours, ITEMS.GRASS_TILE_ID))));
        }
        
        if(!items.length && (x === ITEMS.GRASS_TILE_ID || x === ITEMS.SAND_TILE_ID) && self.countNeighbours(neighbours, ITEMS.WATER_TILE_ID)) {
          if(n > 0 && Math.random() < 0.075) {
            items.push(createOTBMItem(clutter.randomSandstoneMossy()));
          }
        }
        
        if(!items.length && x === ITEMS.SAND_TILE_ID) {
          if(n > 0 && Math.random() < 0.25 && self.countNeighbours(neighbours, ITEMS.WATER_TILE_ID) === 0) {
            items.push(createOTBMItem(clutter.randomPebble()));
          } else if(n > 0.33 && Math.random() < 0.25) {
            items.push(createOTBMItem(clutter.randomCactus()));
          } else if(Math.random() < 0.45) {
            items.push(createOTBMItem(clutter.randomPalmTree(neighbours)));
           } else if(z === 0 && Math.random() < 0.075) {
            items.push(createOTBMItem(clutter.randomShell()));
           } else if(Math.random() < 0.015) {
            items.push(createOTBMItem(clutter.randomSandstone()));
           }
         }
        
        // Add a random water plant
        if(x === ITEMS.STONE_TILE_ID) {
          if(n > 0.25) {
            items.push(createOTBMItem(clutter.randomTileMoss()));
          }
          if(n > 0 && Math.random() < 0.5) {
            items.push(createOTBMItem(clutter.randomPebble()));
          }
        }

        if(x === ITEMS.GRAVEL_TILE_ID) {
          items = items.concat(border.getGrassBorder(neighbours).map(createOTBMItem));
        }
        
        if(x === ITEMS.SAND_TILE_ID) {
          items = items.concat(border.getWaterBorderSand(neighbours).map(createOTBMItem));
        }
        
        if(x === ITEMS.GRAVEL_TILE_ID || x === ITEMS.GRASS_TILE_ID) {
          items = items.concat(border.getSandBorder(neighbours).map(createOTBMItem));
        }
        
        // Border grass & water interface
        if(x === ITEMS.GRASS_TILE_ID) {
          items = items.concat(border.getWaterBorder(neighbours).map(createOTBMItem));
        }
        
        // Border on top of mountain
        if(x === ITEMS.GRASS_TILE_ID || x === ITEMS.STONE_TILE_ID || x === ITEMS.SAND_TILE_ID) {
          items = items.concat(border.getFloatingBorder(neighbours).map(createOTBMItem));
        }
        
        // Border at foot of mountain
        if(x !== ITEMS.MOUNTAIN_TILE_ID) {
          items = items.concat(border.getMountainBorder(neighbours).map(createOTBMItem));
        }

      }

      // Randomize the tile
      x = clutter.randomizeTile(x);

      // Add the tile to the tile area
      // Make sure to give coordinates in RELATIVE tile area coordinates
      tileAreas[areaIdentifier].tiles.push({
        "type": otbm2json.HEADERS.OTBM_TILE,
        "x": coordinates.x % self.TILE_AREA_SIZE,
        "y": coordinates.y % self.TILE_AREA_SIZE,
        "tileid": x,
        "items": items
      });
  
    });
  
  });

  return tileAreas;

}

// Expose the class
module.exports.OTMapGenerator = new OTMapGenerator();
module.exports.__VERSION__ = __VERSION__;

if(require.main === module) {

  otbm2json.write("map.otbm", module.exports.OTMapGenerator.generate());

}

},{"./OTBM2JSON/otbm2json":2,"./json/header":4,"./json/items":5,"./json/versions":6,"./lib/border":7,"./lib/clutter":8,"./lib/noise":9}],4:[function(require,module,exports){
module.exports={
        "version": "1.0.0",
        "identifier": 0,
        "data": {
                "type": 0,
                "version": 2,
                "mapWidth": 0,
                "mapHeight": 0,
                "itemsMajorVersion": 3,
                "itemsMinorVersion": 57,
                "nodes": [{
                        "type": 2,
                        "description": "Saved with OTMapGen at ",
                        "features": [{
                                "type": 12
                        }, {
                                "type": 15
                        }]
                }]
        }
}

},{}],5:[function(require,module,exports){
module.exports={
  "WATER_TILE_ID": 4615,
  "GRASS_TILE_ID": 4526,
  "STONE_TILE_ID": 4405,
  "GRAVEL_TILE_ID": 4570,
  "MOUNTAIN_TILE_ID": 919,
  "SAND_TILE_ID": 231,

  "WATER_TILE_END": 4619,
  "STONE_TILE_END": 4421,
  "GRASS_TILE_END": 4541,

  "SHELL": 5679,
  "SPIRAL_SHELL": 5680,
  "SOME_SHELLS": 5681,
  "PIECE_OF_SHELL": 5682,
  "TORTOISE_EGGS": 5677,

  "SWAMP_PLANT_START": 2771,
  "SWAMP_PLANT_END": 2780,
  "WATER_LILY_START": 2755,
  "WATER_LILY_END": 2758,

  "MOSS_TILE_START": 4580,
  "MOSS_TILE_END": 4594,

  "CACTUS_START": 2728,
  "CACTUS_END": 2736,

  "SMALL_MOSSY_STONE_START": 3632,
  "SMALL_MOSSY_STONE_END": 3635,

  "PALM_TREE": 2725,
  "COCONUT_PALM_TREE": 2726,

  "MOON_FLOWERS": 2740,
  "MOON_FLOWER": 2741,
  "WHITE_FLOWER": 2742,
  "HEAVEN_BLOSSOM": 2743,

  "BLUEBERRY_BUSH": 2785,

  "SAND_STONE_START": 1356,
  "SAND_STONE_END": 1359,

  "MOUNTAIN_WALL_W": 4468,
  "MOUNTAIN_WALL_N": 4469,
  "MOUNTAIN_WALL_S": 4471,
  "MOUNTAIN_WALL_E": 4472,
  
  "MOUNTAIN_WALL_SE": 4470,
  "MOUNTAIN_WALL_NE": 4473,
  "MOUNTAIN_WALL_SW": 4474,
  "MOUNTAIN_WALL_NW": 4475,
  
  "MOUNTAIN_WALL_INNER_SE": 4476,
  "MOUNTAIN_WALL_INNER_NE": 4477,
  "MOUNTAIN_WALL_INNER_SW": 4478,
  "MOUNTAIN_WALL_INNER_NW": 4479,
  
  "MOUNTAIN_WALL_INNER_NW_SE": 4506,
  "MOUNTAIN_WALL_INNER_SW_E": 4489,
  "MOUNTAIN_WALL_INNER_W_SE": 4496,
  "MOUNTAIN_WALL_INNER_S_N": 4494,
  "MOUNTAIN_WALL_INNER_E_W": 4501,

  "MOUNTAIN_BORDER_NORTH": 891,
  "MOUNTAIN_BORDER_EAST": 892,
  "MOUNTAIN_BORDER_SOUTH": 893,
  "MOUNTAIN_BORDER_WEST": 894,

  "MOUNTAIN_BORDER_NW": 899,
  "MOUNTAIN_BORDER_NE": 900,
  "MOUNTAIN_BORDER_SE": 901,
  "MOUNTAIN_BORDER_SW": 902,

  "MOUNTAIN_BORDER_INNER_NW": 895,
  "MOUNTAIN_BORDER_INNER_NE": 896,
  "MOUNTAIN_BORDER_INNER_SE": 897,
  "MOUNTAIN_BORDER_INNER_SW": 898,

  "SAND_BORDER_N": 4760,
  "SAND_BORDER_E": 4761,
  "SAND_BORDER_S": 4762,
  "SAND_BORDER_W": 4763,

  "SAND_BORDER_INNER_NW": 4764,
  "SAND_BORDER_INNER_NE": 4765,
  "SAND_BORDER_INNER_SW": 4766,
  "SAND_BORDER_INNER_SE": 4767,

  "SAND_BORDER_NW": 4768,
  "SAND_BORDER_NE": 4769,
  "SAND_BORDER_SW": 4770,
  "SAND_BORDER_SE": 4771,

  "WATER_SAND_BORDER_N": 4632,
  "WATER_SAND_BORDER_W": 4633,
  "WATER_SAND_BORDER_S": 4634,
  "WATER_SAND_BORDER_E": 4635,
  "WATER_SAND_BORDER_INNER_SW": 4641,
  "WATER_SAND_BORDER_INNER_SE": 4640,
  "WATER_SAND_BORDER_INNER_NE": 4642,
  "WATER_SAND_BORDER_INNER_NW": 4643,
  "WATER_SAND_BORDER_NW": 4639,
  "WATER_SAND_BORDER_NE": 4638,
  "WATER_SAND_BORDER_SE": 4636,
  "WATER_SAND_BORDER_SW": 4637,

  "WATER_GRASS_BORDER_N":4644,
  "WATER_GRASS_BORDER_E":4645,
  "WATER_GRASS_BORDER_S":4646,
  "WATER_GRASS_BORDER_W":4647,
  "WATER_GRASS_BORDER_NW": 4648,
  "WATER_GRASS_BORDER_NE": 4649,
  "WATER_GRASS_BORDER_SW": 4650,
  "WATER_GRASS_BORDER_SE": 4651,
  "WATER_GRASS_BORDER_INNER_NW": 4652,
  "WATER_GRASS_BORDER_INNER_NE": 4653,
  "WATER_GRASS_BORDER_INNER_SW": 4654,
  "WATER_GRASS_BORDER_INNER_SE": 4655,

  "GRASS_BORDER_N": 4542,
  "GRASS_BORDER_E": 4543,
  "GRASS_BORDER_S": 4544,
  "GRASS_BORDER_W": 4545,
  "GRASS_BORDER_NW": 4546,
  "GRASS_BORDER_NE": 4547,
  "GRASS_BORDER_SW": 4548,
  "GRASS_BORDER_SE": 4549,
  "GRASS_BORDER_INNER_NW": 4550,
  "GRASS_BORDER_INNER_NE": 4551,
  "GRASS_BORDER_INNER_SW": 4552,
  "GRASS_BORDER_INNER_SE": 4553,

  "BORDER_EARTHSAND_N": 4656,
  "BORDER_EARTHSAND_S": 4657,
  "BORDER_EARTHSAND_W": 4658,
  "BORDER_EARTHSAND_E": 4659,
  "BORDER_SANDEARTH_N": 4660,
  "BORDER_SANDEARTH_S": 4661,
  "BORDER_SANDEARTH_W": 4662,
  "BORDER_SANDEARTH_E": 4663,

  "MOUNTAIN_FOOT_BORDER_NORTH": 4456,
  "MOUNTAIN_FOOT_BORDER_EAST": 4457,
  "MOUNTAIN_FOOT_BORDER_SOUTH": 4458,
  "MOUNTAIN_FOOT_BORDER_WEST": 4459,
  "MOUNTAIN_FOOT_BORDER_NW": 4460,
  "MOUNTAIN_FOOT_BORDER_NE": 4461,
  "MOUNTAIN_FOOT_BORDER_SE": 4462,
  "MOUNTAIN_FOOT_BORDER_SW": 4463,
  "MOUNTAIN_FOOT_BORDER_INNER_NW": 4464,
  "MOUNTAIN_FOOT_BORDER_INNER_NE": 4465,
  "MOUNTAIN_FOOT_BORDER_INNER_SE": 4466,
  "MOUNTAIN_FOOT_BORDER_INNER_SW": 4467,

  "MOUNTAIN_WALL_OUTER_Y": 873,
  "MOUNTAIN_WALL_OUTER_X": 874,
  "MOUNTAIN_WALL_OUTER_XY": 877
}
},{}],6:[function(require,module,exports){
module.exports={
  "10.98": {
    "version": 2,
    "itemsMajorVersion": 3,
    "itemsMinorVersion": 57,
    "maxId": 26381
  },
  "8.60": {
    "version": 2,
    "itemsMajorVersion": 3,
    "itemsMinorVersion": 20,
    "maxId": 12660
  },
  "8.40": {
    "version": 1,
    "itemsMajorVersion": 3,
    "itemsMinorVersion": 12,
    "maxId": 10017
  },
  "8.10": {
    "version": 1,
    "itemsMajorVersion": 2,
    "itemsMinorVersion": 8,
    "maxId": 8270
  },
  "7.60": {
    "version": 0,
    "itemsMajorVersion": 1,
    "itemsMinorVersion": 3,
    "maxId": 5089
  }
}

},{}],7:[function(require,module,exports){
const ITEMS = require("../json/items");

function getMountainWallOuter(neighbours) {

  /* FUNCTION getMountainWallOuter
   * Returns appropriate outer mountain border
   * Use some random to appear natural
   */
  

  if(neighbours.N === ITEMS.MOUNTAIN_TILE_ID && neighbours.W === ITEMS.MOUNTAIN_TILE_ID && neighbours.SE === ITEMS.MOUNTAIN_TILE_ID) {
    return [ITEMS.MOUNTAIN_WALL_INNER_NW_SE];
  }

  if(neighbours.S === ITEMS.MOUNTAIN_TILE_ID && neighbours.W === ITEMS.MOUNTAIN_TILE_ID && neighbours.E === ITEMS.MOUNTAIN_TILE_ID) {
    return [ITEMS.MOUNTAIN_WALL_INNER_SW_E];
  }

  if(neighbours.W === ITEMS.MOUNTAIN_TILE_ID && neighbours.SE === ITEMS.MOUNTAIN_TILE_ID) {
    return [ITEMS.MOUNTAIN_WALL_INNER_W_SE];
  }

  if(neighbours.S === ITEMS.MOUNTAIN_TILE_ID && neighbours.W === ITEMS.MOUNTAIN_TILE_ID) {
    if(Math.random() < 0.5) {
      return [ITEMS.MOUNTAIN_WALL_INNER_NE];
    } else {
      return [ITEMS.MOUNTAIN_WALL_N];
    }
  }

  if(neighbours.N === ITEMS.MOUNTAIN_TILE_ID & neighbours.S === ITEMS.MOUNTAIN_TILE_ID) {
    return [ITEMS.MOUNTAIN_WALL_INNER_S_N];
  }

  if(neighbours.E === ITEMS.MOUNTAIN_TILE_ID & neighbours.W === ITEMS.MOUNTAIN_TILE_ID) {
    return [ITEMS.MOUNTAIN_WALL_INNER_E_W];
  }

  if(neighbours.E === ITEMS.MOUNTAIN_TILE_ID && neighbours.S === ITEMS.MOUNTAIN_TILE_ID) {
    return [ITEMS.MOUNTAIN_WALL_INNER_NW];
  }

  if(neighbours.E === ITEMS.MOUNTAIN_TILE_ID && neighbours.N === ITEMS.MOUNTAIN_TILE_ID) {
    if(Math.random() < 0.5) {
      return [ITEMS.MOUNTAIN_WALL_INNER_SW];
    } else {
      return [ITEMS.MOUNTAIN_WALL_W];
    }
  }

  if(neighbours.W === ITEMS.MOUNTAIN_TILE_ID && Math.random() < 0.5) {
    return [ITEMS.MOUNTAIN_WALL_E];
  }

  if(neighbours.N === ITEMS.MOUNTAIN_TILE_ID && Math.random() < 0.5) {
    return [ITEMS.MOUNTAIN_WALL_S];
  }

  if(neighbours.S === ITEMS.MOUNTAIN_TILE_ID) {
    return [ITEMS.MOUNTAIN_WALL_N];
  }

  if(neighbours.E === ITEMS.MOUNTAIN_TILE_ID) {
    return [ITEMS.MOUNTAIN_WALL_W];
  }

  if(neighbours.SE === ITEMS.MOUNTAIN_TILE_ID) { 
    return [ITEMS.MOUNTAIN_WALL_SE];
  }

  if(neighbours.SW === ITEMS.MOUNTAIN_TILE_ID && neighbours.W !== ITEMS.MOUNTAIN_TILE_ID && neighbours.S !== ITEMS.MOUNTAIN_TILE_ID) {
    if(Math.random() < 0.33) {
      return [ITEMS.MOUNTAIN_WALL_NE];
    }
  }

  return new Array();

}

function getFloatingBorder(neighbours) {

  /* FUNCTION getFloatingBorder
   * Returns floater border above mountains
   */

  var borders = new Array();

  if(neighbours.W === 0 && neighbours.N === 0) {
    borders.push(ITEMS.MOUNTAIN_BORDER_NW);
  }

  if(neighbours.W === 0 && neighbours.S === 0) {
    borders.push(ITEMS.MOUNTAIN_BORDER_SW);
  }

  if(neighbours.E === 0 && neighbours.S === 0 ) {
    borders.push(ITEMS.MOUNTAIN_BORDER_SE);
  }

  if(neighbours.E === 0 && neighbours.N === 0) {
    borders.push(ITEMS.MOUNTAIN_BORDER_NE);
  }

  if(neighbours.E === 0 && neighbours.S !== 0 && neighbours.N !== 0) {
    borders.push(ITEMS.MOUNTAIN_BORDER_EAST);
  }
  if(neighbours.N === 0 && neighbours.E !== 0 && neighbours.W !== 0) {
    borders.push(ITEMS.MOUNTAIN_BORDER_NORTH);
  }
  if(neighbours.S === 0 && neighbours.E !== 0 && neighbours.W !== 0) {
    borders.push(ITEMS.MOUNTAIN_BORDER_SOUTH);
  }
  if(neighbours.W === 0 && neighbours.S !== 0 && neighbours.N !== 0) {
    borders.push(ITEMS.MOUNTAIN_BORDER_WEST);
  }

  if(neighbours.NW === 0 && neighbours.N !== 0 && neighbours.W !== 0) {
    borders.push(ITEMS.MOUNTAIN_BORDER_INNER_NW);
  }

  if(neighbours.NE === 0 && neighbours.E !== 0 && neighbours.N !== 0) {
    borders.push(ITEMS.MOUNTAIN_BORDER_INNER_NE);
  }

  if(neighbours.SE === 0 && neighbours.E !== 0 && neighbours.S !== 0) {
    borders.push(ITEMS.MOUNTAIN_BORDER_INNER_SE);
  }

  if(neighbours.SW === 0 && neighbours.W !== 0 && neighbours.S !== 0) {
    borders.push(ITEMS.MOUNTAIN_BORDER_INNER_SW);
  }

  return borders;

}

function getSandBorder(neighbours) {

  var borders = new Array();

  if(neighbours.N === ITEMS.SAND_TILE_ID && neighbours.E === ITEMS.SAND_TILE_ID) {
    borders.push(ITEMS.SAND_BORDER_NE);
  }
  if(neighbours.E === ITEMS.SAND_TILE_ID && neighbours.S === ITEMS.SAND_TILE_ID) {
    borders.push(ITEMS.SAND_BORDER_SE);
  }
  if(neighbours.S === ITEMS.SAND_TILE_ID && neighbours.W === ITEMS.SAND_TILE_ID) {
    borders.push(ITEMS.SAND_BORDER_SW);
  }
  if(neighbours.W === ITEMS.SAND_TILE_ID && neighbours.N === ITEMS.SAND_TILE_ID) {
    borders.push(ITEMS.SAND_BORDER_NW);
  }

  if(neighbours.W === ITEMS.SAND_TILE_ID && neighbours.S !== ITEMS.SAND_TILE_ID && neighbours.N !== ITEMS.SAND_TILE_ID) {
    borders.push(ITEMS.SAND_BORDER_W);
  }
  if(neighbours.N === ITEMS.SAND_TILE_ID && neighbours.W !== ITEMS.SAND_TILE_ID && neighbours.E !== ITEMS.SAND_TILE_ID) {
    borders.push(ITEMS.SAND_BORDER_N);
  }
  if(neighbours.S === ITEMS.SAND_TILE_ID && neighbours.W !== ITEMS.SAND_TILE_ID && neighbours.E !== ITEMS.SAND_TILE_ID) {
    borders.push(ITEMS.SAND_BORDER_S);
  }
  if(neighbours.E === ITEMS.SAND_TILE_ID && neighbours.S !== ITEMS.SAND_TILE_ID && neighbours.N !== ITEMS.SAND_TILE_ID) {
    borders.push(ITEMS.SAND_BORDER_E);
  }

  if(neighbours.NE === ITEMS.SAND_TILE_ID && neighbours.N !== ITEMS.SAND_TILE_ID && neighbours.E !== ITEMS.SAND_TILE_ID) {
    borders.push(ITEMS.SAND_BORDER_INNER_NE);
  }
  if(neighbours.SE === ITEMS.SAND_TILE_ID && neighbours.S !== ITEMS.SAND_TILE_ID && neighbours.E !== ITEMS.SAND_TILE_ID) {
    borders.push(ITEMS.SAND_BORDER_INNER_SE);
  }
  if(neighbours.SW === ITEMS.SAND_TILE_ID && neighbours.S !== ITEMS.SAND_TILE_ID && neighbours.W !== ITEMS.SAND_TILE_ID) {
    borders.push(ITEMS.SAND_BORDER_INNER_SW);
  }
  if(neighbours.NW === ITEMS.SAND_TILE_ID && neighbours.N !== ITEMS.SAND_TILE_ID && neighbours.W !== ITEMS.SAND_TILE_ID) {
    borders.push(ITEMS.SAND_BORDER_INNER_NW);
  }

  return borders;

}

function getWaterBorderSand(neighbours) {

  if(neighbours.S === ITEMS.WATER_TILE_ID && neighbours.NW === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_SAND_BORDER_SW];
  }
  if(neighbours.N === ITEMS.WATER_TILE_ID && neighbours.SE === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_SAND_BORDER_NE];
  }
  if(neighbours.W === ITEMS.WATER_TILE_ID && neighbours.NE === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_SAND_BORDER_NW];
  }
  if(neighbours.E === ITEMS.WATER_TILE_ID && neighbours.SW === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_SAND_BORDER_SE];
  }

  if(neighbours.N === ITEMS.WATER_TILE_ID && neighbours.E === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_SAND_BORDER_NE];
  }
  if(neighbours.E === ITEMS.WATER_TILE_ID && neighbours.S === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_SAND_BORDER_SE];
  }
  if(neighbours.S === ITEMS.WATER_TILE_ID && neighbours.W === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_SAND_BORDER_SW];
  }
  if(neighbours.W === ITEMS.WATER_TILE_ID && neighbours.N === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_SAND_BORDER_NW];
  }

  if(neighbours.W === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_SAND_BORDER_W];
  }
  if(neighbours.N === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_SAND_BORDER_N];
  }
  if(neighbours.S === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_SAND_BORDER_S];
  }
  if(neighbours.E === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_SAND_BORDER_E];
  }

  if(neighbours.NE === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_SAND_BORDER_INNER_NE];
  }
  if(neighbours.SE === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_SAND_BORDER_INNER_SE];
  }
  if(neighbours.SW === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_SAND_BORDER_INNER_SW];
  }
  if(neighbours.NW === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_SAND_BORDER_INNER_NW];
  }

  return new Array();

}

function getWaterBorder(neighbours) {

  /* FUNCTION getWaterBorder
   * Returns appropriate water on grass border
   */

  // Edge cases
  if(neighbours.S === ITEMS.WATER_TILE_ID && neighbours.NW === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_GRASS_BORDER_SW];
  }
  if(neighbours.N === ITEMS.WATER_TILE_ID && neighbours.SE === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_GRASS_BORDER_NE];
  }
  if(neighbours.W === ITEMS.WATER_TILE_ID && neighbours.NE === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_GRASS_BORDER_NW];
  }
  if(neighbours.E === ITEMS.WATER_TILE_ID && neighbours.SW === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_GRASS_BORDER_SE];
  }

  if(neighbours.N === ITEMS.WATER_TILE_ID && neighbours.E === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_GRASS_BORDER_NE];
  }
  if(neighbours.E === ITEMS.WATER_TILE_ID && neighbours.S === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_GRASS_BORDER_SE];
  }
  if(neighbours.S === ITEMS.WATER_TILE_ID && neighbours.W === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_GRASS_BORDER_SW];
  }
  if(neighbours.W === ITEMS.WATER_TILE_ID && neighbours.N === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_GRASS_BORDER_NW];
  }

  if(neighbours.W === ITEMS.WATER_TILE_ID) {
    if(neighbours.N === ITEMS.SAND_TILE_ID) {
      return [ITEMS.BORDER_SANDEARTH_W];
    } else if(neighbours.S === ITEMS.SAND_TILE_ID) {
      return [ITEMS.BORDER_EARTHSAND_W];
    } else {
      return [ITEMS.WATER_GRASS_BORDER_W];
    }
  }
  if(neighbours.N === ITEMS.WATER_TILE_ID) {
    if(neighbours.E === ITEMS.SAND_TILE_ID) {
      return [ITEMS.BORDER_EARTHSAND_N];
    } else if(neighbours.W === ITEMS.SAND_TILE_ID) {
      return [ITEMS.BORDER_SANDEARTH_N];
    } else {
      return [ITEMS.WATER_GRASS_BORDER_N];
    }
  }
  if(neighbours.S === ITEMS.WATER_TILE_ID) {
    if(neighbours.E === ITEMS.SAND_TILE_ID) {
      return [ITEMS.BORDER_EARTHSAND_S];
    } else if(neighbours.W === ITEMS.SAND_TILE_ID) {
      return [ITEMS.BORDER_SANDEARTH_S];
    } else {
      return [ITEMS.WATER_GRASS_BORDER_S];
    }
  }
  if(neighbours.E === ITEMS.WATER_TILE_ID) {
    if(neighbours.N === ITEMS.SAND_TILE_ID) {
      return [ITEMS.BORDER_SANDEARTH_E];
    } else if(neighbours.S === ITEMS.SAND_TILE_ID) {
      return [ITEMS.BORDER_EARTHSAND_E];
    } else {
      return [ITEMS.WATER_GRASS_BORDER_E];
    }
  }

  if(neighbours.NE === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_GRASS_BORDER_INNER_NE];
  }
  if(neighbours.SE === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_GRASS_BORDER_INNER_SE];
  }
  if(neighbours.SW === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_GRASS_BORDER_INNER_SW];
  }
  if(neighbours.NW === ITEMS.WATER_TILE_ID) {
    return [ITEMS.WATER_GRASS_BORDER_INNER_NW];
  }

  return new Array();

}


function getGrassBorder(neighbours) {

  if(neighbours.N === ITEMS.GRASS_TILE_ID && neighbours.E === ITEMS.GRASS_TILE_ID) {
    return [ITEMS.GRASS_BORDER_INNER_NE];
  }
  if(neighbours.E === ITEMS.GRASS_TILE_ID && neighbours.S === ITEMS.GRASS_TILE_ID) {
    return [ITEMS.GRASS_BORDER_INNER_SE];
  }
  if(neighbours.S === ITEMS.GRASS_TILE_ID && neighbours.W === ITEMS.GRASS_TILE_ID) {
    return [ITEMS.GRASS_BORDER_INNER_SW];
  }
  if(neighbours.W === ITEMS.GRASS_TILE_ID && neighbours.N === ITEMS.GRASS_TILE_ID) {
    return [ITEMS.GRASS_BORDER_INNER_NW];
  }

  if(neighbours.W === ITEMS.GRASS_TILE_ID) {
    return [ITEMS.GRASS_BORDER_W];
  }
  if(neighbours.N === ITEMS.GRASS_TILE_ID) {
    return [ITEMS.GRASS_BORDER_N];
  }
  if(neighbours.S === ITEMS.GRASS_TILE_ID) {
    return [ITEMS.GRASS_BORDER_S];
  }
  if(neighbours.E === ITEMS.GRASS_TILE_ID) {
    return [ITEMS.GRASS_BORDER_E];
  }

  if(neighbours.NE === ITEMS.GRASS_TILE_ID) {
    return [ITEMS.GRASS_BORDER_NE];
  }
  if(neighbours.SE === ITEMS.GRASS_TILE_ID) {
    return [ITEMS.GRASS_BORDER_SE];
  }
  if(neighbours.SW === ITEMS.GRASS_TILE_ID) {
    return [ITEMS.GRASS_BORDER_SW];
  }
  if(neighbours.NW === ITEMS.GRASS_TILE_ID) {
    return [ITEMS.GRASS_BORDER_NW];
  }

  return new Array();

}

function getMountainBorder(neighbours) {

  /* FUNCTION getMountainBorder
   * Returns appropriate border at mountain foot
   */

  if(neighbours.W === ITEMS.MOUNTAIN_TILE_ID && neighbours.N === ITEMS.MOUNTAIN_TILE_ID) {
    return [ITEMS.MOUNTAIN_FOOT_BORDER_INNER_NW];
  }

  if(neighbours.N === ITEMS.MOUNTAIN_TILE_ID && neighbours.E === ITEMS.MOUNTAIN_TILE_ID) {
    return [ITEMS.MOUNTAIN_FOOT_BORDER_INNER_NE];
  }

  if(neighbours.N === ITEMS.MOUNTAIN_TILE_ID) {
    return [ITEMS.MOUNTAIN_FOOT_BORDER_NORTH];
  }

  if(neighbours.S === ITEMS.MOUNTAIN_TILE_ID) {
    return [ITEMS.MOUNTAIN_FOOT_BORDER_SOUTH];
  }

  if(neighbours.W === ITEMS.MOUNTAIN_TILE_ID) {
    return [ITEMS.MOUNTAIN_FOOT_BORDER_WEST];
  }

  if(neighbours.NE === ITEMS.MOUNTAIN_TILE_ID) {
    return [ITEMS.MOUNTAIN_FOOT_BORDER_NE];
  }

  if(neighbours.NW === ITEMS.MOUNTAIN_TILE_ID) {
    return [ITEMS.MOUNTAIN_FOOT_BORDER_NW];
  }

  if(neighbours.SW === ITEMS.MOUNTAIN_TILE_ID) {
    return [ITEMS.MOUNTAIN_FOOT_BORDER_SW];
  }

  return new Array();

}

function getMountainWall(neighbours) {

  /* FUNCTION getMountainWall
   * Returns appropriate outer mountain wall
   */

  if(neighbours.E !== ITEMS.MOUNTAIN_TILE_ID && neighbours.S !== ITEMS.MOUNTAIN_TILE_ID) {
    return [ITEMS.MOUNTAIN_WALL_OUTER_XY];
  }

  if(neighbours.E !== ITEMS.MOUNTAIN_TILE_ID) {
    return [ITEMS.MOUNTAIN_WALL_OUTER_Y];
  }

  if(neighbours.S !== ITEMS.MOUNTAIN_TILE_ID) {
    return [ITEMS.MOUNTAIN_WALL_OUTER_X];
  }

  return new Array();

}

module.exports.getMountainWallOuter = getMountainWallOuter;
module.exports.getFloatingBorder = getFloatingBorder;
module.exports.getWaterBorder = getWaterBorder;
module.exports.getMountainBorder = getMountainBorder;
module.exports.getMountainWall = getMountainWall;
module.exports.getWaterBorderSand = getWaterBorderSand;
module.exports.getSandBorder = getSandBorder;
module.exports.getGrassBorder = getGrassBorder;
},{"../json/items":5}],8:[function(require,module,exports){
const ITEMS = require("../json/items");

function getRandomBetween(min, max) {

  /* FUNCTION getRandomBetween
   * Returns an integer between min, max (inclusive)
   */

  return Math.floor(Math.random() * (max - min + 1) ) + min;

}

function randomSandstone() {

  /* FUNCTION randomSandstone
   * Returns a random sandstone
   */

  return getRandomBetween(ITEMS.SAND_STONE_START, ITEMS.SAND_STONE_END);

}

function randomShell() {

  /* FUNCTION randomShell
   * Returns a random shell
   */

  var weights = [
    {"id": ITEMS.SHELL, "weight": 0.3},
    {"id": ITEMS.SPIRAL_SHELL, "weight": 0.30},
    {"id": ITEMS.PIECE_OF_SHELL, "weight": 0.30},
    {"id": ITEMS.SOME_SHELLS, "weight": 0.075},
    {"id": ITEMS.TORTOISE_EGGS, "weight": 0.025}
  ];

  return getWeightedRandom(weights);

}

function randomPebble() {

  /* FUNCTION randomPebble
   * Returns a random pebble
   */

  var value = Math.random();

  switch(true) {
    case (value < 0.05):
      return getRandomBetween(3648, 3652);
    case (value < 0.25):
      return getRandomBetween(3611, 3614);
    default:
      return getRandomBetween(3653, 3656);
  }

}

function randomTree() {

  /* FUNCTION randomTree
   * Returns a random shrub or tree
   */

  var value = Math.random();

  // Shrubs or trees
  switch(true) {
    case (value < 0.10):
      return getRandomBetween(2700, 2708);
    case (value < 0.30):
      return getRandomBetween(2767, 2768);
    case (value < 0.95):
      return getRandomBetween(6216, 6219);
    case (value < 0.96):
      return ITEMS.BLUEBERRY_BUSH;
    default:
      if(Math.random() < 0.5) {
        return randomFlower();
      } else {
        return randomFlower2();
      }
  }

}

function randomWaterPlant(nNeighbours) {

  /* FUNCTION randomWaterPlant
   * Returns a random water plant
   */

  // "Swamp" plants
  if(nNeighbours > 2 && Math.random() < 0.2) {
    return [getRandomBetween(ITEMS.SWAMP_PLANT_START, ITEMS.SWAMP_PLANT_END)];
  }

  // Water lillies
  if(nNeighbours > 1 && Math.random() < 0.1) {
    return [getRandomBetween(ITEMS.WATER_LILY_START, ITEMS.WATER_LILY_END)];
  }

  return new Array();

}

function randomSandstoneMossy() {

  return getRandomBetween(ITEMS.SMALL_MOSSY_STONE_START, ITEMS.SMALL_MOSSY_STONE_END);

}

function randomTileMoss() {

  /* FUNCTION randomTileMoss
   * Returns a random moss tile for stone tiles
   */

  return getRandomBetween(ITEMS.MOSS_TILE_START, ITEMS.MOSS_TILE_END);

}


function randomCactus() {

  /* FUNCTION randomWaterPlant
   * Returns a random cactus
   */

  return getRandomBetween(ITEMS.CACTUS_START, ITEMS.CACTUS_END);

}

function randomPalmTree(neighbours) {

  /* FUNCTION randomWaterPlant
   * Returns a random water plant
   */

  if(Math.random() < 0.1) {
    return [getRandomBetween(ITEMS.PALM_TREE, ITEMS.COCONUT_PALM_TREE)];
  }

  return new Array();

}


function randomFlower2() {

  /* FUNCTION countNeighbours
   * Return a random flower with different flower
   */

  return getRandomBetween(4152, 4158);

}

function getWeightedRandom(weights) {

  /* FUNCTION getWeightedRandom
   * Return a random element based on a weight
   */

  // Draw a random sample
  var value = Math.random();
  var sum = 0;

  for(var i = 0; i < weights.length; i++) {
    sum += weights[i].weight;
    if(value < sum) {
      return weights[i].id;
    }
  }

}

function randomFlower() {

  /* FUNCTION randomFlower
   * Return a random flower with different weights
   */

  var weights = [
    {"id": ITEMS.MOON_FLOWER, "weight": 0.5},
    {"id": ITEMS.MOON_FLOWERS, "weight": 0.20},
    {"id": ITEMS.WHITE_FLOWER, "weight": 0.20},
    {"id": ITEMS.HEAVEN_BLOSSOM, "weight": 0.10}
  ];

  return getWeightedRandom(weights);

}

function randomizeTile(x) {

  /* FUNCTION randomizeTile
   * Randomizes a tile of given id (grass, water, mountain)
   * Some private functions that return random objects
   */

  function getRandomWaterTile() {
    return getRandomBetween(ITEMS.WATER_TILE_ID, ITEMS.WATER_TILE_END);
  }
  
  function getRandomMountainTile() {
    return getRandomBetween(ITEMS.STONE_TILE_ID, ITEMS.STONE_TILE_END);
  }
  
  function getRandomGrassTile() {
    return getRandomBetween(ITEMS.GRASS_TILE_ID, ITEMS.GRASS_TILE_END);
  }

  function getRandomGravel() {
    return getRandomBetween(4570, 4579);
  }

  switch(x) {
    case ITEMS.GRASS_TILE_ID:
      return getRandomGrassTile();
    case ITEMS.STONE_TILE_ID:
      return getRandomMountainTile();
    case ITEMS.WATER_TILE_ID:
      return getRandomWaterTile();
    case 4570:
      return getRandomGravel();
	default:
      return x;
  }

}

module.exports.randomShell = randomShell;
module.exports.randomPalmTree = randomPalmTree;
module.exports.randomCactus = randomCactus;
module.exports.randomTree = randomTree;
module.exports.randomWaterPlant = randomWaterPlant;
module.exports.randomTileMoss = randomTileMoss;
module.exports.randomPebble = randomPebble;
module.exports.randomizeTile = randomizeTile;
module.exports.randomSandstone = randomSandstone;
module.exports.randomSandstoneMossy = randomSandstoneMossy
},{"../json/items":5}],9:[function(require,module,exports){
/*
 * A speed-improved perlin and simplex noise algorithms for 2D.
 *
 * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 * Converted to Javascript by Joseph Gentle.
 *
 * Version 2012-03-09
 *
 * This code was placed in the public domain by its original author,
 * Stefan Gustavson. You may use it as you see fit, but
 * attribution is appreciated.
 *
 */

(function(global){
  var module = global.noise = {};

  function Grad(x, y, z) {
    this.x = x; this.y = y; this.z = z;
  }
  
  Grad.prototype.dot2 = function(x, y) {
    return this.x*x + this.y*y;
  };

  Grad.prototype.dot3 = function(x, y, z) {
    return this.x*x + this.y*y + this.z*z;
  };

  var grad3 = [new Grad(1,1,0),new Grad(-1,1,0),new Grad(1,-1,0),new Grad(-1,-1,0),
               new Grad(1,0,1),new Grad(-1,0,1),new Grad(1,0,-1),new Grad(-1,0,-1),
               new Grad(0,1,1),new Grad(0,-1,1),new Grad(0,1,-1),new Grad(0,-1,-1)];

  var p = [151,160,137,91,90,15,
  131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
  190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
  88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
  77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
  102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
  135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
  5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
  223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
  129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
  251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
  49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
  138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
  // To remove the need for index wrapping, double the permutation table length
  var perm = new Array(512);
  var gradP = new Array(512);

  // This isn't a very good seeding function, but it works ok. It supports 2^16
  // different seed values. Write something better if you need more seeds.
  module.seed = function(seed) {
    if(seed > 0 && seed < 1) {
      // Scale the seed out
      seed *= 65536;
    }

    seed = Math.floor(seed);
    if(seed < 256) {
      seed |= seed << 8;
    }

    for(var i = 0; i < 256; i++) {
      var v;
      if (i & 1) {
        v = p[i] ^ (seed & 255);
      } else {
        v = p[i] ^ ((seed>>8) & 255);
      }

      perm[i] = perm[i + 256] = v;
      gradP[i] = gradP[i + 256] = grad3[v % 12];
    }
  };

  module.seed(0);

  /*
  for(var i=0; i<256; i++) {
    perm[i] = perm[i + 256] = p[i];
    gradP[i] = gradP[i + 256] = grad3[perm[i] % 12];
  }*/

  // Skewing and unskewing factors for 2, 3, and 4 dimensions
  var F2 = 0.5*(Math.sqrt(3)-1);
  var G2 = (3-Math.sqrt(3))/6;

  var F3 = 1/3;
  var G3 = 1/6;

  // 2D simplex noise
  module.simplex2 = function(xin, yin) {
    var n0, n1, n2; // Noise contributions from the three corners
    // Skew the input space to determine which simplex cell we're in
    var s = (xin+yin)*F2; // Hairy factor for 2D
    var i = Math.floor(xin+s);
    var j = Math.floor(yin+s);
    var t = (i+j)*G2;
    var x0 = xin-i+t; // The x,y distances from the cell origin, unskewed.
    var y0 = yin-j+t;
    // For the 2D case, the simplex shape is an equilateral triangle.
    // Determine which simplex we are in.
    var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
    if(x0>y0) { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
      i1=1; j1=0;
    } else {    // upper triangle, YX order: (0,0)->(0,1)->(1,1)
      i1=0; j1=1;
    }
    // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
    // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
    // c = (3-sqrt(3))/6
    var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
    var y1 = y0 - j1 + G2;
    var x2 = x0 - 1 + 2 * G2; // Offsets for last corner in (x,y) unskewed coords
    var y2 = y0 - 1 + 2 * G2;
    // Work out the hashed gradient indices of the three simplex corners
    i &= 255;
    j &= 255;
    var gi0 = gradP[i+perm[j]];
    var gi1 = gradP[i+i1+perm[j+j1]];
    var gi2 = gradP[i+1+perm[j+1]];
    // Calculate the contribution from the three corners
    var t0 = 0.5 - x0*x0-y0*y0;
    if(t0<0) {
      n0 = 0;
    } else {
      t0 *= t0;
      n0 = t0 * t0 * gi0.dot2(x0, y0);  // (x,y) of grad3 used for 2D gradient
    }
    var t1 = 0.5 - x1*x1-y1*y1;
    if(t1<0) {
      n1 = 0;
    } else {
      t1 *= t1;
      n1 = t1 * t1 * gi1.dot2(x1, y1);
    }
    var t2 = 0.5 - x2*x2-y2*y2;
    if(t2<0) {
      n2 = 0;
    } else {
      t2 *= t2;
      n2 = t2 * t2 * gi2.dot2(x2, y2);
    }
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 70 * (n0 + n1 + n2);
  };

  // 3D simplex noise
  module.simplex3 = function(xin, yin, zin) {
    var n0, n1, n2, n3; // Noise contributions from the four corners

    // Skew the input space to determine which simplex cell we're in
    var s = (xin+yin+zin)*F3; // Hairy factor for 2D
    var i = Math.floor(xin+s);
    var j = Math.floor(yin+s);
    var k = Math.floor(zin+s);

    var t = (i+j+k)*G3;
    var x0 = xin-i+t; // The x,y distances from the cell origin, unskewed.
    var y0 = yin-j+t;
    var z0 = zin-k+t;

    // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
    // Determine which simplex we are in.
    var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
    var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
    if(x0 >= y0) {
      if(y0 >= z0)      { i1=1; j1=0; k1=0; i2=1; j2=1; k2=0; }
      else if(x0 >= z0) { i1=1; j1=0; k1=0; i2=1; j2=0; k2=1; }
      else              { i1=0; j1=0; k1=1; i2=1; j2=0; k2=1; }
    } else {
      if(y0 < z0)      { i1=0; j1=0; k1=1; i2=0; j2=1; k2=1; }
      else if(x0 < z0) { i1=0; j1=1; k1=0; i2=0; j2=1; k2=1; }
      else             { i1=0; j1=1; k1=0; i2=1; j2=1; k2=0; }
    }
    // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
    // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
    // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
    // c = 1/6.
    var x1 = x0 - i1 + G3; // Offsets for second corner
    var y1 = y0 - j1 + G3;
    var z1 = z0 - k1 + G3;

    var x2 = x0 - i2 + 2 * G3; // Offsets for third corner
    var y2 = y0 - j2 + 2 * G3;
    var z2 = z0 - k2 + 2 * G3;

    var x3 = x0 - 1 + 3 * G3; // Offsets for fourth corner
    var y3 = y0 - 1 + 3 * G3;
    var z3 = z0 - 1 + 3 * G3;

    // Work out the hashed gradient indices of the four simplex corners
    i &= 255;
    j &= 255;
    k &= 255;
    var gi0 = gradP[i+   perm[j+   perm[k   ]]];
    var gi1 = gradP[i+i1+perm[j+j1+perm[k+k1]]];
    var gi2 = gradP[i+i2+perm[j+j2+perm[k+k2]]];
    var gi3 = gradP[i+ 1+perm[j+ 1+perm[k+ 1]]];

    // Calculate the contribution from the four corners
    var t0 = 0.6 - x0*x0 - y0*y0 - z0*z0;
    if(t0<0) {
      n0 = 0;
    } else {
      t0 *= t0;
      n0 = t0 * t0 * gi0.dot3(x0, y0, z0);  // (x,y) of grad3 used for 2D gradient
    }
    var t1 = 0.6 - x1*x1 - y1*y1 - z1*z1;
    if(t1<0) {
      n1 = 0;
    } else {
      t1 *= t1;
      n1 = t1 * t1 * gi1.dot3(x1, y1, z1);
    }
    var t2 = 0.6 - x2*x2 - y2*y2 - z2*z2;
    if(t2<0) {
      n2 = 0;
    } else {
      t2 *= t2;
      n2 = t2 * t2 * gi2.dot3(x2, y2, z2);
    }
    var t3 = 0.6 - x3*x3 - y3*y3 - z3*z3;
    if(t3<0) {
      n3 = 0;
    } else {
      t3 *= t3;
      n3 = t3 * t3 * gi3.dot3(x3, y3, z3);
    }
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 32 * (n0 + n1 + n2 + n3);

  };

  // ##### Perlin noise stuff

  function fade(t) {
    return t*t*t*(t*(t*6-15)+10);
  }

  function lerp(a, b, t) {
    return (1-t)*a + t*b;
  }

  // 2D Perlin Noise
  module.perlin2 = function(x, y) {
    // Find unit grid cell containing point
    var X = Math.floor(x), Y = Math.floor(y);
    // Get relative xy coordinates of point within that cell
    x = x - X; y = y - Y;
    // Wrap the integer cells at 255 (smaller integer period can be introduced here)
    X = X & 255; Y = Y & 255;

    // Calculate noise contributions from each of the four corners
    var n00 = gradP[X+perm[Y]].dot2(x, y);
    var n01 = gradP[X+perm[Y+1]].dot2(x, y-1);
    var n10 = gradP[X+1+perm[Y]].dot2(x-1, y);
    var n11 = gradP[X+1+perm[Y+1]].dot2(x-1, y-1);

    // Compute the fade curve value for x
    var u = fade(x);

    // Interpolate the four results
    return lerp(
        lerp(n00, n10, u),
        lerp(n01, n11, u),
       fade(y));
  };

  // 3D Perlin Noise
  module.perlin3 = function(x, y, z) {
    // Find unit grid cell containing point
    var X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
    // Get relative xyz coordinates of point within that cell
    x = x - X; y = y - Y; z = z - Z;
    // Wrap the integer cells at 255 (smaller integer period can be introduced here)
    X = X & 255; Y = Y & 255; Z = Z & 255;

    // Calculate noise contributions from each of the eight corners
    var n000 = gradP[X+  perm[Y+  perm[Z  ]]].dot3(x,   y,     z);
    var n001 = gradP[X+  perm[Y+  perm[Z+1]]].dot3(x,   y,   z-1);
    var n010 = gradP[X+  perm[Y+1+perm[Z  ]]].dot3(x,   y-1,   z);
    var n011 = gradP[X+  perm[Y+1+perm[Z+1]]].dot3(x,   y-1, z-1);
    var n100 = gradP[X+1+perm[Y+  perm[Z  ]]].dot3(x-1,   y,   z);
    var n101 = gradP[X+1+perm[Y+  perm[Z+1]]].dot3(x-1,   y, z-1);
    var n110 = gradP[X+1+perm[Y+1+perm[Z  ]]].dot3(x-1, y-1,   z);
    var n111 = gradP[X+1+perm[Y+1+perm[Z+1]]].dot3(x-1, y-1, z-1);

    // Compute the fade curve value for x, y, z
    var u = fade(x);
    var v = fade(y);
    var w = fade(z);

    // Interpolate
    return lerp(
        lerp(
          lerp(n000, n100, u),
          lerp(n001, n101, u), w),
        lerp(
          lerp(n010, n110, u),
          lerp(n011, n111, u), w),
       v);
  };

})(this);

},{}],10:[function(require,module,exports){

},{}],11:[function(require,module,exports){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = {__proto__: Uint8Array.prototype, foo: function () { return 42 }}
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  get: function () {
    if (!(this instanceof Buffer)) {
      return undefined
    }
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  get: function () {
    if (!(this instanceof Buffer)) {
      return undefined
    }
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('Invalid typed array length')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new Error(
        'If encoding is specified then the first argument must be a string'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'number') {
    throw new TypeError('"value" argument must not be a number')
  }

  if (isArrayBuffer(value) || (value && isArrayBuffer(value.buffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  return fromObject(value)
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('"size" argument must not be negative')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj) {
    if (ArrayBuffer.isView(obj) || 'length' in obj) {
      if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
        return createBuffer(0)
      }
      return fromArrayLike(obj)
    }

    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      return fromArrayLike(obj.data)
    }
  }

  throw new TypeError('The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object.')
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true
}

Buffer.compare = function compare (a, b) {
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError('Arguments must be Buffers')
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (ArrayBuffer.isView(buf)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isArrayBuffer(string)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    string = '' + string
  }

  var len = string.length
  if (len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
      case undefined:
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) return utf8ToBytes(string).length // assume utf8
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  if (this.length > 0) {
    str = this.toString('hex', 0, max).match(/.{2}/g).join(' ')
    if (this.length > max) str += ' ... '
  }
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (!Buffer.isBuffer(target)) {
    throw new TypeError('Argument must be a Buffer')
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset  // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
      : (firstByte > 0xBF) ? 2
      : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : new Buffer(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffers from another context (i.e. an iframe) do not pass the `instanceof` check
// but they should be treated as valid. See: https://github.com/feross/buffer/issues/166
function isArrayBuffer (obj) {
  return obj instanceof ArrayBuffer ||
    (obj != null && obj.constructor != null && obj.constructor.name === 'ArrayBuffer' &&
      typeof obj.byteLength === 'number')
}

function numberIsNaN (obj) {
  return obj !== obj // eslint-disable-line no-self-compare
}

},{"base64-js":12,"ieee754":13}],12:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],13:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}]},{},[3])(3)
});
