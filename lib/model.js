class Model {
    constructor({ dbName, connection, schema }) {
        this.connection = connection;
        this.db = connection.use(dbName);
        this.dbName = dbName;
        this.schema = schema;
    }

    async createValidationDoc() {
        return await this.db.insert({
            language: "javascript",
            validate_doc_update: this.schema.generateValidator()
        }, "_design/validate_doc_update");
    }

    async createIndexes() {
        await Promise.all(this.schema.indexes.map(i => this.db.createIndex(i)));
    }

    async createDB({ existsOk }={}) {
        try {
            await this.connection.db.create(this.dbName);
            await this.createValidationDoc();
            await this.createIndexes();
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

    async findPaginated(query, limit, skip) {
        limit = parseInt(limit);
        skip = parseInt(skip);
        if (limit)
            query.limit = limit + 1;
        if (skip)
            query.skip = skip;
        const result = await this.db.find(query);
        result.hasNext = result.docs.length === limit + 1;
        if (result.hasNext)
            result.docs = result.docs.slice(0, limit);
        return result;
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

    async replicate(target, options) {
        const sourceName = this.db.config.url + "/" + this.db.config.db;
        const targetName = target.db.config.url + "/" + target.db.config.db;
        return this.connection.db.replicate(sourceName, targetName, options);
    }

    async replicateOnce(target, options) {
        if (!options)
            options = {};
        return this.replicate(target, {...options, continuous: false});
    }

    async get(id, options) {
        return this.db.get(id, options);
    }

    async migrate() {
        try {
            const result = await this.db.get("_design/validate_doc_update");
            await this.db.destroy("_design/validate_doc_update", result._rev);
        } catch {
            // Do nothing if the document didn't exist
        }
        await this.createValidationDoc();
        await this.createIndexes();
    }
}

module.exports = Model;
