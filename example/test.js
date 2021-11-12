import { Schema } from "../lib/index.js";

const schema = Schema({
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
				type: String
			},
			lane: {
				required: false,
				type: {
					lane1: {
						required: true,
						type: String
					},
					lane2: {
						required: false,
						type: String
					}
				}
			},
			pincode: {
				required: true,
				type: Number
			}
		}
	}
});

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
	{
		name: "Irene",
		phoneNo: "9999999999",
		address: {}
	},
	{
		name: "Irene",
		phoneNo: "9999999999",
		address: {
			address: "foo-bar",
			pincode: "190014"
		}
	},
	{
		name: "Irene",
		phoneNo: "9999999999",
		address: {
			address: "foo-bar",
			lane: {
				lane1: "Blah"
			},
			pincode: 190014
		}
	},
	{
		name: "Irene",
		phoneNo: "9999999999",
		address: {
			address: "foo-bar",
			lane: {
				lane1: "Blah",
				lane2: 15710
			},
			pincode: 190014
		}
	},
];
console.log(schema.schema);
docs.forEach(i => { console.log(i); console.log(schema.isValidDoc(i, true), "\n\n"); })
