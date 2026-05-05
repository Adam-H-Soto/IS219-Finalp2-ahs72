import os

# Must be set before any module that imports config.py is loaded
os.environ.setdefault("OPENAI_API_KEY", "sk-test-key-for-testing")
