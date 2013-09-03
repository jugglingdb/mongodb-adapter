var should = require('./init.js');

var db, Book, Chapter;

describe('ObjectID', function() {

    before(function() {
        db = getSchema();
        Book = db.define('Book');
        Chapter = db.define('Chapter');
        Book.hasMany('chapters');
        Chapter.belongsTo('book');
    });

    it('should cast foreign keys as ObjectID', function(done) {

        Chapter.beforeCreate = function(next, data) {
            data.bookId.should.be.an.instanceOf(db.ObjectID);
            this.bookId.should.be.an.instanceOf(db.ObjectID);
            next();
        };

        Book.create(function(err, book) {
            Chapter.create({bookId: book.id.toString()}, done);
        });

    });

    it('should work when create with id', function(done) {
        var id = new db.ObjectID;
        Book.create({id: id}, function(err, b) {
            should.not.exist(err);
            b.id.should.be.an.instanceOf(db.ObjectID);
            b.id.toString().should.equal(id.toString());
            done();
        });
    });
});
