from typing import Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

try:
    from ..database import get_db
    from ..models import Dataset
    from ..schemas import IngestionResponse
    from ..services.cleaner import clean_file_data
except (ImportError, ValueError):
    from app.database import get_db
    from app.models import Dataset
    from app.schemas import IngestionResponse
    from app.services.cleaner import clean_file_data

router = APIRouter()


@router.post(
    "/",
    response_model=IngestionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Ingest and clean raw CSV/Excel dataset",
    description="Uploads a CSV or Excel dataset, executes automated cleaning pipeline, persists dataset metadata, and returns cleaning metrics."
)
@router.post(
    "",
    response_model=IngestionResponse,
    status_code=status.HTTP_201_CREATED,
    include_in_schema=False
)
async def ingest_dataset(
    file: UploadFile = File(..., description="CSV or Excel file to be ingested and cleaned"),
    workspace_id: Optional[int] = Form(None, description="Optional associated workspace ID"),
    db: Session = Depends(get_db)
):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename is missing or invalid."
        )

    # Validate file extension
    lower_filename = file.filename.lower()
    if not (lower_filename.endswith(".csv") or lower_filename.endswith(".xlsx") or lower_filename.endswith(".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type for '{file.filename}'. Supported formats: .csv, .xlsx, .xls"
        )

    try:
        file_bytes = await file.read()
        if len(file_bytes) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty."
            )

        # Run automated cleaning pipeline
        cleaned_result = clean_file_data(file_bytes=file_bytes, filename=file.filename)

        # Persist Dataset entry into SQLite database
        dataset_record = Dataset(
            filename=file.filename,
            workspace_id=workspace_id,
            row_count=cleaned_result["row_count"],
            cleaned_at=cleaned_result["cleaned_at"],
            cleaning_log=cleaned_result["cleaning_log"]
        )
        db.add(dataset_record)
        db.commit()
        db.refresh(dataset_record)

        return IngestionResponse(
            dataset_id=dataset_record.id,
            filename=dataset_record.filename,
            workspace_id=dataset_record.workspace_id,
            row_count=cleaned_result["row_count"],
            rows_processed=cleaned_result["row_count"],
            columns=cleaned_result["columns"],
            cleaning_log=cleaned_result["cleaning_log"],
            cleaned_at=cleaned_result["cleaned_at"],
            preview=cleaned_result["preview"]
        )

    except HTTPException:
        raise
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing file ingestion: {str(exc)}"
        )
