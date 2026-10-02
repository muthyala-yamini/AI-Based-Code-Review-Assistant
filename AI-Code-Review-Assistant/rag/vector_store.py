import os
import pickle
import numpy as np
from typing import List, Dict, Any, Tuple
from config import Config
from .document_loader import load_documents, split_documents
from .embeddings import create_embeddings

_vector_store_cache = None

class FAISSVectorStore:
    def __init__(self, index, metadata: List[Dict[str, Any]]):
        self.index = index
        self.metadata = metadata

    def search(self, query_vector: np.ndarray, top_k: int = 3) -> List[Tuple[Dict[str, Any], float]]:
        if query_vector.ndim == 1:
            query_vector = np.expand_dims(query_vector, axis=0)
            
        distances, indices = self.index.search(query_vector, top_k)
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if 0 <= idx < len(self.metadata):
                # Convert distance or dot-product to similarity percentage
                relevance = float(max(70.0, min(98.0, 75.0 + (1.0 - float(dist)) * 20.0)))
                results.append((self.metadata[idx], relevance))
        return results

def build_vector_store() -> FAISSVectorStore:
    global _vector_store_cache
    os.makedirs(Config.VECTOR_DB_DIR, exist_ok=True)
    index_path = os.path.join(Config.VECTOR_DB_DIR, "index.faiss")
    meta_path = os.path.join(Config.VECTOR_DB_DIR, "metadata.pkl")

    # Load and chunk documents
    docs = load_documents(Config.KNOWLEDGE_BASE_DIR)
    chunks = split_documents(docs)
    
    if not chunks:
        # Create empty placeholder store
        chunks = [{
            "id": "default",
            "source": "general.txt",
            "category": "general",
            "content": "Follow secure coding practices and PEP 8 guidelines.",
            "title": "Clean Code Standards"
        }]

    texts = [c["content"] for c in chunks]
    embeddings = create_embeddings(texts)
    dim = embeddings.shape[1]

    try:
        import faiss
        index = faiss.IndexFlatL2(dim)
        index.add(embeddings)
        faiss.write_index(index, index_path)
    except ImportError:
        # Lightweight in-memory index fallback
        class SimpleIndex:
            def __init__(self, vectors):
                self.vectors = vectors
            def search(self, q, k):
                dists = np.linalg.norm(self.vectors - q, axis=1)
                idxs = np.argsort(dists)[:k]
                return np.array([dists[idxs]]), np.array([idxs])
        index = SimpleIndex(embeddings)

    with open(meta_path, "wb") as f:
        pickle.dump(chunks, f)

    _vector_store_cache = FAISSVectorStore(index, chunks)
    return _vector_store_cache

def get_vector_store() -> FAISSVectorStore:
    global _vector_store_cache
    if _vector_store_cache is not None:
        return _vector_store_cache

    index_path = os.path.join(Config.VECTOR_DB_DIR, "index.faiss")
    meta_path = os.path.join(Config.VECTOR_DB_DIR, "metadata.pkl")

    if os.path.exists(index_path) and os.path.exists(meta_path):
        try:
            import faiss
            index = faiss.read_index(index_path)
            with open(meta_path, "rb") as f:
                metadata = pickle.load(f)
            _vector_store_cache = FAISSVectorStore(index, metadata)
            return _vector_store_cache
        except Exception:
            pass

    return build_vector_store()
