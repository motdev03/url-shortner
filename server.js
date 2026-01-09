console.log("Server file is executing");

require('dotenv').config();
const express = require('express');
const validator = require('validator');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { encode } = require('./base62');
const db = require('./db');

const PORT = process.env.PORT;
const BASE_HOST = process.env.BASE_HOST;

const app = express();

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 20, // limit each IP to 20 requests per minute
    message: { error: 'Too many requests, please try again later.' }
}));

app.post('/api/v1/shorten', (req, res) => {
    console.log(`POST request received ${BASE_HOST}`);
    try {
        const { original_url } = req.body;
    if (!original_url) {
        return res.status(400).json({ error: 'Original URL is required' });
    }

    const normalizedURL = original_url.trim();
    if (!validator.isURL(normalizedURL)) {
        return res.status(400).json({ error: 'Invalid URL' });
    }
    const insertedRow = db.insertUrl(normalizedURL);
    const id = insertedRow.lastInsertRowid;

    const code = encode(id);

    db.updateShortCode(code, id);
    console.log(`Short URL: ${BASE_HOST}/${code}`);
    const short_url = `${BASE_HOST}/${code}`;
        res.status(201).json({ short_url: short_url, original_url: normalizedURL });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/:code', (req, res) => {
    try {
        const { code } = req.params;
        const url = db.findByShortCode(code);
        if (!url) {
            return res.status(404).json({ error: 'URL not found' });
        }
        res.redirect(url.original_url);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});