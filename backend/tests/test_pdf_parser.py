import pytest
import fitz
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from pdf_parser import extract_text, extract_pages


def _make_pdf(text: str = "Test insurance policy document.\nDeductible: $1,000") -> bytes:
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((50, 72), text)
    data = doc.tobytes()
    doc.close()
    return data


def test_extract_text_returns_string():
    pdf_bytes = _make_pdf()
    result = extract_text(pdf_bytes)
    assert isinstance(result, str)
    assert len(result) > 0


def test_extract_pages_returns_list():
    pdf_bytes = _make_pdf()
    result = extract_pages(pdf_bytes)
    assert isinstance(result, list)
    assert len(result) > 0


def test_extract_pages_has_correct_structure():
    pdf_bytes = _make_pdf()
    result = extract_pages(pdf_bytes)
    for item in result:
        assert isinstance(item, tuple)
        assert len(item) == 2
        page_num, page_text = item
        assert isinstance(page_num, int)
        assert isinstance(page_text, str)


def test_extract_text_with_invalid_bytes():
    with pytest.raises(ValueError):
        extract_text(b"this is not a pdf file at all")
