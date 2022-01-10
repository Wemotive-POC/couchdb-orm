/* eslint no-unused-vars: 0 */

// Exporting couchdb query server context objects just to keep eslint and other
// utils happy to avoid no-undef for views
// https://docs.couchdb.org/en/stable/query-server/javascript.html#design-functions-context

module.exports = {
    index: (key, value, params) => {},
    emit: (key, value) => {},
    getRow: () => {},
    isArray: (obj) => {},
    log: (message) => {},
    provides: (key, value) => {},
    registerType: (key, ...mimes) => {},
    require: (path) => {},
    send: (chunk) => {},
    start: (init_resp) => {},
    sum: (arr) => {},
    toJSON: (obj) => {},
};
