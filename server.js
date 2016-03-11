var express = require('express');
var DBControl = require('./db-control.js');
var Shorten = require('./shorten.js');
var Util = require('./util.js');

var util = Util();
var app = express();
var shortApp = express();
var shortSrv = Shorten();
var dbControl = DBControl(util.MakeDBOption());
shortSrv.DbControl = dbControl;

//shorten service
shortApp.get('/*', function(req, res) {
    console.log("handle new request");
    //remove the prefix char "/"
    shortSrv.OriginalUrl = req.path.substr(1);
    shortSrv.ShortenUrl(function(err, r) {
       if(err) {
           
           res.end(JSON.stringify({
               "error": err.toString()
           }));
           return;
       }
       
       res.writeHead(200, {"Content-Type": "application/json"});
       res.end(JSON.stringify({
           "original_url": shortSrv.OriginalUrl,
           "short_url": req.protocol + "://" + req.hostname + "/" + r
       }));
    });
});

//mount the shorten service
app.use('/new', shortApp);

//redirection service
app.get('/:shortUrl', function(req, res) {
    console.log("access short URL " + req.params.shortUrl);
    
    dbControl.Find({shortenurl: req.params.shortUrl}, function(err, r) {
        if(err) {
            console.log("err happen " + err.toString());
            res.writeHead(404, {"Content-Type": "application/json"});
            res.end(JSON.stringify({
                error: err.toString()
            }));
            return;
        }
        
        if(r === null) {
            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(JSON.stringify({
                error: "URL not found"
            }));
            return;
        }
        
        console.log("redirect to " + r.originalurl);
        
        res.redirect(r.originalurl);
    });
});

var port = process.env.PORT || 8080;
app.listen(port, function() {
    console.log('start server at port: ' + port);
});