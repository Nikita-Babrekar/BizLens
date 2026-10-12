# import io
# import re
# from datetime import datetime, timezone
# from typing import Any, Dict, List, Tuple
# import numpy as np
# import pandas as pd


# # Keywords to assist date/time column detection
# DATE_KEYWORDS = {
#     "date", "time", "timestamp", "datetime", "created", "created_at",
#     "updated", "updated_at", "order_date", "invoice_date", "purchase_date",
#     "period", "day", "month", "year", "dob"
# }


# def is_date_column(series: pd.Series, col_name: str) -> bool:
#     """
#     Heuristic to determine if a column should be treated and formatted as a datetime column.
#     """
#     col_lower = col_name.lower().strip()
    
#     # Already datetime type
#     if pd.api.types.is_datetime64_any_dtype(series):
#         return True

#     # If column is purely numeric and doesn't explicitly have a date name, avoid parsing as date
#     if pd.api.types.is_numeric_dtype(series):
#         if any(keyword in col_lower for keyword in ["timestamp", "date_epoch", "order_date"]):
#             # Check if values could be unix timestamp in reasonable range
#             sample = series.dropna().head(10)
#             if not sample.empty and sample.min() > 1000000000:
#                 return True
#         return False

#     # Check if column name strongly implies a date
#     has_date_keyword = any(keyword in col_lower for keyword in DATE_KEYWORDS)

#     # Inspect non-null string values
#     non_nulls = series.dropna().astype(str).str.strip()
#     non_nulls = non_nulls[~non_nulls.str.lower().isin(["none", "null", "nan", ""])]
#     if non_nulls.empty:
#         return has_date_keyword

#     sample = non_nulls.head(25)
    
#     # Fast check: If strings are simple integers or floats without separators like - or / or :, skip unless date keyword
#     if not has_date_keyword:
#         if all(re.match(r"^-?\d+(\.\d+)?$", val) for val in sample):
#             return False

#     try:
#         # Try parsing sample
#         parsed = pd.to_datetime(sample, errors="coerce", format="mixed")
#         valid_ratio = parsed.notna().sum() / len(sample)
#         return valid_ratio >= 0.75
#     except Exception:
#         return False


# def clean_dataframe(df: pd.DataFrame) -> Tuple[pd.DataFrame, List[Dict[str, Any]]]:
#     """
#     Executes automated cleaning pipeline on a pandas DataFrame:
#     1. Removes exact duplicate rows and logs the count.
#     2. Automatically detects date/time columns and formats them to ISO datetime.
#     3. Handles missing numeric values by filling with 0 and text values with 'Unknown'.
#     """
#     cleaning_log: List[Dict[str, Any]] = []

#     # 1. Remove exact duplicate rows
#     initial_rows = len(df)
#     duplicates_count = int(df.duplicated().sum())
#     if duplicates_count > 0:
#         df = df.drop_duplicates().reset_index(drop=True)
#         cleaning_log.append({
#             "action": "remove_duplicates",
#             "count": duplicates_count,
#             "message": f"Removed {duplicates_count} exact duplicate row(s). Row count reduced from {initial_rows} to {len(df)}."
#         })
#     else:
#         cleaning_log.append({
#             "action": "remove_duplicates",
#             "count": 0,
#             "message": "Scanned for exact duplicates; 0 duplicate rows found."
#         })

#     # 2. Detect date/time columns and format them
#     for col in list(df.columns):
#         if is_date_column(df[col], str(col)):
#             try:
#                 # Convert to standard datetime
#                 parsed_dates = pd.to_datetime(df[col], errors="coerce", format="mixed")
                
#                 # Check how many were successfully parsed
#                 valid_count = int(parsed_dates.notna().sum())
#                 if valid_count > 0:
#                     # Format standard string representation for clean serialization
#                     formatted_dates = parsed_dates.dt.strftime("%Y-%m-%d %H:%M:%S")
                    
#                     # Preserve originally empty ones as NaN for subsequent text fill if needed
#                     df[col] = formatted_dates.where(parsed_dates.notna(), np.nan)
#                     cleaning_log.append({
#                         "action": "detect_and_format_datetime",
#                         "column": str(col),
#                         "count": valid_count,
#                         "message": f"Detected date/time in column '{col}' and formatted {valid_count} entries to standard datetime (YYYY-MM-DD HH:MM:SS)."
#                     })
#             except Exception as e:
#                 cleaning_log.append({
#                     "action": "detect_and_format_datetime_failed",
#                     "column": str(col),
#                     "message": f"Attempted datetime conversion on '{col}' but encountered error: {str(e)}."
#                 })

#     # 3. Handle missing numeric values by filling with 0
#     numeric_cols = df.select_dtypes(include=[np.number]).columns
#     for col in numeric_cols:
#         missing_count = int(df[col].isna().sum())
#         if missing_count > 0:
#             df[col] = df[col].fillna(0)
#             cleaning_log.append({
#                 "action": "fill_missing_numeric",
#                 "column": str(col),
#                 "count": missing_count,
#                 "fill_value": 0,
#                 "message": f"Filled {missing_count} missing numeric values in column '{col}' with 0."
#             })

#     # 4. Handle missing text/object values by filling with 'Unknown'
#     text_cols = [c for c in df.columns if c not in numeric_cols]
#     for col in text_cols:
#         missing_count = int(df[col].isna().sum())
#         if missing_count > 0:
#             df[col] = df[col].fillna("Unknown")
#             cleaning_log.append({
#                 "action": "fill_missing_text",
#                 "column": str(col),
#                 "count": missing_count,
#                 "fill_value": "Unknown",
#                 "message": f"Filled {missing_count} missing text/categorical values in column '{col}' with 'Unknown'."
#             })

#     return df, cleaning_log


# def parse_file_to_dataframe(file_bytes: bytes, filename: str) -> pd.DataFrame:
#     """
#     Parses uploaded CSV or Excel file bytes into a Pandas DataFrame.
#     """
#     lower_filename = filename.lower()
#     buffer = io.BytesIO(file_bytes)

#     if lower_filename.endswith(".csv"):
#         encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]
#         for encoding in encodings:
#             try:
#                 buffer.seek(0)
#                 return pd.read_csv(buffer, encoding=encoding)
#             except (UnicodeDecodeError, pd.errors.ParserError):
#                 continue
#         # If all fail, fallback with replace errors
#         buffer.seek(0)
#         return pd.read_csv(buffer, encoding="utf-8", encoding_errors="replace")

#     elif lower_filename.endswith((".xlsx", ".xls")):
#         buffer.seek(0)
#         engine = "openpyxl" if lower_filename.endswith(".xlsx") else None
#         return pd.read_excel(buffer, engine=engine)

#     else:
#         raise ValueError(
#             f"Unsupported file format '{filename}'. Please upload a CSV (.csv) or Excel (.xlsx, .xls) file."
#         )


# def clean_file_data(file_bytes: bytes, filename: str) -> Dict[str, Any]:
#     """
#     Full automated cleaning pipeline:
#     - Parses CSV/Excel
#     - Cleans duplicates, detects dates, fills missing values
#     - Returns structured metadata, logs, and preview records
#     """
#     df = parse_file_to_dataframe(file_bytes, filename)
#     df_cleaned, cleaning_log = clean_dataframe(df)

#     # Generate preview (first 10 records)
#     preview_df = df_cleaned.head(10).replace({np.nan: None})
#     preview_records = preview_df.to_dict(orient="records")

#     return {
#         "df": df_cleaned,
#         "filename": filename,
#         "row_count": len(df_cleaned),
#         "columns": [str(c) for c in df_cleaned.columns],
#         "cleaning_log": cleaning_log,
#         "cleaned_at": datetime.now(timezone.utc),
#         "preview": preview_records
#     }



import io
import re
from datetime import datetime, timezone
from typing import Any, Dict, List, Tuple
import numpy as np
import pandas as pd


# Keywords to assist date/time column detection
DATE_KEYWORDS = {
    "date", "time", "timestamp", "datetime", "created", "created_at",
    "updated", "updated_at", "order_date", "invoice_date", "purchase_date",
    "period", "day", "month", "year", "dob"
}


def is_date_column(series: pd.Series, col_name: str) -> bool:
    """
    Memory-efficient heuristic to determine if a column should be treated as a datetime column.
    """
    col_lower = col_name.lower().strip()
    
    # Already datetime type
    if pd.api.types.is_datetime64_any_dtype(series):
        return True

    # If column is purely numeric and doesn't explicitly have a date name, avoid parsing as date
    if pd.api.types.is_numeric_dtype(series):
        if any(keyword in col_lower for keyword in ["timestamp", "date_epoch", "order_date"]):
            sample = series.dropna().head(10)
            if not sample.empty and sample.min() > 1000000000:
                return True
        return False

    has_date_keyword = any(keyword in col_lower for keyword in DATE_KEYWORDS)

    # Sample only up to 50 non-null values to conserve memory and avoid segfaults
    non_nulls = series.dropna().astype(str).str.strip()
    non_nulls = non_nulls[~non_nulls.str.lower().isin(["none", "null", "nan", ""])]
    if non_nulls.empty:
        return has_date_keyword

    sample = non_nulls.head(50)
    
    if not has_date_keyword:
        if all(re.match(r"^-?\d+(\.\d+)?$", val) for val in sample):
            return False

    try:
        parsed = pd.to_datetime(sample, errors="coerce", format="mixed")
        valid_ratio = parsed.notna().sum() / len(sample)
        return valid_ratio >= 0.75
    except Exception:
        return False


def clean_dataframe(df: pd.DataFrame) -> Tuple[pd.DataFrame, List[Dict[str, Any]]]:
    """
    Executes automated cleaning pipeline on a pandas DataFrame with low memory overhead:
    1. Removes exact duplicate rows and logs the count.
    2. Automatically detects date/time columns and formats them to ISO datetime.
    3. Handles missing numeric values by filling with 0 and text values with 'Unknown'.
    """
    cleaning_log: List[Dict[str, Any]] = []

    # 1. Remove exact duplicate rows
    initial_rows = len(df)
    duplicates_count = int(df.duplicated().sum())
    if duplicates_count > 0:
        df = df.drop_duplicates().reset_index(drop=True)
        cleaning_log.append({
            "action": "remove_duplicates",
            "count": duplicates_count,
            "message": f"Removed {duplicates_count} exact duplicate row(s). Row count reduced from {initial_rows} to {len(df)}."
        })
    else:
        cleaning_log.append({
            "action": "remove_duplicates",
            "count": 0,
            "message": "Scanned for exact duplicates; 0 duplicate rows found."
        })

    # 2. Detect date/time columns and format them safely
    for col in list(df.columns):
        if is_date_column(df[col], str(col)):
            try:
                parsed_dates = pd.to_datetime(df[col], errors="coerce", format="mixed")
                valid_count = int(parsed_dates.notna().sum())
                if valid_count > 0:
                    formatted_dates = parsed_dates.dt.strftime("%Y-%m-%d %H:%M:%S")
                    df[col] = formatted_dates.where(parsed_dates.notna(), np.nan)
                    cleaning_log.append({
                        "action": "detect_and_format_datetime",
                        "column": str(col),
                        "count": valid_count,
                        "message": f"Detected date/time in column '{col}' and formatted {valid_count} entries to standard datetime (YYYY-MM-DD HH:MM:SS)."
                    })
            except Exception as e:
                cleaning_log.append({
                    "action": "detect_and_format_datetime_failed",
                    "column": str(col),
                    "message": f"Attempted datetime conversion on '{col}' but encountered error: {str(e)}."
                })

    # 3. Handle missing numeric values by filling with 0
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        missing_count = int(df[col].isna().sum())
        if missing_count > 0:
            df[col] = df[col].fillna(0)
            cleaning_log.append({
                "action": "fill_missing_numeric",
                "column": str(col),
                "count": missing_count,
                "fill_value": 0,
                "message": f"Filled {missing_count} missing numeric values in column '{col}' with 0."
            })

    # 4. Handle missing text/object values by filling with 'Unknown'
    text_cols = [c for c in df.columns if c not in numeric_cols]
    for col in text_cols:
        missing_count = int(df[col].isna().sum())
        if missing_count > 0:
            df[col] = df[col].fillna("Unknown")
            cleaning_log.append({
                "action": "fill_missing_text",
                "column": str(col),
                "count": missing_count,
                "fill_value": "Unknown",
                "message": f"Filled {missing_count} missing text/categorical values in column '{col}' with 'Unknown'."
            })

    return df, cleaning_log


def parse_file_to_dataframe(file_bytes: bytes, filename: str) -> pd.DataFrame:
    """
    Parses uploaded CSV or Excel file bytes into a Pandas DataFrame.
    """
    lower_filename = filename.lower()
    buffer = io.BytesIO(file_bytes)

    if lower_filename.endswith(".csv"):
        encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]
        for encoding in encodings:
            try:
                buffer.seek(0)
                return pd.read_csv(buffer, encoding=encoding)
            except (UnicodeDecodeError, pd.errors.ParserError):
                continue
        buffer.seek(0)
        return pd.read_csv(buffer, encoding="utf-8", encoding_errors="replace")

    elif lower_filename.endswith((".xlsx", ".xls")):
        buffer.seek(0)
        engine = "openpyxl" if lower_filename.endswith(".xlsx") else None
        return pd.read_excel(buffer, engine=engine)

    else:
        raise ValueError(
            f"Unsupported file format '{filename}'. Please upload a CSV (.csv) or Excel (.xlsx, .xls) file."
        )


def clean_file_data(file_bytes: bytes, filename: str) -> Dict[str, Any]:
    """
    Full automated cleaning pipeline with memory optimization:
    - Parses CSV/Excel
    - Cleans duplicates, detects dates, fills missing values
    - Returns structured metadata, logs, and preview records
    """
    df = parse_file_to_dataframe(file_bytes, filename)
    df_cleaned, cleaning_log = clean_dataframe(df)

    # Generate preview (first 10 records) safely
    preview_df = df_cleaned.head(10).replace({np.nan: None})
    preview_records = preview_df.to_dict(orient="records")

    return {
        "df": df_cleaned,
        "filename": filename,
        "row_count": len(df_cleaned),
        "columns": [str(c) for c in df_cleaned.columns],
        "cleaning_log": cleaning_log,
        "cleaned_at": datetime.now(timezone.utc),
        "preview": preview_records
    }