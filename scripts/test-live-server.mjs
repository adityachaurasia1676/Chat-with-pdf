console.log('=== TESTING LIVE NEXT.JS SERVER & API ENDPOINTS ===\n');

let passed = 0;
let failed = 0;

function assert(condition, name) {
  if (condition) {
    console.log(`✓ PASS: ${name}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${name}`);
    failed++;
  }
}

async function run() {
  // Test 1: Home Page GET
  try {
    const resHome = await fetch('http://localhost:3000/');
    const textHome = await resHome.text();
    assert(resHome.status === 200, 'Home page returns HTTP 200');
    assert(textHome.includes('Chat with Your') && textHome.includes('PDF'), 'Home page contains title');
  } catch (err) {
    assert(false, `Home page request failed: ${err.message}`);
  }

  // Test 2: Chat Page GET
  try {
    const resChat = await fetch('http://localhost:3000/chat');
    const textChat = await resChat.text();
    assert(resChat.status === 200, 'Chat page returns HTTP 200');
  } catch (err) {
    assert(false, `Chat page request failed: ${err.message}`);
  }

  // Test 3: Static PDF Worker GET
  try {
    const resWorker = await fetch('http://localhost:3000/pdf.worker.min.mjs');
    assert(resWorker.status === 200, 'PDF worker script served correctly');
  } catch (err) {
    assert(false, `PDF worker fetch failed: ${err.message}`);
  }

  // Test 4: Sample Document GET
  try {
    const resPdf = await fetch('http://localhost:3000/sample-document.pdf');
    const buffer = await resPdf.arrayBuffer();
    assert(resPdf.status === 200 && buffer.byteLength > 500, 'Sample PDF served with valid bytes');
  } catch (err) {
    assert(false, `Sample PDF fetch failed: ${err.message}`);
  }

  // Test 5: API validation - empty question
  try {
    const resApiEmpty = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: '', chunks: [{ id: '1', pageNumber: 1, text: 'hi' }] }),
    });
    const jsonEmpty = await resApiEmpty.json();
    assert(resApiEmpty.status === 400 && jsonEmpty.error.includes('empty question'), 'API rejects empty question with 400');
  } catch (err) {
    assert(false, `Empty question test failed: ${err.message}`);
  }

  // Test 6: API validation - missing chunks/context
  try {
    const resApiNoChunks = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: 'What is this?', chunks: [] }),
    });
    const jsonNoChunks = await resApiNoChunks.json();
    assert(resApiNoChunks.status === 400 && jsonNoChunks.error.includes('context was provided'), 'API rejects missing context with 400');
  } catch (err) {
    assert(false, `Missing chunks test failed: ${err.message}`);
  }

  // Test 7: API failure when GEMINI_API_KEY is not provided (TEST 7)
  try {
    const resApiKeyMissing = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: 'Summarize the document.',
        chunks: [{ id: 'p1', pageNumber: 1, text: 'Quantum computers use qubits.' }],
      }),
    });
    const jsonKey = await resApiKeyMissing.json();
    assert(
      resApiKeyMissing.status === 500 && jsonKey.error.includes('GEMINI_API_KEY is not configured'),
      'API gracefully catches missing GEMINI_API_KEY with descriptive error message'
    );
  } catch (err) {
    assert(false, `API key missing test failed: ${err.message}`);
  }

  console.log(`\nLive Server Test Summary: ${passed} passed, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

run();
