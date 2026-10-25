const path = require('path');
const { createFile, editFile, deleteFile } = require('./backend/services/fileService');

(async () => {
    const testPath = path.join(__dirname, 'test_doc.txt');

    console.log(await createFile(testPath, 'Initial line of text.'));
    console.log(await editFile(testPath, 'Second line appended by bot.'));
    console.log(await deleteFile(testPath));
})();