/* global describe, it, afterEach, beforeEach, xdescribe, xit */

/*
 * LevelSync
 * https://github.com/toddself/levelsync
 *
 * Copyright (c) 2013 Todd Kennedy. All rights reserved.
 */
'use strict';

var dbPath = './test_db';
var levelup = require('level');
var db = levelup(dbPath, {valueEncoding: 'json'});
var Model = require('./index')(db);
var expect = require('chai').expect();
var q = require('q');
var fixture = require('./fixture');


describe('levelsync', function(){
  var existingid;
  var existing_model;

  beforeEach(function(done){
    existing_model = new Model();
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

  it('Should save the document to the datastore', function(done){
    var test_model = new Model();
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

  it('Should get an existing object', function(done){
    var m = new Model();
    m.set('id', existingid);
    m.fetch({cb: f});
    function f(err, data){
      if(data.id === existingid){
        done();
      } else {
        var err = new Error('Expected '+data.id+' to be '+existingid);
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