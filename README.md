[![build status](https://secure.travis-ci.org/toddself/levelsync.png)](http://travis-ci.org/toddself/levelsync)

#LevelSync
LevelSync is a [`Backbone.Model`](http://backbonejs.org/#Model) replacement which uses [LevelDB](http://code.google.com/p/leveldb) via the [levelup](https://github.com/rvagg/node-levelup) interface.

## Installation
```
npm install --save levelsync
```

## Usage
```
var Model = require('levelsync')('./path/to/db');

var StatBlock = Model.extend({
  defaults: {
    'str': 8,
    'con': 8,
    'wis': 8,
    'dex': 8,
    'int': 8,
    'chr': 8
  }
});

var myCharacter = new StatBlock();
myCharacter.set('str', 18);
myCharacter.set('name', 'LEROY JENKINS');
myCharacter.save(myCharacter.toJSON(), {cb: function(err){
  if(!err) console.log(myCharacter.get('name'), 'was saved');
}});

// or
var promise = myCharacter.save();
promise.when(function(){
  console.log(myCharacter.get('name'), 'was saved');
});
```
## Changes from Backbone
The `options` hash accepts a new parameter, `cb`. This callback will be use for all the level operations if set. It's signature should be `(err, data)`. If this is not set, a [`q`](https://github.com/kriskowal/q) promise will be returned instead.

## License
LevelSync is copyright (c) 2013 Todd Kennedy. Usage is provided under the terms of the [MIT Licence](/LICENSE)