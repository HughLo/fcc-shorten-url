var assert = require('assert');
var DBControl = require('../db-control.js');

describe("Test Database", function() {
    var dbc = DBControl({
        host: "localhost",
        port: 20202,
        dbName: "test-db"
    });
    
    var data = [
        
        //http url
        {
            orignalUrl: "http://www.google.com",
            shortenUrl: "0",
            seqNum: 0
        },
        
        //https url
        {
            orignalUrl: "https://www.baidu.com",
            shortenUrl: "1",
            seqNum: 1
        },
        
        //incorrect url
        {
            orignalUrl: "httpxxxx",
            shortenUrl: "2",
            seqNum: 2
        }
    ];
    
    before(function(done) {
        dbc.Clear(function(err, r) {
            if(err) return done(err);
            done();
        });
    });
    
    describe("#Insert()", function() {
        it("should insert a new record", function(done) {
            dbc.Insert(data[0].orignalUrl, data[0].shortenUrl, data[0].seqNum, 
                function(err, r) {
                    if(err) return done(err);
                    done();
            })
        });
    });
    
    describe("#Find()", function() {
        it("should find the inserted record", function(done) {
             dbc.Find({originalurl: data[0].orignalUrl}, function(err, r) {
                 if(err) return done(err);
                assert.equal(r.originalurl, data[0].orignalUrl);
                done();
             });
        });
    });
    
    describe("#NextSequence()", function() {
        it("should be zero for the first record", function(done) {
            dbc.NextSequence(function(err, seqNum) {
                if(err) return done(err);
                assert.equal(seqNum, 0);
                done();
            });
        });
        
        it("should increase by one for the following records", function(done) {
            dbc.NextSequence(function(err, seqNum) {
                if(err) return done(err);
                assert.equal(seqNum, 1);
                done();
            }) ;
        });
    });
});