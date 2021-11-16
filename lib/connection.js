const nano = require("nano");

function Connection(url) {
    return nano(url);
}

module.exports = Connection;
