const path = require('path');
const fs = require('fs/promises');
const { createFile, editFile, deleteFile } = require('./backend/services/fileService');
const { processSubmissions } = require('./batchProcessor');
const { fetchAssignmentSubmissions } = require('./backend/services/assignmentFetcher');
const { stripMentionsText } = require("@microsoft/teams.api");
const { App } = require("@microsoft/teams.apps");
const { LocalStorage } = require("@microsoft/teams.common");
const config = require("./config");
const { ManagedIdentityCredential } = require("@azure/identity");
const { handleTeacherCommand } = require("./backend/services/commandRouter");
const { evaluateBatchSubmissions } = require("./backend/services/aiGrader");
const { detectIntent } = require("./backend/services/geminiService");

const storage = new LocalStorage();

const createTokenFactory = () => {
    return async (scope, tenantId) => {
        const managedIdentityCredential = new ManagedIdentityCredential({
            clientId: process.env.CLIENT_ID,
        });
        const scopes = Array.isArray(scope) ? scope : [scope];
        const tokenResponse = await managedIdentityCredential.getToken(scopes, {
            tenantId: tenantId,
        });
        return tokenResponse.token;
    };
};

const tokenCredentials = {
    clientId: process.env.CLIENT_ID || "",
    token: createTokenFactory(),
};

const credentialOptions =
    config.MicrosoftAppType === "UserAssignedMsi" ? { ...tokenCredentials } : undefined;

const app = new App({
    ...credentialOptions,
    storage,
    skipAuth: !process.env.CLIENT_ID,
});

const getConversationState = (conversationId) => {
    let state = storage.get(conversationId);
    if (!state) {
        state = { count: 0 };
        storage.set(conversationId, state);
    }
    return state;
};

function getCreateVendorState(conversationId) {
    return storage.get("create_" + conversationId);
}

function setCreateVendorState(conversationId, data) {
    storage.set("create_" + conversationId, data);
}

function clearCreateVendorState(conversationId) {
    storage.delete("create_" + conversationId);
}

    app.on("message", async (context) => {
    const activity = context.activity;
    let text = stripMentionsText(activity) || "";

    // --- INSTANT TYPO CORRECTION ---
    // Fixes common spelling mistakes before the router processes them
    text = text
        .replace(/\b(crate|cretae|creat|make)\b/ig, "create")
        .replace(/\b(grad|garde|score)\b/ig, "grade")
        .replace(/\b(fetech|feth|fech|pull)\b/ig, "fetch")
        .replace(/\b(delet|delte|remove)\b/ig, "delete")
        .replace(/\b(keyword:|keyword)\b/ig, "keywords:");

    const lowerText = text.toLowerCase();

    // 1. Intercept Teacher Commands First
    try {
        if (lowerText.startsWith("fetch assignment") ||
            lowerText.startsWith("grade keywords:") ||
            lowerText.startsWith("create file") ||
            lowerText.startsWith("edit file") ||
            lowerText.startsWith("delete file")) {
            
            if (lowerText.startsWith("grade keywords:")) {
                await context.send("Analyzing submissions and generating feedback. Please wait a moment...");
            }

            const result = await handleTeacherCommand(text);

            if (result && result.action === "GRADE_BATCH") {
                const evaluationReport = await evaluateBatchSubmissions(result);
                await context.send(evaluationReport);
            } else {
                await context.send(typeof result === "string" ? result : JSON.stringify(result));
            }
            return;
        }
    } catch (err) {
        console.error("Error processing teacher command:", err);
        await context.send(`An error occurred: ${err.message}`);
        return;
    }

    // 2. Existing Vendor Management Logic
    const greetings = [
        "hi", "hii", "hiii", "hello", "hey", "heyy", "heyyy",
        "good morning", "good afternoon", "good evening", "how are you"
    ];

    if (greetings.includes(lowerText)) {
        await context.send(`Hello! 👋\nI'm your Assistant.\nI can help you with:\n- Create Vendor\n- Search Vendor\n- Grade assignments\nHow can I help you today?`);
        return;
    }

    const createState = getCreateVendorState(activity.conversation.id);
    if (createState) {
        if (createState && createState.step === "vendorName") {
            createState.vendorName = text;
            createState.step = "email";
            setCreateVendorState(activity.conversation.id, createState);
            await context.send("Please enter the email address.");
            return;
        }
        if (createState.step === "email") {
            createState.email = text;
            createState.step = "phone";
            setCreateVendorState(activity.conversation.id, createState);
            await context.send("Please enter the phone number.");
            return;
        }
        if (createState.step === "phone") {
            createState.phone = text;
            createState.step = "gst";
            setCreateVendorState(activity.conversation.id, createState);
            await context.send("Please enter the GST number.");
            return;
        }
        if (createState.step === "gst") {
            createState.gst = text;
            createState.step = "address";
            setCreateVendorState(activity.conversation.id, createState);
            await context.send("Please enter the address.");
            return;
        }
        if (createState.step === "address") {
            createState.address = text;
            try {
                await fetch("http://localhost:3000/api/vendors", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        vendorName: createState.vendorName,
                        email: createState.email,
                        phone: createState.phone,
                        gst: createState.gst,
                        address: createState.address
                    })
                });
                clearCreateVendorState(activity.conversation.id);
                await context.send(`✅ Vendor Created Successfully\nName : ${createState.vendorName}\nEmail : ${createState.email}\nPhone : ${createState.phone}\nGST : ${createState.gst}\nAddress : ${createState.address}`);
            } catch (err) {
                console.error("Error creating vendor:", err);
                await context.send("Failed to create vendor.");
            }
            return;
        }
    }

    try {
        const aiResult = await detectIntent(text);
        console.log("AI Result:", aiResult);

        if (aiResult.intent === "create_vendor") {
            let vendorName = aiResult.vendorName || aiResult.entities?.vendorName;
            if (!vendorName) {
                setCreateVendorState(activity.conversation.id, { step: "vendorName" });
                await context.send("Sure! What is the vendor name?");
                return;
            }
            setCreateVendorState(activity.conversation.id, { vendorName, step: "email" });
            await context.send(`Let's create vendor "${vendorName}".\nPlease enter the email address.`);
            return;
        }

        switch (aiResult.intent) {
            case "fetch_assignment":
                const heading = aiResult.heading || "General Assignment";
                const fetchRes = await fetchAssignmentSubmissions(heading);
                await context.send(`✅ Successfully connected to Teams Classroom.\nFetched ${fetchRes.count} submissions for "${fetchRes.heading}".\nStudents downloaded: ${fetchRes.files.join(', ')}\n\nReady for grading.`);
                break;

            case "grade_batch":
                const keywords = aiResult.keywords || [];
                if (keywords.length === 0) {
                    await context.send("I understand you want to grade, but I couldn't detect any keywords. Please specify them.");
                    break;
                }
                await context.send(`Analyzing submissions against keywords: ${keywords.join(', ')}. Please wait a moment...`);
                
                const folder = path.join(__dirname, 'submissions');
                const batchResults = await processSubmissions(folder, keywords);
                
                // AI Grading Call
                const evaluationReport = await evaluateBatchSubmissions({ keywords, submissions: batchResults });
                await context.send(evaluationReport);
                
                // Instant Cleanup
                try { await fs.rm(folder, { recursive: true, force: true }); } catch (e) {}
                break;

            case "create_file":
                const createMsg = await createFile(path.join(__dirname, aiResult.fileName), aiResult.content || "");
                await context.send(createMsg);
                break;

            case "edit_file":
                const editMsg = await editFile(path.join(__dirname, aiResult.fileName), aiResult.content || "");
                await context.send(editMsg);
                break;

            case "delete_file":
                const delMsg = await deleteFile(path.join(__dirname, aiResult.fileName));
                await context.send(delMsg);
                break;
            case "greeting":
                await context.send(`Hello 👋\nI'm your Assistant.\nI can help you with:\n- Create Vendor\n- Search Vendor\n- Grade assignments\nWhat would you like to do?`);
                break;
            case "search_vendor":
                if (!aiResult.vendorName) {
                    await context.send("Which vendor would you like to search?");
                    return;
                }
                try {
                    const response = await fetch(`http://localhost:3000/api/vendors/${aiResult.vendorName}`);
                    const result = await response.json();
                    if (!result.success) {
                        await context.send("Vendor not found.");
                        break;
                    }
                    const vendor = result.data;
                    await context.send(`✅ Vendor Found\nName : ${vendor.vendorName}\nEmail : ${vendor.email}\nPhone : ${vendor.phone}\nGST : ${vendor.gst}\nAddress : ${vendor.address}`);
                } catch (err) {
                    console.error(err);
                    await context.send("Search failed.");
                }
                break;
            case "help":
                await context.send(`I can help you with\n- Create Vendor\n- Search Vendor\n- Grade assignments`);
                break;
            default:
                await context.send("Sorry, I didn't understand that.");
        }
    } catch (err) {
        console.error(err);
        await context.send("AI Processing Error");
        return;
    }

    const state = getConversationState(activity.conversation.id);
    state.count++;

    try {
        const response = await fetch("http://localhost:3000/api/queries", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ message: text })
        });
        const result = await response.json();
        console.log("Query logged:", result);
    } catch (err) {
        console.error("Error logging query:", err);
    }
});

module.exports = app;