import fs from 'fs';

// Construct valid PDF text stream
const stream1 = `BT
/F1 18 Tf
50 720 Td
(Quantum Computing and Cryptography - Page 1) Tj
/F1 12 Tf
0 -40 Td
(Executive Summary: Quantum computing utilizes qubits that can exist in quantum superpositions.) Tj
0 -25 Td
(This computational paradigm enables exponential acceleration for specific mathematical problems.) Tj
0 -25 Td
(Shor's algorithm can factor large integers in polynomial time, threatening classical RSA encryption.) Tj
0 -25 Td
(Grover's algorithm provides quadratic speedup for searching unstructured databases.) Tj
ET`;

const stream2 = `BT
/F1 18 Tf
50 720 Td
(Post-Quantum Cryptography and Standards - Page 2) Tj
/F1 12 Tf
0 -40 Td
(Mitigation Strategies: To counter quantum threats, NIST standardized post-quantum cryptography algorithms.) Tj
0 -25 Td
(Primary lattice-based standards include ML-KEM for key encapsulation and ML-DSA for digital signatures.) Tj
0 -25 Td
(Organizations are strongly advised to begin cryptographic inventory audits immediately.) Tj
0 -25 Td
(Conclusion: Full migration to post-quantum cryptographic security is recommended before the year 2030.) Tj
ET`;

const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>\nendobj\n';
const obj3 = '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /Font << /F1 7 0 R >> >> >>\nendobj\n';
const obj4 = '4 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 6 0 R /Resources << /Font << /F1 7 0 R >> >> >>\nendobj\n';
const obj5 = `5 0 obj\n<< /Length ${Buffer.byteLength(stream1)} >>\nstream\n${stream1}\nendstream\nendobj\n`;
const obj6 = `6 0 obj\n<< /Length ${Buffer.byteLength(stream2)} >>\nstream\n${stream2}\nendstream\nendobj\n`;
const obj7 = '7 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n';

const header = '%PDF-1.4\n';

let offset = Buffer.byteLength(header);
const offsets = [0];

const objects = [obj1, obj2, obj3, obj4, obj5, obj6, obj7];
for (const obj of objects) {
  offsets.push(offset);
  offset += Buffer.byteLength(obj);
}

let xref = `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
for (let i = 1; i < offsets.length; i++) {
  xref += offsets[i].toString().padStart(10, '0') + ' 00000 n \n';
}

const trailer = `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${offset}\n%%EOF\n`;

const pdfBuffer = Buffer.concat([
  Buffer.from(header),
  ...objects.map((o) => Buffer.from(o)),
  Buffer.from(xref),
  Buffer.from(trailer),
]);

fs.writeFileSync('public/sample-document.pdf', pdfBuffer);
console.log('Sample PDF successfully created at public/sample-document.pdf');
