class Model {
    constructor({ dbName, connection, schema }) {
        this.connection = connection;
        this.db = connection.use(dbName);
        this.dbName = dbName;
        this.schema = schema;
        this.ddoc = new Proxy(this, {
            get: (target, property) => {
                const newTarget = {
                    dbModel: target,
                    designDocument: property,
                };

                return new Proxy(newTarget, {
                    get: (target, view) => {
                        return async function (params) {
                            const db = target.dbModel.db;
                            return await db.view(target.designDocument, view, params);
                        };
                    }
                });
            }
        });
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

    async createDDocs(upgrade) {
        await Promise.all(
            Object.entries(this.schema.ddocs)
                .map(async ([name, doc]) => {
                    const docName = `_design/${name}`;
                    let add = true;
                    if (upgrade) {
                        try {
                            const document = await this.get(docName);
                            // If document is same, don't delete as that would
                            // cause reindexing
                            delete document._id;
                            delete document._rev;
                            if (JSON.stringify(document) === JSON.stringify(doc))
                                add = false;
                            else {
                                this.delete(document);
                            }
                        } catch {
                            // Document doesn't exist. Need to create it
                        }
                    }
                    if (add) {
                        try {
                            await this.insert({ _id: docName, ...doc });
                        } catch {
                            // if it fails, probably coz already existed
                        }
                    }
                })
        );
    }

    async createDB({ existsOk }={}) {
        try {
            await this.connection.db.create(this.dbName);
            await this.createValidationDoc();
        } catch(e) {
            if (!existsOk)
                throw(e);
        }
        await this.createIndexes();
        await this.createDDocs(false);
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
        await this.createDDocs(true);
    }
}

module.exports = Model;
