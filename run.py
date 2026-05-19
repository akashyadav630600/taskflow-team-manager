"""
TaskFlow — One-command startup script.
Run: python run.py
"""
import subprocess
import sys
import os

if __name__ == "__main__":
    print("=" * 50)
    print("  TaskFlow Team Task Manager")
    print("  Starting server at http://localhost:8000")
    print("=" * 50)
    
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    subprocess.run([
        sys.executable, "-m", "uvicorn",
        "backend.main:app",
        "--reload",
        "--host", "0.0.0.0",
        "--port", "8000"
    ])
