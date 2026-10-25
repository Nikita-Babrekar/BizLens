'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import {
  IngestionResponse,
  KPISummary,
  fetchActiveOverviewKPIs,
  fetchOverviewKPIs,
} from '@/lib/api';

export interface DatasetContextType {
  uploadedData: IngestionResponse | null;
  datasetHistory: IngestionResponse[];
  metrics: KPISummary | null;
  setUploadedData: (data: IngestionResponse | null) => void;
  selectDataset: (dataset: IngestionResponse) => Promise<void>;
  setMetrics: (metrics: KPISummary | null) => void;
  isLoadingMetrics: boolean;
  metricsError: string | null;
  fetchMetricsForDataset: (data: IngestionResponse) => Promise<KPISummary | null>;
  clearDataset: () => void;
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined);

const STORAGE_KEY_UPLOAD = 'bizlens_uploaded_data';
const STORAGE_KEY_METRICS = 'bizlens_metrics_data';
const STORAGE_KEY_HISTORY = 'bizlens_dataset_history';

const DEFAULT_SAMPLE_DATASETS: IngestionResponse[] = [
  {
    dataset_id: 101,
    filename: 'retail_sales_q3_2024.csv',
    row_count: 1248,
    rows_processed: 1248,
    columns: ['order_id', 'date', 'gross_sales', 'region', 'product_category'],
    cleaning_log: [],
    cleaned_at: new Date().toISOString(),
  },
  {
    dataset_id: 102,
    filename: 'mumbai_outlet_orders.csv',
    row_count: 840,
    rows_processed: 840,
    columns: ['invoice_no', 'timestamp', 'revenue', 'payment_mode', 'item_name'],
    cleaning_log: [],
    cleaned_at: new Date(Date.now() - 86400000).toISOString(),
  },
];

export function DatasetProvider({ children }: { children: ReactNode }) {
  const [uploadedData, setUploadedDataState] = useState<IngestionResponse | null>(null);
  const [datasetHistory, setDatasetHistory] = useState<IngestionResponse[]>(DEFAULT_SAMPLE_DATASETS);
  const [metrics, setMetricsState] = useState<KPISummary | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  // Hydrate from sessionStorage on initial client mount
  useEffect(() => {
    try {
      const savedUpload = sessionStorage.getItem(STORAGE_KEY_UPLOAD);
      if (savedUpload) {
        const parsed = JSON.parse(savedUpload) as IngestionResponse;
        setUploadedDataState(parsed);
      }

      const savedHistory = sessionStorage.getItem(STORAGE_KEY_HISTORY);
      if (savedHistory) {
        const parsedHist = JSON.parse(savedHistory) as IngestionResponse[];
        if (Array.isArray(parsedHist) && parsedHist.length > 0) {
          setDatasetHistory(parsedHist);
        }
      }

      const savedMetrics = sessionStorage.getItem(STORAGE_KEY_METRICS);
      if (savedMetrics) {
        const parsedMetrics = JSON.parse(savedMetrics) as KPISummary;
        setMetricsState(parsedMetrics);
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, []);

  const setUploadedData = useCallback((data: IngestionResponse | null) => {
    setUploadedDataState(data);
    try {
      if (data) {
        sessionStorage.setItem(STORAGE_KEY_UPLOAD, JSON.stringify(data));
        setDatasetHistory((prev) => {
          const filtered = prev.filter(
            (d) => d.filename !== data.filename && d.dataset_id !== data.dataset_id
          );
          const updated = [data, ...filtered].slice(0, 8);
          try {
            sessionStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updated));
          } catch {
            // ignore
          }
          return updated;
        });
      } else {
        sessionStorage.removeItem(STORAGE_KEY_UPLOAD);
      }
    } catch {
      // storage unavailable
    }
  }, []);

  const setMetrics = useCallback((newMetrics: KPISummary | null) => {
    setMetricsState(newMetrics);
    try {
      if (newMetrics) {
        sessionStorage.setItem(STORAGE_KEY_METRICS, JSON.stringify(newMetrics));
      } else {
        sessionStorage.removeItem(STORAGE_KEY_METRICS);
      }
    } catch {
      // storage unavailable
    }
  }, []);

  const clearDataset = useCallback(() => {
    setUploadedData(null);
    setMetrics(null);
    setMetricsError(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY_UPLOAD);
      sessionStorage.removeItem(STORAGE_KEY_METRICS);
    } catch {
      // ignore
    }
  }, [setUploadedData, setMetrics]);

  const fetchMetricsForDataset = useCallback(
    async (dataset: IngestionResponse): Promise<KPISummary | null> => {
      setIsLoadingMetrics(true);
      setMetricsError(null);

      try {
        let computed: KPISummary | null = null;

        // 1. Try fetching directly from active backend session
        try {
          computed = await fetchActiveOverviewKPIs(dataset.dataset_id ?? undefined);
        } catch {
          // If active session fetch failed, attempt fallback via preview payload
          if (dataset.preview && dataset.preview.length > 0) {
            computed = await fetchOverviewKPIs({
              data: dataset.preview,
              dataset_id: dataset.dataset_id ?? undefined,
            });
          }
        }

        if (computed) {
          setMetrics(computed);
          return computed;
        }

        throw new Error('Could not calculate KPIs from backend.');
      } catch (err: any) {
        const message = err?.message || 'Failed to calculate live overview metrics.';
        setMetricsError(message);
        return null;
      } finally {
        setIsLoadingMetrics(false);
      }
    },
    [setMetrics]
  );

  const selectDataset = useCallback(
    async (dataset: IngestionResponse) => {
      setUploadedData(dataset);
      await fetchMetricsForDataset(dataset);
    },
    [setUploadedData, fetchMetricsForDataset]
  );

  return (
    <DatasetContext.Provider
      value={{
        uploadedData,
        metrics,
        setUploadedData,
        setMetrics,
        isLoadingMetrics,
        metricsError,
        fetchMetricsForDataset,
        clearDataset,
      }}
    >
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset(): DatasetContextType {
  const context = useContext(DatasetContext);
  if (!context) {
    throw new Error('useDataset must be used within a DatasetProvider');
  }
  return context;
}
