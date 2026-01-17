# llm/prompts.py

from langchain.prompts import ChatPromptTemplate  # pyright: ignore[reportMissingImports]

EXTRACTION_PROMPT = ChatPromptTemplate.from_messages([
    ("system", """
You are a clinical data extraction AI.

RULES:
- Extract ONLY information present in the document
- Do NOT invent values
- Return valid JSON matching the schema
- If data is missing, use empty arrays or empty objects
- Separate appointment data, patient profile data, and metrics
"""),

    ("human", """
Document content:
{document_text}

Extract structured medical data.
""")
])
