@echo off
cd /d "%~dp0.."
python tools\build_ai_context_bundle.py
if errorlevel 1 (
  echo.
  echo 產生失敗，請確認已安裝 Python。
  pause
  exit /b 1
)
echo.
echo AI 內容包已更新：AI_CONTEXT\EXPORTS\000_Universal_Rebalance_AI_Context_Bundle.md
pause
