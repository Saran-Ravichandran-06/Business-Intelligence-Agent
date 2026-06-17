from fastapi import APIRouter, HTTPException

from backend.services.dashboard_service import (
    DashboardError,
    calculate_kpis,
    region_analysis,
    revenue_trend_analysis,
    top_products_analysis,
)
from backend.services.dataset_service import DatasetNotFoundError

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/kpis")
def get_kpis() -> dict:
  try:
      kpis = calculate_kpis()
      return {
          "total_revenue": kpis.total_revenue,
          "total_orders": kpis.total_orders,
          "total_profit": kpis.total_profit,
          "unique_products": kpis.unique_products,
      }
  except DatasetNotFoundError as exc:
      raise HTTPException(status_code=404, detail=str(exc)) from exc
  except DashboardError as exc:
      raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/revenue-trend")
def get_revenue_trend() -> dict:
  try:
      points = revenue_trend_analysis()
      return {"points": points}
  except DatasetNotFoundError as exc:
      raise HTTPException(status_code=404, detail=str(exc)) from exc
  except DashboardError as exc:
      raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/top-products")
def get_top_products() -> dict:
  try:
      items = top_products_analysis()
      return {"items": items}
  except DatasetNotFoundError as exc:
      raise HTTPException(status_code=404, detail=str(exc)) from exc
  except DashboardError as exc:
      raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/regions")
def get_regions() -> dict:
  try:
      regions = region_analysis()
      return {"regions": regions}
  except DatasetNotFoundError as exc:
      raise HTTPException(status_code=404, detail=str(exc)) from exc
  except DashboardError as exc:
      raise HTTPException(status_code=400, detail=str(exc)) from exc

