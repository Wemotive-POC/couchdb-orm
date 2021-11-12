import Model from "./model.js";

function call(dbName="") {
    if (!this.connection)
        throw({ error: "No connection found" });

    if (dbName == "") {
        if (this.options.defaultDB)
            dbName = this.options.defaultDB;
        else
            throw({ error: "No DB Name provided." });
    } else if (this.options.dbPrefix)
        dbName = this.options.dbPrefix + dbName;

    return new Model({ dbName, connection: this.connection, schema: this.schema });
}


function connect(connection) {
    this.connection = connection;
}

function ModelGen(schema, options) {
    const obj = {
        schema,
        options,
    };
    const caller = call.bind(obj);
    caller.connect = connect.bind(obj);
    return caller;
}

export default ModelGen;
