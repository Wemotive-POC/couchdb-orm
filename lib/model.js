class Model {
    constructor({ dbName, connection, schema }) {
        this.connection = connection;
        this.db = connection.use(dbName);
        this.dbName = dbName;
        this.schema = schema;
    }

    async createDB({ existsOk }={}) {
        try {
            await this.connection.db.create(this.dbName);
            await this.connection.request({
                db: this.dbName,
                method: "PUT",
                path: "/_design/validate_doc_update",
                body: {
                    language: "javascript",
                    validate_doc_update: this.schema.generateValidator()
                }
            });
        } catch(e) {
            if (!existsOk)
                throw(e);
        }
    }
}

export default Model;
