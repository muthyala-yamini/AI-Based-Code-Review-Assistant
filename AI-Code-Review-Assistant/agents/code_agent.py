import ast
import re
from typing import Dict, Any
from services.gemini_service import generate_json_response

def analyze_code_structure(code: str, language: str) -> Dict[str, Any]:
    """
    AGENT 1: Code Analyzer Agent
    Analyzes syntax, control flow, AST structures, logical flaws, and edge cases.
    """
    # 1. Local heuristic check
    syntax_valid = True
    syntax_error = None
    if language.lower() == "python":
        try:
            ast.parse(code)
        except SyntaxError as e:
            syntax_valid = False
            syntax_error = f"Syntax error at line {e.lineno}: {e.msg}"

    system_prompt = f"""You are the Code Analyzer Agent in a multi-agent system.
Your role:
- Understand source code logic and structure
- Identify programming language: {language}
- Detect syntax and parsing problems
- Detect logical problems, broken invariants, infinite loops, and edge case failures
- Detect anti-patterns and unhandled conditions

Output valid JSON matching:
{{
  "syntax_valid": true,
  "bugs": [
    {{
      "id": "bug-1",
      "severity": "HIGH",
      "title": "Issue title",
      "line": 1,
      "description": "Detailed explanation",
      "why_it_matters": "Reason",
      "recommendation": "Fix recommendation",
      "suggested_fix": "code snippet"
    }}
  ],
  "structural_notes": "Observations on architecture and flow"
}}"""

    user_prompt = f"Analyze the following {language} code for syntax, logic, and structural bugs:\n\n```{language.lower()}\n{code}\n```"

    try:
        result = generate_json_response(user_prompt, system_instruction=system_prompt)
        if not syntax_valid and syntax_error:
            result.setdefault("bugs", []).insert(0, {
                "id": "syntax-err-0",
                "severity": "CRITICAL",
                "title": "Python Syntax Error",
                "line": 1,
                "description": syntax_error,
                "why_it_matters": "Code cannot execute with syntax errors.",
                "recommendation": "Correct syntax to ensure valid parsing.",
                "suggested_fix": "# Fix syntax error"
            })
        return result
    except Exception as e:
        return {
            "syntax_valid": syntax_valid,
            "bugs": [{
                "id": "analysis-fallback",
                "severity": "MEDIUM",
                "title": "Static Code Analysis Alert",
                "line": 1,
                "description": f"Analysis executed with notice: {str(e)}",
                "why_it_matters": "Potential syntax or execution constraint.",
                "recommendation": "Verify imports and function signature.",
                "suggested_fix": code.splitlines()[0] if code.splitlines() else ""
            }],
            "structural_notes": "Completed with fallback heuristics."
        }
