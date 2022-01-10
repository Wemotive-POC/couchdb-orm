const { env } = require("process");
const { Connection, Model, Schema, emit } = require("../lib/index.js");


const userSchema = Schema({
    name: {
        required: true,
        type: String
    },
    email: {
        required: true,
        type: String,
        validate: (email) => {
            const emailRe = /^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
            if (!email.match(emailRe))
                throw({ forbidden: "Email doesn't match the email regex" });
        }
    }
}, {
    indexes: [
        {
            index: {
                fields: ["email"],
            },
            name: "email",
        },
        ["name"],
        [],
    ],
    ddocs: {
        email: {
            views: {
                count: {
                    map: function (doc) {
                        emit(doc.email, 1);
                    },
                    reduce: "_count"
                }
            }
        }
    }
});

userSchema.addDDoc("name", {
    views: {
        letters: {
            map: function (doc) {
                emit(doc._id, doc.name.length);
            }
        }
    }
});

const conn = Connection(env.COUCH_DB_URL);
const User = Model(userSchema, { defaultDB: "users", dbPrefix: "users_" })(conn);


(async () => {
    const dummyOrg = User("dummyorg");
    const spamOrg = User("spamorg");
    await dummyOrg.createDB({ existsOk: true });
    await spamOrg.createDB({ existsOk: true });
    await dummyOrg.migrate();

    spamOrg.schema = Schema({
        name: {
            type: String,
        },
        email: {
            type: String,
        },
        phoneNumber: {
            type: String,
        },
    });
    await spamOrg.migrate();
    await dummyOrg.insert({
        name: "Irene",
        email: "irene@webionite.com",
    });

    await dummyOrg.insert({
        name: "Irene",
        email: "irene@wemotiveforge.com",
    });

    const foo = await dummyOrg.insert({
        name: "Foo",
        email: "foo@bar.com",
    });

    console.log(`Getting by id: ${foo.id}`);
    const fooFromDb = await dummyOrg.get(foo.id);
    console.log(fooFromDb);

    console.log("Getting one by email: foo@bar.com");
    const one = await dummyOrg.findOne({selector: {  email: "foo@bar.com"  }});
    console.log(one);

    console.log("Getting all by name: Irene");
    const all = await dummyOrg.findAll({ selector: { name: "Irene" } });
    console.log(all.docs);

    console.log("Getting all paginated with limit=2 skip=0");
    const paginated = await dummyOrg.findPaginated({ selector: {} }, 2, 0);
    console.log(paginated);

    console.log("Getting data from design document email, view count");
    const emailCount = await dummyOrg.ddoc.email.count();
    console.log(emailCount);

    console.log("Getting data from design document name, view letters");
    const letters = await dummyOrg.ddoc.name.letters();
    console.log(letters);

    console.log("Replicating");
    await dummyOrg.replicate(spamOrg, { continuous: false });
    console.log("Replicated");
})();
