
from langchain_google_genai import ChatGoogleGenerativeAI
import os

# Using Gemini 2.0 Flash for better performance and structured output
llm = ChatGoogleGenerativeAI(
    model="gemini-2.0-flash-exp",  # or "gemini-1.5-pro" if 2.0 not available
    temperature=0,
    google_api_key=os.getenv("GEMINI_API_KEY")
)