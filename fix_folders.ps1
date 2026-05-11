$source = "c:\Projects\HaiVintage\HaiVintage"
$destination = "c:\Projects\HaiVintage"
if (Test-Path "$source\.git") { Remove-Item -Recurse -Force "$source\.git" }
Get-ChildItem -Path $source -Force | ForEach-Object {
    $destPath = Join-Path $destination $_.Name
    if (Test-Path $destPath) {
        if ($_.PSIsContainer) {
            Copy-Item -Path "$($_.FullName)\*" -Destination $destPath -Recurse -Force
            Remove-Item -Recurse -Force $_.FullName
        } else {
            Move-Item -Path $_.FullName -Destination $destPath -Force
        }
    } else {
        Move-Item -Path $_.FullName -Destination $destPath -Force
    }
}
Remove-Item -Path $source -Force
