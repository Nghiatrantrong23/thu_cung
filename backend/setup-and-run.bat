@echo off
REM Server Setup and Run Script for Pet Care Management System
REM This script adds Node.js to PATH, installs dependencies, and starts the dev server

echo ========================================
echo Pet Care Management System - Server Setup
echo ========================================
echo.

REM Add Node.js to PATH for this session
set "PATH=C:\Program Files\nodejs;%PATH%"

REM Verify Node.js is accessible
echo [1/4] Verifying Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found at C:\Program Files\nodejs
    echo Please install Node.js or update the PATH in this script.
    pause
    exit /b 1
)
echo Node.js found: 
node --version
npm --version
echo.

REM Navigate to server directory
cd /d "%~dp0"
echo Current directory: %cd%
echo.

REM Install dependencies
echo [2/4] Installing dependencies...
echo This may take a few minutes on first run...
npm install
if errorlevel 1 (
    echo ERROR: npm install failed
    echo Try running: npm install --verbose
    pause
    exit /b 1
)
echo Dependencies installed successfully.
echo.

REM Check for .env file
echo [3/4] Checking environment configuration...
if not exist .env (
    echo WARNING: .env file not found!
    echo Creating .env from .env.example...
    if exist .env.example (
        copy .env.example .env
        echo .env file created. Please update with your database credentials.
        echo Edit .env before proceeding.
        pause
    ) else (
        echo ERROR: .env.example not found. Cannot create .env
        pause
        exit /b 1
    )
)
echo Environment configuration found.
echo.

REM Start development server
echo [4/4] Starting development server...
echo Server will run on http://localhost:5000
echo Press Ctrl+C to stop the server
echo.
npm run dev
