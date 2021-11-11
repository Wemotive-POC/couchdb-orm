class Schema {
    constructor(schema) {
        this.schema = schema;
        this.required = Object.keys(schema).filter(key => schema[key].required);
    }

    isValidDoc(document) {
        try {
            eval(this.generateValidator())(document);
            return true;
        } catch (_) {
            return false;
        }
    }

    generateValidator() {
        const lineSep = "\n            ";
        let string = `
        (doc) => {
            // Standard boilerplate
            function requireField(field) {
                const message = "Document must have a " + field;
                if (!doc[field]) throw({forbidden : message});
            }
            // First let's check if valid keys are available
            `;
        string += this.required
            .map(i => "requireField(" + JSON.stringify(i) + ");")
            .reduce((i,j) => i + lineSep + j);

        string += `

            // Next let's check if the types are correct

            function typeCheck(value) {
              const return_value = Object.prototype.toString.call(value);
              const type = return_value.substring(
                       return_value.indexOf(" ") + 1,
                       return_value.indexOf("]"));
              return type.toLowerCase();
            }
        `;

        const typeChecked = Object.keys(this.schema)
            .filter(key => this.schema[key].type);

        const nonObj = typeChecked.filter(key => typeof this.schema[key].type !== "object");
        nonObj.forEach(
            key => {
                let type = null;
                switch (this.schema[key].type) {
                    case String:
                        type = "string";
                        break;
                    case Array:
                        type = "array";
                        break;
                    case Number:
                        type = "number";
                        break;
                    case Date:
                        type = "date";
                        break;
                    default:
                        throw({ error: "Invalid type" });
                }
                string += `
                if (doc[${JSON.stringify(key)}] !== undefined && typeof doc[${JSON.stringify(key)}] !== "${type}")
                    throw({ forbidden: "Invalid type for " + ${JSON.stringify(key)} })
                `
            }
        )
        string += `
        }`;
        return string;
    }
}

export default Schema;
