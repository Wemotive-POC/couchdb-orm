const { env } = require("process");
const { Connection, Model, Schema  } = require("../lib/index.js");


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
});

const conn = Connection(env.COUCH_DB_URL);
const User = Model(userSchema, { defaultDB: "users", dbPrefix: "users_" })(conn);


(async () => {
    const dummyOrg = User("dummyorg");
    const spamOrg = User("spamorg");
    await dummyOrg.createDB({ existsOk: true });
    await spamOrg.createDB({ existsOk: true });
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

    const one = await dummyOrg.findOne({selector: {  email: "foo@bar.com"  }});
    console.log(one);

    const all = await dummyOrg.findAll({ selector: { name: "Irene" } });
    console.log(all.docs);

    const paginated = await dummyOrg.findPaginated({ selector: {} }, 2, 0);
    console.log(paginated);

    console.log("Replicating");
    await dummyOrg.replicate(spamOrg, { continuous: false });
})();
