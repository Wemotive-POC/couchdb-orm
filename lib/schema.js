class Schema {
    constructor(schema) {
        this.schema = schema;
        this.required = Object.keys(schema).filter(key => schema[key].required);
    }

    isValidDoc(document, logError=false) {
        try {
            eval(this.generateValidator())(document);
            return true;
        } catch (_) {
            if (logError)
                console.log(_);
            return false;
        }
    }

    generateValidator(nested=false, name='doc') {
        const lineSep = "\n            ";
        let string = `
        (doc, name=${JSON.stringify(name)}) => {
            function requireField(field) {
                const message = name + " must have a " + field;
                if (!doc[field]) throw({forbidden : message});
            }
        `
        if (!nested)
            string += `
            // Standard boilerplate

            function typeCheck(value) {
              const return_value = Object.prototype.toString.call(value);
              const type = return_value.substring(
                       return_value.indexOf(" ") + 1,
                       return_value.indexOf("]"));
              return type.toLowerCase();
            }

            // First let's check if valid keys are available
            `;
        string += this.required
            .map(i => "requireField(" + JSON.stringify(i) + ");")
            .reduce((i,j) => i + lineSep + j);

        string += `

            // Next let's check if the types are correct

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
                    throw({ forbidden: "Invalid type for " + name + "." + ${JSON.stringify(key)} })
                `
            }
        )

        // We want to nest the tests for object types
        const obj = typeChecked.filter(key => typeof this.schema[key].type === "object");
        obj.forEach(
            key => {
                const validator = (new Schema(this.schema[key].type))
                    .generateValidator(true);
                string += `
                doc[${JSON.stringify(key)}] !== undefined && (
                    ${validator})(doc[${JSON.stringify(key)}], name + "." + ${JSON.stringify(key)})`
            }
        )
        string += `
        }`;

        return string;
    }
}

export default (...args) => { return new Schema(...args); };
