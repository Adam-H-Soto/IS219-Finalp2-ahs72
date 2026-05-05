import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    def __init__(self):
        self.OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
        if not self.OPENAI_API_KEY:
            raise ValueError(
                "OPENAI_API_KEY is not set. "
                "Create a .env file in the backend/ directory with your OpenAI API key."
            )


settings = Settings()
