document.addEventListener("DOMContentLoaded", function(event) {

  function getConfiguration() {
  
    /* function getConfiguration
     * Returns default or DOM overwritten parameters
     */

    return {
      "SEED": Number(document.getElementById("map-seed").value) || 0,
      "WIDTH": Number(document.getElementById("map-width").value) || 512,
      "HEIGHT": Number(document.getElementById("map-height").value) || 512,
      "VERSION": document.getElementById("map-version").value,
      "TERRAIN_ONLY": false,
      "GENERATION": {
        "A": Number(document.getElementById("parameter-a").value) || 0.05,
        "B": Number(document.getElementById("parameter-b").value) || 2.00,
        "C": Number(document.getElementById("parameter-c").value) || 2.00,
        "CAVE_DEPTH": Number(document.getElementById("cave-depth").value) || 12,
        "CAVE_ROUGHNESS": Number(document.getElementById("cave-roughness").value) || 0.45,
        "CAVE_CHANCE": Number(document.getElementById("cave-chance").value) || 0.005,
        "SAND_BIOME": Boolean(document.getElementById("add-sand-biome").checked),
        "EUCLIDEAN": Boolean(document.getElementById("euclidean-falloff").checked),
        "SMOOTH_COASTLINE": true,
        "ADD_CAVES": Boolean(document.getElementById("add-caves").checked),
        "WATER_LEVEL": Number(document.getElementById("water-level").value) || 0,
        "EXPONENT": Number(document.getElementById("parameter-e").value) || 1.00,
        "LINEAR": Number(document.getElementById("parameter-d").value) || 8.0,
        "FREQUENCIES": [
          {"f": 1, "weight": Number(document.getElementById("frequency-1").value)},
          {"f": 2, "weight": Number(document.getElementById("frequency-2").value)},
          {"f": 4, "weight": Number(document.getElementById("frequency-4").value)},
          {"f": 8, "weight": Number(document.getElementById("frequency-8").value)},
          {"f": 16, "weight": Number(document.getElementById("frequency-16").value)},
          {"f": 32, "weight": Number(document.getElementById("frequency-32").value)},
          {"f": 64, "weight": Number(document.getElementById("frequency-64").value)}
        ]
      }
    }
  
  }

  _transparent = false;

  // Update page metadata
  document.getElementById("otmapgen-version").innerHTML = bundle.__VERSION__;
  document.title = "Open Tibia Map Generator " + bundle.__VERSION__;

  // Add an event listener to the generate map button
  document.getElementById("generate-map").addEventListener("click", generateMap);
  document.getElementById("generate-minimap").addEventListener("click", generateMinimap);
  document.getElementById("random-seed").addEventListener("click", randomSeed);

  document.getElementById("increment-layer").addEventListener("click", function() { _activeLayer++; showLayer() });
  document.getElementById("decrement-layer").addEventListener("click", function() { _activeLayer--; showLayer() });
  document.getElementById("transparent-layer").addEventListener("click", function() { _transparent = !_transparent; showLayer() });

  // Add listener to cave checkbox
  document.getElementById("add-caves").addEventListener("change", function() {

    // Show or hide cave options
    if(document.getElementById("add-caves").checked) {
      document.getElementById("cave-options").style.display = "block";
    } else {
      document.getElementById("cave-options").style.display = "none";
    }

  });
  
  function randomSeed() {
    var value = Math.floor(Math.random() * (Number.MAX_SAFE_INTEGER - Number.MIN_SAFE_INTEGER)) + Number.MIN_SAFE_INTEGER;
    document.getElementById("map-seed").value = value;
    generateMinimap();
  }

  function generateMap() {

    /* function generateMap
     * Asks OTMapGen for a full OTBM
     */

    // Get the configuration from the DOM (or default)
    var mapConfiguration = getConfiguration();
  
    updateInformation("info", "Creating a new OTBM. This may take some moments!");
  
    // Defer with timeout to release the DOM
    defer(function() {

      try {
        var binaryOTBM = bundle.OTMapGenerator.generate(mapConfiguration);
      } catch(e) {
        return updateInformation("danger", "<b>Failure!</b> Exception occured during generation of OTBM.");
      }

      // Generate the map using the configuration
      downloadMap(binaryOTBM);

      updateInformation("success", "<b>Ok!</b> OTBM has been generated.");

    });

  }

  function defer(callback) {

    /* function defer
     * returns thread to update GUI and invoke next callback
     */

    setTimeout(callback, 10);

  }

  function updateInformation(type, message) {

    /* function updateInformation
     * Updates the information box with a color & message
     */

    document.getElementById("generation-status").className = "alert alert-" + type;
    document.getElementById("generation-status").innerHTML = message;

    if(type === "danger") {

      var canvas = document.getElementById("minimap");
      var context = canvas.getContext("2d");

      // Fill canvas with black background
      context.fillStyle = "black";
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.beginPath();
      context.fillStyle = "lightgrey";
      context.arc(128, 128, 50, 0, 2 * Math.PI);
      context.fill();

      context.beginPath();
      context.fillStyle = "lightgrey";
      context.arc(512 - 128, 128, 50, 0, 2 * Math.PI);
      context.fill();

      context.beginPath();
      context.strokeStyle = "lightgrey";
      context.lineWidth = "32";
      context.arc(256, 512 - 128, 128, Math.PI + 0.25, -0.25);
      context.stroke();

    }

  }

  var _layerData;
  var _activeLayer = 0;

  function getPixelData() {

    /* function getPixelData
     * Compiles all layers to a single image with transparency
     */

    const TRANSPARENCY_VALUE = 0x40;

    if(!_transparent) {
      return _layerData.data[_activeLayer].slice(0);
    }

    var pixelData = _layerData.data[0].slice(0);

    for(var i = 1; i <= _activeLayer; i++) {

      for(var j = 0; j < _layerData.data[i].length; j += 4) {

        // Check if value is black and set transparency
        if(_layerData.data[i][j] === 0 && _layerData.data[i][j + 1] === 0 && _layerData.data[i][j + 2] === 0) {
          pixelData[j + 3] = TRANSPARENCY_VALUE; continue;
        }

        // Copy layer pixel data
        pixelData[j] = _layerData.data[i][j];
        pixelData[j + 1] = _layerData.data[i][j + 1];
        pixelData[j + 2] = _layerData.data[i][j + 2];

      }

    }

    return pixelData;

  }

  function showLayer() {

    /* function showLayer
     * Writes the currently active layer to the canvas
     */

    _activeLayer = Math.min(Math.max(_activeLayer, 0), 7);

    var canvas = document.getElementById("minimap");
    var context = canvas.getContext("2d");

    // Resize the canvas to fit the map
    canvas.width = Math.max(512, _layerData.metadata.WIDTH);
    canvas.height = Math.max(512, _layerData.metadata.HEIGHT);

    // Fill canvas with black background
    context.fillStyle = "black";
    context.fillRect(0, 0, canvas.width, canvas.height);

    document.getElementById("transparent-layer").children[0].className = _transparent ? "fas fa-eye" : "fas fa-eye-slash";

    var pixelData = getPixelData();

    // Convert UInt8ClampedArray to canvas image data
    var imgData = new ImageData(
      pixelData,
      _layerData.metadata.WIDTH,
      _layerData.metadata.HEIGHT
    );

    // Put the RGBA image data
    context.putImageData(imgData, 0, 0);

    // PNG Watermark
    context.fillStyle = "white";
    context.font = "bold 14px sans-serif";
    context.fillText("Minimap Preview Floor: " + _activeLayer, 6, 18);
    context.fillText("Seed: " + _layerData.metadata.SEED.toString(16).toUpperCase(), 6, 36);

  }

  function generateMinimap() {
  
    /* function generateMinimap
     * Asks OTMapGen for a minimap preview of the generation parameters
     */

    updateInformation("info", "Creating a new minimap. Sit tight!");
  
    // Defer and give thread to DOM
    defer(function() {
  
      var mapConfiguration = getConfiguration();

      // Attempt to generate a minimap
      try {
        _layerData = bundle.OTMapGenerator.generateMinimap(mapConfiguration);
      } catch(e) {
        return updateInformation("danger", "<b>Failed!</b> Exception in generation of minimap.");
      }

      updateInformation("success", "<b>Ok!</b> Minimap has been generated.");
      showLayer();
  
    });
  
  }
  
  function downloadMap(content) {
  
    /* function downloadMap
     * Uses BLOB to download map (your browser may not support this)
     */

    const CONTENT_TYPE = "application/octet-stream";
    const FILENAME = "map-" + document.getElementById("map-version").value + ".otbm";
  
    var aElement = document.createElement("a");
  
    // Firefox fix
    document.body.appendChild(aElement);
    aElement.target = "_self";

    // Write encoded component and click download link
    aElement.href = window.URL.createObjectURL(new Blob([content], {"type": CONTENT_TYPE}));
    aElement.download = FILENAME;
    aElement.click();
  
    // Clean up
    aElement.remove();
  
  }

  // Generate an initial minimap
  generateMinimap();

});
