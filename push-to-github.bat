@echo off
echo ================================================
echo   Push to GitHub Repository
echo ================================================
echo.

set /p REPO_NAME="Enter repository name (e.g., multi-server-orchestration): "
set /p USERNAME="Enter your GitHub username: "

if "%REPO_NAME%"=="" (
    echo ERROR: Repository name is required
    pause
    exit /b 1
)

if "%USERNAME%"=="" (
    echo ERROR: GitHub username is required
    pause
    exit /b 1
)

echo.
echo Repository will be created at:
echo https://github.com/%USERNAME%/%REPO_NAME%
echo.
echo ================================================
echo   BEFORE RUNNING THIS SCRIPT:
echo ================================================
echo.
echo 1. Go to https://github.com/new
echo 2. Create a new repository named: %REPO_NAME%
echo 3. Choose Public or Private
echo 4. DO NOT initialize with README
echo 5. Click "Create repository"
echo.
echo Press any key when repository is created...
pause > nul

echo.
echo ================================================
echo   Pushing to GitHub...
echo ================================================
echo.

REM Rename branch to main
echo Renaming branch to main...
git branch -M main

REM Add remote
echo Adding remote origin...
git remote remove origin 2>nul
git remote add origin https://github.com/%USERNAME%/%REPO_NAME%.git

REM Push to GitHub
echo Pushing to GitHub...
git push -u origin main

if errorlevel 1 (
    echo.
    echo ================================================
    echo   Push failed!
    echo ================================================
    echo.
    echo Common solutions:
    echo 1. Make sure the repository exists on GitHub
    echo 2. Check your GitHub credentials
    echo 3. Try: git push -u origin main --force
    echo.
    echo For authentication:
    echo - HTTPS: You may need a Personal Access Token
    echo - SSH: Use git@github.com:%USERNAME%/%REPO_NAME%.git
    echo.
    pause
    exit /b 1
)

echo.
echo ================================================
echo   Success!
echo ================================================
echo.
echo Your repository is now available at:
echo https://github.com/%USERNAME%/%REPO_NAME%
echo.
echo Next steps:
echo 1. Visit the repository URL above
echo 2. Add topics/tags
echo 3. Update description
echo 4. Star your repository!
echo.
pause
