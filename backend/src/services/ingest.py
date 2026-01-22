# routes/ingest.py

import io
from bson import ObjectId
from fastapi import APIRouter, UploadFile
from src.services.llm_extractor import chain
from src.r2 import upload_to_r2
from src.services.storage import (
    update_appointment,
    update_patient,
    store_reports,
    store_tests,
    store_time_series
)
from src.utils.pdf import extract_text_from_pdf_bytes

router = APIRouter()

@router.post("/ingest/document/{appointment_id}")
async def ingest_document(
    appointment_id: str,
    patient_id: str,
    file: UploadFile
):
    # 1️⃣ Extract text
    contents = await file.read()
    text = await extract_text_from_pdf_bytes(contents)

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

    # 5️⃣ Store reportsfrom
    for report in result.reports:
        uri = upload_to_r2(io.BytesIO(contents), report.file_name)
        print(uri)
        report.uri = uri
        await store_reports(appointment_id, report)

    # 6️⃣ Store tests
    for test in result.tests:
        uri = upload_to_r2(io.BytesIO(contents), test.file_name)
        test.uri = uri
        await store_tests(appointment_id, test)

    # 7️⃣ Time-series metrics
    await store_time_series(patient_id, result.time_series_observations)

    return {"status": "success"}
