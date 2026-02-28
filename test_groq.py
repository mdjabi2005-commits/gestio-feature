import os
import sys
import time

sys.path.append('c:/Users/djabi/gestion-financiere/v4')

from domains.transactions.ocr.core.groq_parser import GroqParser

def run_test():
    print("----- TEST GROQ ZERO-SHOT PARSER -----")
    
    # Vérification de la clé API
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("ERREUR: Impossible de tester, GROQ_API_KEY n'est pas définie dans l'environnement terminal actuel.")
        print("Par défaut, le script fera un fallback (catégorie 'Autre')")
    else:
        print("Clé API GROQ détectée ✅")

    parser = GroqParser()
    
    # Texte brut d'un ticket simulé "difficile"
    ticket_text = """
    *** BIENVENUE ***
    L'ETOILE DU SUD
    RESTAURATION RAPIDE
    PARIS 75011
    
    12/11/2026 13:45 
    TABLE 4
    
    1x KEBAB FRITES ....... 6.50
    1x COCA COLA 33cl ...... 2.00
    1x TIRAMISU ............ 3.50
    
    TOTAL EUR             12.00
    EN ESPECES            20.00
    A RENDRE               8.00
    
    MERCI DE VOTRE VISITE!
    """
    
    print("\n[Soumission à Groq de 30 mots de 'Bruit OCR']...")
    t0 = time.time()
    
    # Appel magique
    result = parser.parse(ticket_text)
    
    t1 = time.time()
    
    print(f"\n⏱️  Temps de réponse Groq : {t1 - t0:.2f} secondes !")
    print("📦 Résultat structuré JSON :")
    print(f"  - Marchand   : {result.get('description')}")
    print(f"  - Catégorie  : {result.get('category')} (Officielle V4)")
    print(f"  - Sous-cat.  : {result.get('subcategory')}")

if __name__ == '__main__':
    run_test()
