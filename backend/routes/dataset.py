from fastapi import APIRouter, File, HTTPException, UploadFile

from backend.services.dataset_service import (
    DatasetError,
    DatasetNotFoundError,
    DatasetValidationError,
    get_dataset_metadata,
    get_preview_rows,
    load_latest_dataset_path,
    save_csv,
)

router = APIRouter(prefix="", tags=["dataset"])


@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)) -> dict:
    try:
        if not file.filename:
            raise DatasetValidationError("Missing file name.")

        path = save_csv(file.file, file.filename)
        meta = get_dataset_metadata(path)
        return {
            "file_name": meta.file_name,
            "rows": meta.rows,
            "columns": meta.columns,
            "column_names": meta.column_names,
        }
    except DatasetValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except DatasetError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/dataset/preview")
def dataset_preview() -> dict:
    try:
        path = load_latest_dataset_path()
        meta = get_dataset_metadata(path)
        preview_rows = get_preview_rows(path, limit=10)
        return {
            "file_name": meta.file_name,
            "row_count": meta.rows,
            "column_count": meta.columns,
            "column_names": meta.column_names,
            "first_10_rows": preview_rows,
        }
    except DatasetNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except DatasetValidationError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except DatasetError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc
