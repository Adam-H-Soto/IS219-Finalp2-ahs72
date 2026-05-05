from pydantic import BaseModel


class PolicySummary(BaseModel):
    plan_name: str
    plan_type: str
    deductible_individual: str
    deductible_family: str
    out_of_pocket_max_individual: str
    out_of_pocket_max_family: str
    primary_care_copay: str
    specialist_copay: str
    emergency_room_copay: str
    covered_services: list[str]
    exclusions: list[str]
    notes: list[str]


class SourceChunk(BaseModel):
    text: str
    page_number: int
    chunk_index: int


class RAGResponse(BaseModel):
    answer: str
    sources: list[SourceChunk]


class QuestionRequest(BaseModel):
    question: str
    doc_id: str


class UploadResponse(BaseModel):
    doc_id: str
    summary: PolicySummary
    message: str
