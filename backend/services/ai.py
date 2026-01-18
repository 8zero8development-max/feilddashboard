import os
import logging
from fastapi import HTTPException

logger = logging.getLogger(__name__)


async def summarize_notes(notes: str, provider: str = "openai") -> str:
    system_message = "You are an assistant for a refrigeration/HVAC field service company. Summarize job notes concisely."
    user_prompt = f"Summarize these job notes:\n\n{notes}"
    
    try:
        if provider == "gemini":
            api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
            if not api_key:
                raise HTTPException(status_code=400, detail="Google API key not configured")
            
            import google.generativeai as genai
            genai.configure(api_key=api_key)
            model = genai.GenerativeModel("gemini-1.5-flash")
            response = model.generate_content(f"{system_message}\n\n{user_prompt}")
            return response.text
        else:
            api_key = os.environ.get("OPENAI_API_KEY")
            if not api_key:
                raise HTTPException(status_code=400, detail="OpenAI API key not configured")
            
            from openai import OpenAI
            client = OpenAI(api_key=api_key)
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_message},
                    {"role": "user", "content": user_prompt}
                ]
            )
            return response.choices[0].message.content
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"AI summarization error: {e}")
        raise HTTPException(status_code=500, detail="AI service error")
