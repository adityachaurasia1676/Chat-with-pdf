# Chat with Your PDF 📄✨

A modern, production-ready document question-answering web application built with **Next.js**, **React**, **Tailwind CSS**, and the **Google Gemini API**.

Upload any PDF document—academic papers, legal contracts, technical manuals, or reports—and chat interactively with an AI assistant. Every answer is strictly grounded in the document text, includes supporting page-number citations, and refuses to hallucinate facts outside the provided document.

---

## 🌟 Key Features

- **Client-Side PDF Processing**: Extracts text page-by-page directly in the user's browser using Mozilla's `pdfjs-dist` engine via web workers. No upload file-size bottlenecks on serverless backends.
- **Strict Document Grounding**: Enforces strict system instructions so the model answers only from the uploaded document. If an answer is not in the text, it transparently responds:
  > *"I couldn't find this information in the uploaded document."*
- **Page-by-Page Source Citations**: AI responses cite the exact page number and text snippets supporting the answer, presented in expandable citation cards.
- **Sliding-Window Chunking & Context Retrieval**: Intelligent sliding-window text chunking and TF-IDF relevance scoring extract the most pertinent sections for the user's question, keeping context concise and token-efficient.
- **Multi-Turn Conversation Memory**: Supports natural follow-up questions while maintaining document-grounded boundaries.
- **Interactive Suggested Questions**: Instant clickable prompts (`"Summarize this document"`, `"What are the main points?"`, etc.) generated right after upload.
- **1-Click Sample Document**: Test instantly with a built-in sample document without needing a local PDF file.
- **Zero-Database Persistence**: Uses browser `localStorage` with React 19 `useSyncExternalStore` for seamless, hydration-safe chat persistence and fast loading.
- **Responsive & Accessible UI**: Clean SaaS layout with Tailwind CSS that adapts flawlessly to Desktop, Laptop, Tablet, and Mobile screens.
- **Enterprise-Grade Security**: API keys are isolated exclusively to server-side Next.js route handlers (`/api/chat`) and never exposed to the client.

---

## 🛠️ Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Server-side API routes & optimized static/SSR rendering |
| **Frontend** | React 19 (JavaScript only) | No TypeScript, clean and beginner-friendly |
| **Styling** | Tailwind CSS v4 | Responsive, accessible utility-first design |
| **AI Model** | Google Gemini API | `gemini-2.5-flash` with automatic `gemini-1.5-flash` fallback |
| **PDF Extraction** | Mozilla `pdfjs-dist` | In-browser page-by-page text extraction with web worker |
| **Icons** | Lucide React | Clean, lightweight icon suite |
| **Storage** | Browser LocalStorage | Lightweight persistence for active session |

---

## 🏗️ Architecture Overview

```text
chat-with-pdf/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.js          # Secure server-side Gemini route handler
│   ├── chat/
│   │   └── page.js               # Dedicated chat workspace with document preview
│   ├── globals.css               # Global Tailwind CSS styling
│   ├── layout.js                 # Root HTML layout with fonts and metadata
│   └── page.js                   # Landing page with drag-and-drop PDF uploader
├── components/
│   ├── ChatWindow.js             # Chat message stream and input box
│   ├── DocumentSidebar.js        # File statistics, suggested prompts, actions
│   ├── FileUpload.js             # Drag-and-drop file uploader with progress bar
│   ├── Loading.js                # Animated thinking/typing indicator
│   ├── Message.js                # User/AI message bubble with source citation cards
│   ├── Navbar.js                 # Top header with document status badge
│   └── SuggestedQuestions.js     # Clickable suggestion pills
├── lib/
│   ├── gemini.js                 # Gemini API client with grounding prompts & JSON schema
│   ├── pdf.js                    # PDF parser, validator, and page-by-page text extractor
│   ├── retrieval.js              # Sliding-window chunker & TF-IDF relevance scorer
│   ├── useStorage.js             # React 19 useSyncExternalStore hook for LocalStorage
│   └── utils.js                  # Formatting helpers (bytes, word count, IDs)
├── public/
│   ├── pdf.worker.min.mjs        # Local Mozilla PDF.js worker
│   ├── sample-document.pdf       # 2-page sample PDF for 1-click test
│   └── standard_fonts/           # Standard PDF font glyphs
├── scripts/
│   ├── generate-sample-pdf.mjs   # Script to generate sample PDF binary
│   ├── test-backend.mjs          # Unit tests for validation and chunking
│   ├── test-gemini-formatting.mjs# Integration tests for Gemini JSON parser
│   └── test-live-server.mjs      # Live HTTP endpoint test suite
├── .env.example                  # Environment variable template
├── .gitignore                    # Git ignore file (prevents secret leaks)
├── package.json
└── README.md
```

---

## 🧠 How It Works (College Viva / Presentation Guide)

If you are presenting this project in a viva or technical interview, here is the clear 3-step explanation:

### 1. In-Browser Text Extraction (`lib/pdf.js`)
When a user uploads a PDF, the file is read as an `ArrayBuffer` and processed by Mozilla's `pdfjs-dist` inside a Web Worker. The engine iterates through every page and extracts text strings with their corresponding page number.
- **Advantage**: Zero server upload limits (works even for 25MB documents on serverless hosts like Vercel with strict 4.5MB limits) and gives real-time percentage progress.

### 2. Sliding-Window Chunking & TF-IDF Retrieval (`lib/retrieval.js`)
For documents with multiple pages, text is segmented into chunks of ~350 words with a 50-word overlap to prevent sentences from being chopped mid-context.
When the user asks a question:
- Query terms are filtered against a set of English stop words (`what`, `the`, `is`, etc.).
- Each chunk is scored based on **Term Frequency (TF)**, **Inverse Document Frequency (IDF)**, multi-keyword co-occurrence, and phrase matches.
- For broad questions (e.g. `"Summarize this document"`), representative chunks from the start, middle, and conclusion are selected.
- The top-scoring chunks (preserving page metadata) are assembled within a safe token budget.

### 3. Document-Grounded Prompting (`lib/gemini.js` & `app/api/chat/route.js`)
The server forwards the selected document excerpts and conversation history to Gemini along with a strict system instruction:
- **Mandate**: Answer *only* using facts present in the excerpts.
- **Citations**: Return a structured JSON response containing the answer text and an array of supporting sources `{ page: number, text: "snippet" }`.
- **Refusal**: If the document does not contain the answer, explicitly return:
  `"I couldn't find this information in the uploaded document."`

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) v18.0.0 or higher
- A free Google Gemini API Key from [Google AI Studio](https://aistudio.google.com/)

### 1. Clone & Install Dependencies
```bash
git clone <your-repo-url>
cd chat-with-pdf
npm install
```

### 2. Configure Environment Variables
Copy the `.env.example` file to create a local `.env.local` file:
```bash
cp .env.example .env.local
```

Open `.env.local` and add your Gemini API Key:
```env
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

> **Note**: `.env.local` is listed in `.gitignore` and will never be committed to source control.

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing

The project includes an automated test suite verifying file validation, chunking, relevance scoring, and Gemini JSON parsing:

```bash
# Run unit & integration tests
npm test

# Run ESLint check
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

---

## ☁️ Deploying to Vercel

This application is designed to be 100% Vercel-compatible:

1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com/) and import the repository.
3. In the project **Environment Variables** settings, add:
   - **Name**: `GEMINI_API_KEY`
   - **Value**: Your Google Gemini API Key
4. Click **Deploy**. Vercel will build and launch your application globally!

---

## 🔒 Security Best Practices

- **Zero Client Secret Exposure**: The `GEMINI_API_KEY` is accessed only inside server-side Next.js route handlers (`app/api/chat/route.js`). It is never sent to the browser.
- **Strict File Validation**: Enforces PDF format checks and caps file sizes at 25MB before memory loading.
- **Malicious Payload Protection**: Request inputs are strictly validated on the server with sanitized error messages.
- **Prompt Injection Defense**: Document text is isolated inside designated `DOCUMENT EXCERPTS` delimiter blocks to prevent prompt hijacking.

---

## 🔮 Future Improvements

- [ ] Support for OCR on scanned/image-only PDFs via Tesseract.js
- [ ] Export conversation transcripts to PDF or Markdown
- [ ] Support for multi-document comparisons (side-by-side chat)
- [ ] Dark / Light mode manual toggle switch

---

## 📄 License

MIT License. Open source and free for educational and commercial use.
#   C h a t - w i t h - p d f  
 