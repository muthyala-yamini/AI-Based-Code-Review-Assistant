from typing import List, Dict, Any
from .embeddings import create_embeddings
from .vector_store import get_vector_store

def retrieve_context(query: str, language: str = "Python", top_k: int = 3) -> List[Dict[str, Any]]:
    vector_store = get_vector_store()
    
    # Formulate query embedding
    combined_query = f"{language} best practices: {query[:300]}"
    query_vector = create_embeddings([combined_query])[0]
    
    results = vector_store.search(query_vector, top_k=top_k * 2)
    
    # Re-rank with language priority
    ranked = []
    for chunk, score in results:
        # Boost language matching
        relevance = score
        if chunk.get("category", "").lower() == language.lower():
            relevance = min(98.0, relevance + 8.0)
        elif chunk.get("category", "").lower() == "general":
            relevance = min(95.0, relevance + 3.0)
            
        ranked.append({
            "title": chunk.get("title", chunk.get("source")),
            "source": chunk.get("source"),
            "category": chunk.get("category"),
            "relevance": round(relevance, 1),
            "snippet": chunk.get("content")[:300] + ("..." if len(chunk.get("content", "")) > 300 else ""),
            "content": chunk.get("content")
        })
        
    ranked.sort(key=lambda x: x["relevance"], reverse=True)
    return ranked[:top_k]
