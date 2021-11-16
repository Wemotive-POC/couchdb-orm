import { env } from "process";
import { Connection, Model, Schema  } from "../lib/index.js";


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

const User = Model(userSchema, { defaultDB: "users", dbPrefix: "users_" });


const conn = Connection(env.COUCH_DB_URL);
User.connect(conn);


(async () => {
    const dummyOrg = User("dummyOrg");
    await dummyOrg.createDB({ existsOk: true });
    await dummyOrg.insert({
        name: "Irene",
        email: "irene@webionite.com",
    });

    await dummyOrg.insert({
        name: "Irene",
        email: "irene@wemotiveforge.com",
    });

    await dummyOrg.insert({
        name: "Foo",
        email: "foo@bar.com",
    });

    const one = await dummyOrg.findOne({selector: {  email: "foo@bar.com"  }});
    console.log(one);

    const all = await dummyOrg.findAll({ selector: { name: "Irene" } });
    console.log(all.docs);
})();
