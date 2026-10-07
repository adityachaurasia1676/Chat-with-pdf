import fs from 'fs';
import { validatePdfFile } from '../lib/pdf.js';
import { chunkDocumentPages, retrieveRelevantChunks } from '../lib/retrieval.js';

console.log('=== RUNNING AUTOMATED UNIT & INTEGRATION TESTS ===\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName) {
  totalTests++;
  if (condition) {
    console.log(`✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`✗ FAIL: ${testName}`);
  }
}

// TEST 5: Upload an invalid file - Verify proper validation
console.log('--- Testing File Validation (TEST 5) ---');
const nullValidation = validatePdfFile(null);
assert(!nullValidation.valid && nullValidation.error.includes('No file provided'), 'Null file rejected');

const fakeTxtFile = { name: 'notes.txt', type: 'text/plain', size: 1024 };
const txtValidation = validatePdfFile(fakeTxtFile);
assert(!txtValidation.valid && txtValidation.error.includes('Invalid file format'), 'Non-PDF file rejected');

const emptyFile = { name: 'empty.pdf', type: 'application/pdf', size: 0 };
const emptyValidation = validatePdfFile(emptyFile);
assert(!emptyValidation.valid && emptyValidation.error.includes('empty'), '0-byte PDF rejected');

const hugeFile = { name: 'huge.pdf', type: 'application/pdf', size: 30 * 1024 * 1024 };
const hugeValidation = validatePdfFile(hugeFile);
assert(!hugeValidation.valid && hugeValidation.error.includes('File is too large'), 'Over 25MB file rejected');

const validFile = { name: 'report.pdf', type: 'application/pdf', size: 50000 };
const validValidation = validatePdfFile(validFile);
assert(validValidation.valid, 'Valid PDF accepted');

// TEST 6: Document Chunking and Retrieval
console.log('\n--- Testing Chunking & Context Retrieval (TEST 6 & Grounding) ---');
const samplePages = [
  {
    pageNumber: 1,
    text: 'Quantum computing utilizes qubits that can exist in quantum superpositions. Shor algorithm can factor large integers in polynomial time, threatening classical RSA encryption. Grover algorithm provides quadratic speedup for searching unstructured databases.',
  },
  {
    pageNumber: 2,
    text: 'Mitigation Strategies: To counter quantum threats, NIST standardized post-quantum cryptography algorithms. Primary lattice-based standards include ML-KEM for key encapsulation and ML-DSA for digital signatures. Migration is recommended before the year 2030.',
  },
];

const chunks = chunkDocumentPages(samplePages);
assert(chunks.length === 2, 'Pages chunked properly (2 chunks)');
assert(chunks[0].pageNumber === 1 && chunks[1].pageNumber === 2, 'Page attribution preserved in chunks');

// Query 1: Specific question
const retrievedRSA = retrieveRelevantChunks(chunks, "What does Shor's algorithm threaten?");
assert(retrievedRSA.length > 0 && retrievedRSA[0].pageNumber === 1, 'Specific query retrieved page 1 for Shor algorithm');

// Query 2: Specific question for page 2
const retrievedNIST = retrieveRelevantChunks(chunks, 'What did NIST standardize for digital signatures?');
assert(retrievedNIST.length > 0 && retrievedNIST.some(c => c.pageNumber === 2), 'Specific query retrieved page 2 for NIST standards');

// Query 3: Broad summary question
const retrievedSummary = retrieveRelevantChunks(chunks, 'Summarize this document.');
assert(retrievedSummary.length >= 2, 'Summary query retrieved both pages for comprehensive coverage');

console.log(`\nResults: ${passedTests}/${totalTests} tests passed successfully.`);
if (passedTests !== totalTests) {
  process.exit(1);
}
