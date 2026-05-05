import chromadb
from openai import OpenAI
from config import settings
from models import RAGResponse, SourceChunk

client = OpenAI(api_key=settings.OPENAI_API_KEY)
chroma_client = chromadb.PersistentClient(path="./chroma_db")

CHUNK_SIZE = 400    # ~500 tokens
CHUNK_OVERLAP = 40  # ~50 tokens
TOP_K = 4


def _chunk_text(pages: list[tuple[int, str]]) -> list[dict]:
    chunks = []
    chunk_index = 0

    for page_number, text in pages:
        words = text.split()
        start = 0
        while start < len(words):
            end = min(start + CHUNK_SIZE, len(words))
            chunk_text = " ".join(words[start:end])
            if chunk_text.strip():
                chunks.append({
                    "text": chunk_text,
                    "page_number": page_number,
                    "chunk_index": chunk_index,
                })
                chunk_index += 1
            if end == len(words):
                break
            start += CHUNK_SIZE - CHUNK_OVERLAP

    return chunks


def _embed(texts: list[str]) -> list[list[float]]:
    response = client.embeddings.create(
        input=texts,
        model="text-embedding-3-small",
    )
    return [item.embedding for item in response.data]


def index_document(pages: list[tuple[int, str]], doc_id: str) -> None:
    """Chunk, embed, and store document in ChromaDB."""
    collection = chroma_client.get_or_create_collection(name=f"doc-{doc_id}")

    chunks = _chunk_text(pages)
    if not chunks:
        return

    texts = [c["text"] for c in chunks]
    embeddings = _embed(texts)

    collection.add(
        ids=[f"{doc_id}-chunk-{c['chunk_index']}" for c in chunks],
        embeddings=embeddings,
        documents=texts,
        metadatas=[
            {"page_number": c["page_number"], "chunk_index": c["chunk_index"]}
            for c in chunks
        ],
    )


def query_document(question: str, doc_id: str) -> RAGResponse:
    """Retrieve relevant chunks and generate a grounded answer."""
    try:
        collection = chroma_client.get_collection(name=f"doc-{doc_id}")
    except Exception:
        raise ValueError(f"Document '{doc_id}' not found in index")

    count = collection.count()
    if count == 0:
        raise ValueError(f"Document '{doc_id}' has no indexed content")

    question_embedding = _embed([question])[0]

    results = collection.query(
        query_embeddings=[question_embedding],
        n_results=min(TOP_K, count),
        include=["documents", "metadatas"],
    )

    docs = results["documents"][0]
    metas = results["metadatas"][0]
    context = "\n\n---\n\n".join(docs)

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a helpful assistant that answers questions about health insurance policies. "
                    "Use only the provided context to answer. "
                    "If the answer is not in the context, say so clearly."
                ),
            },
            {
                "role": "user",
                "content": f"Context:\n{context}\n\nQuestion: {question}",
            },
        ],
        temperature=0,
    )

    answer = response.choices[0].message.content
    sources = [
        SourceChunk(
            text=doc,
            page_number=meta["page_number"],
            chunk_index=meta["chunk_index"],
        )
        for doc, meta in zip(docs, metas)
    ]

    return RAGResponse(answer=answer, sources=sources)


def clear_index(doc_id: str) -> None:
    """Remove all chunks for a given document from ChromaDB."""
    try:
        chroma_client.delete_collection(name=f"doc-{doc_id}")
    except Exception:
        pass
