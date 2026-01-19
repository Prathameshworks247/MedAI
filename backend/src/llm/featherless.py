"""
Featherless AI LLM Configuration
Uses OpenAI-compatible interface for Featherless AI
Reference: https://featherless.ai/docs/quickstart-guide
"""
from langchain_openai import ChatOpenAI
import os

from src.config import FEATHERLESS_API_KEY

if not FEATHERLESS_API_KEY:
    raise ValueError("FEATHERLESS_API_KEY environment variable is required. Get your API key from https://featherless.ai")

# Using Featherless AI with OpenAI-compatible interface
# Model: m42-health/Llama3-Med42-70B (medical-focused model)
llm = ChatOpenAI(
    model="m42-health/Llama3-Med42-70B",
    temperature=0,
    base_url="https://api.featherless.ai/v1",
    api_key=FEATHERLESS_API_KEY or "",  # Ensure string type
    timeout=60  # Increase timeout for larger models
)
