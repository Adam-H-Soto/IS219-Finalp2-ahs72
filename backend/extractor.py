import json
from openai import OpenAI
from config import settings
from models import PolicySummary

client = OpenAI(api_key=settings.OPENAI_API_KEY)

_SYSTEM_PROMPT = """You are an expert at extracting structured information from health insurance policy documents.

Extract the following information from the provided policy text and return it as a JSON object with exactly these fields:
- plan_name: string (the name of the insurance plan)
- plan_type: string (HMO, PPO, EPO, HDHP, etc.)
- deductible_individual: string (individual annual deductible amount)
- deductible_family: string (family annual deductible amount)
- out_of_pocket_max_individual: string (individual out-of-pocket maximum)
- out_of_pocket_max_family: string (family out-of-pocket maximum)
- primary_care_copay: string (copay amount for primary care visits)
- specialist_copay: string (copay amount for specialist visits)
- emergency_room_copay: string (copay amount for emergency room visits)
- covered_services: array of strings (list of covered medical services)
- exclusions: array of strings (list of excluded or not-covered services)
- notes: array of strings (important details that don't fit the above categories)

Rules:
- Use "Not specified" for string fields that cannot be determined from the text.
- Use an empty array [] for list fields with no extractable content.
- If the document is not a health insurance policy, set plan_name to "Not an insurance policy" and fill remaining fields with "N/A" or [].
- Return ONLY valid JSON with no additional text or markdown."""


def extract_policy_data(text: str) -> PolicySummary:
    """Use GPT-4o to extract structured policy info from raw text."""
    # Truncate to avoid token overflow while preserving most content
    truncated = text[:12000]

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": f"Policy document text:\n\n{truncated}"},
        ],
        response_format={"type": "json_object"},
        temperature=0,
    )

    raw = response.choices[0].message.content
    data = json.loads(raw)
    return PolicySummary(**data)
