from typing import TypedDict, List, Dict, Any
from .code_agent import analyze_code_structure
from .security_agent import analyze_security_vulnerabilities
from .quality_agent import analyze_quality_and_performance
from .rag_agent import retrieve_rag_standards
from .review_agent import orchestrate_final_review

class CodeReviewState(TypedDict):
    code: str
    language: str
    code_analysis: dict
    security_analysis: dict
    quality_analysis: dict
    rag_context: list
    final_review: dict
    agent_activity: list

def code_analysis_node(state: CodeReviewState) -> dict:
    code = state["code"]
    lang = state["language"]
    result = analyze_code_structure(code, lang)
    activity = state.get("agent_activity", [])
    activity.append({
        "agent": "Code Analyzer Agent",
        "status": "Completed",
        "details": f"Analyzed syntax and logic; identified {len(result.get('bugs', []))} potential bugs."
    })
    return {"code_analysis": result, "agent_activity": activity}

def security_analysis_node(state: CodeReviewState) -> dict:
    code = state["code"]
    lang = state["language"]
    result = analyze_security_vulnerabilities(code, lang)
    activity = state.get("agent_activity", [])
    activity.append({
        "agent": "Security Agent",
        "status": "Completed",
        "details": f"Scanned OWASP Top 10 vulnerabilities; detected {result.get('vulnerability_count', 0)} security findings."
    })
    return {"security_analysis": result, "agent_activity": activity}

def quality_performance_node(state: CodeReviewState) -> dict:
    code = state["code"]
    lang = state["language"]
    result = analyze_quality_and_performance(code, lang)
    activity = state.get("agent_activity", [])
    activity.append({
        "agent": "Quality & Performance Agent",
        "status": "Completed",
        "details": f"Evaluated algorithmic complexity, style standards, and maintainability metrics."
    })
    return {"quality_analysis": result, "agent_activity": activity}

def rag_node(state: CodeReviewState) -> dict:
    code = state["code"]
    lang = state["language"]
    result = retrieve_rag_standards(code, lang)
    activity = state.get("agent_activity", [])
    top_score = result[0]["relevance"] if result else 0
    activity.append({
        "agent": "RAG Agent",
        "status": "Completed",
        "details": f"Retrieved {len(result)} relevant coding standards with top match {top_score}%."
    })
    return {"rag_context": result, "agent_activity": activity}

def final_review_node(state: CodeReviewState) -> dict:
    code = state["code"]
    lang = state["language"]
    code_res = state.get("code_analysis", {})
    sec_res = state.get("security_analysis", {})
    qual_res = state.get("quality_analysis", {})
    rag_res = state.get("rag_context", [])
    
    result = orchestrate_final_review(
        code=code,
        language=lang,
        code_analysis=code_res,
        security_analysis=sec_res,
        quality_analysis=qual_res,
        rag_context=rag_res
    )
    activity = state.get("agent_activity", [])
    activity.append({
        "agent": "Review Orchestrator",
        "status": "Completed",
        "details": f"Synthesized final report with score {result.get('overall_score', 85)}/100 and refined source code."
    })
    return {"final_review": result, "agent_activity": activity}

def build_code_review_graph():
    """
    Constructs the LangGraph state machine workflow.
    """
    try:
        from langgraph.graph import StateGraph, END
        workflow = StateGraph(CodeReviewState)

        # Register nodes
        workflow.add_node("code_analyzer", code_analysis_node)
        workflow.add_node("security_agent", security_analysis_node)
        workflow.add_node("quality_performance", quality_performance_node)
        workflow.add_node("rag_agent", rag_node)
        workflow.add_node("final_reviewer", final_review_node)

        # Configure edges
        workflow.set_entry_point("code_analyzer")
        workflow.add_edge("code_analyzer", "security_agent")
        workflow.add_edge("security_agent", "quality_performance")
        workflow.add_edge("quality_performance", "rag_agent")
        workflow.add_edge("rag_agent", "final_reviewer")
        workflow.add_edge("final_reviewer", END)

        return workflow.compile()
    except ImportError:
        return None

def execute_review_pipeline(code: str, language: str = "Python") -> Dict[str, Any]:
    """
    Executes the entire multi-agent review graph.
    """
    initial_state: CodeReviewState = {
        "code": code,
        "language": language,
        "code_analysis": {},
        "security_analysis": {},
        "quality_analysis": {},
        "rag_context": [],
        "final_review": {},
        "agent_activity": []
    }

    graph = build_code_review_graph()
    if graph:
        final_state = graph.invoke(initial_state)
        return final_state
    
    # Direct sequential workflow if LangGraph is not present
    s1 = code_analysis_node(initial_state)
    initial_state.update(s1)
    
    s2 = security_analysis_node(initial_state)
    initial_state.update(s2)
    
    s3 = quality_performance_node(initial_state)
    initial_state.update(s3)
    
    s4 = rag_node(initial_state)
    initial_state.update(s4)
    
    s5 = final_review_node(initial_state)
    initial_state.update(s5)
    
    return initial_state
