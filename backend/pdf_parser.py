import fitz  # PyMuPDF


def extract_text(pdf_bytes: bytes) -> str:
    """Extract and return all text from a PDF as a single string."""
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except fitz.FileDataError as e:
        raise ValueError(f"Invalid or corrupt PDF file: {e}")

    if len(doc) == 0:
        doc.close()
        raise ValueError("PDF document is empty (no pages)")

    text = "\n".join(page.get_text() for page in doc)
    doc.close()

    if not text.strip():
        raise ValueError("PDF contains no extractable text")

    return text


def extract_pages(pdf_bytes: bytes) -> list[tuple[int, str]]:
    """Return a list of (page_number, text) tuples, one per page."""
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    except fitz.FileDataError as e:
        raise ValueError(f"Invalid or corrupt PDF file: {e}")

    if len(doc) == 0:
        doc.close()
        raise ValueError("PDF document is empty (no pages)")

    pages = [(i + 1, page.get_text()) for i, page in enumerate(doc)]
    doc.close()
    return pages
