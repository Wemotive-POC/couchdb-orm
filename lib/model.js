class Model {
    constructor(dbName, connection) {
        this.db = connection.use(dbName);
        this.dbName = dbName;
    }
}

export default Model;
