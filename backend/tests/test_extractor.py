import json
import sys
import os
from unittest.mock import MagicMock, patch

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from models import PolicySummary

MOCK_POLICY_JSON = {
    "plan_name": "BlueCross Gold Plus",
    "plan_type": "PPO",
    "deductible_individual": "$1,500",
    "deductible_family": "$3,000",
    "out_of_pocket_max_individual": "$5,000",
    "out_of_pocket_max_family": "$10,000",
    "primary_care_copay": "$25",
    "specialist_copay": "$50",
    "emergency_room_copay": "$250",
    "covered_services": ["Preventive care", "Mental health", "Prescription drugs"],
    "exclusions": ["Cosmetic surgery", "Experimental treatments"],
    "notes": ["Out-of-network benefits available at reduced rates"],
}


def _make_mock_openai_response(data: dict):
    message = MagicMock()
    message.content = json.dumps(data)
    choice = MagicMock()
    choice.message = message
    response = MagicMock()
    response.choices = [choice]
    return response


@patch("extractor.client")
def test_extract_policy_data_returns_policy_summary(mock_client):
    mock_client.chat.completions.create.return_value = _make_mock_openai_response(MOCK_POLICY_JSON)
    from extractor import extract_policy_data
    result = extract_policy_data("Sample policy text")
    assert isinstance(result, PolicySummary)


@patch("extractor.client")
def test_extract_policy_data_has_required_fields(mock_client):
    mock_client.chat.completions.create.return_value = _make_mock_openai_response(MOCK_POLICY_JSON)
    from extractor import extract_policy_data
    result = extract_policy_data("Sample policy text")
    assert result.plan_name
    assert result.plan_type
    assert result.deductible_individual
    assert result.deductible_family
    assert result.out_of_pocket_max_individual
    assert result.out_of_pocket_max_family
    assert result.primary_care_copay
    assert result.specialist_copay
    assert result.emergency_room_copay


@patch("extractor.client")
def test_extract_policy_data_covered_services_is_list(mock_client):
    mock_client.chat.completions.create.return_value = _make_mock_openai_response(MOCK_POLICY_JSON)
    from extractor import extract_policy_data
    result = extract_policy_data("Sample policy text")
    assert isinstance(result.covered_services, list)


@patch("extractor.client")
def test_extract_policy_data_exclusions_is_list(mock_client):
    mock_client.chat.completions.create.return_value = _make_mock_openai_response(MOCK_POLICY_JSON)
    from extractor import extract_policy_data
    result = extract_policy_data("Sample policy text")
    assert isinstance(result.exclusions, list)
