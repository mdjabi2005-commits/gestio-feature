#define MyAppName "Gestio"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Gestio Team"
#define MyAppExeName "launcher.bat"
#define MyAppExePath "distribution\launcher.bat"
#define MyAppIcon "favicon.ico"
#define MyAppIconPath "distribution\favicon.ico"

[Setup]
; NOTE: The value of AppId uniquely identifies this application. Do not use the same AppId value in installers for other applications.
; (To generate a new GUID, click Tools | Generate GUID inside the IDE.)
AppId={{B7A38D4A-98C3-4E82-9694-87A5B6913D5E}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
;AppVerName={#MyAppName} {#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={localappdata}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
; Installation au niveau utilisateur (pas besoin des droits Administrateur !)
PrivilegesRequired=lowest
OutputDir=..\dist\installer
OutputBaseFilename=Gestio-Setup-v{#MyAppVersion}
SetupIconFile={#MyAppIcon}
Compression=lzma
SolidCompression=yes
WizardStyle=modern

[Languages]
Name: "french"; MessagesFile: "compiler:Languages\French.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked

[Files]
; Copier tous les fichiers sauf les dossiers de dépendances et caches
Source: "../*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs; \
    Excludes: ".git\*,.venv\*,frontend\node_modules\*,node_modules\*,.idea\*,.pytest_cache\*,.ruff_cache\*,tmp\*,.github\*,dist\*,build\*"
; Plus besoin de copier explicitement favicon.ico à la racine de {app} puisqu'il est copié dans distribution/

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExePath}"; IconFilename: "{app}\{#MyAppIconPath}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExePath}"; IconFilename: "{app}\{#MyAppIconPath}"; Tasks: desktopicon

[Run]
; Lancer le setup.ps1 au premier démarrage (via run.ps1 qui l'appelle si besoin)
Filename: "{app}\{#MyAppExePath}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: shellexec postinstall skipifsilent
