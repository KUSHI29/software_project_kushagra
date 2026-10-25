const fs = require('fs/promises');
const path = require('path');

// Pool of 60 realistic student names
const firstNames = ["Aarav", "Priya", "Rahul", "Sneha", "Vikram", "Ananya", "Rohan", "Ishaan", "Pooja", "Aditya", "Neha", "Kunal"];
const lastNames = ["Sharma", "Patel", "Verma", "Reddy", "Singh", "Gupta", "Nair", "Mehta", "Chopra", "Das"];

function generateStudentNames(count) {
    const list = [];
    for (let i = 0; i < count; i++) {
        const fn = firstNames[i % firstNames.length];
        const ln = lastNames[Math.floor(i / firstNames.length) % lastNames.length];
        list.push(`${fn}_${ln}_${String(i + 1).padStart(2, '0')}`);
    }
    return list;
}

// Generate contextual assignment text based on the assignment title
function generateSubmissionBody(topic, index) {
    const tier = index % 4;
    switch (tier) {
        case 0:
            // Excellent submission: uses cloud/aws/agentic concepts meaningfully
            return `In this paper on ${topic}, we implement an agentic framework hosted on AWS cloud infrastructure. The system leverages cloud-native microservices and autonomous agent pipelines to optimize distributed workloads dynamically.`;
        case 1:
            // Average submission: mentions cloud concepts briefly
            return `This assignment reviews the fundamental principles of ${topic}. Cloud deployment strategies were analyzed alongside basic AWS storage options, though agentic automation requires further testing.`;
        case 2:
            // Weak/Off-topic submission
            return `This project investigates relational database query optimization and standard disk storage structures. We evaluated B-tree indexes and benchmarked local execution speed without remote service integration.`;
        case 3:
            // Partial submission
            return `Our solution for ${topic} relies primarily on on-premise virtual machines and static load balancers. While we investigated AWS documentation, current deployment is handled locally without cloud services.`;
    }
}

/**
 * Fetches student submissions for any given assignment title.
 * @param {string} assignmentTitle - The heading/name of the assignment.
 * @param {number} studentCount - Number of student files to generate (default: 5).
 */
async function fetchAssignmentSubmissions(assignmentTitle, studentCount = 5) {
    const submissionsDir = path.join(__dirname, '../../submissions');

    // Clear previous batch to ensure fresh grading run
    try {
        await fs.rm(submissionsDir, { recursive: true, force: true });
    } catch (_) {}
    await fs.mkdir(submissionsDir, { recursive: true });

    const studentNames = generateStudentNames(studentCount);
    const fetchedFiles = [];

    for (let i = 0; i < studentNames.length; i++) {
        const student = studentNames[i];
        const fileName = `${student}.txt`;
        const filePath = path.join(submissionsDir, fileName);

        const content = `Assignment: ${assignmentTitle}\nStudent: ${student}\n\n${generateSubmissionBody(assignmentTitle, i)}`;
        await fs.writeFile(filePath, content, 'utf8');
        fetchedFiles.push(fileName);
    }

    return {
        title: assignmentTitle,
        count: fetchedFiles.length,
        files: fetchedFiles
    };
}

module.exports = { fetchAssignmentSubmissions };