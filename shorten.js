var assert = require('assert');

/**
    @fileOverview The **Shorten** class is used to shorten a specified URL
    
    @example
    var shortSrv = Shorten();
    shortSrv.OriginalUrl = "http://www.example.com";
    shortSrv.Shorten(function(err, r) {
        //TODO
    });
*/

// create an instance of Shorten.
var Shorten = function() {
    if(!(this instanceof Shorten)) return new Shorten();
    this.OriginalUrl = ""; 
    this.DbControl = null;
};

Shorten.prototype = {
    constructor: Shorten,
    base62Volcabulary: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
    collection: null,
    
    //return true if this.OriginalUrl is a valid URL.
    //valid URL has the format "http://www.example.com"
    isValidUrl: function() {
        var urlRegexp = /^http[s]?:\/\/www\.\w+\.\w+(\/\w+)*/;
        var matchResult = urlRegexp.exec(this.OriginalUrl);
        return matchResult != null;
    },
    
    //encode a number to a string
    encodeUrl: function(seqNum) {
        var codes = [];
        var result = "";
        
        //calc base62 code
        while(true) {
            codes.push(seqNum % 62);
            seqNum = parseInt(seqNum / 62);
            if(seqNum === 0) break;
        }
        
        codes.forEach(function(c) {
           result += this.base62Volcabulary.charAt(c); 
        }, this);
        
        return result;
    },
    
    //decode the string to the number
    decodeUrl: function(eu) {
        var seqNum = 0;
        
        //map from string to base62 codes
        for(var i = 0; i < eu.length; ++i) {
            for(var j = 0; j < this.base62Volcabulary.length; ++j) {
                if(this.base62Volcabulary.charAt(j) === eu.charAt(i)) {
                    seqNum += Math.pow(62, i) * j;
                    break;
                }
            }
        }
        
        return seqNum;
    },
    
    // return the shorten form of this.OrignalUrl
    ShortenUrl: function(callback) {
        var self = this;
        
        if(!self.isValidUrl()) {
            callback(new Error("invalid URL"));
            return;
        }
        
        assert(self.DbControl, "must setup the db controller");
        
        //search db to see if it has already been shoretened.
        self.DbControl.Find({originalurl: self.OriginalUrl}, function(err, d) {
            if(err) {
                callback(err);
                return;
            }
            
            //already shortened.
            if(d) {
                console.log("already shortened");
                callback(null, d.shortenurl);
            } else {
                self.DbControl.NextSequence(function(err, seq) {
                   if(err) {
                       callback(err);
                       return;
                   }
                   
                   console.log("next seq number: " + seq);
                   
                   var encUrl = self.encodeUrl(seq);
                   self.DbControl.Insert(self.OriginalUrl, 
                        encUrl, 
                        seq, 
                        function(err, r) {
                            if(err) {
                                callback(err);
                                return;
                            }
                            
                            callback(null, encUrl);
                        })
                });
            }
        });
    }
};

module.exports = Shorten;