@echo off
echo Starting HealthPredict Backend Server...
cd /d "C:\Users\DELL\OneDrive\Desktop\ddd\backend"
call venv\Scripts\activate.bat
echo Virtual environment activated
python main.py
pause
