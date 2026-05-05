import io
import sys
import os
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import pytest
from fastapi.testclient import TestClient

from models import PolicySummary, RAGResponse, SourceChunk

MOCK_SUMMARY = PolicySummary(
    plan_name="Test Gold Plan",
    plan_type="PPO",
    deductible_individual="$1,500",
    deductible_family="$3,000",
    out_of_pocket_max_individual="$5,000",
    out_of_pocket_max_family="$10,000",
    primary_care_copay="$25",
    specialist_copay="$50",
    emergency_room_copay="$250",
    covered_services=["Preventive care"],
    exclusions=["Cosmetic surgery"],
    notes=[],
)

MOCK_RAG_RESPONSE = RAGResponse(
    answer="Your deductible is $1,500.",
    sources=[SourceChunk(text="Deductible is $1,500.", page_number=1, chunk_index=0)],
)


def _make_pdf_bytes() -> bytes:
    import fitz
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), "Test insurance policy text.")
    data = doc.tobytes()
    doc.close()
    return data


@pytest.fixture
def client():
    from main import app
    return TestClient(app)


def test_health_endpoint(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@patch("main.pdf_parser.extract_text")
@patch("main.pdf_parser.extract_pages")
@patch("main.extractor.extract_policy_data")
@patch("main.rag.index_document")
def test_upload_requires_pdf(mock_index, mock_extract, mock_pages, mock_text, client):
    response = client.post(
        "/upload",
        files={"file": ("document.txt", b"not a pdf", "text/plain")},
    )
    assert response.status_code == 400


def test_upload_missing_file(client):
    response = client.post("/upload")
    assert response.status_code == 422


def test_ask_missing_doc_id(client):
    response = client.post(
        "/ask",
        json={"question": "What is my deductible?", "doc_id": "nonexistent-id-12345"},
    )
    assert response.status_code == 404


def test_ask_missing_question(client):
    response = client.post(
        "/ask",
        json={"doc_id": "some-doc-id"},
    )
    assert response.status_code == 422
