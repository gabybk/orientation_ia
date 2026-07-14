// Configuration Supabase
const SUPABASE_URL = "https://eaimilmqtwmurrtwpkkf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhaW1pbG1xdHdtdXJydHdwa2tmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2Njk2OTMsImV4cCI6MjA5OTI0NTY5M30.IGGSP2r7iu8IqAspYdITlhomUuDWOMK_9BDASXxMerA";

const client = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
  // 1. Tester la connexion et charger la vitrine d'accueil
  initialiserApplication();

  // 2. Écouteur pour le formulaire d'orientation
  const btnRecommander = document.getElementById('btn-recommander');
  if (btnRecommander) {
    btnRecommander.addEventListener('click', calculerRecommandations);
  }
});

async function initialiserApplication() {
  try {
    let { data: listeOutils, error } = await client.from('outils_ia').select('*');
    if (error) {
      console.error("Erreur Supabase :", error.message);
      return;
    }
    console.log("Connexion Supabase réussie, chargement de la vitrine...");
    chargerVitrineCategories(listeOutils);
  } catch (err) {
    console.error("Erreur lors de l'initialisation :", err.message);
  }
}

// --- FONCTION : CHARGER LA VITRINE SUR L'ACCUEIL ---
// --- FONCTION : CHARGER LA VITRINE SUR L'ACCUEIL ---
function chargerVitrineCategories(outils) {
  const conteneurVitrine = document.getElementById('vitrine-categories');
  if (!conteneurVitrine) return;

  conteneurVitrine.innerHTML = "";

  // MODIFICATION : Remplacement de "perplexity" (Serveur) par "deepseek r1" ou "qwen" (Local)
  // Cela permet d'avoir plus d'outils locaux visibles dès la page d'accueil !
  const iaSelectionneesPourAccueil = ["chatgpt", "claude", "notebook lm", "stable diffusion", "deepseek r1", "cursor"];
  
  let outilsSelectionnes = outils.filter(ia => {
    let nomIA = String(ia.nom || ia.IA || "").toLowerCase().trim();
    return iaSelectionneesPourAccueil.some(target => nomIA.includes(target));
  });

  // Si jamais les noms exacts ne sont pas trouvés, on prend les 6 premiers par sécurité
  if (outilsSelectionnes.length === 0) {
    outilsSelectionnes = outils.slice(0, 6);
  }

  outilsSelectionnes.forEach(ia => {
    let nomIA = ia.nom || ia.IA || 'Outil IA';
    let utiliteIA = ia.utilite || ia.Utilité || 'Non spécifiée';
    let coutIA = ia.cout_installation || ia.coût_installation || 'Non spécifié';
    let lienIA = ia.lien_officiel || ia.Sources || '#';
    let benchmark = ia.performance_benchmark || ia["Performance Benchmark (MMLU Pro / GPQA)"] || 'Standard';
    let contexte = ia.taille_fenetre_contexte || ia["Taille de la Fenêtre de Contexte"] || 'Standard';
    let langueIA = ia.langue || ia.Langues || ia["Langues Supportées"] || 'Multilingue';
    
    let valeurInstallation = ia.type_installation || ia["type d'installation (local ou serveur)"] || "";
    let typeInstal = String(valeurInstallation).toLowerCase();
    let badgeClass = typeInstal.includes('local') ? 'badge-local' : 'badge-cloud';
    let badgeText = typeInstal.includes('local') ? '💻 Local' : '☁️ Cloud';

    // Le bouton s'adapte dynamiquement selon le type de déploiement de l'IA
    let texteActionBouton = typeInstal.includes('serveur') || typeInstal.includes('saas') || typeInstal.includes('cloud') 
      ? 'Tester l\'outil en ligne 🌐' 
      : 'Télécharger / Installer l\'outil 💾';

    let cardHTML = `
      <div class="card-ia" style="border-top: 4px solid var(--primary);">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
             <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--secondary); font-weight: bold;">Aperçu Catalogue</span>
             <span class="badge ${badgeClass}" style="margin-bottom:0;">${badgeText}</span>
          </div>
          <h3>${nomIA}</h3>
          <p style="margin-top: 8px;"><strong>Usage :</strong> ${utiliteIA}</p>
          <p><strong>Langues :</strong> ${langueIA}</p>
          <p><strong>Mémoire immédiate :</strong> ${contexte}</p>
          <p><strong>Raisonnement :</strong> ${benchmark}</p>
          <p><strong>Tarif :</strong> ${coutIA}</p>
        </div>
        <a href="${lienIA}" target="_blank" class="btn-card" style="margin-top:15px; display:inline-block; text-align:center;">${texteActionBouton}</a>
      </div>
    `;
    conteneurVitrine.innerHTML += cardHTML;
  });
}

// --- FONCTION : CALCUL DU QUESTIONNAIRE MULTICRITÈRE ---
async function calculerRecommandations() {
  const elInstallation = document.getElementById('critere-installation');
  const elUtlite = document.getElementById('critere-utilite');
  const elFormat = document.getElementById('critere-format');
  const elProfil = document.getElementById('critere-profil');
  const elPerformance = document.getElementById('critere-performance');
  const elContexte = document.getElementById('critere-contexte');
  const elLangue = document.getElementById('critere-langue');
  const elGratuit = document.getElementById('critere-gratuit');

  const typeInstallationSelectionne = elInstallation ? elInstallation.value : "Tous";
  const utiliteSelectionnee = elUtlite ? elUtlite.value : "Tous";
  const formatSelectionne = elFormat ? elFormat.value : "Tous";
  const profilSelectionne = elProfil ? elProfil.value : "Tous";
  const performanceSelectionnee = elPerformance ? elPerformance.value : "Standard";
  const contexteSelectionne = elContexte ? elContexte.value : "Standard";
  const langueSelectionnee = elLangue ? elLangue.value : "Tous";
  const veutGratuit = elGratuit ? elGratuit.checked : false;

  let { data: listeOutils, error } = await client.from('outils_ia').select('*');

  if (error) {
    alert("Erreur lors de la récupération des données : " + error.message);
    return;
  }

  let tableRecommandations = listeOutils.map(ia => {
    let scoreAdéquation = 0;
    let maxCriteresActifs = 0;
    let criteresEchoues = [];

    // --- CRITÈRE 1 : GRATUITÉ ---
    if (veutGratuit) {
      maxCriteresActifs++;
      if (ia.version_gratuite === true) {
        scoreAdéquation += 10;
      } else {
        criteresEchoues.push("Pas de version gratuite");
      }
    }

    // --- CRITÈRE 2 : INSTALLATION ---
    if (typeInstallationSelectionne !== "Tous") {
      maxCriteresActifs++;
      let typeInstalBase = String(ia.type_installation || ia["type d'installation"] || "").toLowerCase();
      if (typeInstallationSelectionne === 'Local' && typeInstalBase.includes('local')) {
        scoreAdéquation += 10;
      } else if (typeInstallationSelectionne === 'serveur' && (typeInstalBase.includes('serveur') || typeInstalBase.includes('saas'))) {
        scoreAdéquation += 10;
      } else {
        criteresEchoues.push(`Type d'installation requis non respecté (${typeInstallationSelectionne})`);
      }
    }

    // --- CRITÈRE 3 : FORMAT ---
    if (formatSelectionne !== "Tous") {
      maxCriteresActifs++;
      let formatBase = String(ia.format || "").toLowerCase();
      if (formatSelectionne === 'Open Source' && formatBase.includes('open')) {
        scoreAdéquation += 10;
      } else if (formatSelectionne === 'Propriétaire' && (formatBase.includes('propri') || formatBase.includes('saas'))) {
        scoreAdéquation += 10;
      } else {
        criteresEchoues.push(`Format requis non respecté (${formatSelectionne})`);
      }
    }

    // --- CRITÈRE 4 : UTILITÉ ---
    if (utiliteSelectionnee !== "Tous") {
      maxCriteresActifs++;
      let utiliteBase = String(ia.utilite || ia.Utilité || "").toLowerCase();
      let nomBase = String(ia.nom || ia.IA || "").toLowerCase();
      
      let estValide = false;
      if (utiliteSelectionnee === 'Généraliste' && (utiliteBase.includes('généraliste') || utiliteBase.includes('assistant'))) estValide = true;
      if (utiliteSelectionnee === 'Programmation' && (utiliteBase.includes('code') || utiliteBase.includes('programmation') || nomBase.includes('cursor') || nomBase.includes('copilot'))) estValide = true;
      if (utiliteSelectionnee === 'Image' && (utiliteBase.includes('image') || utiliteBase.includes('graphique'))) estValide = true;
      if (utiliteSelectionnee === 'Recherche' && (utiliteBase.includes('recherche') || utiliteBase.includes('éducation'))) estValide = true;

      if (estValide) {
        scoreAdéquation += 15;
      } else {
        criteresEchoues.push(`Pas optimisé pour l'usage : ${utiliteSelectionnee}`);
      }
    }

    // --- CRITÈRE 5 : PROFIL / SÉCURITÉ ---
    if (profilSelectionne !== "Tous") {
      maxCriteresActifs++;
      let secuBase = String(ia.securite_confidentialite || ia["sécurité /confidentialité"] || "").toLowerCase();
      if (profilSelectionne === 'Professionnel' && (secuBase.includes('totale') || secuBase.includes('infrastructure locale') || secuBase.includes('confidentielles'))) {
        scoreAdéquation += 10;
      } else {
        criteresEchoues.push("Niveau de sécurité insuffisant pour entreprise");
      }
    }

    // --- CRITÈRE 6 : PUISSANCE (BENCHMARK) ---
    maxCriteresActifs++;
    let benchText = String(ia.performance_benchmark || ia["Performance Benchmark (MMLU Pro / GPQA)"] || "");
    let scoreMMLU = parseInt(benchText.replace(/[^0-9]/g, '')) || 0;
    
    if (performanceSelectionnee === 'Expert') {
      if (scoreMMLU >= 85) {
        scoreAdéquation += 10;
      } else {
        criteresEchoues.push(`Puissance de réflexion trop limitée pour calcul complexe (${benchText})`);
      }
    } else {
      if (scoreMMLU < 85) {
        scoreAdéquation += 10;
      } else {
        criteresEchoues.push("Modèle lourd (généralement plus lent ou plus coûteux qu'un modèle standard)");
      }
    }

    // --- CRITÈRE 7 : CAPACITÉ DE MÉMOIRE (CONTEXTE) ---
    maxCriteresActifs++;
    let contexteText = String(ia.taille_fenetre_contexte || ia["Taille de la Fenêtre de Contexte"] || "").toLowerCase();
    let aGrosseMemoire = contexteText.includes('200k') || contexteText.includes('10m') || contexteText.includes('2m');
    
    if (contexteSelectionne === 'Gros') {
      if (aGrosseMemoire) {
        scoreAdéquation += 10;
      } else {
        criteresEchoues.push(`Capacité de mémoire textuelle trop restreinte (${contexteText})`);
      }
    } else {
      if (!aGrosseMemoire) {
        scoreAdéquation += 10;
      } else {
        criteresEchoues.push("Mémoire surdimensionnée pour des requêtes courtes");
      }
    }

    // --- CRITÈRE 8 : LANGUE ---
    if (langueSelectionnee !== "Tous") {
      maxCriteresActifs++;
      let langueBase = String(ia.langue || ia.Langues || ia["Langues Supportées"] || "").toLowerCase();
      if (langueSelectionnee === 'Francais' && (langueBase.includes('français') || langueBase.includes('multilingue'))) {
        scoreAdéquation += 10;
      } else {
        criteresEchoues.push("Support du Français absent ou limité (Anglais requis)");
      }
    }

    let noteInterface = ia.score_qualite_interface || 7;
    let noteRapidite = ia.score_rapidite || 7;
    
    ia.scoreCalculé = noteInterface + noteRapidite;
    ia.scoreAdéquation = scoreAdéquation;
    ia.criteresEchoues = criteresEchoues;
    ia.tauxMatch = maxCriteresActifs > 0 ? Math.round((1 - (criteresEchoues.length / maxCriteresActifs)) * 100) : 100;

    return ia;
  });

  tableRecommandations.sort((a, b) => b.tauxMatch - a.tauxMatch || b.scoreCalculé - a.scoreCalculé);

  afficherResultats(tableRecommandations);
}

function afficherResultats(listeIA) {
  const sectionResultats = document.getElementById('resultats-section');
  const conteneurListe = document.getElementById('liste-ia');

  if (!sectionResultats || !conteneurListe) return;

  conteneurListe.innerHTML = "";
  sectionResultats.classList.remove('hidden');

  listeIA.forEach((ia, index) => {
    let nomIA = ia.nom || ia.IA || 'Outil IA';
    let utiliteIA = ia.utilite || ia.Utilité || 'Non spécifiée';
    let coutIA = ia.cout_installation || ia.coût_installation || 'Non spécifié';
    let lienIA = ia.lien_officiel || ia.Sources || '#';
    let benchmark = ia.performance_benchmark || ia["Performance Benchmark (MMLU Pro / GPQA)"] || 'Non évalué';
    let contexte = ia.taille_fenetre_contexte || ia["Taille de la Fenêtre de Contexte"] || 'Standard';
    let langueIA = ia.langue || ia.Langues || ia["Langues Supportées"] || 'Multilingue';
    
    let valeurInstallation = ia.type_installation || ia["type d'installation (local ou serveur)"] || "";
    let typeInstal = String(valeurInstallation).toLowerCase();
    let badgeClass = typeInstal.includes('local') ? 'badge-local' : 'badge-cloud';
    let badgeText = typeInstal.includes('local') ? '💻 Local' : '☁️ Cloud / Internet';

    let blocDefautsHTML = "";
    if (ia.criteresEchoues.length > 0) {
      blocDefautsHTML += `<div style="margin: 10px 0; padding: 8px; background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; border-radius: 4px;">`;
      blocDefautsHTML += `<span style="font-size: 12px; font-weight: bold; color: #fca5a5; display: block; margin-bottom: 4px;">⚠️ Écarts constatés :</span>`;
      ia.criteresEchoues.forEach(defaut => {
        blocDefautsHTML += `<span style="font-size: 12px; color: #f8fafc; display: block;">• ${defaut}</span>`;
      });
      blocDefautsHTML += `</div>`;
    } else {
      blocDefautsHTML += `<div style="margin: 10px 0; padding: 8px; background: rgba(16, 185, 129, 0.1); border-left: 3px solid #10b981; border-radius: 4px;"><span style="font-size: 12px; font-weight: bold; color: #a7f3d0;">✅ Correspondance parfaite à vos critères !</span></div>`;
    }

    let colorTag = ia.tauxMatch === 100 ? '#10b981' : (ia.tauxMatch >= 50 ? '#f59e0b' : '#ef4444');

    // MÊME LOGIQUE POUR LES BOUTONS DE LA DEUXIÈME PAGE (RÉSULTATS DE L'ORIENTATION)
    let texteActionBoutonRecommandation = typeInstal.includes('local') ? 'Télécharger / Installer l\'outil 💾' : 'Tester l\'outil en ligne 🌐';

    let cardHTML = `
      <div class="card-ia" style="border-top: 4px solid ${colorTag};">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
             <span class="score-tag" style="margin-bottom:0;">🎯 Match : ${ia.tauxMatch}%</span>
             <span style="font-size: 12px; color: var(--text-muted); font-weight: bold;">Note : ${ia.scoreCalculé}/20</span>
          </div>
          <h3>${nomIA}</h3>
          <span class="badge ${badgeClass}">${badgeText}</span>
          
          <p><strong>Usage :</strong> ${utiliteIA}</p>
          <p><strong>Langues :</strong> ${langueIA}</p>
          <p><strong>Mémoire immédiate :</strong> ${contexte}</p>
          <p><strong>Raisonnement :</strong> ${benchmark}</p>
          <p><strong>Tarif :</strong> ${coutIA}</p>
          
          ${blocDefautsHTML}
        </div>
        <a href="${lienIA}" target="_blank" class="btn-card" style="margin-top:15px; display:inline-block;">${texteActionBoutonRecommandation}</a>
      </div>
    `;
    conteneurListe.innerHTML += cardHTML;
  });
}