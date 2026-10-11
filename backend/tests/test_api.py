import io
import unittest
import pandas as pd
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


class TestBizLensBackend(unittest.TestCase):
    def test_health_endpoint(self):
        response = client.get("/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")

    def test_ingest_csv_cleaning(self):
        csv_content = (
            "order_id,date,region,revenue,quantity,customer_note\n"
            "101,2024-01-15,North,150.50,2,First order\n"
            "102,2024-01-16,South,,3,\n"
            "103,2024-01-17,,300.00,,VIP\n"
            "101,2024-01-15,North,150.50,2,First order\n"
        )
        files = {"file": ("orders.csv", io.BytesIO(csv_content.encode("utf-8")), "text/csv")}
        response = client.post("/api/ingest/", files=files)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["row_count"], 3)  # 1 duplicate removed
        self.assertIn("date", data["columns"])
        self.assertTrue(any(log["action"] == "remove_duplicates" for log in data["cleaning_log"]))
        self.assertTrue(any(log["action"] == "fill_missing_numeric" for log in data["cleaning_log"]))
        self.assertTrue(any(log["action"] == "fill_missing_text" for log in data["cleaning_log"]))

    def test_ingest_excel_cleaning(self):
        df = pd.DataFrame({
            "order_id": [1, 2, 2],
            "order_date": ["2024-03-01", "2024-03-02", "2024-03-02"],
            "region": ["East", None, None],
            "amount": [120.0, None, None]
        })
        buf = io.BytesIO()
        with pd.ExcelWriter(buf, engine="openpyxl") as writer:
            df.to_excel(writer, index=False)
        
        files = {"file": ("test_orders.xlsx", io.BytesIO(buf.getvalue()), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")}
        response = client.post("/api/ingest/", files=files)
        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["row_count"], 2)

    def test_kpi_overview_calculations(self):
        payload = {
            "data": [
                {"order_id": "ORD-1", "date": "2024-01-10", "region": "North", "revenue": 100.0},
                {"order_id": "ORD-2", "date": "2024-01-11", "region": "North", "revenue": 200.0},
                {"order_id": "ORD-3", "date": "2024-01-11", "region": "South", "revenue": 150.0},
                {"order_id": "ORD-4", "date": "2024-01-12", "region": "West", "revenue": 250.0}
            ]
        }
        response = client.post("/api/overview/kpis", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total_revenue"], 700.0)
        self.assertEqual(data["average_order_value"], 175.0)
        self.assertEqual(len(data["revenue_by_region"]), 3)
        self.assertEqual(len(data["revenue_over_time"]), 3)


if __name__ == "__main__":
    unittest.main()
