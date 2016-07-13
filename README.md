[![NPM Version][npm-image]][npm-url]
[![NPM Downloads][downloads-image]][downloads-url]
[![Build status][build-image]][build-url]
[![Test Coverage][coveralls-image]][coveralls-url]
[![Dependency Status][dependencies-image]][dependencies-url]

## JugglingDB-MongoDB

MongoDB adapter for jugglingdb.

## Usage

To use it you need `jugglingdb@0.2.x`.

1. Setup dependencies in `package.json`:

    ```json
    {
      ...
      "dependencies": {
        "jugglingdb": "0.2.x",
        "jugglingdb-mongodb": "latest"
      },
      ...
    }
    ```

2. Use:

    ```javascript
    var Schema = require('jugglingdb').Schema;
    var schema = new Schema('mongodb');
    ...
    ```
    You can also set some settings in your schema, as [write concern and journaling](http://docs.mongodb.org/manual/core/write-concern/):
    ```javascript
    var Schema = require('jugglingdb').Schema;
    var schema = new Schema('mongodb', {
        url: 'mongodb://localhost/myapp',
        w: 1,
        j: 1
    });
    ```

## Running tests

Make sure you have mongodb server running on default port, username: `travis`,
password: `test`, database: `myapp`

    npm test

## MIT License

    Copyright (C) 2012 by Anatoliy Chakkaev

    Permission is hereby granted, free of charge, to any person obtaining a copy
    of this software and associated documentation files (the "Software"), to deal
    in the Software without restriction, including without limitation the rights
    to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the Software is
    furnished to do so, subject to the following conditions:

    The above copyright notice and this permission notice shall be included in
    all copies or substantial portions of the Software.

    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
    IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
    FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
    AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
    LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
    OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
    THE SOFTWARE.

[coveralls-url]: https://coveralls.io/github/jugglingdb/mongodb-adapter
[coveralls-image]: https://coveralls.io/repos/github/jugglingdb/mongodb-adapter/badge.svg
[build-url]: https://circleci.com/gh/jugglingdb/mongodb-adapter
[build-image]: https://circleci.com/gh/jugglingdb/mongodb-adapter.svg?style=shield
[npm-image]: https://img.shields.io/npm/v/jugglingdb-mongodb.svg
[npm-url]: https://npmjs.org/package/jugglingdb-mongodb
[downloads-image]: https://img.shields.io/npm/dm/jugglingdb-mongodb.svg
[downloads-url]: https://npmjs.org/package/jugglingdb-mongodb
[dependencies-image]: https://david-dm.org/jugglingdb/mongodb-adapter.svg
[dependencies-url]: https://david-dm.org/jugglingdb/mongodb-adapter

