const { detectIntent } = require("./services/geminiService");

async function test() {

    const result = await detectIntent("Find vendor Dell");

    console.log(result);

}

test();