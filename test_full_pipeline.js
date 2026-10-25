const { handleTeacherCommand } = require('./backend/services/commandRouter');
const { evaluateBatchSubmissions } = require('./backend/services/aiGrader');

(async () => {
    console.log("1. Simulating teacher message...");
    const command = "grade keywords: aws, cloud, agentic";
    const parsed = await handleTeacherCommand(command);

    if (parsed.action === 'GRADE_BATCH') {
        console.log("2. Running local LLM evaluation across batch...");
        const output = await evaluateBatchSubmissions(parsed);
        console.log("\n--- Final Chatbot Response ---\n");
        console.log(output);
    } else {
        console.log("Response:", parsed);
    }
})();