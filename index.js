const express = require('express');
const jsondiffpatch = require('jsondiffpatch');

const app = express();
app.use(express.json());

app.post('/diff', (req, res) => {
    const { json1, json2 } = req.body;

    // Ensure both json1 and json2 are provided and are arrays
    if (!Array.isArray(json1) || !Array.isArray(json2)) {
        return res.status(400).json({ error: 'Both json1 and json2 should be arrays.' });
    }

    try {
        // Compare JSON arrays
        const diff = jsondiffpatch.diff(json1, json2);

        // Return the diff
        res.json(diff);
    } catch (error) {
        res.status(500).json({ error: 'Error processing the diff. Ensure both JSON objects are valid.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
