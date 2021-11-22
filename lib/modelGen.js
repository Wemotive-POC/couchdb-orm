const Model = require("./model.js");

function AbstractModel(dbName="", connection, options, schema) {
    if (!connection)
        throw({ error: "No connection found" });

    if (dbName === "" || dbName === undefined || dbName === null) {
        if (options.defaultDB)
            dbName = options.defaultDB;
        else
            throw({ error: "No DB Name provided." });
    } else if (options.dbPrefix)
        dbName = options.dbPrefix + dbName;

    return new Model({ dbName, connection, schema });
}

function ModelGen(schema, options) {
    return connection =>
        (dbName="") =>
            AbstractModel(dbName, connection, options, schema);
}

module.exports = ModelGen;

