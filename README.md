# inconcessus.github.io

This web application is a GUI for OTMapGen. It is based on OTMapGen code that has been bundled for use in the browser.

    # Download OTMapGen and dependencies from Git
    $ git clone https://github.com/Inconcessus/OTMapGen.git
    $ cd OTMapGen
    $ git clone https://github.com/Inconcessus/OTBM2JSON.git

    # Bundle and copy
    $ browserify OTMapGen.js --standalone bundle -o bundle.js
    $ cp bundle.js js/bundle.js
