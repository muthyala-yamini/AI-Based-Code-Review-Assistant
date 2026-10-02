from typing import List
import numpy as np

_model = None

def get_embeddings_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            _model = SentenceTransformer("all-MiniLM-L6-v2")
        except ImportError:
            _model = "fallback"
    return _model

def create_embeddings(texts: List[str]) -> np.ndarray:
    model = get_embeddings_model()
    if model != "fallback":
        return model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
    
    # Fallback deterministic hashing embedding for lightweight environments
    embeddings = []
    for text in texts:
        vec = np.zeros(128, dtype=np.float32)
        words = text.lower().split()
        for w in words:
            idx = abs(hash(w)) % 128
            vec[idx] += 1.0
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        embeddings.append(vec)
    return np.array(embeddings, dtype=np.float32)
