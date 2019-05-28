const app = require('./app.js');

const errorHandler = function(err) {
    console.log(err);
    console.log('##### SERVER IS NOT STARTING CORRECTLY! #####');
};

app.start().catch(errorHandler);
