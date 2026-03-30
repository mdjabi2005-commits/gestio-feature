@echo off
pushd %~dp0
powershell.exe -ExecutionPolicy Bypass -File "./distribution/run.ps1"
popd
exit
