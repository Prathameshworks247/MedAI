# routes/ingest.py

from fastapi import APIRouter, UploadFile, Depends
from src.services.llm_extractor import chain
# from services.storage import upload_to_s3
from src.services.storage import (
    update_appointment,
    update_patient,
    store_reports,
    store_tests,
    store_time_series
)
from utils.pdf import extract_text_from_pdf

router = APIRouter()

@router.post("/ingest/document/{appointment_id}")
async def ingest_document(
    appointment_id: str,
    patient_id: str,
    file: UploadFile
):
    # 1️⃣ Extract text
    text = extract_text_from_pdf(file)

    # 2️⃣ LLM extraction
    result = chain.invoke({"document_text": text})

    # 3️⃣ Appointment update
    await update_appointment(
        appointment_id=appointment_id,
        updates=result.appointment_updates
    )

    # 4️⃣ Patient profile update
    await update_patient(
        patient_id=patient_id,
        updates=result.patient_profile_updates
    )

    # 5️⃣ Store reports
    for report in result.reports:
        # uri = upload_to_s3(file, report.file_name)
        await store_reports(appointment_id, report)

    # 6️⃣ Store tests
    for test in result.tests:
        # uri = upload_to_s3(file, test.file_name)
        await store_tests(appointment_id, test)

    # 7️⃣ Time-series metrics
    await store_time_series(patient_id, result.time_series_observations)

    return {"status": "success"}
