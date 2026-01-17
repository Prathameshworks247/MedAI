# llm/extractor.py

from langchain.output_parsers import PydanticOutputParser  # pyright: ignore[reportMissingImports]
from langchain.schema.runnable import RunnableSequence  # pyright: ignore[reportMissingImports]
from src.models.llm import ExtractionResult
from llm.prompts import EXTRACTION_PROMPT
from llm.gemini import llm

parser = PydanticOutputParser(pydantic_object=ExtractionResult)

chain = (
    EXTRACTION_PROMPT
    | llm
    | parser
)
