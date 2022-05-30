
A demo of yaw and pitch tracking using the PhyPhox app.

## Getting started
1. First, create a new experiment in phyphox with the accelerometer, the gyroscope and linear acceleration enabled.
2. Start the experiment and enable remote access. A URL should appear at the bottom of the screen. Make sure the address displayed is accessible from the computer running this application.
3. Set the variable PHYPHOXURL in src/sketch.js to the URL. 
4. You'll need to host a local server in order for the demo to work correctly. Any server that can serve static files will do (e.g. php-cli `` php -S 0.0.0.0:1234 ``)

	Unfortunately, the PhyPhox remote interface does not allow CORS, meaning that requests will be blocked by your browser.
	In chromium-based browsers, the easiest way to deal with this is to install this plugin: https://chrome.google.com/webstore/detail/allow-cors-access-control/lhobafahddgcelffkeicbaginigeejlf?hl=en

5. Open http://localhost:1234/ in your browser
