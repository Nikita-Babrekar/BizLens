import io
import unittest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.services.session_store import clear_active_dataset

client = TestClient(app)


class TestOverviewRouter(unittest.TestCase):
    def setUp(self):
        clear_active_dataset()

    def tearDown(self):
        clear_active_dataset()

    def test_overview_empty_get(self):
        """GET /api/overview should return 0-values when no session dataset exists without 500 error."""
        response = client.get("/api/overview")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total_revenue"], 0.0)
        self.assertEqual(data["average_order_value"], 0.0)
        self.assertEqual(data["total_orders"], 0)
        self.assertEqual(data["revenue_by_region"], [])
        self.assertEqual(data["revenue_over_time"], [])

    def test_overview_post_and_get_session(self):
        """POST /api/overview stores dataset in active session; subsequent GET retrieves it."""
        payload = {
            "data": [
                {"order_number": "1001", "transaction_date": "2024-05-01", "sales_region": "North", "sales_amount": "$100.50"},
                {"order_number": "1002", "transaction_date": "2024-05-01", "sales_region": "South", "sales_amount": "200.00"},
                {"order_number": "1003", "transaction_date": "2024-05-02", "sales_region": "North", "sales_amount": "300.00"},
            ]
        }
        post_resp = client.post("/api/overview", json=payload)
        self.assertEqual(post_resp.status_code, 200)
        data = post_resp.json()
        self.assertEqual(data["total_revenue"], 600.5)
        self.assertEqual(data["total_orders"], 3)
        self.assertAlmostEqual(data["average_order_value"], 200.17, places=2)
        self.assertEqual(len(data["revenue_by_region"]), 2)
        self.assertEqual(len(data["revenue_over_time"]), 2)

        # Verify subsequent GET /api/overview uses active session
        get_resp = client.get("/api/overview")
        self.assertEqual(get_resp.status_code, 200)
        get_data = get_resp.json()
        self.assertEqual(get_data["total_revenue"], 600.5)

    def test_column_auto_detection_variations(self):
        """Test variations like 'Revenue', 'State', 'created_at', 'invoice_id' with currency signs and NaNs."""
        records = [
            {"invoice_id": "INV-1", "State": "California", "created_at": "2024-06-10", "Revenue": "$1,500.50"},
            {"invoice_id": "INV-2", "State": "New York", "created_at": "2024-06-11", "Revenue": "500.00"},
            {"invoice_id": "INV-3", "State": None, "created_at": None, "Revenue": None},  # Missing values
        ]
        response = client.post("/api/overview", json=records)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total_revenue"], 2000.5)
        self.assertEqual(data["total_orders"], 3)
        # Check missing state handled gracefully as 'Unknown'
        regions = {r["region"]: r["revenue"] for r in data["revenue_by_region"]}
        self.assertIn("California", regions)
        self.assertIn("New York", regions)
        self.assertIn("Unknown", regions)
        self.assertEqual(regions["California"], 1500.5)
        self.assertEqual(regions["Unknown"], 0.0)

    def test_synthesized_revenue_from_qty_and_price(self):
        """If no revenue column is given, quantity * price is computed automatically."""
        records = [
            {"order_id": "1", "qty": 2, "unit_price": 50.0, "region": "East", "date": "2024-01-01"},
            {"order_id": "2", "qty": 4, "unit_price": 25.0, "region": "West", "date": "2024-01-02"},
        ]
        response = client.post("/api/overview", json=records)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total_revenue"], 200.0)
        self.assertEqual(data["average_order_value"], 100.0)

    def test_direct_csv_upload_endpoint(self):
        """POST /api/overview/upload should accept multipart CSV file and compute KPIs."""
        csv_data = (
            "transaction_id,order_date,state,total_sales\n"
            "TX-1,2024-07-01,Texas,250.00\n"
            "TX-2,2024-07-01,Texas,150.00\n"
            "TX-3,2024-07-02,Florida,100.00\n"
        )
        files = {"file": ("sales.csv", io.BytesIO(csv_data.encode("utf-8")), "text/csv")}
        response = client.post("/api/overview/upload", files=files)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["total_revenue"], 500.0)
        self.assertEqual(data["total_orders"], 3)
        self.assertAlmostEqual(data["average_order_value"], 166.67, places=2)

    def test_supporting_metric_routes(self):
        """Verify supporting metric routes: /total-revenue, /aov, /revenue-over-time, /revenue-by-region."""
        payload = {
            "data": [
                {"id": 1, "date": "2024-08-01", "location": "EMEA", "amount": 400.0},
                {"id": 2, "date": "2024-08-02", "location": "APAC", "amount": 600.0},
            ]
        }
        # Total Revenue
        resp_rev = client.post("/api/overview/total-revenue", json=payload)
        self.assertEqual(resp_rev.status_code, 200)
        self.assertEqual(resp_rev.json()["total_revenue"], 1000.0)

        # AOV
        resp_aov = client.post("/api/overview/aov", json=payload)
        self.assertEqual(resp_aov.status_code, 200)
        self.assertEqual(resp_aov.json()["average_order_value"], 500.0)

        # Revenue Over Time
        resp_time = client.post("/api/overview/revenue-over-time", json=payload)
        self.assertEqual(resp_time.status_code, 200)
        self.assertEqual(len(resp_time.json()["revenue_over_time"]), 2)

        # Revenue by Region
        resp_reg = client.post("/api/overview/revenue-by-region", json=payload)
        self.assertEqual(resp_reg.status_code, 200)
        self.assertEqual(len(resp_reg.json()["revenue_by_region"]), 2)

    def test_session_status_and_clear(self):
        """Verify GET /api/overview/session and DELETE /api/overview/session."""
        # Seed session
        client.post("/api/overview", json=[{"revenue": 100, "region": "North"}])
        status_resp = client.get("/api/overview/session")
        self.assertEqual(status_resp.status_code, 200)
        self.assertTrue(status_resp.json()["active_dataset"])
        self.assertEqual(status_resp.json()["row_count"], 1)

        # Clear session
        del_resp = client.delete("/api/overview/session")
        self.assertEqual(del_resp.status_code, 200)

        status_after = client.get("/api/overview/session")
        self.assertFalse(status_after.json()["active_dataset"])


if __name__ == "__main__":
    unittest.main()
