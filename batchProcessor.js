const fs = require('fs/promises');
const path = require('path');

async function processSubmissions(folderPath, keywords) {
    const files = await fs.readdir(folderPath);
    const textFiles = files.filter(f => f.endsWith('.txt'));
    const batchResults = [];

    for (const file of textFiles) {
        const filePath = path.join(folderPath, file);
        const text = await fs.readFile(filePath, 'utf8');

        let totalCount = 0;
        let breakdown = {};

        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
            const matches = text.match(regex);
            const count = matches ? matches.length : 0;
            breakdown[keyword] = count;
            totalCount += count;
        });

        batchResults.push({
            fileName: file,
            totalCount,
            breakdown,
            text
        });
    }

    return batchResults;
}

(async () => {
    const results = await processSubmissions('./submissions', ['aws', 'cloud', 'agentic']);
    console.log("Processed Submissions:", JSON.stringify(results, null, 2));
})();
module.exports = { processSubmissions };