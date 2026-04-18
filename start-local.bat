@echo off
chcp 65001 >nul
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js が見つかりません。https://nodejs.org/ からインストールしてください。
  pause
  exit /b 1
)

echo.
echo ローカルプレビューを起動しています...
echo   URL: http://localhost:3000
echo   終了: このウィンドウで Ctrl+C
echo.
echo 記事やニュース一覧を最新にしたい場合は、別のターミナルで npm run build を実行してからブラウザを更新してください。
echo.

npx --yes serve . -l 3000

pause
