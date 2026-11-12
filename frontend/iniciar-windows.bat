@echo off
cd /d "%~dp0"
where npm >nul 2>nul
if errorlevel 1 (
  echo Node.js e npm nao foram encontrados. Instale Node.js em https://nodejs.org/
  pause
  exit /b 1
)
if not exist node_modules (
  echo Instalando dependencias pela primeira vez...
  call npm install
  if errorlevel 1 (
    echo Falha ao instalar dependencias. Verifique a conexao com a internet.
    pause
    exit /b 1
  )
)
echo Iniciando LookLoop...
call npm run dev
pause
