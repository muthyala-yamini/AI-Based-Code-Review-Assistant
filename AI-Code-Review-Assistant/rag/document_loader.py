import os
from typing import List, Dict
from config import Config

def load_documents(directory: str = None) -> List[Dict[str, str]]:
    kb_dir = directory or Config.KNOWLEDGE_BASE_DIR
    documents = []
    
    if not os.path.exists(kb_dir):
        return documents

    for root, _, files in os.walk(kb_dir):
        for file in files:
            if file.endswith((".txt", ".md")):
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, kb_dir)
                category = os.path.basename(root)
                try:
                    with open(full_path, "r", encoding="utf-8") as f:
                        text = f.read()
                        documents.append({
                            "path": rel_path,
                            "filename": file,
                            "category": category,
                            "text": text
                        })
                except Exception as e:
                    print(f"Error loading {full_path}: {e}")
                    
    return documents

def split_documents(documents: List[Dict[str, str]], chunk_size: int = 500, chunk_overlap: int = 50) -> List[Dict[str, any]]:
    chunks = []
    for doc in documents:
        text = doc["text"]
        sections = text.split("\n## ")
        for i, sec in enumerate(sections):
            prefix = "## " if i > 0 else ""
            section_text = (prefix + sec).strip()
            if len(section_text) < 30:
                continue
                
            # If section is small enough, keep as single chunk
            if len(section_text) <= chunk_size:
                chunks.append({
                    "id": f"{doc['filename']}-{i}",
                    "source": doc["filename"],
                    "category": doc["category"],
                    "content": section_text,
                    "title": section_text.split("\n")[0].replace("#", "").strip()
                })
            else:
                # Sub-chunk by words
                words = section_text.split()
                start = 0
                sub_idx = 0
                while start < len(words):
                    end = start + 80
                    sub_text = " ".join(words[start:end])
                    chunks.append({
                        "id": f"{doc['filename']}-{i}-{sub_idx}",
                        "source": doc["filename"],
                        "category": doc["category"],
                        "content": sub_text,
                        "title": section_text.split("\n")[0].replace("#", "").strip()
                    })
                    start += 60
                    sub_idx += 1
    return chunks
