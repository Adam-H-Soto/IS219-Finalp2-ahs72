import uuid
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

import extractor
import pdf_parser
import rag
from models import QuestionRequest, RAGResponse, UploadResponse

app = FastAPI(title="PolicyLens API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory tracking of uploaded doc IDs for this server session
_active_docs: set[str] = set()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/upload", response_model=UploadResponse)
async def upload_pdf(file: UploadFile = File(...)):
    is_pdf_content_type = file.content_type == "application/pdf"
    is_pdf_name = (file.filename or "").lower().endswith(".pdf")
    if not is_pdf_content_type and not is_pdf_name:
        raise HTTPException(status_code=400, detail="File must be a PDF")

    pdf_bytes = await file.read()

    if not pdf_bytes.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="File must be a PDF")

    try:
        full_text = pdf_parser.extract_text(pdf_bytes)
        pages = pdf_parser.extract_pages(pdf_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    doc_id = str(uuid.uuid4())

    try:
        summary = extractor.extract_policy_data(full_text)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"Policy extraction failed: {e}")

    try:
        rag.index_document(pages, doc_id)
        _active_docs.add(doc_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Document indexing failed: {e}")

    return UploadResponse(
        doc_id=doc_id,
        summary=summary,
        message="Policy document uploaded and indexed successfully",
    )


@app.post("/ask", response_model=RAGResponse)
def ask_question(request: QuestionRequest):
    if request.doc_id not in _active_docs:
        raise HTTPException(
            status_code=404,
            detail=f"Document '{request.doc_id}' not found. Please upload a policy first.",
        )

    try:
        return rag.query_document(request.question, request.doc_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {e}")
