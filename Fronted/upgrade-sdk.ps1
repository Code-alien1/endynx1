# Clear Expo cache and reinstall dependencies for SDK 54 upgrade
Write-Host "Clearing Expo cache..."
npx expo r -c

Write-Host "Removing node_modules and package-lock.json..."
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

Write-Host "Installing dependencies..."
npm install

Write-Host "Starting Expo project..."
npx expo start
