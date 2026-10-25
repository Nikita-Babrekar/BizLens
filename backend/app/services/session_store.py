import threading
from typing import Any, Dict, List, Optional
import pandas as pd


_lock = threading.Lock()
_active_dataframe: Optional[pd.DataFrame] = None
_active_dataset_id: Optional[int] = None
_dataset_cache: Dict[int, pd.DataFrame] = {}


def set_active_dataset(df: pd.DataFrame, dataset_id: Optional[int] = None) -> None:
    """Stores the active DataFrame in session memory and in dataset cache if ID provided."""
    global _active_dataframe, _active_dataset_id
    with _lock:
        _active_dataframe = df.copy(deep=True)
        _active_dataset_id = dataset_id
        if dataset_id is not None:
            _dataset_cache[dataset_id] = _active_dataframe


def get_active_dataset(dataset_id: Optional[int] = None) -> Optional[pd.DataFrame]:
    """Retrieves dataset by ID or returns the currently active session DataFrame."""
    with _lock:
        if dataset_id is not None and dataset_id in _dataset_cache:
            return _dataset_cache[dataset_id]
        return _active_dataframe


def clear_active_dataset(dataset_id: Optional[int] = None) -> None:
    """Clears the active session DataFrame or specified dataset cache entry."""
    global _active_dataframe, _active_dataset_id
    with _lock:
        if dataset_id is not None:
            _dataset_cache.pop(dataset_id, None)
            if _active_dataset_id == dataset_id:
                _active_dataframe = None
                _active_dataset_id = None
        else:
            _active_dataframe = None
            _active_dataset_id = None


def get_session_info() -> Dict[str, Any]:
    """Returns metadata about the active session DataFrame."""
    with _lock:
        if _active_dataframe is not None:
            return {
                "active_dataset": True,
                "dataset_id": _active_dataset_id,
                "row_count": len(_active_dataframe),
                "columns": [str(c) for c in _active_dataframe.columns]
            }
        return {
            "active_dataset": False,
            "dataset_id": None,
            "row_count": 0,
            "columns": []
        }
