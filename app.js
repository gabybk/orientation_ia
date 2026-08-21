// Configuration Supabase
const SUPABASE_URL = "https://ohlxeskhravwrjumgtqs.supabase.co";
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

// --- INITIALISATION DE L'APPLICATION (VITRINE) ---
async function initialiserApplication() {
  try {
    let { data: listeOutils, error } = await client.from('outils_ia').select('*');
    if (error) {
      console.error("Erreur Supabase :", error.message);
      return;
    }

    const conteneurVitrine = document.getElementById('vitrine-ia');
    if (!conteneurVitrine) return;

    conteneurVitrine.innerHTML = "";

    // Prendre les 6 premières IA de la base de données pour la vitrine d'accueil
    const selectionVitrine = listeOutils.slice(0, 6);

    selectionVitrine.forEach(ia => {
      let nomIA = ia.nom || ia.IA || 'Outil IA';
      let utiliteIA = ia.utilite || ia.Utilité || 'Non spécifiée';
      let lienIA = ia.lien_officiel || ia.Sources || '#';
      
      let valeurInstallation = ia.type_installation || ia["type d'installation (local ou serveur)"] || "";
      let typeInstal = String(valeurInstallation).toLowerCase();
      let badgeClass = typeInstal.includes('local') ? 'badge-local' : 'badge-cloud';
      let badgeText = typeInstal.includes('local') ? '💻 Local' : '☁️ Cloud';

      let descriptionCourte = ia.securite_confidentialite || ia["sécurité /confidentialité"] || "";
      if (descriptionCourte.length > 80) {
        descriptionCourte = descriptionCourte.substring(0, 80) + "...";
      }

      const cardHTML = `
        <div class="card-ia">
          <h3>${nomIA}</h3>
          <span class="badge ${badgeClass}">${badgeText}</span>
          <p style="margin-top: 10px;"><strong>Usage :</strong> ${utiliteIA}</p>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 5px;">${descriptionCourte}</p>
          <a href="${lienIA}" target="_blank" class="btn-card" style="margin-top: 15px; display: inline-block; text-align: center; width: 100%;">Découvrir 🌐</a>
        </div>
      `;
      conteneurVitrine.innerHTML += cardHTML;
    });

  } catch (err) {
    console.error("Erreur générale lors de l'initialisation :", err);
  }
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

  // 1. Calculer les scores d'adéquation pour chaque IA
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
    let estValideUtilité = true; 
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
        estValideUtilité = false; 
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
    ia.estValideUtilité = estValideUtilité;

    return ia;
  });

  // 2. FILTRAGE PAR DOMAINE D'ACTIVITÉ STRICT
  let listeMemeDomaine = tableRecommandations.filter(ia => {
    if (utiliteSelectionnee !== "Tous" && !ia.estValideUtilité) {
      return false; 
    }
    return true;
  });

  // 3. SÉPARATION DES GROUPES (PARFAITS vs ALTERNATIVES)
  let perfectMatches = listeMemeDomaine.filter(ia => ia.tauxMatch === 100);
  let partialMatches = listeMemeDomaine.filter(ia => ia.tauxMatch >= 50 && ia.tauxMatch < 100);

  // Tris respectifs
  perfectMatches.sort((a, b) => b.scoreCalculé - a.scoreCalculé);
  partialMatches.sort((a, b) => b.tauxMatch - a.tauxMatch || b.scoreCalculé - a.scoreCalculé);

  // 4. APPLICATION DE LA RÈGLE DES 5 MINIMUM
  let finalResultats = [];
  let aAssezDeMatchsParfaits = perfectMatches.length >= 5;

  if (aAssezDeMatchsParfaits) {
    // Si on a 5 ou plus correspondances parfaites, on n'affiche QUE celles-ci !
    finalResultats = perfectMatches;
  } else {
    // Sinon (moins de 5 parfaits), on fusionne les parfaits et on complète avec les alternatives
    finalResultats = [...perfectMatches, ...partialMatches];
  }

  // Envoi des résultats et des indicateurs à l'affichage
  afficherResultats(finalResultats, aAssezDeMatchsParfaits, perfectMatches.length);
}

// --- FONCTION : RENDU DES CARTES DANS L'INTERFACE ---
function afficherResultats(listeIA, aAssezDeMatchsParfaits, nbMatchsParfaits) {
  const sectionResultats = document.getElementById('resultats-section');
  const conteneurListe = document.getElementById('liste-ia');

  if (!sectionResultats || !conteneurListe) return;

  conteneurListe.innerHTML = "";
  sectionResultats.classList.remove('hidden');

  // S'il n'y a absolument rien à afficher
  if (listeIA.length === 0) {
    conteneurListe.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px;">
        <span style="font-size: 40px;">🚫</span>
        <h3 style="color: #ef4444; margin-top: 10px;">Aucun résultat trouvé</h3>
        <p style="color: var(--text-muted); margin-top: 5px;">Essayez d'élargir vos critères de recherche pour obtenir des suggestions.</p>
      </div>
    `;
    return;
  }

  // Affichage du message personnalisé si on a dû compléter avec des alternatives (moins de 5 parfaits)
  if (!aAssezDeMatchsParfaits) {
    let messageAlerte = "";
    if (nbMatchsParfaits === 0) {
      messageAlerte = "Désolé, aucune IA de notre connaissance ne parvient à respecter absolument tous vos critères en même temps.";
    } else {
      messageAlerte = `Nous avons trouvé seulement ${nbMatchsParfaits} IA correspondant parfaitement à 100% à tous vos critères.`;
    }

    const htmlEnteteAlternatif = `
      <div class="alert-no-perfect-match" style="grid-column: 1 / -1; margin-bottom: 20px; padding: 15px; background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; border-radius: 6px;">
        <h4 style="color: #f59e0b; margin-bottom: 5px; font-size: 16px;">⚠️ Suggestions d'alternatives (Seuil de 5 résultats parfaits non atteint)</h4>
        <p style="color: #cbd5e1; font-size: 14px; margin: 0;">
          ${messageAlerte} <strong>Voici les meilleures alternatives qui s'en rapprochent le plus :</strong>
        </p>
      </div>
    `;
    conteneurListe.innerHTML += htmlEnteteAlternatif;
  }

  // Rendu de chaque carte d'IA
  listeIA.forEach((ia) => {
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

    // Bloc affichant les critères échoués ou réussis
    let blocDefautsHTML = "";
    if (ia.criteresEchoues.length > 0) {
      blocDefautsHTML += `
        <div style="margin: 10px 0; padding: 8px; background: rgba(239, 68, 68, 0.1); border-left: 3px solid #ef4444; border-radius: 4px;">
          <span style="font-size: 12px; font-weight: bold; color: #fca5a5; display: block; margin-bottom: 4px;">⚠️ Critères non respectés :</span>
          ${ia.criteresEchoues.map(defaut => `<span style="font-size: 12px; color: #f8fafc; display: block;">• ${defaut}</span>`).join('')}
        </div>
      `;
    } else {
      blocDefautsHTML += `
        <div style="margin: 10px 0; padding: 8px; background: rgba(16, 185, 129, 0.1); border-left: 3px solid #10b981; border-radius: 4px;">
          <span style="font-size: 12px; font-weight: bold; color: #a7f3d0;">✅ Correspondance parfaite à vos critères !</span>
        </div>
      `;
    }

    let colorTag = ia.tauxMatch === 100 ? '#10b981' : (ia.tauxMatch >= 70 ? '#f59e0b' : '#ef4444');
    let texteActionBoutonRecommandation = typeInstal.includes('local') ? 'Télécharger / Installer l\'outil 💾' : 'Tester l\'outil en ligne 🌐';

    let cardHTML = `
      <div class="card-ia" style="border-top: 4px solid ${colorTag};">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
             <span class="score-tag" style="margin-bottom:0; background-color: ${colorTag}22; color: ${colorTag}; border: 1px solid ${colorTag}44; padding: 2px 8px; border-radius: 20px; font-size: 12px; font-weight: bold;">🎯 Match : ${ia.tauxMatch}%</span>
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
        <a href="${lienIA}" target="_blank" class="btn-card" style="margin-top:15px; display:inline-block; text-align:center; width: 100%;">${texteActionBoutonRecommandation}</a>
      </div>
    `;
    conteneurListe.innerHTML += cardHTML;
  });
}

// ==========================================================================
// 💬 LOGIQUE DU CHATBOT DIRECTIONNEL (CABINET SHAURI)
// ==========================================================================

// Variables d'état du Chatbot
let etapeChat = 0;
let choixUtilisateur = {
  installation: "Tous",
  utilite: "Tous",
  gratuit: false
};

// 1. Ouvrir / Fermer la fenêtre du chatbot
function toggleChatbot() {
  const fenetre = document.getElementById('chatbot-window');
  if (fenetre) {
    fenetre.classList.toggle('hidden');
  }
}

// 2. Ajouter un message dans la zone de discussion
function ajouterMessageChat(texte, expediteur) {
  const zoneMessages = document.getElementById('chatbot-messages');
  if (!zoneMessages) return;

  const divMessage = document.createElement('div');
  divMessage.className = `message ${expediteur}-message`;
  divMessage.innerHTML = texte;
  
  zoneMessages.appendChild(divMessage);
  
  // Faire défiler automatiquement vers le bas
  zoneMessages.scrollTop = zoneMessages.scrollHeight;
}

// 3. Modifier dynamiquement les boutons d'options en bas du chat
function afficherOptionsChat(options) {
  const zoneOptions = document.getElementById('chatbot-options');
  if (!zoneOptions) return;

  zoneOptions.innerHTML = ""; // Vider les anciennes options

  options.forEach(opt => {
    const bouton = document.createElement('button');
    bouton.className = "btn-chat-option";
    bouton.innerText = opt.texte;
    bouton.onclick = () => traiterChoixChat(opt.valeur, opt.texte);
    zoneOptions.appendChild(bouton);
  });
}

// 4. Démarrer le diagnostic (Déclenché par le bouton "Oui, c'est parti !")
function demarrerDiagnostic() {
  etapeChat = 1;
  ajouterMessageChat("Oui, c'est parti ! 🚀", "user");
  
  setTimeout(() => {
    ajouterMessageChat("Super ! Commençons par la sécurité et le contrôle de vos données. 🔒", "bot");
    ajouterMessageChat("Souhaitez-vous installer l'IA directement sur votre ordinateur (Local) ou préférez-vous l'utiliser directement sur internet (Cloud) ?", "bot");
    
    afficherOptionsChat([
      { texte: "💻 Strictement en Local", valeur: "Local" },
      { texte: "☁️ Sur le Cloud (Internet)", valeur: "serveur" },
      { texte: "🤷 Peu importe", valeur: "Tous" }
    ]);
  }, 800);
}

// 5. Gérer les réponses aux questions étape par étape
function traiterChoixChat(valeur, texteAffiche) {
  // Afficher la réponse de l'utilisateur dans le chat
  ajouterMessageChat(texteAffiche, "user");

  if (etapeChat === 1) {
    // Enregistrement de la réponse 1 (Installation)
    choixUtilisateur.installation = valeur;
    etapeChat = 2;

    setTimeout(() => {
      ajouterMessageChat("C'est noté ! 📝 Quelle sera l'utilisation principale de votre IA ?", "bot");
      
      afficherOptionsChat([
        { texte: "✍️ Rédiger/Résumer (Généraliste)", valeur: "Généraliste" },
        { texte: "💻 Programmer / Coder", valeur: "Programmation" },
        { texte: "🎨 Créer des images", valeur: "Image" },
        { texte: "📚 Analyser des fichiers / Réviser", valeur: "Recherche" },
        { texte: "🌍 Tous les domaines", valeur: "Tous" }
      ]);
    }, 800);

  } else if (etapeChat === 2) {
    // Enregistrement de la réponse 2 (Utilité)
    choixUtilisateur.utilite = valeur;
    etapeChat = 3;

    setTimeout(() => {
      ajouterMessageChat("Très bien. Et concernant le budget ? Cherchez-vous spécifiquement un outil avec une version gratuite ?", "bot");
      
      afficherOptionsChat([
        { texte: "🎁 Oui, gratuit en priorité !", valeur: true },
        { texte: "💸 Peu importe le tarif", valeur: false }
      ]);
    }, 800);

  } else if (etapeChat === 3) {
    // Enregistrement de la réponse 3 (Gratuité)
    choixUtilisateur.gratuit = valeur;
    etapeChat = 4;

    setTimeout(() => {
      ajouterMessageChat("Parfait ! J'ai rassemblé toutes les données clés pour votre profil. 🧠⚡", "bot");
      ajouterMessageChat("Je configure instantanément vos filtres et je calcule vos recommandations...", "bot");
      
      // Injecter les choix récoltés dans le formulaire principal et lancer la recommandation !
      appliquerChoixChatAuSysteme();
    }, 800);
  }
}

// 6. Injecter les données du Chatbot dans le formulaire et lancer l'algorithme d'orientation
function appliquerChoixChatAuSysteme() {
  // Récupération des éléments du formulaire réel de la page
  const selectInstallation = document.getElementById('critere-installation');
  const selectUtlite = document.getElementById('critere-utilite');
  const checkGratuit = document.getElementById('critere-gratuit');

  // Remplissage automatique en arrière-plan
  if (selectInstallation) selectInstallation.value = choixUtilisateur.installation;
  if (selectUtlite) selectUtlite.value = choixUtilisateur.utilite;
  if (checkGratuit) checkGratuit.checked = choixUtilisateur.gratuit;

  // Lancement de l'algorithme d'orientation
  calculerRecommandations();

  setTimeout(() => {
    ajouterMessageChat("✅ C'est fait ! Vos recommandations personnalisées viennent de s'afficher juste en dessous sur la page. Vous pouvez fermer ce chat pour les découvrir ! 😊", "bot");
    
    // Vider les options pour terminer proprement la discussion
    const zoneOptions = document.getElementById('chatbot-options');
    if (zoneOptions) zoneOptions.innerHTML = `<span style="font-size:12px; color:var(--text-muted);">Diagnostic terminé.</span>`;

    // Faire défiler l'écran de l'utilisateur automatiquement jusqu'à ses résultats
    const sectionResultats = document.getElementById('resultats-section');
    if (sectionResultats) {
      sectionResultats.scrollIntoView({ behavior: 'smooth' });
    }
  }, 1200);
}
// 7. Réinitialiser la conversation sans recharger la page
function reinitialiserChatbot() {
  // Remise à zéro des variables d'état
  etapeChat = 0;
  choixUtilisateur = {
    installation: "Tous",
    utilite: "Tous",
    gratuit: false
  };

  // Nettoyage de la zone des messages
  const zoneMessages = document.getElementById('chatbot-messages');
  if (zoneMessages) {
    zoneMessages.innerHTML = `
      <div class="message bot-message">
          Bonjour ! Je suis l'assistant virtuel du cabinet Shauri. 😊
      </div>
      <div class="message bot-message">
          Je vais vous poser quelques questions pour trouver l'IA idéale pour votre PME ou vos études au Cameroun. On commence ?
      </div>
    `;
  }

  // Remise à l'état initial des boutons d'options (Bouton de départ)
  const zoneOptions = document.getElementById('chatbot-options');
  if (zoneOptions) {
    zoneOptions.innerHTML = `
      <button class="btn-chat-option" onclick="demarrerDiagnostic()">Oui, c'est parti ! 🚀</button>
    `;
  }
}
