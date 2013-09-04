// This test written in mocha+should.js
var should = require('./init.js');

var User, Post, db, Test;

describe('mongodb', function(){

    before(function() {
        db = getSchema();

        User = db.define('User', {
            name:      { type: String, index: true },
            email:     { type: String, index: true },
            age:          Number,
        });

        Post = db.define('Post', {
            title:     { type: String, length: 255, index: true },
            content:   { type: String }
        });

        Test = db.define('Test', {
            name:     { type: String}
        }, {
            table: 'test_collection'
        });

        User.hasMany(Post);
        Post.belongsTo(User);
    });

    beforeEach(function(done) {
        User.destroyAll(function() {
            Post.destroyAll(function() {
                Test.destroyAll(done);
            });
        });

    });

    it('hasMany should support additional conditions', function (done) {
        User.create(function (e, u) {
            u.posts.create({}, function (e, p) {
                u.posts({where: {_id: p.id}}, function (err, posts) {
                    should.not.exist(err);
                    posts.should.have.lengthOf(1);

                    done();
                });
            });
        });
    });

    it('should allow to find by id string', function (done) {
        Post.create(function (err, post) {
            Post.find(post.id.toString(), function (err, post) {
                should.not.exist(err);
                should.exist(post);

                done();
            });
        });
    });

    it('find should return an object with an id, which is instanceof ObjectId', function (done) {
        Post.create(function (err, post) {
            Post.find(post.id, function (err, post) {
                should.not.exist(err);
                post.id.should.be.an.instanceOf(db.ObjectID);
                post._id.should.be.an.instanceOf(db.ObjectID);

                done();
            });

        });
    });

    it('all should return object with an id, which is instanceof ObjectID', function (done) {
        var post = new Post({title: 'a'})
        post.save(function (err, post) {
            Post.all({where: {title: 'a'}}, function (err, posts) {
                should.not.exist(err);
                posts.should.have.lengthOf(1);
                post = posts[0];
                post.id.should.be.an.instanceOf(db.ObjectID);
                post._id.should.be.an.instanceOf(db.ObjectID);

                done();
            });

        });
    });

    it('should use the table setting if setted', function(done) {
        var post = new Post({title: 'a'})
        should.exist(db.adapter.collections.Post);


        var test = new Test({name: 'testing'});

        should.not.exist(db.adapter.collections.Test);
        should.exist(db.adapter.collections.test_collection);

        done();
    });

    it('should create an object if wrong id type is passed if using upsert', function(done) {
        var id = new db.ObjectID;
        User.upsert({id: id}, function(err, user) {
            should.not.exist(err);
            should.exist(user);
            user.id.toString().should.equal(id.toString());

            done();
        });
    });

    it('should create and update an object using upsert', function(done) {
        var id = new db.ObjectID;
        var email = 'user@email.com';
        var updatedEmail = 'user@email2.com';
        User.upsert({id: id, email: email}, function(err, user) {
            should.not.exist(err);
            should.exist(user);
            user.email.should.equal(email);
            user.id.toString().should.equal(id.toString());
            User.find(id, function(err, user){
                should.not.exist(err);
                user.email.should.equal(email);
                User.upsert({id: id, email: updatedEmail}, function(err, user){
                    User.find(id, function(err, user) {
                        should.not.exist(err);
                        user.id.should.equal(id);
                        user.email.should.equal(updatedEmail);
                        done();
                    });
                });
            })
        });
    });

    after(function(done){
        User.destroyAll(function(){
            Post.destroyAll(function() {
                Test.destroyAll(done);
            });
        });
    });
});

