var assert = require('assert');
var shortSrv = require('../shorten.js')();
var DBControl = require('../db-control.js');

describe("Test URL Shorten Service", function() {
    describe("#isValidUrl()", function() {
        it("should return false for invalid URL", function() {
            var incorrectUrls = [
                "xxx",
                "http://www.xxx",
                "https://www.xxx",
                "http://www",
                "https://www",
                "http://",
                "https://",
                "http:/",
                "https:/",
                "http:",
                "https:",
                "http",
                "https",
                "/http://www.goole.com"
            ];
            
            incorrectUrls.forEach(function(x) {
                shortSrv.OriginalUrl = x;
                assert.equal(shortSrv.isValidUrl(), false, "current testing: " + x);
            });
        });
        
        it("should return true for valid URL", function() {
            var correctUrls = [
                "http://www.google.com",
                "https://www.google.com",
                "http://www.hughlog.org",
            ] 
            
            correctUrls.forEach(function(x) {
                shortSrv.OriginalUrl = x;
                assert.equal(shortSrv.isValidUrl(), true, "current testing: " + x);
            });
        });
    });
    
    describe("#encodeUrl() and decodeUrl()", function() {
        it("should return the original sequece number by calling decodeUrl", function() {
            for(var i = 0; i < 100000; ++i) {
                var enc = shortSrv.encodeUrl(i);
                var dec = shortSrv.decodeUrl(enc);
                assert.equal(dec, i, "testing on number: " + i);
            }
        });
    });
    
    describe("#ShortenUrl()", function() {
        before(function(done) {
            var dbControl = DBControl({
                host: "localhost",
                port: 20202,
                dbName: "test-db"
            });
            
            dbControl.Clear(function(err, r) {
                if(err) return done(err);
                shortSrv.DbControl = dbControl;
                done();
            });
        });
        
        it("should failed when inserting invalid URLs", function(done) {
            shortSrv.OriginalUrl = "xxx";
            shortSrv.ShortenUrl(function(err, r) {
               if(err) return done(null);
               done(new Error("should failed for invalid URL xxx"));
            });
        });
        
        it("should success when inserting valid URLs", function(done) {
            shortSrv.OriginalUrl = "http://www.google.com";
            shortSrv.ShortenUrl(function(err, r) {
               if(err) return done(err);
               done();
            });
        });
    });
});