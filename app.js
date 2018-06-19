document.addEventListener("DOMContentLoaded", function(event) {

  function getConfiguration() {
  
    /* function getConfiguration
     * Returns default or DOM overwritten parameters
     */

    return {
      "SEED": Number(document.getElementById("map-seed").value) || 0,
      "WIDTH": Number(document.getElementById("map-width").value) || 512,
      "HEIGHT": Number(document.getElementById("map-height").value) || 512,
      "TERRAIN_ONLY": false,
      "GENERATION": {
        "A": Number(document.getElementById("parameter-a").value) || 0.05,
        "B": Number(document.getElementById("parameter-b").value) || 2.00,
        "C": Number(document.getElementById("parameter-c").value) || 2.00,
        "CAVE_DEPTH": 12,
        "CAVE_ROUGHNESS": 0.45,
        "CAVE_CHANCE": 0.005,
        "SAND_BIOME": Boolean(document.getElementById("add-sand-biome").checked),
        "EUCLIDEAN": true,
        "SMOOTH_COASTLINE": true,
        "ADD_CAVES": Boolean(document.getElementById("add-caves").checked),
        "WATER_LEVEL": Number(document.getElementById("water-level").value) || 0,
        "EXPONENT": Number(document.getElementById("parameter-e").value) || 1.00,
        "LINEAR": Number(document.getElementById("parameter-d").value) || 8.0
      }
    }
  
  }
  
  // Add an event listener to the generate map button
  document.getElementById("generate-map").addEventListener("click", generateMap);
  document.getElementById("generate-minimap").addEventListener("click", generateMinimap);
  
  function generateMap() {

    /* function generateMap
     * Asks OTMapGen for a full OTBM
     */

    // Get the configuration from the DOM (or default)
    var mapConfiguration = getConfiguration();
  
    document.getElementById("generation-status").innerHTML = "Creating a new OTBM. This may take some moments!";
  
    // Defer with timeout to release the DOM
    defer(function() {

      // Generate the map using the configuration
      downloadMap(bundle.OTMapGenerator.generate(mapConfiguration));

      document.getElementById("generation-status").innerHTML = "<b>Ok!</b> OTBM has been generated.";

    });

  }

  function defer(callback) {

    /* function defer
     * returns thread to update GUI and invoke next callback
     */

    setTimeout(callback, 0);

  }

  function generateMinimap() {
  
    /* function generateMinimap
     * Asks OTMapGen for a minimap preview of the generation parameters
     */

    document.getElementById("generation-status").innerHTML = "Creating a new minimap. Sit tight!";
  
    defer(function() {
  
      var canvas = document.getElementById("minimap");
      var context = canvas.getContext("2d");
      context.fillRect(0, 0, canvas.width, canvas.height);
  
      var MAP = getConfiguration();
  
      var imgData = new ImageData(bundle.OTMapGenerator.generateMini(MAP), MAP.WIDTH, MAP.HEIGHT);
      context.putImageData(imgData, 0, 0);
  
      document.getElementById("generation-status").innerHTML = "<b>Ok!</b> Minimap has been generated.";
  
    });
  
  }
  
  function downloadMap(content) {
  
    /* function downloadMap
     * Uses BLOB to download map (your browser may not support this)
     */

    const CONTENT_TYPE = "application/octet-stream";
    const FILENAME = "map.otbm";
  
    var a = document.createElement("a");
  
    // Write encoded component and click download link
    a.href = window.URL.createObjectURL(new Blob([content], {"type": CONTENT_TYPE}));
    a.download = FILENAME;
    a.click();
  
    // Clean up
    a.remove();
  
  }

  // Generate an initial minimap
  generateMinimap();

});
