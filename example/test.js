import { Schema } from "../lib/index.js";

const schema = new Schema({
	name: {
		required: true,
		type: String
	},

	phoneNo: {
		required: true,
		type: String,
		// The validate function must not depend on any state of the file
		// It will be passed as is to backend
		validate: (phoneNo) => {
			if (!phoneNo.match(/\d{10}/))
				throw({ forbidden: "Invalid Phone Number" })
		}
	},

	address: {
		required: false,
		type: {
			address: {
				required: true,
				type: Number
			},
			pincode: {
				required: true,
				type: Number
			}
		}
	}
});

console.log(schema.generateValidator())

const docs = [
	{
		name: "Irene"
	},

	{
		phoneNo: "9999999999"
	},

	{
		name: "Irene",
		phoneNo: "9999999999"
	},
];
docs.forEach(i => { console.log(i); console.log(schema.isValidDoc(i)); })
