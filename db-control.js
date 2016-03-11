var mongo = require('mongodb').MongoClient;
var assert = require('assert');

// create a database controller
// @param options.connString
// @param options.host
// @param options.port
// @param options.dbName
var DBControl = function(options) {
    if(!(this instanceof DBControl)) {
        console.log("create instance");
        return new DBControl(options);
    }
    
    if(options.hasOwnProperty("connString")) {
        this.requestUrl = options.connString;
    } else {
        assert(options.hasOwnProperty("host"));
        assert(options.hasOwnProperty("port"));
        assert(options.hasOwnProperty("dbName"));
        
        this.requestUrl = "mongodb://" + options.host + ":" + 
            options.port + "/" + options.dbName;
    }
    
    console.log(this.requestUrl);
};

DBControl.prototype = {
    //connect to the db. callback immediately if it is already connected.
    connectToDB: function(callback) {
        mongo.connect(this.requestUrl, function(err, db) {
            if(err) {
                callback(new Error("db connection error: " + err.toString()));
                return;
            }
            callback(null, db);
        });
    },
    
    //return the next valid sequence number by callback
    NextSequence: function(callback) {
        this.connectToDB(function(err, db) {
            if(err) {
                callback(err);
                return;
            }
            var c = db.collection('counter');
            c.find({_id: "seqnum"}).toArray(function(err, docs) {
                if(err) {
                    callback(err);
                    db.close();
                    return;
                }
                
                //console.log(docs);
                
                //? error or return empty docs
                if(docs.length === 0) {
                    console.log('empty counter');
                    c.insert({_id: "seqnum", num: 0});
                    callback(null, 0);
                    db.close();
                    return;
                }
                
                c.findOneAndUpdate( 
                    {_id: "seqnum"}, 
                    {$inc: {num: 1}}, 
                    {returnOriginal: false},
                    function(err, doc) {
                        //console.log("returned doc: " + doc.value);
                        if(err) {
                            callback(err);
                            db.close();
                            return;
                        }
                        callback(null, doc.value.num);
                        db.close();
                });
            });
        }); 
    },
    
    //insert the data if it is not existed.
    Insert: function(originalUrl, shortenUrl, seqNum, callback) {
        this.connectToDB(function(err, db) {
            if(err) {
                callback(err);
                return;
            }
            
            var c = db.collection("url-map");
            c.find({originalurl: originalUrl}).toArray(function(err, docs) {
                if(err) {
                    db.close();
                    callback(err)
                    return;
                }
                
                //not in the collection
                if(docs.length === 0) {
                    c.insertOne({
                        originalurl: originalUrl, 
                        shortenurl: shortenUrl,
                        seqnum: seqNum
                    }, function(err, r) {
                        db.close();
                        callback(err, r);
                    });
                } else { //already in the collection
                    db.close();
                    callback(null, {ok: 1, n: 1});
                }
            });
        });
    },
    
    //find the document by criterial and return it via callback
    //if no document is found, the second argument will be null
    Find: function(criteria, callback) {
        this.connectToDB(function(err, db) {
            if(err) {
                callback(err);
                return;
            } 
            
            var c = db.collection("url-map");
            c.find(criteria).toArray(function(err, docs) {
                if(err) {
                    callback(err);
                    db.close();
                }
                
                //console.log(docs);
                
                if(docs.length > 1) {
                    callback(new Error("duplicated record"));
                    db.close();
                    return;
                }
                
                var ret = docs.length === 0 ? null : docs[0];
                
                callback(null, ret);
                db.close();
            });
        });
    },
    
    //clear the 'url-map' and 'counter' collections
    Clear: function(callback) {
        this.connectToDB(function(err, db) {
            if(err) {
                callback(err); 
                return;
            }
            
            var umCollection = db.collection('url-map');
            umCollection.deleteMany({}, function(err, r) {
                if(err) {
                    callback(err);
                    return;
                }
                
                var cntCollection = db.collection('counter');
                cntCollection.deleteMany({}, function(err, r) {
                    if(err) {
                        callback(err);
                        return;
                    }
                    callback(null, r);
                });
            });
        });
    }
};

module.exports = DBControl;