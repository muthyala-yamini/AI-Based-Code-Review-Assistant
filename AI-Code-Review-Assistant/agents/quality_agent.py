from typing import Dict, Any, List
from services.gemini_service import generate_json_response

def analyze_quality_and_performance(code: str, language: str) -> Dict[str, Any]:
    """
    AGENT 3: Quality & Performance Agent
    Analyzes cyclomatic complexity, algorithmic efficiency O(N^2), memory consumption,
    DRY code reuse, PEP 8 / style conventions, and exception handling.
    """
    system_prompt = f"""You are the Quality & Performance Agent.
Your duties:
- Evaluate algorithmic time complexity (e.g., nested loops O(N^2), redundant operations)
- Evaluate memory footprint and generator usage
- Analyze cyclomatic complexity and function sizing (> 30 lines)
- Check exception handling (bare except, swallowing errors)
- Check naming conventions (PEP 8, camelCase vs snake_case)
- Detect code duplication (DRY principle)
- Check proper resource management (context managers, closing streams)

Language: {language}

Output JSON schema:
{{
  "performance_issues": [
    {{
      "id": "perf-1",
      "severity": "MEDIUM",
      "title": "Performance issue title",
      "line": 1,
      "description": "Inefficiency details",
      "why_it_matters": "Latency or CPU/RAM impact",
      "recommendation": "Optimization strategy",
      "suggested_fix": "Optimized snippet"
    }}
  ],
  "quality_issues": [
    {{
      "id": "qual-1",
      "severity": "LOW",
      "title": "Code quality / standard violation",
      "line": 1,
      "description": "Code smell description",
      "why_it_matters": "Maintainability impact",
      "recommendation": "Clean code standard to follow",
      "suggested_fix": "Standard compliant snippet"
    }}
  ]
}}"""

    user_prompt = f"Analyze performance and code quality for this {language} code:\n\n```{language.lower()}\n{code}\n```"

    try:
        return generate_json_response(user_prompt, system_instruction=system_prompt)
    except Exception as e:
        return {
            "performance_issues": [{
                "id": "perf-heuristics",
                "severity": "LOW",
                "title": "Algorithmic Efficiency Evaluation",
                "line": 1,
                "description": "Standard loop evaluation recommended.",
                "why_it_matters": "Ensures predictable scaling with large inputs.",
                "recommendation": "Consider vectorization or dictionary lookups.",
                "suggested_fix": "# Utilize set/dict for O(1) lookups"
            }],
            "quality_issues": [{
                "id": "qual-heuristics",
                "severity": "LOW",
                "title": "Code Formatting & Exception Handling",
                "line": 1,
                "description": "Ensure specific exception handling and style conformity.",
                "why_it_matters": "Improves readability and debugging speed.",
                "recommendation": "Catch specific exception types rather than broad Exception.",
                "suggested_fix": "try:\n    pass\nexcept ValueError as e:\n    pass"
            }]
        }
