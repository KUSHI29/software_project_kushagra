const path = require('path');
const { createFile, editFile, deleteFile } = require('./fileService');
const { processSubmissions } = require('../../batchProcessor');
const { fetchAssignmentSubmissions } = require('./assignmentFetcher'); // Imported mock fetcher

async function handleTeacherCommand(rawText) {
    const text = rawText.trim();

    // Command: "fetch assignment <Title> [count]"
    if (text.toLowerCase().startsWith('fetch assignment')) {
        const rawParam = text.substring('fetch assignment'.length).trim();
        if (!rawParam) {
            return "Please specify the assignment heading. Example:\n- fetch assignment AWS Cloud Architecture\n- fetch assignment AWS Cloud Architecture 60";
        }

        // Check if the last word is a number (e.g. 5, 20, 60)
        const parts = rawParam.split(/\s+/);
        let count = 5;
        let title = rawParam;

        const maybeCount = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(maybeCount) && maybeCount > 0) {
            count = maybeCount;
            title = parts.slice(0, -1).join(' ');
        }

        const result = await fetchAssignmentSubmissions(title, count);
        return `✅ Successfully connected to Teams Classroom.\nFetched ${result.count} submissions for "${result.title}".\nStudents downloaded: ${result.files.slice(0, 5).join(', ')}${result.count > 5 ? ` and ${result.count - 5} more...` : ''}\n\nReady for grading.`;
    }

    // 2. Grading command: "grade keywords: word1, word2, word3"
    if (text.toLowerCase().startsWith('grade keywords:')) {
        const keywordsPart = text.split(/keywords:\s*/i)[1];
        if (!keywordsPart) return "Please specify keywords. Example: grade keywords: aws, cloud, agentic";

        const keywords = keywordsPart.split(',').map(k => k.trim()).filter(Boolean);
        const folder = path.join(__dirname, '../../submissions');
        
        // Process the files
        const batchResults = await processSubmissions(folder, keywords);

        // INSTANT CLEANUP: Delete the files from the server immediately after reading
        const fs = require('fs/promises');
        try {
            await fs.rm(folder, { recursive: true, force: true });
        } catch (err) {
            console.error("Cleanup error:", err);
        }

        return {
            action: 'GRADE_BATCH',
            keywords,
            submissions: batchResults
        };
    }

    // 3. Create file command: "create file <name> content: <text>"
    if (text.toLowerCase().startsWith('create file')) {
        const match = text.match(/create file\s+([^\s]+)\s+content:\s*(.*)/i);
        if (!match) return "Format: create file <filename> content: <your content>";
        const [_, fileName, content] = match;
        const targetPath = path.join(__dirname, '../../', fileName);
        return await createFile(targetPath, content);
    }

    // 4. Edit / Append file command: "edit file <name> content: <text>"
    if (text.toLowerCase().startsWith('edit file')) {
        const match = text.match(/edit file\s+([^\s]+)\s+content:\s*(.*)/i);
        if (!match) return "Format: edit file <filename> content: <your content to append>";
        const [_, fileName, content] = match;
        const targetPath = path.join(__dirname, '../../', fileName);
        return await editFile(targetPath, content);
    }

    // 5. Delete file command: "delete file <name>"
    if (text.toLowerCase().startsWith('delete file')) {
        const match = text.match(/delete file\s+([^\s]+)/i);
        if (!match) return "Format: delete file <filename>";
        const targetPath = path.join(__dirname, '../../', match[1]);
        return await deleteFile(targetPath);
    }

    // Fallback help menu
    return (
        "Commands supported:\n" +
        "1. fetch assignment <Heading>\n" +
        "2. grade keywords: kw1, kw2, kw3\n" +
        "3. create file <filename> content: <text>\n" +
        "4. edit file <filename> content: <text>\n" +
        "5. delete file <filename>"
    );
}

module.exports = { handleTeacherCommand };