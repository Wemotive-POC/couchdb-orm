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


    async insert(doc, { validate } = { validate: false }) {
        if (!validate || this.schema.isValidDoc(doc))
            return this.db.insert(doc);
        else
            throw({ error: "Invalid document", doc });
    }

    async findAll(query) {
        return await this.db.find(query);
    }

    async findOne(query) {
        const res = await this.db.find({ ...query, limit: 1 });
        if (res.docs.length > 0)
            return res.docs[0];
        return null;
    }

    async delete({ _id, _rev }) {
        return await this.db.destroy(_id, _rev);
    }

    async update(doc, ...args) {
        if (!doc._id || !doc._rev)
            throw new Error("Missing _id or _rev");
        return this.insert(doc, ...args);
    }
}

module.exports = Model;
