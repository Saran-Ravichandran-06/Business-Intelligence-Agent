from __future__ import annotations

import csv
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import IO, Any, Iterable


class DatasetError(Exception):
    pass


class DatasetNotFoundError(DatasetError):
    pass


class DatasetValidationError(DatasetError):
    pass


@dataclass(frozen=True)
class DatasetMetadata:
    file_name: str
    rows: int
    columns: int
    column_names: list[str]


def _uploads_dir() -> Path:
    # backend/services -> backend -> uploads
    base_dir = Path(__file__).resolve().parents[1]
    uploads = base_dir / "uploads"
    uploads.mkdir(parents=True, exist_ok=True)
    return uploads


def _latest_pointer_path() -> Path:
    return _uploads_dir() / ".latest"


def validate_csv_filename(filename: str) -> None:
    if not filename:
        raise DatasetValidationError("Missing file name.")

    if not filename.lower().endswith(".csv"):
        raise DatasetValidationError("Only .csv files are supported.")


def validate_csv_content(file_obj: IO[bytes]) -> None:
    # Basic validation: non-empty + readable as text + has header + at least 1 column.
    try:
        file_obj.seek(0, os.SEEK_END)
        size = file_obj.tell()
        file_obj.seek(0)
    except Exception as exc:  # pragma: no cover
        raise DatasetValidationError("Unable to read uploaded file.") from exc

    if size == 0:
        raise DatasetValidationError("Uploaded CSV is empty.")

    try:
        wrapper = (line.decode("utf-8") for line in file_obj)
        reader = csv.reader(wrapper)
        header = next(reader, None)
    except UnicodeDecodeError as exc:
        raise DatasetValidationError("CSV must be UTF-8 encoded.") from exc
    except csv.Error as exc:
        raise DatasetValidationError("CSV appears to be corrupted or malformed.") from exc
    finally:
        file_obj.seek(0)

    if not header:
        raise DatasetValidationError("CSV header row is missing.")

    header = [h.strip() for h in header if h is not None]
    if len(header) == 0:
        raise DatasetValidationError("CSV has no columns.")


def save_csv(file_obj: IO[bytes], original_filename: str) -> Path:
    validate_csv_filename(original_filename)
    validate_csv_content(file_obj)

    uploads = _uploads_dir()
    safe_name = Path(original_filename).name
    timestamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    saved_name = f"{timestamp}__{safe_name}"
    dest_path = uploads / saved_name

    file_obj.seek(0)
    with dest_path.open("wb") as out_f:
        while True:
            chunk = file_obj.read(1024 * 1024)
            if not chunk:
                break
            out_f.write(chunk)

    _latest_pointer_path().write_text(saved_name, encoding="utf-8")
    return dest_path


def _read_latest_filename() -> str:
    pointer = _latest_pointer_path()
    if not pointer.exists():
        raise DatasetNotFoundError("No dataset uploaded yet.")

    name = pointer.read_text(encoding="utf-8").strip()
    if not name:
        raise DatasetNotFoundError("No dataset uploaded yet.")
    return name


def load_latest_dataset_path() -> Path:
    name = _read_latest_filename()
    path = _uploads_dir() / name
    if not path.exists():
        raise DatasetNotFoundError("Latest dataset file could not be found on disk.")
    return path


def _iterate_rows(path: Path) -> tuple[list[str], Iterable[list[str]]]:
    try:
        f = path.open("r", encoding="utf-8", newline="")
    except OSError as exc:
        raise DatasetError("Unable to open dataset file.") from exc

    def row_iter(file_handle: IO[str]) -> Iterable[list[str]]:
        with file_handle:
            reader = csv.reader(file_handle)
            header = next(reader, None)
            if not header:
                raise DatasetValidationError("CSV header row is missing.")
            yield from reader

    with path.open("r", encoding="utf-8", newline="") as fh:
        reader = csv.reader(fh)
        header = next(reader, None)
        if not header:
            raise DatasetValidationError("CSV header row is missing.")

    return [h.strip() for h in header], row_iter(f)


def get_dataset_metadata(path: Path) -> DatasetMetadata:
    header, rows_iter = _iterate_rows(path)

    row_count = 0
    column_count = len(header)
    for row in rows_iter:
        if len(row) == 0:
            continue
        row_count += 1

    return DatasetMetadata(
        file_name=path.name.split("__", 1)[-1],
        rows=row_count,
        columns=column_count,
        column_names=header,
    )


def get_preview_rows(path: Path, limit: int = 10) -> list[dict[str, Any]]:
    header, rows_iter = _iterate_rows(path)

    preview: list[dict[str, Any]] = []
    for row in rows_iter:
        if len(preview) >= limit:
            break
        # Normalize row to header length
        normalized = list(row[: len(header)])
        if len(normalized) < len(header):
            normalized.extend([""] * (len(header) - len(normalized)))
        preview.append({header[i]: normalized[i] for i in range(len(header))})

    return preview
