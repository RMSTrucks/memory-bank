@echo off
echo Building TypeScript files...
call npx tsc
if %ERRORLEVEL% NEQ 0 (
    echo Build failed
    exit /b %ERRORLEVEL%
)
echo Build completed successfully
