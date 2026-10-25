const fs = require('fs/promises');

async function analyzeKeywordFrequency(filePath, keywords) {
    try {
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

        return { totalCount, breakdown, text };
    } catch (err) {
        console.error("Error reading file:", err.message);
    }
}

(async () => {
    const res = await analyzeKeywordFrequency('./sample_assignment.txt', ['aws', 'cloud', 'agentic']);
    console.log("Analysis Result:", res);
})();