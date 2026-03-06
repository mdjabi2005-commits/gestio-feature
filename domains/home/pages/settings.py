"""
Page Paramètres — Configuration de l'application.
Permet à l'utilisateur de configurer sa clé API Groq (OCR IA).
"""

import logging
import os
import streamlit as st

from config.paths import ENV_PATH
from shared.ui.toast_components import toast_success, toast_error, toast_warning

logger = logging.getLogger(__name__)



def _read_env() -> dict[str, str]:
    """Lit le fichier .env et retourne un dict clé=valeur."""
    env: dict[str, str] = {}
    if ENV_PATH.exists():
        for line in ENV_PATH.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                env[k.strip()] = v.strip()
    return env


def _write_env(env: dict[str, str]) -> None:
    """Écrit le dict dans le fichier .env (crée le fichier si absent)."""
    lines = [f"{k}={v}" for k, v in env.items()]
    ENV_PATH.write_text("\n".join(lines) + "\n", encoding="utf-8")


def _test_groq_key(api_key: str) -> bool:
    """Teste la clé Groq en faisant un appel minimal."""
    try:
        from groq import Groq
        from groq.types.chat import ChatCompletionUserMessageParam
        client = Groq(api_key=api_key)
        client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[ChatCompletionUserMessageParam(role="user", content="ping")],
            max_tokens=1,
        )
        return True
    except Exception as e:
        logger.warning(f"Test clé Groq échoué : {e}")
        return False


def interface_settings() -> None:
    """Page de configuration des paramètres de l'application."""
    st.title("⚙️ Paramètres")

    # ── Section OCR / Groq ────────────────────────────────────────────────────
    st.subheader("🤖 Configuration OCR (Groq API)")
    st.markdown(
        "L'OCR intelligent utilise **Groq** (LLM cloud ultra-rapide) pour analyser vos tickets. "
        "Obtenez votre clé gratuite sur [console.groq.com](https://console.groq.com/keys)."
    )
    st.caption(f"📁 Fichier de configuration : `{ENV_PATH}`")

    env = _read_env()
    current_key = os.getenv("GROQ_API_KEY") or env.get("GROQ_API_KEY", "")

    # Indicateur d'état
    if current_key:
        st.success("✅ Clé API Groq configurée")
    else:
        st.warning("⚠️ Aucune clé API Groq — l'OCR IA est désactivé (OCR texte brut uniquement)")

    with st.form("form_groq"):
        new_key = st.text_input(
            "Clé API Groq",
            value=current_key,
            type="password",
            placeholder="gsk_...",
            help="Commence par 'gsk_'. Stockée dans le fichier .env local.",
        )
        col1, col2 = st.columns([1, 1])
        with col1:
            save = st.form_submit_button("💾 Sauvegarder", use_container_width=True, type="primary")
        with col2:
            test = st.form_submit_button("🔍 Tester la connexion", use_container_width=True)

    if save:
        if new_key.strip():
            env["GROQ_API_KEY"] = new_key.strip()
            _write_env(env)
            os.environ["GROQ_API_KEY"] = new_key.strip()
            toast_success("Clé API Groq sauvegardée ✅")
            logger.info("GROQ_API_KEY mise à jour via les paramètres")
        else:
            # Supprimer la clé
            env.pop("GROQ_API_KEY", None)
            _write_env(env)
            os.environ.pop("GROQ_API_KEY", None)
            toast_warning("Clé API Groq supprimée")
        st.rerun()

    if test:
        key_to_test = new_key.strip() or current_key
        if not key_to_test:
            toast_error("Aucune clé à tester — saisissez d'abord une clé.")
        else:
            with st.spinner("Test de connexion en cours..."):
                ok = _test_groq_key(key_to_test)
            if ok:
                toast_success("Connexion Groq réussie ✅ — la clé est valide")
            else:
                toast_error("Connexion échouée ❌ — vérifiez votre clé ou votre connexion internet")

    st.divider()

    # ── Informations ─────────────────────────────────────────────────────────
    with st.expander("ℹ️ Comment obtenir une clé Groq gratuite ?"):
        st.markdown("""
1. Aller sur [console.groq.com](https://console.groq.com/keys)
2. Créer un compte gratuit (ou se connecter)
3. Cliquer sur **"Create API Key"**
4. Copier la clé (commence par `gsk_`)
5. La coller dans le champ ci-dessus et cliquer **Sauvegarder**

> **Confidentialité** : la clé est stockée uniquement dans le fichier `.env` sur votre machine, jamais envoyée ailleurs.
        """)

