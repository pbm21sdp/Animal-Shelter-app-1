// src/config/db_dummy.js
// Dummy database functions for testing
module.exports = {
    query: () => console.log("Database is disabled for testing"),
    connect: () => Promise.resolve("Database disabled"),
};