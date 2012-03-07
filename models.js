
/**
 * Module dependencies.
 */

var mongoose = require('mongoose')
  , Schema = mongoose.Schema;

/**
 * Schema definition
 */

/*
 * 

var Monster = new Schema({
    name       : { type: String, index: { unique: true, sparse: true } }
  , code       : { type: String, index: true }
  , ownerships : [Ownership]
  , comments   : [Comment] 
});

var Ownership = new Schema({
    user       : User
  , date_start : Date
  , date_end   : Date
  , latitude   : Double
  , longitude  : Double
  , deed       : String
  , notify     : Boolean
});

var Comment = new Schema({
    user       : User
  , date       : Date
  , text       : String
});

var User = new Schema({
    name       : String
  , email      : { type: String, required: true, index: { unique: true, sparse: true } }
  , password   : String
  , active     : String
});


 */

var Monster = new Schema({
    code       : { type: String, index: true }
  , ownerships : [Ownership]
});

var Ownership = new Schema({
    date_added : Date
  , address    : String 
  , deed       : String
});


/**
 * Models
 */

mongoose.model('Monster', Monster);
exports.Monster = function(db) {
  return db.model('Monster');
};

mongoose.model('Ownership', Ownership);
exports.Ownership = function(db) {
    return db.model('Ownership');
};

