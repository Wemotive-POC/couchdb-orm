const Connection = require("./connection.js");
const Schema = require("./schema.js");
const ModelGen = require("./modelGen.js");

module.exports = {
    Connection,
    Schema,
    Model: ModelGen,
};
