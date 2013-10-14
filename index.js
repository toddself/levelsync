/*
 * LevelSync
 * https://github.com/toddself/levelsync
 *
 * Copyright (c) 2013 Todd Kennedy. All rights reserved.
 */
'use strict';

var Backbone = require('backbone');
var levelup = require('level');
var db;

/**
 * Returns a Backbone.Model instance with the `Sync` method overwritten
 * with our new version
 * @param  {String} dbPath  Path to the LevelDB instance. Will be created if it
 *                          does not exist
 * @param  {Object} options Options for the LevelDB instance.
 * @return {Object}         Backbone.Model
 */
module.exports = function(dbPath, options){
  if(typeof options === 'undefined'){
    options = {valueEncoding: 'json'};
  }

  if(typeof dbPath === 'string'){
    db = levelup(dbPath, options);
  } else {
    db =  dbPath;
  }

  Backbone.sync = levelSync;
  return Backbone.Model;
}

/**
 * `Backbone.Sync` method which uses LevelDB for persistance
 * @private
 * @async
 * @param  {String} method  What are we doing with the data
 * @param  {Object} model   The data
 * @param  {Object} options Options hash
 * @return {Mixed}          Undefined if `options.cb` set, otherwise a `q` defer
 */
function levelSync(method, model, options){
  var cb, q, d;

  if(typeof options.cb === 'undefined'){
    q = require('q');
    d = q.defer();

    /**
     * If you don't pass in a callback in the options hash we need to return
     * a promise which will be resolved/rejected on error. We'll make a fake
     * callback to handle this so we can keep the interface the same;
     * @private
     * @async
     * @param  {Object} err  Error
     * @param  {Object} data Data
     * @return {Object}      Undefined
     */
    cb = function(err, data){
      if(err){
        d.reject(err);
      } else if(data){
        d.resolve(data);
      } else {
        d.resolve(model.toJSON());
      }
    }
  } else {
    cb = function(err, data){
      if(err){
        options.cb(err);
      } else if(data){
        options.cb(null, data);
      } else {
        options.cb(null, model.toJSON());
      }
    };
  }

  switch(method){
    case 'create':
    case 'update':
    case 'patch':
      if(method === 'create') model.set('id', model.cid);
      db.put(model.get('id'), model.toJSON(), cb);
      break;
    case 'delete':
      db.del(model.get('id'), cb);
      break;
    case 'read':
      if(typeof model.get('id') === 'undefined'){
        _cb(new Error('No ID attribute set on model'));
      } else {
        db.get(model.get('id'), cb);
      }
      break;
    default:
      _cb(new Error('Method '+method+' not recognized'));
      break;
  }

  return typeof d === 'undefined' ? d : d.promise;

}