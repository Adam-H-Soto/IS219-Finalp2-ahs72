# PolicyLens

**Live site:** [https://is-219-finalp2-ahs72.vercel.app/](https://is-219-finalp2-ahs72.vercel.app/)  
**Author:** [Adam Soto](https://www.linkedin.com/in/adam-soto-909586327/) — Applied AI Engineering Student at NJIT

An AI-powered web application that helps users understand complex health insurance policy documents through structured extraction and natural language Q&A.

---

## What It Does

PolicyLens accepts a PDF upload of any health insurance policy and performs two tasks automatically. First, it uses GPT-4o to extract key plan details — deductibles, copays, coverage limits, and exclusions — and displays them in a clean, readable summary card. Second, it builds a RAG (Retrieval-Augmented Generation) pipeline over the document so users can ask plain-English questions and receive accurate, grounded answers with source citations pointing back to the original policy text.

---

## Why I Built This

Health insurance policies are notoriously difficult to read. This project demonstrates the exact kind of AI-native data infrastructure used by companies building intelligent document pipelines — combining LLM-powered extraction, vector search, and a production-grade API behind a clean UI. It directly mirrors skills required for AI engineering and data pipeline roles.

---

## Skills Demonstrated

- **RAG pipeline design and implementation** (chunking, embedding, retrieval, generation)
- **LLM API integration** (OpenAI GPT-4o for extraction + Q&A, text-embedding-3-small for vectors)
- **Vector database usage** (ChromaDB with persistent local storage)
- **FastAPI backend development** (async routes, Pydantic validation, CORS, multipart upload)
- **Structured data extraction** from unstructured PDF text
- **React frontend development** (Vite, component composition, state management)
- **Automated testing with Pytest** (mocking, TestClient, fixtures)

---

## Tech Stack

| Layer      | Technology                             |
|------------|----------------------------------------|
| Backend    | FastAPI, Uvicorn, Python 3.11+         |
| AI / LLMs  | OpenAI GPT-4o, text-embedding-3-small  |
| Vector DB  | ChromaDB (local persistent)            |
| PDF        | PyMuPDF (fitz)                         |
| Frontend   | React 18, Vite, plain CSS              |
| Testing    | Pytest, pytest-asyncio, httpx          |

---

## Project Structure

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
│       ├── conftest.py
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
│           ├── UploadZone.jsx
│           ├── PolicySummary.jsx
│           ├── ChatInterface.jsx
│           └── SourceContext.jsx
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```

---

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd policylens
```

### 2. Create your environment file

```bash
cp .env.example backend/.env
# Edit backend/.env and add your real OpenAI API key
```

### 3. Install Python dependencies

Run this from the **project root** (where `requirements.txt` lives):

```bash
pip install -r requirements.txt
```

### 4. Run the backend

```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

### 5. Install frontend dependencies

```bash
cd frontend
npm install
```

### 6. Run the frontend

```bash
npm run dev
# Opens at http://localhost:5173
```

---

## Running the Tests

Run from the **`backend/`** directory:

```bash
cd backend
python -m pytest tests/ -v
```

---

## How to Use

1. Open `http://localhost:5173` in your browser
2. Drag and drop a health insurance policy PDF onto the upload zone (or click to browse)
3. Wait for the AI to analyze the document — a structured summary card will appear on the left
4. Type any question about your coverage in the chat panel on the right
5. Review the AI's answer and expand "Show sources" to see the exact policy passages used

---

## API Reference

| Method | Path      | Description                     | Request                           | Response         |
|--------|-----------|---------------------------------|-----------------------------------|------------------|
| GET    | /health   | Health check                    | —                                 | `{"status":"ok"}` |
| POST   | /upload   | Upload and analyze a policy PDF | `multipart/form-data` with `file` | `UploadResponse` |
| POST   | /ask      | Ask a question about a policy   | `{"question": str, "doc_id": str}` | `RAGResponse`   |

**UploadResponse** — `doc_id: str`, `summary: PolicySummary`, `message: str`

**RAGResponse** — `answer: str`, `sources: [{text, page_number, chunk_index}]`
