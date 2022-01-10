const Connection = require("./connection.js");
const Schema = require("./schema.js");
const ModelGen = require("./modelGen.js");
const queryServer = require("./couchdbContext");

module.exports = {
    ...queryServer,
    Connection,
    Schema,
    Model: ModelGen,
};
