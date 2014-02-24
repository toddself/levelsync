/*
 * LevelSync
 * https://github.com/toddself/levelsync
 *
 * Copyright (c) 2013 Todd Kennedy. All rights reserved.
 */
'use strict';

var Backbone = require('backbone');
var highland = require('highland');

/**
 * Returns a `Backbone.Sync` method
 * with our new version
 * @param  {String} db  LevelDB instance.
 * @return {Function}     `Backbone.Sync` method
 */
module.exports = function(db){
  /**
   * `Backbone.Sync` method which uses LevelDB for persistance
   * @private
   * @async
   * @param  {String} method  What are we doing with the data
   * @param  {Object} model   The data
   * @param  {Object} options Options hash
   * @return {Mixed}          Undefined if `options.cb` set, otherwise a `q` defer
   */
  var levelSync = function levelSync(method, model, options){
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

    if (model instanceof Backbone.Collection) {
      switch (method) {
        case 'read':
          highland(db.createReadStream())
            .pluck('value')
            .errors(function (err) {
              if (err) { return cb(err); }
            })
            .toArray(function (array) {
              return cb(null, array);
            });
          break;
        default:
          cb(new Error('Collection method '+method+'not recognized'));
          break;
      }
    }
    else if (model instanceof Backbone.Model) {

      switch (method) {
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
            cb(new Error('No ID attribute set on model'));
          } else {
            db.get(model.get('id'), cb);
          }
          break;
        default:
          cb(new Error('Model method '+method+' not recognized'));
          break;
      }
    }
    else {
      cb(new Error('Invalid Backbone model'));
    }

    return typeof d === 'undefined' ? d : d.promise;

  };
  return levelSync;
};
