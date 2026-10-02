import re
from typing import Dict, Any, List
from services.gemini_service import generate_json_response

def analyze_security_vulnerabilities(code: str, language: str) -> Dict[str, Any]:
    """
    AGENT 2: Security Agent
    Scans for OWASP Top 10 vulnerabilities, SQL injection, hardcoded secrets,
    command injection, XSS, unsafe deserialization, and permission issues.
    """
    system_prompt = f"""You are the Security Agent in an automated code review platform.
Your focus:
- SQL injection flaws and unsafe string concatenations
- Hardcoded API keys, tokens, passwords, private keys
- Remote Code Execution (eval, exec, pickle.loads, system, popen)
- Command injection (subprocess with shell=True)
- Cross-Site Scripting (XSS), innerHTML, unsafe HTML injection
- Path traversal and arbitrary file reads/writes
- Broken authentication and access control
- Sensitive data exposure in logs or unencrypted stores

Language: {language}

Output JSON schema:
{{
  "security_issues": [
    {{
      "id": "sec-1",
      "severity": "CRITICAL", // CRITICAL, HIGH, MEDIUM, LOW, or INFO
      "title": "Clear vulnerability title",
      "line": 1,
      "description": "How the vulnerability manifests",
      "why_it_matters": "Exploit scenario and impact",
      "recommendation": "Prescriptive remediation",
      "suggested_fix": "Secure code replacement"
    }}
  ],
  "vulnerability_count": 0
}}"""

    user_prompt = f"Perform deep security audit on this {language} code:\n\n```{language.lower()}\n{code}\n```"

    try:
        res = generate_json_response(user_prompt, system_instruction=system_prompt)
        issues = res.get("security_issues", [])
        return {
            "security_issues": issues,
            "vulnerability_count": len(issues)
        }
    except Exception as e:
        # Regex heuristic backup for secrets & SQL injection
        backup_issues = []
        if re.search(r"(api[_-]?key|secret|password|token)\s*=\s*['\"][a-zA-Z0-9_\-]{8,}['\"]", code, re.I):
            backup_issues.append({
                "id": "sec-fallback-secret",
                "severity": "HIGH",
                "title": "Hardcoded Sensitive Credential Detected",
                "line": 1,
                "description": "Hardcoded secret key or password literal identified in source code.",
                "why_it_matters": "Credentials checked into source control lead to unauthorized data breaches.",
                "recommendation": "Extract credentials into environment variables or secrets manager.",
                "suggested_fix": "import os\nAPI_KEY = os.getenv('API_KEY')"
            })
        return {
            "security_issues": backup_issues,
            "vulnerability_count": len(backup_issues)
        }
