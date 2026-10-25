const { callLocalLLM } = require('./geminiService');

async function evaluateBatchSubmissions(gradingPlan) {
    const { keywords, submissions } = gradingPlan;
    const finalReport = [];

    for (const sub of submissions) {
        const keywordSummary = Object.entries(sub.breakdown)
            .map(([word, count]) => `${word}: ${count}`)
            .join(', ');

        const prompt = `
You are an academic grading assistant. Evaluate the following student assignment.

Keyword Requirements: ${keywords.join(', ')}
Keyword Counts Found: ${keywordSummary}
Total Target Keywords: ${sub.totalCount}

Assignment Text:
"""
${sub.text}
"""

Instructions:
1. Provide a concise 2-sentence feedback explaining how effectively the student incorporated the required concepts.
2. Provide a score out of 10.
- Use a lenient baseline average of ~6/10.
- Award 7-10 if keywords are integrated meaningfully in proper context.
- Assign 1-5 only if required concepts are largely omitted or irrelevant.

Output strictly in this format:
Feedback: <your 2-sentence evaluation>
Score: <number>/10
`;

        const evaluation = await callLocalLLM(prompt);
        finalReport.push(`### File: ${sub.fileName}\n${evaluation}\n`);
    }

    return finalReport.join('\n---\n\n');
}

module.exports = { evaluateBatchSubmissions };