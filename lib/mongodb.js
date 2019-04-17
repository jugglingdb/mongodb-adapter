/**
 * Module dependencies
 */
var mongodb = require('mongodb');
var MongoClient = require('mongodb').MongoClient
var ObjectID = mongodb.ObjectID;

exports.initialize = function initializeSchema(schema, callback) {
    if (!mongodb) return;

    var s = schema.settings;
    s.connectionUrl = s.rs || s.url;
    
    var match = s.connectionUrl.match(/^mongodb:\/\/([^/]+)\/([^?]+)\??(.*)$/);
    
    if (!match) {
        throw new Error('Incorrect connection url for mongo: ' + s.connectionUrl);
    }
    
    s.databaseName = match[2];
    
    schema.adapter = new MongoDB(s, schema, callback);
    schema.ObjectID = ObjectID;
};

var MongoObjectID = function ObjectID(id) {
    if (typeof id !== 'string') return id;
    return new mongodb.ObjectID(id);
}

function MongoDB(s, schema, callback) {
    this.name = 'mongodb';
    this._models = {};
    this.collections = {};

    var connectionOptions = {
        useNewUrlParser: true
    };
    
    MongoClient.connect(s.connectionUrl, connectionOptions, function (err, client) {
        if (err) throw err;
        // the adapter was naming database as client;
        // we keep this convention to minimize changes to the adapter's code
        this.client = client.db(s.databaseName);
        schema.client = this.client;
        callback();
    }.bind(this));
}

MongoDB.prototype.define = function (descr) {
    if (!descr.settings) descr.settings = {};
    this._models[descr.model.modelName] = descr;
    descr.properties.id = descr.properties.id || {type: MongoObjectID};
};

MongoDB.prototype.defineProperty = function (model, prop, params) {
    this._models[model].properties[prop] = params;
};

MongoDB.prototype.defineForeignKey = function (model, key, cb) {
    cb(null, MongoObjectID);
};

MongoDB.prototype.collection = function (name) {
    if ("undefined" !== typeof (this._models[name].settings.table)) {
        name = this._models[name].settings.table;
    }
    if (!this.collections[name]) {
        this.collections[name] = this.client.collection(name);
    }
    return this.collections[name];
};

MongoDB.prototype.create = function (model, data, callback, modelConstructor, options) {
    if (data.id === null || data.id === undefined) {
        delete data.id;
    }
    if (data.id) {
        data._id = data.id;
        delete data.id;
    }
    if (!options) {
        options = {};
    }

    //enable write concern if it's not specified
    options.w = options.w || 1;

    this.collection(model).insert(data, options, function (err, m) {
        if (err || (options.w < 1)) {
            callback(err, null);
        } else {
            callback(err, m.ops[0]._id);
        }
    });
};

MongoDB.prototype.save = function (model, data, callback) {
    var id = data.id;
    if (typeof id === 'string') {
        id = new ObjectID(id);
    } else if (data._id) {
        id = data._id;
    }

    delete data.id;
    delete data._id;

    this.collection(model).update({_id: id}, data, function (err) {
        callback(err);
    });
};

MongoDB.prototype.exists = function (model, id, callback) {
    if (typeof id === 'string') {
        id = new ObjectID(id);
    }
    this.collection(model).findOne({_id: id}, {_id: 1}, function (err, data) {
        callback(err, !!(data && data._id));
    });
};

MongoDB.prototype.find = function find(model, id, callback) {
    if (typeof id === 'string') {
        id = new ObjectID(id);
    }
    this.collection(model).findOne({_id: id}, function (err, data) {
        if (data) data.id = id;
        callback(err, data);
    });
};

MongoDB.prototype.updateOrCreate = function updateOrCreate(model, data, callback) {
    // set data.id as a mongodb object
    var id = data.id;
    if (typeof id === "string") {
        id = new ObjectID(data.id);
    } else if (id === null || id === undefined) {
        id = data._id ? data._id : new ObjectID()
    }

    // avoid setting data._id during $set method
    delete data.id;
    delete data._id;

    this.collection(model).update({_id: id}, {$set: data}, {upsert: true, multi: false}, function (err, rowsAffected) {
        data.id = id;
        callback(err, data);
    });
};

MongoDB.prototype.destroy = function destroy(model, id, callback) {
    if (typeof id === 'string') {
        id = new ObjectID(id);
    }
    this.collection(model).remove({_id: id}, callback);
};

MongoDB.prototype.all = function all(model, filter, callback) {
    var mongo = this;
    if (!filter) {
        filter = {};
    }
    var query = {};
    if (filter.where) {
        if (filter.where.id) {
            var id = filter.where.id;
            delete filter.where.id;
            if (typeof id === 'string') {
                id = new ObjectID(id);
            }
            filter.where._id = id;
        }
        Object.keys(filter.where).forEach(function (k) {
            var cond = filter.where[k];
            var spec = false;
            if (cond && cond.constructor.name === 'Object') {
                spec = Object.keys(cond)[0];
                cond = cond[spec];
            }
            if (spec) {
                if (spec === 'between') {
                    query[k] = {$gte: cond[0], $lte: cond[1]};
                } else if (spec === 'inq') {
                    query[k] = {
                        $in: cond.map(function (x) {
                            if ('string' !== typeof x) return x;
                            return new ObjectID(x);
                        })
                    };
                } else {
                    query[k] = {};
                    query[k]['$' + spec] = cond;
                }
            } else {
                if (cond === null) {
                    query[k] = {$type: 10};
                } else {
                    query[k] = cond;
                }
            }
        });
    }
    var cursor = this.collection(model).find(query);

    if (filter.order) {
        var keys = filter.order;
        if (typeof keys === 'string') {
            keys = keys.split(',');
        }
        var args = {};
        for (var index in keys) {
            var m = keys[index].match(/\s+(A|DE)SC$/);
            var key = keys[index];
            key = key.replace(/\s+(A|DE)SC$/, '').trim();
            if (m && m[1] === 'DE') {
                args[key] = -1;
            } else {
                args[key] = 1;
            }
        }
        cursor.sort(args);
    }
    if (filter.limit) {
        cursor.limit(filter.limit);
    }
    if (filter.skip) {
        cursor.skip(filter.skip);
    } else if (filter.offset) {
        cursor.skip(filter.offset);
    }
    cursor.toArray(function (err, data) {
        if (err) return callback(err);
        var objs = data.map(function (o) {
            o.id = o._id;
            return o;
        });
        if (filter && filter.include) {
            mongo._models[model].model.include(objs, filter.include, callback);
        } else {
            callback(null, objs);
        }
    });
};

MongoDB.prototype.destroyAll = function destroyAll(model, callback) {
    this.collection(model).remove({}, callback);
};

MongoDB.prototype.count = function count(model, callback, where) {
    this.collection(model).count(where, function (err, count) {
        callback(err, count);
    });
};

MongoDB.prototype.updateAttributes = function updateAttrs(model, id, data, cb) {
    if (typeof id === 'string') {
        id = new ObjectID(id);
    }
    this.collection(model).findAndModify({_id: id}, [['_id', 'asc']], {$set: data}, {}, function (err, object) {
        cb(err, object);
    });
};

MongoDB.prototype.disconnect = function () {
    this.client.close();
};

