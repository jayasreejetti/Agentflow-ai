import os
import re
from typing import Dict, Any, List
from app.core.config import settings

# Prompt injection patterns to detect and neutralize in search snippets
INJECTION_PATTERNS = [
    r"(?i)ignore\s+(all\s+)?(previous|above|prior)\s+instructions",
    r"(?i)system\s*:\s*you\s+are",
    r"(?i)disregard\s+all\s+rules",
    r"(?i)override\s+(the\s+)?prompt",
    r"(?i)new\s+system\s+directive",
    r"<script[\s\S]*?</script>",
]


def sanitize_search_content(text: str) -> str:
    """Sanitize retrieved web content to mitigate prompt injection risks."""
    if not text:
        return ""
    sanitized = text
    for pattern in INJECTION_PATTERNS:
        sanitized = re.sub(pattern, "[BLOCKED_SUSPICIOUS_CONTENT]", sanitized)
    # Strip dangerous HTML or control characters
    sanitized = re.sub(r"<[^>]+>", " ", sanitized)
    sanitized = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", sanitized)
    return sanitized.strip()


def search_web(query: str, max_results: int = 5) -> Dict[str, Any]:
    """
    Search the web using Tavily API if configured, or provide realistic structured
    results with clear configuration instructions if TAVILY_API_KEY is not set.
    """
    if not query or not query.strip():
        return {"success": False, "error": "Query cannot be empty", "results": []}

    api_key = settings.TAVILY_API_KEY or os.getenv("TAVILY_API_KEY", "")

    if api_key and api_key.strip():
        try:
            from tavily import TavilyClient
            client = TavilyClient(api_key=api_key.strip())
            response = client.search(
                query=query.strip(),
                search_depth="basic",
                max_results=max_results
            )

            raw_results = response.get("results", [])
            sanitized_results = []
            sources = []

            for item in raw_results:
                clean_title = sanitize_search_content(item.get("title", ""))
                clean_content = sanitize_search_content(item.get("content", ""))
                url = item.get("url", "")
                sanitized_results.append({
                    "title": clean_title,
                    "url": url,
                    "snippet": clean_content,
                    "score": item.get("score", 0.0)
                })
                sources.append({"title": clean_title, "url": url})

            return {
                "success": True,
                "provider": "tavily",
                "is_simulated": False,
                "query": query,
                "count": len(sanitized_results),
                "results": sanitized_results,
                "sources": sources
            }
        except Exception as e:
            # Sanitize error message to ensure no API key or token is leaked
            raw_err = str(e)
            clean_err = re.sub(r"tvly-[a-zA-Z0-9_\-]+", "tvly-dev-***MASKED***", raw_err)
            clean_err = re.sub(r"(key|token|api_key)=[a-zA-Z0-9_\-]+", r"\1=***MASKED***", clean_err)
            return {
                "success": False,
                "provider": "tavily",
                "error": f"Tavily search API error: {clean_err}. Please check your TAVILY_API_KEY.",
                "query": query,
                "results": [],
                "sources": []
            }

    # Fallback when TAVILY_API_KEY is not configured
    clean_query = query.strip()
    simulated_results = _generate_structured_fallback(clean_query, max_results)

    return {
        "success": True,
        "provider": "simulated_search",
        "is_simulated": True,
        "notice": "TAVILY_API_KEY is not configured. Running in simulated search mode. Add TAVILY_API_KEY to backend/.env for live internet queries.",
        "query": clean_query,
        "count": len(simulated_results),
        "results": simulated_results,
        "sources": [{"title": r["title"], "url": r["url"]} for r in simulated_results]
    }


def _generate_structured_fallback(query: str, max_results: int) -> List[Dict[str, Any]]:
    """Generates realistic structured research knowledge for testing without Tavily API key."""
    q_lower = query.lower()
    results = []

    if any(k in q_lower for k in ["ai", "company", "companies", "openai", "anthropic", "google"]):
        results = [
            {
                "title": "OpenAI: Models, Enterprise Solutions & Pricing Overview",
                "url": "https://openai.com/research-and-pricing",
                "snippet": "OpenAI offers GPT-4o, o1, and ChatGPT Enterprise. API pricing starts at $2.50 per 1M input tokens for GPT-4o and $10.00 for output tokens. Key features: advanced multimodality, function calling, code interpreter, and custom GPT builder."
            },
            {
                "title": "Anthropic: Claude 3.5 Sonnet & Claude 3 Opus Benchmarks & Architecture",
                "url": "https://anthropic.com/claude-enterprise",
                "snippet": "Anthropic specializes in Constitutional AI and safety-first LLMs. Claude 3.5 Sonnet leads in software engineering, complex reasoning, and 200k token context window. Pricing is $3 per 1M input tokens and $15 per 1M output tokens with Artifacts UI."
            },
            {
                "title": "Google DeepMind & Gemini 1.5 Pro: Multimodal Intelligence",
                "url": "https://deepmind.google/technologies/gemini",
                "snippet": "Google Gemini 1.5 Pro features a breakthrough 2-million token context window, native audio/video multimodal processing, and Google Cloud Vertex AI integration. Pay-as-you-go pricing: $1.25 per 1M input tokens (<128k prompt)."
            }
        ]
    elif any(k in q_lower for k in ["price", "pricing", "cost", "roi", "calculator"]):
        results = [
            {
                "title": "Cloud AI Infrastructure and Compute Cost Comparison",
                "url": "https://tech-benchmark.org/ai-costs",
                "snippet": "Standard GPU compute hourly rates: H100 SXM clusters average $3.20-$4.50/GPU hour. Token-based API usage typically yields 60-80% lower total cost of ownership (TCO) compared to self-hosted dedicated model serving."
            },
            {
                "title": "Enterprise LLM Deployment Economics & ROI Analysis",
                "url": "https://ai-economics-review.com/roi-guide",
                "snippet": "Organizations report average ROI within 4.2 months when automating customer workflows and document summarization. Key cost factors: prompt caching, batch API discounts (50% off), and token output management."
            }
        ]
    else:
        results = [
            {
                "title": f"Market Research & Technical Analysis: {query.title()}",
                "url": f"https://global-tech-index.org/research?q={query.replace(' ', '+')}",
                "snippet": f"Comprehensive industry report examining {query}. Modern implementations emphasize autonomous agent orchestration, modular tool execution, and continuous validation pipelines."
            },
            {
                "title": f"Industry Standards and Best Practices for {query.title()}",
                "url": f"https://standards-tracker.io/topic/{query.replace(' ', '-')}",
                "snippet": f"Key benchmarks, architectural patterns, and comparative metrics regarding {query}. Highlights include automated evaluation nodes and human-in-the-loop safeguards."
            }
        ]

    return results[:max_results]

