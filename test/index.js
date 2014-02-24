/* global describe, it, afterEach, beforeEach, xdescribe, xit */

/*
 * LevelSync
 * https://github.com/toddself/levelsync
 *
 * Copyright (c) 2013 Todd Kennedy. All rights reserved.
 */
'use strict';

var dbPath = __dirname + '/../test_db';
var levelup = require('level');
var db = levelup(dbPath, {valueEncoding: 'json'});
var Backbone = require('backbone');
Backbone.sync = require('../')(db);
var expect = require('chai').expect();
var q = require('q');
var fixture = require('../fixture');


describe('levelsync', function(){
  var existingid;
  var existing_model;

  beforeEach(function(done){
    existing_model = new Backbone.Model();
    existing_model.set(fixture);
    existing_model.save(existing_model.toJSON(), {cb: _cb});

    function _cb(err, data){
      if(err){
        throw err;
      } else {
        existing_model.set(data);
        existingid = data.id;
        done();
      }
    }

  });

  it('Should save the object to the database', function(done){
    var test_model = new Backbone.Model();
    test_model.set(fixture);

    q(test_model.save()).then(function(data){
      if(data.id){
        done();
      } else {
        done(new Error('Not saved'));
      }
    }, function(err){
      done(err);
    });
  });

  it('Should perform an in-place update when changing data', function(done){
    var new_title = 'this is a test';
    existing_model.set('title', new_title);

    q(existing_model.save()).then(function(data){
      if(data.id === existingid && data.title === new_title){
        done();
      } else {
        var err = new Error('Expected '+data.id+' to be '+existingid+' and '+data.title+' to be '+new_title);
        done(err);
      }
    }, function(err){
      done(err);
    });
  });

  it('Should delete an object in the database', function(done){
    q(existing_model.destroy()).then(function(data){
      done();
    }, function(err){
      done(err);
    });
  });

  it('Should get an existing object in the database', function(done){
    var m = new Backbone.Model();
    m.set('id', existingid);
    m.fetch({cb: f});
    function f(err, obj){
      if(obj.id === existingid){
        done();
      } else {
        var err = new Error('Expected '+obj.id+' to be '+existingid);
        done(err);
      }
    };

  });

  it('Should get all existing objects in the database', function(done){
    var c = new Backbone.Collection();
    c.fetch({cb: f});
    function f(err, objs) {
      var obj = objs[0];
      if(obj.id === existingid){
        done();
      } else {
        var err = new Error('Expected '+obj.id+' to be '+existingid);
        done(err);
      }
    };

  });

  afterEach(function(done){
    db.createKeyStream()
      .on('data', function(k){
        db.del(k);
      })
      .on('close', function(){
        done();
      });
  });
});
