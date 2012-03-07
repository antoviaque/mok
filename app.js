
// Imports /////////////////////////////////////////////////////

var restify = require('restify');
var Logger = require('bunyan');


// Database ////////////////////////////////////////////////////

mongoose = require('mongoose');
db = mongoose.connect('mongodb://localhost/mok');

Monster = require('./models.js').Monster(db);
Ownership = require('./models.js').Ownership(db);

// Schema updates //////////////////////////////////////////////

Ownership.find({date_added: {'$exists': false}}, function(err, ownership_list) {
    ownership_list.forEach(function(ownership) {
        ownership.date_added = new Date();
        ownership.save();
    });
});


function SortByName(a, b){
    var aName = a.name.toLowerCase();
    var bName = b.name.toLowerCase(); 
    return ((aName < bName) ? -1 : ((aName > bName) ? 1 : 0));
  }


// Views ///////////////////////////////////////////////////////

function get_monster(req, res, next) {
    var send_result = function(err, monster_list) {
        if (err) {
            return next(err);
        }
        
        if(monster_list) {
            console.log(monster_list.ownerships);
            monster_list.ownerships.sort(function(a, b) {
                return ((a.date_added < b.date_added) ? -1 : (a.date_added > b.date_added) ? 1 : 0); 
            });
            console.log(monster_list.ownerships);
            res.send(monster_list);
            return next();
        } else {
            return next(new restify.ResourceNotFoundError("Could not find any such monster"));
        }
    };
    
    if('code' in req.query) {
        Monster.findOne({'code': req.query.code}, send_result);
    } else if('_id' in req.params) {
        Monster.findOne({'_id': req.params._id}, send_result);
    } else {
        Monster.find({}, send_result);        
    }
}

function get_ownership(req, res, next) {
    return next(new restify.BadMethodError("Not implemented"));
}

function post_ownership(req, res, next) {
    if(!req.body.address || !req.body.deed || !req.body.monster) {
        return next(new restify.MissingParameterError("Missing required ownership attribute in request body"));
    }
    
    Monster.findOne({_id: req.body.monster}, function(err, monster) {
        if (err) {
            return next(err);
        } else if(!monster) {
            return next(new restify.ResourceNotFoundError("Could not find monster with id="+req.body.monster));
        }
        
        new_ownership = new Ownership({address: req.body.address,
                                       deed: req.body.deed,
                                       date_added: new Date()});
        new_ownership.save();
        monster.ownerships.push(new_ownership);
        monster.save();
        
        res.send(new_ownership);
        return next();
    })
}

function put_ownership(req, res, next) {
    return next(new restify.BadMethodError("Not implemented"));
}

// Server /////////////////////////////////////////////////////

server = restify.createServer();

server.use(restify.acceptParser(server.acceptable));
server.use(restify.authorizationParser());
server.use(restify.dateParser());
server.use(restify.queryParser({ mapParams: false }));
server.use(restify.bodyParser({ mapParams: false }));
server.use(restify.throttle({
  burst: 10,
  rate: 1,
  ip: false,
  xff: true,
}));

// Logging
server.on('after', restify.auditLogger({
    log: new Logger({
        name: 'mok',
        streams: [{ level: "info", stream: process.stdout }, 
                  { level: "info", path: 'log/server.log' }],
    })
}));


// Routes /////////////////////////////////////////////////////

// Monster
server.get('/api/monster/', get_monster);
server.get('/api/monster/:_id', get_monster);

// Ownership
server.get('/api/ownership/', get_ownership);
server.get('/api/ownership/:_id', get_ownership);
server.get('/api/ownership/set/:id_list', get_ownership);
server.post('/api/ownership/', post_ownership);

// Run ////////////////////////////////////////////////////////

server.listen(3001, function() {
    console.log('%s listening at %s', server.name, server.url);
});

