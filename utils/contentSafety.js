const ContentSafetyClient= require("@azure-rest/ai-content-safety").default
const {AzureKeyCredential}= require("@azure/core-auth")

const client= ContentSafetyClient(
    process.env.AZURE_CONTENT_SAFETY_ENDPOINT,
    new AzureKeyCredential(process.env.AZURE_CONTENT_SAFETY_KEY)
);

/**
 * Analyzes text using Azure Content Safety.
 *
 * Returns:
 *   { flagged: false }                → content is clean  → flagStatus = "none"
 *   { flagged: true, reasons: [...] } → hit threshold     → flagStatus = "pending"
 *
 * Threshold: severity >= 2 in ANY category triggers a flag.
 * Categories: Hate, Violence, Sexual, SelfHarm
 *
 * Azure severity scale: 0 = safe, 2 = low, 4 = medium, 6 = high
 * We use >= 2 because this is a public civic app — even low severity
 * content should be reviewed before appearing publicly.
 *
 * Fail open policy: if Azure is unreachable, let the feedback through
 * and log the error. Don't block users because of a third-party outage.
 */
const SEVERITY_THRESHOLD= 2;

const analyzeContent= async(text)=>{
    // No comment provided — nothing to analyze, pass through
    if (!text || text.trim() === "") {
        return { flagged: false };
    }

    const response= await client.path("/text:analyze").post({
        body:{
            text,
            categories: ["Hate", "Violence", "Sexual", "SelfHarm"],
            outputType: "FourSeverityLevels"
        }
    })
    
    if (response.status !== "200") {
        console.error("Azure Content Safety error:", response.body);
        return { flagged: false }; // fail open
    }

    const flaggedCategories = response.body.categoriesAnalysis
        .filter((r) => r.severity >= SEVERITY_THRESHOLD)
        .map((r) => r.category);
 
    if (flaggedCategories.length > 0) {
        return { flagged: true, reasons: flaggedCategories };
    }
 
    return { flagged: false };

};
module.exports = { analyzeContent };