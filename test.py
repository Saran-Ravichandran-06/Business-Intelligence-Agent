import sys
import os
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.path.insert(0, os.path.abspath('.'))

from backend.agent.query_analyzer import _deterministic_parse
from backend.agent.insight_generator import _fallback_insight

queries = [
    "Show revenue trend",
    "Compare revenue between East and West regions",
    "Why was revenue lower in February compared to January?",
    "Predict next month's revenue",
    "Which region generated the highest revenue?",
    "Which product generated the highest total profit?",
    "Predict the revenue for the next 30 days based on historical data.",
]

print("=" * 60)
print("DETERMINISTIC PARSING TESTS")
print("=" * 60)
for q in queries:
    res = _deterministic_parse(q)
    if res:
        print(f"\nQuery: {q}")
        print(f"  -> {res.model_dump()}")
    else:
        print(f"\nQuery: {q}")
        print(f"  -> None (would fall back to LLM)")

print("\n" + "=" * 60)
print("INSIGHT FORMATTING TESTS")
print("=" * 60)

# Forecast
results_forecast = {
    "predicted_revenue": 263646.5000000001,
    "forecast_period": "next_period"
}
insight = _fallback_insight("forecast", results_forecast)
print(f"\nForecast insight:\n  {insight}")

# Diagnostic
results_diag = {
    "change_percent": -15.4234,
    "top_contributor": "East"
}
insight2 = _fallback_insight("diagnostic", results_diag)
print(f"\nDiagnostic insight:\n  {insight2}")

# Ranking - region
results_rank_region = {
    "top_region": "South",
    "revenue": 250000.0
}
insight3 = _fallback_insight("ranking", results_rank_region)
print(f"\nRanking (region) insight:\n  {insight3}")

# Ranking - product
results_rank_product = {
    "top_product": "Product A",
    "profit": 52000.0
}
insight4 = _fallback_insight("ranking", results_rank_product)
print(f"\nRanking (product) insight:\n  {insight4}")