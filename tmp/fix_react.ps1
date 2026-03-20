$files = Get-ChildItem -Recurse -Include *.tsx,*.jsx
foreach ($file in $files) {
    try {
        $content = Get-Content $file.FullName -Raw
        if ($content -match "import React from 'react';" -and $content -match "import React,\s*\{") {
            Write-Host "Fixing duplicate React in $($file.FullName)"
            $newContent = $content -replace "(?m)^import React from 'react';\s*", ""
            $newContent | Set-Content $file.FullName -Encoding utf8
        }
    } catch {
        Write-Warning "Failed to process $($file.FullName)"
    }
}
