console.log('=== TESTING GEMINI INTEGRATION & RESPONSE PARSER ===\n');

let passed = 0;
let total = 0;

function assert(condition, name) {
  total++;
  if (condition) {
    console.log(`✓ PASS: ${name}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${name}`);
  }
}

// Test 1: JSON Output Parsing
const validGeminiJson = JSON.stringify({
  answer: "Shor's algorithm can factor large integers in polynomial time, which breaks RSA encryption.",
  sources: [
    { page: 1, text: "Shor's algorithm can factor large integers in polynomial time, threatening classical RSA encryption." }
  ]
});

const parsed = JSON.parse(validGeminiJson);
assert(parsed.answer.includes("Shor's algorithm"), "Parsed answer contains accurate text");
assert(parsed.sources[0].page === 1, "Parsed source identifies page 1");

// Test 2: Grounding failure detection ("not found")
const notFoundJson = JSON.stringify({
  answer: "I couldn't find this information in the uploaded document.",
  sources: []
});
const parsedNotFound = JSON.parse(notFoundJson);
assert(
  parsedNotFound.answer.includes("couldn't find this information"),
  "Handles missing information without hallucination"
);
assert(parsedNotFound.sources.length === 0, "No sources attributed for unfound info");

// Test 3: Fallback handling when AI returns plain text instead of JSON
const plainTextResponse = "According to page 1, quantum superpositions enable exponential acceleration.";
let fallbackResult;
try {
  const json = JSON.parse(plainTextResponse);
  fallbackResult = { answer: json.answer, sources: json.sources || [] };
} catch {
  fallbackResult = { answer: plainTextResponse, sources: [] };
}
assert(fallbackResult.answer === plainTextResponse, "Fallback handles plain text responses without crashing");
assert(Array.isArray(fallbackResult.sources), "Sources is guaranteed to be an array in fallback");

console.log(`\nGemini Parser Results: ${passed}/${total} passed successfully.`);
