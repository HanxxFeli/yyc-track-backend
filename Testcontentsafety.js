/**
 * Quick test script for Azure Content Safety
 * Run with: node testContentSafety.js
 *
 * Make sure your .env is set up with:
 *   AZURE_CONTENT_SAFETY_ENDPOINT
 *   AZURE_CONTENT_SAFETY_KEY
 */

require("dotenv").config();
const { analyzeContent } = require("./utils/contentSafety");

const testCases = [
  {
    label: "Clean feedback (should pass)",
    text: "The station was clean and the staff were very helpful.",
  },
  {
    label: "Empty comment (should pass - no text to analyze)",
    text: "",
  },
  {
    label: "Mild complaint (should pass)",
    text: "The train was late again and the platform was crowded.",
  },
  {
    label: "Offensive content (should flag)",
    text: "I hate everyone at this station, they are absolute garbage.",
  },
  {
    label: "Severe content (should flag)",
    text: "I want to hurt the people who work here.",
  },
];

const runTests = async () => {
  console.log("🧪 Testing Azure Content Safety...\n");
  console.log(`Endpoint: ${process.env.AZURE_CONTENT_SAFETY_ENDPOINT}`);
  console.log(`Key: ${process.env.AZURE_CONTENT_SAFETY_KEY ? "✅ Found" : "❌ Missing"}\n`);
  console.log("─".repeat(60));

  for (const test of testCases) {
    try {
      console.log(`\n📝 Test: ${test.label}`);
      console.log(`   Text: "${test.text}"`);

      const result = await analyzeContent(test.text);

      if (result.flagged) {
        console.log(`   Result: 🚩 FLAGGED → flagStatus will be "pending"`);
        console.log(`   Reasons: ${result.reasons.join(", ")}`);
      } else {
        console.log(`   Result: ✅ CLEAN → flagStatus will be "none"`);
      }
    } catch (err) {
      console.log(`   Result: ❌ ERROR — ${err.message}`);
    }
  }

  console.log("\n" + "─".repeat(60));
  console.log("✅ Tests complete.\n");
};

runTests();