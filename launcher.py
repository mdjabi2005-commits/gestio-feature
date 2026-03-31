import os
import sys
import time
import socket
import subprocess
import webbrowser

try:
    import browsers
except ImportError:
    browsers = None
    print("Attention: le module 'pybrowsers' n'est pas installé. Fallback sur webbrowser standard actif.")

PORT = 8002

def wait_for_port(port, timeout=30):
    start_time = time.time()
    while time.time() - start_time < timeout:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            result = sock.connect_ex(('127.0.0.1', port))
            if result == 0:
                return True
        time.sleep(1)
    return False


def open_browser(url: str):
    """Tente d'ouvrir le navigateur en mode application (Chrome) ou standard."""
    browser_launched = False
    
    # On essaie d'abord avec pybrowsers pour gérer le flag --app de Chrome
    if browsers:
        try:
            chrome = browsers.get("chrome")
            if chrome and 'path' in chrome:
                chrome_path = chrome['path']
                print(f"\n➜ Chrome détecté : {chrome_path}")
                subprocess.Popen([chrome_path, f"--app={url}"])
                browser_launched = True
            else:
                print("\n➜ Chrome non détecté par pybrowsers.")
        except Exception as e:
            print(f"\n⚠️ Erreur silencieuse de pybrowsers: {e}")
            
    # Fallback ultra robuste si Chrome n'est pas là
    if not browser_launched:
        print("\n➜ Lancement via le navigateur par défaut de votre système...")
        webbrowser.open(url)

def main():
    # Sécurité anti-zombie : tuer les anciens processus uvicorn restés bloqués en arrière-plan (Windows)
    if os.name == 'nt':
        os.system("taskkill /F /IM uvicorn.exe >nul 2>&1")
        
    print("=" * 50)
    print("🚀 Démarrage de Gestio")
    print("=" * 50)
    print("\n[1/2] Lancement du Serveur...")
    
    # Sur Windows, on empêche l'ouverture d'une nouvelle console noire inutile
    creationflags = 0x08000000 if os.name == 'nt' else 0 # CREATE_NO_WINDOW
    
    # On lance Uvicorn en utilisant uv (optimisé)
    backend_process = subprocess.Popen(
        ["uv", "run", "uvicorn", "backend.main:app", "--port", str(PORT)],
        creationflags=creationflags
    )
    
    print(f"\n[2/2] En attente de l'application (port {PORT})...")
    if not wait_for_port(PORT, timeout=30):
        print("\n❌ ERREUR : Temps d'attente dépassé. Le serveur n'a pas pu démarrer.")
        backend_process.terminate()
        sys.exit(1)
        
    print("\n✅ Serveur en ligne ! Ouverture de l'interface utilisateur...")
    
    url = f"http://localhost:{PORT}"
    open_browser(url)
        
    print("\n🎯 Gestio est en cours d'exécution.")
    print("   --------------------------------------------------")
    print("   💡 ASTUCE : Appuyez sur ENTREE pour rouvrir Gestio.")
    print("   💡 QUITTER : Ctrl+C pour tout arrêter.")
    print("   --------------------------------------------------")
    print("=" * 50)
    
    try:
        # Sur Windows, on utilise msvcrt pour un polling clavier non-bloquant
        if os.name == 'nt':
            import msvcrt
            while backend_process.poll() is None:
                if msvcrt.kbhit():
                    char = msvcrt.getch()
                    # Touche ENTRÉE (b'\r' ou b'\n')
                    if char in (b'\r', b'\n'):
                        print("\n🔄 Réouverture de Gestio...")
                        open_browser(url)
                time.sleep(0.1)
        else:
            # Sur Linux/macOS, on retombe sur wait() simple pour l'instant (plus complexe sans bloquer)
            backend_process.wait()
            
    except KeyboardInterrupt:
        print("\n\nArrêt manuel de Gestio demandé...")
        backend_process.terminate()
        print("Serveur arrêté avec succès. À bientôt !")
    except Exception as e:
        print(f"\nUne erreur est survenue : {e}")
        backend_process.terminate()

if __name__ == "__main__":
    main()
