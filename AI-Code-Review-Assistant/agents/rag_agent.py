from typing import List, Dict, Any
from rag.retriever import retrieve_context

def retrieve_rag_standards(code: str, language: str) -> List[Dict[str, Any]]:
    """
    AGENT 4: RAG Agent
    Retrieves industry coding guidelines, security advisories, and architecture best
    practices from the FAISS vector database to inject grounded context into the review.
    """
    # Extract query context from code
    lines = [line.strip() for line in code.splitlines() if line.strip() and not line.strip().startswith("#")]
    query_text = " ".join(lines[:10]) if lines else code[:300]
    
    rag_results = retrieve_context(query=query_text, language=language, top_k=2)
    return rag_results
