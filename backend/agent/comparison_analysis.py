from __future__ import annotations

from typing import Any

import pandas as pd


def compute_comparison(
    df: pd.DataFrame,
    *,
    metric_col: str,
    entity_col: str,
    entity_a: str,
    entity_b: str,
) -> dict[str, Any]:
    tmp = df.copy()
    tmp[metric_col] = pd.to_numeric(tmp[metric_col], errors="coerce").fillna(0.0)
    tmp = tmp.dropna(subset=[entity_col])

    # Case-insensitive match on entities.
    def match_mask(entity: str) -> pd.Series:
        e = entity.strip().lower()
        return tmp[entity_col].astype(str).str.strip().str.lower() == e

    mask_a = match_mask(entity_a)
    mask_b = match_mask(entity_b)

    value_a = float(tmp.loc[mask_a, metric_col].sum())
    value_b = float(tmp.loc[mask_b, metric_col].sum())

    return {
        "analysis_basis": entity_col,
        "entity_a": entity_a,
        "entity_b": entity_b,
        "value_a": value_a,
        "value_b": value_b,
        "difference": value_a - value_b,
    }

