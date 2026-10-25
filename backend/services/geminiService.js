const { Ollama } = require('ollama');

const ollama = new Ollama({ host: 'http://127.0.0.1:11434' });

/**
 * Sends prompt to local Ollama llama3.1
 */
async function callLocalLLM(prompt) {
    try {
        const response = await ollama.generate({
            model: 'llama3.2',
            prompt: prompt,
            stream: false
        });
        return response.response.trim();
    } catch (err) {
        console.error("Ollama connection error:", err.message);
        return `Error: Could not communicate with local LLM (${err.message})`;
    }
}

/**
 * Fallback intent detection using the local LLM
 */
async function detectIntent(text) {
    // Inside your detectIntent function in geminiService.js
const prompt = `
Analyze the user's message and determine their intent. 
Output ONLY a valid JSON object. Do not include markdown formatting, markdown blocks, or extra text.

Possible intents:
1. "fetch_assignment": User wants to fetch, pull, or download assignments. (Extract 'heading')
2. "grade_batch": User wants to grade files or check keywords. (Extract 'keywords' as an array of strings)
3. "create_file": User wants to create or make a new file. (Extract 'fileName' and 'content')
4. "edit_file": User wants to edit, update, or append to a file. (Extract 'fileName' and 'content')
5. "delete_file": User wants to delete or remove a file. (Extract 'fileName')
6. "create_vendor": User wants to create a vendor. (Extract 'vendorName')
7. "search_vendor": User wants to find a vendor. (Extract 'vendorName')
8. "greeting" / "help" / "unknown"

User Message: "${text}"

JSON Format Example:
{
  "intent": "grade_batch",
  "keywords": ["aws", "cloud", "agentic"],
  "fileName": null,
  "content": null,
  "heading": null
}
`;

    try {
        const raw = await callLocalLLM(prompt);
        // Clean any code block backticks if Ollama wraps JSON in ```json ... ```
        const jsonStr = raw.replace(/```json|```/g, '').trim();
        return JSON.parse(jsonStr);
    } catch {
        return { intent: "help" };
    }
}

module.exports = { callLocalLLM, detectIntent };