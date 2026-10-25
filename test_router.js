const { handleTeacherCommand } = require('./backend/services/commandRouter');

(async () => {
    console.log("--- Testing Unknown Command ---");
    console.log(await handleTeacherCommand("hello bot"));

    console.log("\n--- Testing File Creation Command ---");
    console.log(await handleTeacherCommand("create file sample_run.txt content: testing command router"));

    console.log("\n--- Testing Batch Grading Command ---");
    const gradingPlan = await handleTeacherCommand("grade keywords: aws, cloud, agentic");
    console.log(JSON.stringify(gradingPlan, null, 2));

    console.log("\n--- Testing File Deletion Command ---");
    console.log(await handleTeacherCommand("delete file sample_run.txt"));
})();