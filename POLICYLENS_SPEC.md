# PolicyLens — Project Specification
> Spec-Driven Development Document  
> Author: Adam Soto  
> Version: 1.0  
> Stack: FastAPI · OpenAI · ChromaDB · React · PyMuPDF · Pytest

---

## 1. Project Overview

### What Is PolicyLens?
PolicyLens is an AI-powered web application that helps users understand complex health insurance policy documents. A user uploads a PDF of their insurance policy, and the app does two things:

1. **Structured Extraction** — Automatically pulls out key policy details (deductibles, copays, coverage limits, exclusions) and displays them in a clean, readable summary card.
2. **RAG-Powered Q&A** — Lets the user ask natural language questions about their policy and returns accurate, grounded answers with source context from the document.

### Why Does This Exist?
Health insurance policies are notoriously difficult to read. Most people don't understand what their plan actually covers until they get a bill. PolicyLens makes policy documents accessible, structured, and queryable — mirroring exactly the kind of AI-native data infrastructure that companies like Policybot are building at scale.

### Skills This Demonstrates
- **RAG (Retrieval-Augmented Generation)** pipeline design and implementation
- **LLM API integration** (OpenAI GPT-4o + embeddings)
- **Vector database** usage (ChromaDB)
- **FastAPI** backend development
- **Structured data extraction** from unstructured text
- **React** frontend development
- **Automated testing** with Pytest

---

## 2. Repository Structure

```
policylens/
├── backend/
│   ├── main.py                  # FastAPI app, route definitions
│   ├── extractor.py             # Structured policy data extraction via LLM
│   ├── rag.py                   # RAG pipeline: chunking, embedding, querying
│   ├── pdf_parser.py            # PDF text extraction via PyMuPDF
│   ├── models.py                # Pydantic request/response models
│   ├── config.py                # Environment config, settings
│   └── tests/
│       ├── __init__.py
│       ├── test_pdf_parser.py
│       ├── test_extractor.py
│       ├── test_rag.py
│       └── test_api.py
├── frontend/
│   ├── public/
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── index.css
│       └── components/
│           ├── UploadZone.jsx       # PDF drag-and-drop upload area
│           ├── PolicySummary.jsx    # Structured extraction results card
│           ├── ChatInterface.jsx    # Q&A chat UI
│           └── SourceContext.jsx    # Shows source chunks used in answer
├── .env.example                 # Template for required environment variables
├── .gitignore                   # Must include .env and chroma_db/
├── requirements.txt             # Python dependencies
├── README.md                    # Full project documentation
└── package.json                 # Frontend dependencies (inside /frontend)
```

---

## 3. Environment Setup

### Required Environment Variables
Create a `.env` file in the `/backend` directory. **Never commit this file to GitHub.**

```env
OPENAI_API_KEY=your_openai_api_key_here
```

### `.env.example` (commit this file)
```env
OPENAI_API_KEY=your_openai_api_key_here
```

### `.gitignore` must include:
```
.env
chroma_db/
__pycache__/
*.pyc
node_modules/
dist/
```

---

## 4. Backend Specification

### 4.1 Dependencies (`requirements.txt`)
```
fastapi
uvicorn
openai
chromadb
pymupdf
python-dotenv
pydantic
python-multipart
pytest
pytest-asyncio
httpx
```

### 4.2 `config.py`
Loads environment variables and exposes them as a settings object.

```python
# Responsibilities:
# - Load OPENAI_API_KEY from .env using python-dotenv
# - Expose a Settings object imported by other modules
# - Raise a clear error at startup if OPENAI_API_KEY is missing
```

### 4.3 `pdf_parser.py`
Handles PDF ingestion and text extraction.

```python
# Responsibilities:
# - Accept a file path or bytes object representing a PDF
# - Use PyMuPDF (fitz) to extract raw text page by page
# - Return a single concatenated string of the full document text
# - Also return a list of (page_number, page_text) tuples for chunking purposes
# - Handle errors gracefully: corrupt PDF, empty PDF, non-PDF file

# Key function signatures:
def extract_text(pdf_bytes: bytes) -> str:
    """Extract and return all text from a PDF as a single string."""

def extract_pages(pdf_bytes: bytes) -> list[tuple[int, str]]:
    """Return a list of (page_number, text) tuples, one per page."""
```

### 4.4 `extractor.py`
Uses the OpenAI API to extract structured data from raw policy text.

```python
# Responsibilities:
# - Accept raw policy text as input
# - Send a structured prompt to GPT-4o requesting JSON output
# - Parse and return a PolicySummary object (defined in models.py)
# - Handle cases where the document is not an insurance policy
# - Handle OpenAI API errors gracefully

# The LLM prompt should instruct the model to extract:
# - plan_name: str
# - plan_type: str (HMO, PPO, EPO, etc.)
# - deductible_individual: str
# - deductible_family: str
# - out_of_pocket_max_individual: str
# - out_of_pocket_max_family: str
# - primary_care_copay: str
# - specialist_copay: str
# - emergency_room_copay: str
# - covered_services: list[str]
# - exclusions: list[str]
# - notes: list[str] (anything important that doesn't fit above)

# Key function signatures:
def extract_policy_data(text: str) -> PolicySummary:
    """Use GPT-4o to extract structured policy info from raw text."""
```

### 4.5 `rag.py`
Implements the full Retrieval-Augmented Generation pipeline.

```python
# Responsibilities:
# - Chunk the raw document text into overlapping segments
# - Embed each chunk using OpenAI text-embedding-3-small
# - Store embeddings in a local ChromaDB collection
# - Accept a user question, embed it, retrieve the top-k relevant chunks
# - Send retrieved chunks + question to GPT-4o to generate a grounded answer
# - Return the answer AND the source chunks used (for transparency)
# - Clear/reset the ChromaDB collection when a new document is uploaded

# Chunking strategy:
# - Chunk size: 500 tokens (~400 words)
# - Overlap: 50 tokens (~40 words)
# - Each chunk stored with metadata: page_number, chunk_index

# Retrieval strategy:
# - top_k: 4 most relevant chunks retrieved per query
# - Use cosine similarity (ChromaDB default)

# RAG prompt structure:
# - System: "You are a helpful assistant that answers questions about health 
#            insurance policies. Use only the provided context to answer. 
#            If the answer is not in the context, say so clearly."
# - User: "Context:\n{chunks}\n\nQuestion: {question}"

# Key function signatures:
def index_document(pages: list[tuple[int, str]], doc_id: str) -> None:
    """Chunk, embed, and store document in ChromaDB."""

def query_document(question: str, doc_id: str) -> RAGResponse:
    """Retrieve relevant chunks and generate a grounded answer."""

def clear_index(doc_id: str) -> None:
    """Remove all chunks for a given document from ChromaDB."""
```

### 4.6 `models.py`
All Pydantic models for request/response validation.

```python
# Models to define:

class PolicySummary(BaseModel):
    plan_name: str
    plan_type: str
    deductible_individual: str
    deductible_family: str
    out_of_pocket_max_individual: str
    out_of_pocket_max_family: str
    primary_care_copay: str
    specialist_copay: str
    emergency_room_copay: str
    covered_services: list[str]
    exclusions: list[str]
    notes: list[str]

class SourceChunk(BaseModel):
    text: str
    page_number: int
    chunk_index: int

class RAGResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]

class QuestionRequest(BaseModel):
    question: str
    doc_id: str

class UploadResponse(BaseModel):
    doc_id: str
    summary: PolicySummary
    message: str
```

### 4.7 `main.py`
FastAPI application with all route definitions.

```python
# App setup:
# - Initialize FastAPI app with title "PolicyLens API"
# - Enable CORS for localhost:5173 (Vite dev server)
# - Mount routes

# Routes:

# POST /upload
# - Accepts: multipart/form-data with a PDF file
# - Validates file is a PDF
# - Calls pdf_parser.extract_text() and extract_pages()
# - Generates a unique doc_id (use uuid4)
# - Calls extractor.extract_policy_data() with full text
# - Calls rag.index_document() with pages and doc_id
# - Returns: UploadResponse (doc_id + PolicySummary + success message)
# - Error handling: 400 if not a PDF, 422 if extraction fails, 500 for server errors

# POST /ask
# - Accepts: QuestionRequest JSON body (question + doc_id)
# - Validates doc_id exists (return 404 if not found)
# - Calls rag.query_document(question, doc_id)
# - Returns: RAGResponse (answer + source chunks)
# - Error handling: 404 if doc_id not found, 500 for server errors

# GET /health
# - Returns: {"status": "ok"}
# - Used for basic health checking and testing
```

---

## 5. Frontend Specification

### 5.1 Tech Stack
- **React** (via Vite)
- **Plain CSS** with CSS custom properties (variables) for theming
- **No UI component library** — custom styled components only

### 5.2 Aesthetic Direction
PolicyLens should feel like a **refined, clinical tool** — think medical-grade precision meets modern SaaS. The design should feel trustworthy and clean without being cold.

- **Color palette**: Deep navy (`#0A1628`) background, crisp white text, with a single sharp accent — electric teal (`#00C9A7`)
- **Typography**: Use Google Fonts — `"DM Serif Display"` for headings, `"DM Sans"` for body text
- **Layout**: Single-page app. Left panel = upload + summary. Right panel = chat interface.
- **Animations**: Subtle fade-in on upload completion, smooth chat message appearance, pulsing loading indicator during API calls
- **Feel**: Confident, professional, minimal — like something a health-tech startup would actually ship

### 5.3 Component Breakdown

#### `App.jsx`
- Top-level layout component
- Manages global state: `docId`, `summary`, `isLoading`, `messages`
- Renders two-column layout: left panel (UploadZone + PolicySummary), right panel (ChatInterface)
- Passes state and callbacks down as props

#### `UploadZone.jsx`
- Drag-and-drop zone for PDF upload
- Also supports click-to-browse file selection
- Shows upload progress/loading state during API call
- On success: hides upload zone, triggers summary display
- On error: shows inline error message
- Calls `POST /upload` and passes `doc_id` + `summary` back to App

#### `PolicySummary.jsx`
- Receives a `PolicySummary` object as props
- Displays structured data in clearly labeled card sections:
  - Header: Plan name + type badge
  - Cost section: deductible, out-of-pocket max
  - Copay section: primary care, specialist, ER
  - Coverage list: covered services
  - Exclusions list
  - Notes
- Only renders after a successful upload

#### `ChatInterface.jsx`
- Full-height chat panel on the right
- Displays conversation history (user messages + AI responses)
- Input bar at bottom with send button
- Disabled state when no document is uploaded (shows prompt: "Upload a policy to start asking questions")
- On send: calls `POST /ask`, appends response to message list
- Shows loading indicator while waiting for response
- Each AI message renders a `SourceContext` component below it

#### `SourceContext.jsx`
- Collapsible section below each AI answer
- Shows the source chunks retrieved from the document
- Displays page number for each chunk
- Toggle button: "Show sources" / "Hide sources"
- Styled as a subtle secondary element, not distracting

### 5.4 API Integration
All API calls use the native `fetch` API. Base URL should be stored in a constant:

```javascript
const API_BASE = "http://localhost:8000";
```

---

## 6. Testing Specification

All tests live in `backend/tests/`. Run with `pytest` from the `/backend` directory.

### 6.1 `test_pdf_parser.py`
```
- test_extract_text_returns_string: extract_text() returns a non-empty string from a valid PDF
- test_extract_pages_returns_list: extract_pages() returns a list of tuples
- test_extract_pages_has_correct_structure: each tuple contains (int, str)
- test_extract_text_with_invalid_bytes: raises appropriate error for non-PDF bytes
```

### 6.2 `test_extractor.py`
```
- test_extract_policy_data_returns_policy_summary: returns a PolicySummary object
- test_extract_policy_data_has_required_fields: all required fields are present and non-empty
- test_extract_policy_data_covered_services_is_list: covered_services field is a list
- test_extract_policy_data_exclusions_is_list: exclusions field is a list
Note: Mock the OpenAI API call using unittest.mock to avoid real API calls in tests
```

### 6.3 `test_rag.py`
```
- test_index_document_succeeds: index_document() runs without error on valid input
- test_query_document_returns_rag_response: returns a RAGResponse object
- test_rag_response_has_answer: answer field is a non-empty string
- test_rag_response_has_sources: sources field is a non-empty list
- test_clear_index_removes_documents: after clear_index(), querying returns no results
Note: Mock OpenAI embedding and completion calls in tests
```

### 6.4 `test_api.py`
```
- test_health_endpoint: GET /health returns 200 and {"status": "ok"}
- test_upload_requires_pdf: POST /upload with non-PDF returns 400
- test_upload_missing_file: POST /upload with no file returns 422
- test_ask_missing_doc_id: POST /ask with invalid doc_id returns 404
- test_ask_missing_question: POST /ask with missing question field returns 422
Note: Use FastAPI TestClient (httpx) for all API tests. Mock backend service calls.
```

---

## 7. README Specification

The README must include the following sections in this order:

1. **PolicyLens** — one-sentence description
2. **What It Does** — 3-4 sentence explanation of the two core features
3. **Why I Built This** — connects to target role (AI engineering, data pipelines, RAG)
4. **Skills Demonstrated** — bulleted list
5. **Tech Stack** — table with Backend / Frontend / AI / Testing columns
6. **Project Structure** — copy of the folder tree from Section 2
7. **Setup Instructions** — step by step:
   - Clone the repo
   - Create `.env` from `.env.example`
   - Install Python dependencies
   - Run the backend
   - Install frontend dependencies
   - Run the frontend
8. **Running the Tests** — exact commands to run pytest
9. **How to Use** — short walkthrough with numbered steps
10. **API Reference** — table of endpoints (method, path, description, request, response)

---

## 8. Running the Project

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# Runs on http://localhost:5173
```

### Tests
```bash
cd backend
pytest tests/ -v
```

---

## 9. Key Design Decisions & Rationale

| Decision | Rationale |
|---|---|
| ChromaDB (local) | No cloud account needed, easy setup, production-equivalent for demo |
| text-embedding-3-small | Cost-efficient, high quality, sufficient for document Q&A |
| GPT-4o for extraction + Q&A | Best instruction-following for structured JSON output |
| 500-token chunks with 50-token overlap | Balances context preservation with retrieval precision |
| doc_id per upload | Supports multiple sessions without cross-contamination |
| Pydantic models | Enforces data contracts between frontend and backend |
| FastAPI | Async, fast, auto-generates OpenAPI docs, bonus on target JD |
| React via Vite | Fast dev server, modern tooling, aligns with frontend bonus on JD |

---

## 10. Submission Checklist

- [ ] All backend modules implemented (`pdf_parser.py`, `extractor.py`, `rag.py`, `models.py`, `main.py`, `config.py`)
- [ ] All 4 test files written and passing
- [ ] React frontend with all 4 components
- [ ] `.env.example` committed, `.env` in `.gitignore`
- [ ] `chroma_db/` in `.gitignore`
- [ ] Full README following Section 7 structure
- [ ] Project runs end-to-end: upload PDF → see summary → ask questions → get answers with sources
- [ ] GitHub repository is clean, public, and has a descriptive name
- [ ] Project featured in portfolio site with explanation of what it demonstrates

---

*This spec was designed to be handed directly to an AI coding assistant (Claude Code) for implementation. Each section is intentionally precise enough to generate correct code without ambiguity.*
