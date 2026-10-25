const fs = require('fs/promises');
const path = require('path');

/**
 * Creates or overwrites a file with given content.
 */
async function createFile(filePath, content) {
    try {
        await fs.writeFile(filePath, content, 'utf8');
        return `Successfully created ${filePath}`;
    } catch (err) {
        return `Failed to create file: ${err.message}`;
    }
}

/**
 * Appends content to an existing file.
 */
async function editFile(filePath, contentToAppend) {
    try {
        await fs.appendFile(filePath, `\n${contentToAppend}`, 'utf8');
        return `Successfully updated ${filePath}`;
    } catch (err) {
        return `Failed to edit file: ${err.message}`;
    }
}

/**
 * Deletes a file.
 */
async function deleteFile(filePath) {
    try {
        await fs.unlink(filePath);
        return `Successfully deleted ${filePath}`;
    } catch (err) {
        return `Failed to delete file: ${err.message}`;
    }
}

module.exports = { createFile, editFile, deleteFile };