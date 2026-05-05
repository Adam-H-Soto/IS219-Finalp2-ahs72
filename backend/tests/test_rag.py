import sys
import os
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from models import RAGResponse

SAMPLE_PAGES = [
    (1, "Your deductible is $1,500 per individual per year."),
    (2, "Emergency room visits require a $250 copay after deductible."),
]

SAMPLE_EMBEDDING = [0.1] * 1536


def _mock_embed_response(*args, **kwargs):
    texts = kwargs.get("input", args[0] if args else [])
    items = [MagicMock(embedding=SAMPLE_EMBEDDING) for _ in texts]
    resp = MagicMock()
    resp.data = items
    return resp


def _mock_completion_response(answer: str):
    message = MagicMock()
    message.content = answer
    choice = MagicMock()
    choice.message = message
    resp = MagicMock()
    resp.choices = [choice]
    return resp


@patch("rag.chroma_client")
@patch("rag.client")
def test_index_document_succeeds(mock_openai, mock_chroma):
    mock_openai.embeddings.create.side_effect = _mock_embed_response
    mock_collection = MagicMock()
    mock_chroma.get_or_create_collection.return_value = mock_collection

    from rag import index_document
    index_document(SAMPLE_PAGES, "test-doc-123")

    mock_chroma.get_or_create_collection.assert_called_once()
    mock_collection.add.assert_called_once()


@patch("rag.chroma_client")
@patch("rag.client")
def test_query_document_returns_rag_response(mock_openai, mock_chroma):
    mock_openai.embeddings.create.side_effect = _mock_embed_response
    mock_openai.chat.completions.create.return_value = _mock_completion_response(
        "Your individual deductible is $1,500 per year."
    )

    mock_collection = MagicMock()
    mock_collection.count.return_value = 2
    mock_collection.query.return_value = {
        "documents": [["Your deductible is $1,500.", "ER copay is $250."]],
        "metadatas": [[{"page_number": 1, "chunk_index": 0}, {"page_number": 2, "chunk_index": 1}]],
    }
    mock_chroma.get_collection.return_value = mock_collection

    from rag import query_document
    result = query_document("What is my deductible?", "test-doc-123")

    assert isinstance(result, RAGResponse)


@patch("rag.chroma_client")
@patch("rag.client")
def test_rag_response_has_answer(mock_openai, mock_chroma):
    mock_openai.embeddings.create.side_effect = _mock_embed_response
    mock_openai.chat.completions.create.return_value = _mock_completion_response(
        "Your individual deductible is $1,500."
    )

    mock_collection = MagicMock()
    mock_collection.count.return_value = 1
    mock_collection.query.return_value = {
        "documents": [["Deductible is $1,500."]],
        "metadatas": [[{"page_number": 1, "chunk_index": 0}]],
    }
    mock_chroma.get_collection.return_value = mock_collection

    from rag import query_document
    result = query_document("What is my deductible?", "test-doc-123")

    assert isinstance(result.answer, str)
    assert len(result.answer) > 0


@patch("rag.chroma_client")
@patch("rag.client")
def test_rag_response_has_sources(mock_openai, mock_chroma):
    mock_openai.embeddings.create.side_effect = _mock_embed_response
    mock_openai.chat.completions.create.return_value = _mock_completion_response("Answer here.")

    mock_collection = MagicMock()
    mock_collection.count.return_value = 2
    mock_collection.query.return_value = {
        "documents": [["Chunk A", "Chunk B"]],
        "metadatas": [[{"page_number": 1, "chunk_index": 0}, {"page_number": 2, "chunk_index": 1}]],
    }
    mock_chroma.get_collection.return_value = mock_collection

    from rag import query_document
    result = query_document("What is covered?", "test-doc-123")

    assert isinstance(result.sources, list)
    assert len(result.sources) > 0


@patch("rag.chroma_client")
@patch("rag.client")
def test_clear_index_removes_documents(mock_openai, mock_chroma):
    mock_chroma.delete_collection.return_value = None

    from rag import clear_index
    clear_index("test-doc-123")

    mock_chroma.delete_collection.assert_called_once_with(name="doc-test-doc-123")
