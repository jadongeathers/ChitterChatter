from pathlib import Path

def load_prompt(name):
    path = Path(__file__).parent / f"{name}.txt"
    return path.read_text()
