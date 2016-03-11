
var Util = function() {
    if(!(this instanceof Util)) return new Util();
};

Util.prototype = {
    constructor: Util,
    MakeDBOption: function() {
        if(process.env.MONGOLAB_URI) {
            return {
                connString: process.env.MONGOLAB_URI
            }
        } else {
            return {
                host: "localhost",
                port: 20202,
                dbName: "shorten-url"
            }
        }
    }  
};

module.exports = Util;