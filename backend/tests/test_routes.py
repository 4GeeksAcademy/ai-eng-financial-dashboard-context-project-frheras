from datetime import date

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.routes import (
    FinancialMovement, MetricsSummaryItem, build_alert_summary,
    detect_outcome_alerts, filter_movements_by_date, generate_mock_movements,
)


client = TestClient(app)


def test_generate_mock_movements_returns_full_year_sorted_data():
    movements = generate_mock_movements(seed=42)

    assert len(movements) == 360
    assert movements == sorted(movements, key=lambda item: item.create_date)


def test_filter_movements_by_date_includes_range_edges():
    movements = generate_mock_movements(seed=42)
    target_date = movements[0].create_date

    filtered = filter_movements_by_date(movements, target_date, target_date)

    assert filtered
    assert all(movement.create_date == target_date for movement in filtered)


def test_health_endpoint_returns_ok():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_metrics_endpoint_respects_date_filters():
    base_response = client.get("/api/metrics")
    assert base_response.status_code == 200
    first_date = base_response.json()[0]["create_date"]

    response = client.get(
        "/api/metrics",
        params={"start_date": first_date, "end_date": first_date},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload
    assert all(item["create_date"] == first_date for item in payload)


def test_b2b_endpoint_only_returns_b2b_records():
    response = client.get("/api/metrics/b2b")

    assert response.status_code == 200
    payload = response.json()
    assert payload
    assert all(item["business_type"] == "B2B" for item in payload)
    assert payload == sorted(payload, key=lambda item: item["create_date"])


def test_b2c_endpoint_only_returns_b2c_records():
    response = client.get("/api/metrics/b2c")

    assert response.status_code == 200
    payload = response.json()
    assert payload
    assert all(item["business_type"] == "B2C" for item in payload)
    assert payload == sorted(payload, key=lambda item: item["create_date"])


def test_metrics_endpoint_filters_by_category():
    response = client.get("/api/metrics", params={"category": "sales"})

    assert response.status_code == 200
    payload = response.json()
    assert payload
    assert all(item["category"] == "sales" for item in payload)


def test_metrics_endpoint_filters_by_operation_type():
    response = client.get("/api/metrics", params={"operation_type": "income"})

    assert response.status_code == 200
    payload = response.json()
    assert payload
    assert all(item["operation_type"] == "income" for item in payload)


def test_b2b_endpoint_combines_new_filters():
    response = client.get(
        "/api/metrics/b2b",
        params={"operation_type": "outcome", "category": "suppliers"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload
    assert all(item["business_type"] == "B2B" for item in payload)
    assert all(item["operation_type"] == "outcome" for item in payload)
    assert all(item["category"] == "suppliers" for item in payload)


def test_metrics_facets_returns_filter_options_and_date_range():
    response = client.get("/api/metrics/facets")

    assert response.status_code == 200
    payload = response.json()
    assert sorted(payload["operation_types"]) == ["income", "outcome"]
    assert payload["business_types"] == ["B2B", "B2C"]
    assert payload["categories"] == [
        "administrative",
        "operational",
        "others",
        "sales",
        "suppliers",
    ]
    assert payload["min_date"] <= payload["max_date"]


def test_metrics_summary_by_month_returns_balances():
    response = client.get("/api/metrics/summary", params={"group_by": "month"})

    assert response.status_code == 200
    payload = response.json()
    assert payload
    first = payload[0]
    assert set(first.keys()) == {"period", "income", "outcome", "net"}
    assert all(item["income"] >= 0 for item in payload)
    assert all(item["outcome"] >= 0 for item in payload)


def test_metrics_summary_by_week_honors_business_type_filter():
    response = client.get(
        "/api/metrics/summary",
        params={"group_by": "week", "business_type": "B2C"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload


def test_top_categories_returns_limited_sorted_categories():
    response = client.get(
        "/api/metrics/categories/top",
        params={"operation_type": "outcome", "limit": 3},
    )

    assert response.status_code == 200
    payload = response.json()
    assert len(payload) == 3
    assert payload[0]["total_amount"] >= payload[1]["total_amount"]
    assert all(item["operation_type"] == "outcome" for item in payload)


def test_metrics_comparison_returns_delta_fields():
    response = client.get(
        "/api/metrics/comparison",
        params={"start_date": "2025-03-01", "end_date": "2025-03-31"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert set(payload.keys()) == {
        "current_period",
        "previous_period",
        "delta_abs",
        "delta_pct",
    }


def test_metrics_alerts_returns_anomaly_candidates():
    response = client.get(
        "/api/metrics/alerts",
        params={"threshold": 0.2, "group_by": "month"},
    )

    assert response.status_code == 200
    payload = response.json()
    assert isinstance(payload, list)
    if payload:
        first = payload[0]
        assert set(first.keys()) == {
            "period",
            "outcome_total",
            "baseline_average",
            "increase_ratio",
        }


def movement(day, amount, operation_type="outcome", business_type="B2B", category="sales"):
    return FinancialMovement(
        create_date=date.fromisoformat(day), amount=amount,
        operation_type=operation_type, business_type=business_type, category=category,
    )


def test_alerts_use_exactly_three_previous_periods():
    summary = [
        MetricsSummaryItem(period=f"2026-{index:02d}", income=0, outcome=amount, net=-amount)
        for index, amount in enumerate([1000, 10, 20, 30, 40], start=1)
    ]
    alerts = detect_outcome_alerts(summary, 0.3)
    assert [item.period for item in alerts] == ["2026-05"]
    assert alerts[0].baseline_average == 20
    assert alerts[0].increase_ratio == 1
    assert detect_outcome_alerts(summary[:3], 0.3) == []


@pytest.mark.parametrize("group_by, days, missing", [
    ("day", ["2026-01-01", "2026-01-03", "2026-01-04"], "2026-01-02"),
    ("week", ["2025-12-22", "2026-01-05", "2026-01-12"], "2026-W01"),
    ("month", ["2025-12-01", "2026-02-01", "2026-03-01"], "2026-01"),
])
def test_alert_calendar_gaps_are_zero(group_by, days, missing):
    summary = build_alert_summary([
        movement(days[0], 30), movement(days[1], 30), movement(days[2], 60),
    ], group_by)
    assert len(summary) == 4
    assert summary[1].period == missing
    assert summary[1].outcome == 0
    alerts = detect_outcome_alerts(summary, 0.3)
    assert len(alerts) == 1
    assert alerts[0].baseline_average == 20
    assert alerts[0].increase_ratio == 2


def test_alert_zero_baseline_is_not_evaluable():
    summary = [
        MetricsSummaryItem(period=f"2026-01-{index:02d}", income=0, outcome=amount, net=-amount)
        for index, amount in enumerate([0, 0, 0, 100], start=1)
    ]
    assert detect_outcome_alerts(summary, 0.3) == []


def test_alert_ratio_equal_to_threshold_is_not_an_anomaly():
    summary = [
        MetricsSummaryItem(period=f"2026-{index:02d}", income=0, outcome=amount, net=-amount)
        for index, amount in enumerate([100, 100, 100, 130], start=1)
    ]
    assert detect_outcome_alerts(summary, 0.3) == []


def test_alerts_evaluate_business_history_independently(monkeypatch):
    data = [movement(f"2026-{month:02d}-10", amount)
            for month, amount in enumerate([10, 10, 10, 20], start=1)]
    data += [movement(f"2026-{month:02d}-10", 1000, business_type="B2C")
             for month in range(1, 5)]
    monkeypatch.setattr("app.routes.generate_mock_movements", lambda seed: data)
    response = client.get("/api/metrics/alerts", params={"business_type": "B2B"})
    assert response.status_code == 200
    assert response.json() == [{
        "period": "2026-04", "outcome_total": 20, "baseline_average": 10, "increase_ratio": 1,
    }]
    assert client.get("/api/metrics/alerts", params={"business_type": "B2C"}).json() == []


def test_alerts_keep_history_before_date_filter(monkeypatch):
    data = [movement(f"2026-{month:02d}-10", amount)
            for month, amount in enumerate([10, 20, 30, 60], start=1)]
    monkeypatch.setattr("app.routes.generate_mock_movements", lambda seed: data)
    response = client.get("/api/metrics/alerts", params={
        "start_date": "2026-04-15", "end_date": "2026-04-16", "threshold": 0.3,
    })
    assert response.status_code == 200
    assert response.json() == [{
        "period": "2026-04", "outcome_total": 60, "baseline_average": 20, "increase_ratio": 2,
    }]
    assert client.get("/api/metrics/alerts", params={"end_date": "2026-03-31"}).json() == []


@pytest.mark.parametrize("threshold", [0, 0.009, 1.001, -1])
def test_alerts_reject_out_of_range_threshold(threshold):
    response = client.get("/api/metrics/alerts", params={"threshold": threshold})
    assert response.status_code == 422
    assert response.json()["detail"][0]["loc"] == ["query", "threshold"]


@pytest.mark.parametrize("threshold", [0.01, 1.0])
def test_alerts_accept_threshold_edges(threshold):
    assert client.get("/api/metrics/alerts", params={"threshold": threshold}).status_code == 200


def test_facets_filter_categories_by_group_operation_and_date(monkeypatch):
    data = [
        movement("2026-01-10", 10, "income", "B2B", "sales"),
        movement("2026-02-10", 20, "income", "B2B", "others"),
        movement("2026-01-10", 30, "income", "B2C", "others"),
        movement("2026-01-10", 40, "outcome", "B2B", "suppliers"),
    ]
    monkeypatch.setattr("app.routes.generate_mock_movements", lambda seed: data)
    response = client.get("/api/metrics/facets", params={
        "business_type": "B2B", "operation_type": "income",
        "start_date": "2026-01-10", "end_date": "2026-01-10",
    })
    assert response.status_code == 200
    assert response.json() == {
        "operation_types": ["income"], "business_types": ["B2B"], "categories": ["sales"],
        "min_date": "2026-01-10", "max_date": "2026-01-10",
    }


def test_facets_empty_result_has_null_dates():
    response = client.get("/api/metrics/facets", params={"end_date": "1900-01-01"})
    assert response.status_code == 200
    assert response.json() == {
        "operation_types": [], "business_types": [], "categories": [],
        "min_date": None, "max_date": None,
    }


def test_income_totals_include_all_categories_and_both_groups(monkeypatch):
    data = [
        movement("2026-01-10", 10, "income", "B2B", "sales"),
        movement("2026-01-10", 20, "income", "B2B", "others"),
        movement("2026-01-10", 50, "outcome", "B2B"),
        movement("2026-02-10", 40, "income", "B2C"),
    ]
    monkeypatch.setattr("app.routes.generate_mock_movements", lambda seed: data)
    response = client.get("/api/metrics/income/totals", params={"end_date": "2026-01-10"})
    assert response.status_code == 200
    assert response.json() == [
        {"business_type": "B2B", "total_income": 30},
        {"business_type": "B2C", "total_income": 0},
    ]
    assert client.get("/api/metrics/categories/top", params={
        "operation_type": "income", "business_type": "B2B", "limit": 1,
    }).json()[0]["total_amount"] == 20


def test_income_totals_empty_result_keeps_two_zero_entries():
    response = client.get("/api/metrics/income/totals", params={"end_date": "1900-01-01"})
    assert response.status_code == 200
    assert response.json() == [
        {"business_type": "B2B", "total_income": 0},
        {"business_type": "B2C", "total_income": 0},
    ]


def test_income_totals_include_both_date_boundaries(monkeypatch):
    data = [movement(f"2026-01-{day:02d}", day, "income") for day in range(1, 5)]
    monkeypatch.setattr("app.routes.generate_mock_movements", lambda seed: data)
    response = client.get("/api/metrics/income/totals", params={
        "start_date": "2026-01-02", "end_date": "2026-01-03",
    })
    assert response.status_code == 200
    assert response.json()[0]["total_income"] == 5


@pytest.mark.parametrize("parameter", ["start_date", "end_date"])
def test_metrics_support_each_inclusive_date_limit(parameter):
    data = client.get("/api/metrics").json()
    boundary = data[len(data) // 2]["create_date"]
    response = client.get("/api/metrics", params={parameter: boundary})
    assert response.status_code == 200
    expected = [item for item in data if (
        item["create_date"] >= boundary if parameter == "start_date" else item["create_date"] <= boundary
    )]
    assert response.json() == expected


def test_openapi_documents_new_contracts():
    schema = client.get("/openapi.json").json()
    assert "/api/metrics/income/totals" in schema["paths"]
    params = schema["paths"]["/api/metrics/alerts"]["get"]["parameters"]
    threshold = next(item for item in params if item["name"] == "threshold")["schema"]
    assert threshold["minimum"] == 0.01
    assert threshold["maximum"] == 1
    facets = schema["components"]["schemas"]["MetricsFacets"]["properties"]
    assert {item["type"] for item in facets["min_date"]["anyOf"]} == {"string", "null"}
