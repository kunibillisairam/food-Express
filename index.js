const path = require('path');

// Change working directory to 'server' to ensure correct path resolution
process.chdir(path.join(__dirname, 'server'));

// Require the actual server entry point
require('./server.js');
