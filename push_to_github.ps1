# Asistente HYS - Script de Sincronización GitHub
# Este script automatiza el proceso de subir los cambios al repositorio.

Write-Host "--- Sincronizando con GitHub ---" -ForegroundColor Cyan

# 1. Agregar todos los cambios
git add .

# 2. Crear el commit con un mensaje descriptivo
$mensaje = "Mejora Interfaz: Tema Azul Premium y Refinamiento de Layout"
git commit -m $mensaje

# 3. Empujar a la rama principal (main)
# Nota: Si tu rama se llama diferente, cambia 'main' por el nombre de tu rama.
Write-Host "Subiendo cambios a GitHub..." -ForegroundColor Yellow
git push origin main

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ ¡Éxito! Los cambios están en GitHub." -ForegroundColor Green
} else {
    Write-Host "❌ Hubo un error al subir los cambios. Verifica tu conexión o permisos." -ForegroundColor Red
}

Write-Host "Presiona cualquier tecla para salir..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
