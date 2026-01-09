console.log("db.js executing...");
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'data.sqlite');
console.log("dbPath: ", dbPath);
const db = new Database(dbPath);

const migrations = fs.readFileSync(path.join(__dirname, 'migrations.sql'), 'utf8');
if (!migrations || migrations.trim().length === 0) {
    console.error("ERROR: migrations.sql is empty or could not be read!");
    process.exit(1);
}

console.log("Running migrations...");
db.exec(migrations);

// prepared statements
const insertUrlStmt = db.prepare('INSERT INTO urls (original_url) VALUES (?)');
const updateShortCodeStmt = db.prepare('UPDATE urls SET short_code = ? WHERE id = ?');
const findByShortCodeStmt = db.prepare('SELECT * FROM urls WHERE short_code = ?');
const findByIdStmt = db.prepare('SELECT * FROM urls WHERE id = ?');

module.exports = {
    insertUrl: (originalUrl) => {
        return insertUrlStmt.run(originalUrl);
    },
    updateShortCode: (shortCode, id) => {
        return updateShortCodeStmt.run(shortCode, id);
    },
    findByShortCode: (shortCode) => {
        return findByShortCodeStmt.get(shortCode);
    },
    findById: (id) => {
        return findByIdStmt.get(id);
    }
};