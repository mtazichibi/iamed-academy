/* ═══════════════════════════════════════════════════════════════
   IAMED Academy — app.js
   Centre d'Excellence en IA pour les Professionnels de Santé
   Version GitHub Pages — Mai 2026
════════════════════════════════════════════════════════════════ */

// ─── FILE DOWNLOADER ─────────────────────────────
// ─── DOWNLOAD via fetch (GitHub Pages — fichiers dans data/) ────────────────
const IAMED_FILE_PATHS = {
  "manuel_prompt_engineering_medecins.html":   { path: "data/manuel_prompt_engineering_medecins.html",   sizeKb: 487, downloadName: "Manuel_Prompt_Engineering_Medecins.html" },
  "cours_prompt_engineering_medecins.html":    { path: "data/cours_prompt_engineering_medecins.html",    sizeKb: 80,  downloadName: "Fiches_Exercices_Prompt_Engineering.html" },
  "brochure_prompt_engineering_medecins.html": { path: "data/brochure_prompt_engineering_medecins.html", sizeKb: 444, downloadName: "Brochure_Prompt_Engineering_Medecins.html" },
};

function downloadFile(fileKey, downloadName, toastMsg) {
  const entry = IAMED_FILE_PATHS[fileKey];
  if (!entry) { showToast("❌ Fichier introuvable"); return; }
  showToast("⏳ Téléchargement en cours...");
  fetch(entry.path)
    .then(r => { if (!r.ok) throw new Error('Erreur réseau'); return r.blob(); })
    .then(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = entry.downloadName;
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
      showToast(toastMsg + " (" + entry.sizeKb + " Ko)");
    })
    .catch(() => showToast("❌ Erreur — vérifiez votre connexion"));
}

// ─── PAGE ROUTER ─────────────────────────────
const navMap = { 'home':'nav-home', 'courses':'nav-courses', 'about':'nav-about' };

function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById('page-' + name);
  if (pg) pg.classList.add('active');

  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const navEl = document.getElementById('nav-' + name);
  if (navEl) navEl.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });
  setTimeout(observeFadeUps, 100);

  // Page-specific init (no recursion — single function, no override)
  if (name === 'qcm' && typeof qcmState !== 'undefined' && !qcmState.started) initQCM();
  if (name === 'exercices' && typeof renderExercices !== 'undefined') { renderExercices(currentBloc); updateSavedIndicator(false); }
  if (name === 'certificat' && typeof initCert !== 'undefined') initCert();
}

// ─── ACCORDION BLOCS ─────────────────────────
function toggleBloc(header) {
  const content = header.nextElementSibling;
  const chevron = header.querySelector('.chevron');
  const isOpen = content.style.display !== 'none';
  content.style.display = isOpen ? 'none' : 'block';
  if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(90deg)';
}

// ─── FILTER TABS ─────────────────────────────
function setFilter(el) {
  const parent = el.closest('.courses-filter-bar');
  if (parent) parent.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  else document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
}

// ─── TOAST ───────────────────────────────────
function showToast(msg) {
  const toast = document.getElementById('toast');
  const parts = msg.split(' ');
  const icon = parts[0];
  const text = parts.slice(1).join(' ');
  document.getElementById('toast-icon').textContent = icon;
  document.getElementById('toast-msg').textContent = text;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3500);
}

// ─── MODULE PROGRESS ─────────────────────────
function checkProgress() {
  const boxes = document.querySelectorAll('#page-module input[type="checkbox"]');
  const all = [...boxes].every(b => b.checked);
  const btn = document.getElementById('btn-complete');
  if (btn) {
    btn.style.opacity = all ? '1' : '0.5';
    btn.style.pointerEvents = all ? 'auto' : 'none';
  }
}

function completeExercise() {
  const actions = document.getElementById('module-actions');
  const msg = document.getElementById('completion-msg');
  if (actions) actions.style.display = 'none';
  if (msg) msg.style.display = 'block';
  showToast('🎉 Exercice complété ! +15 points de progression');
}

// ─── SCROLL FADE IN ───────────────────────────
function observeFadeUps() {
  const els = document.querySelectorAll('.fade-up:not(.visible)');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach((e, i) => {
      if (e.isIntersecting) {
        setTimeout(() => e.target.classList.add('visible'), i * 80);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08 });
  els.forEach(el => obs.observe(el));
}

document.addEventListener('DOMContentLoaded', observeFadeUps);

// ══════════════════════════════════════════════
//  QCM DATA — 20 questions cliniques
// ══════════════════════════════════════════════
const QCM_QUESTIONS = [
  { q: "Vous avez besoin des dernières recommandations ESC/ESH 2024 sur l'HTA résistante. Quel mode d'interrogation choisissez-vous ?", opts: ["Connaissance intégrée — le modèle les connaît", "Web search activé — pour accéder aux données récentes", "Deep research — pour une synthèse bibliographique complète", "Aucun — consultez directement le site ESC"], correct: 1, expl: "Le web search est indispensable pour toute recommandation publiée dans les 12–18 derniers mois. La connaissance intégrée s'arrête à la date d'entraînement du modèle." },
  { q: "L'IA cite l'étude 'EMPA-REG OUTCOME, Zinman et al., NEJM 2015'. Selon la grille feux tricolores, cette source est :", opts: ["🔴 Rouge — pas de source identifiable", "🟡 Orange — à vérifier avant usage", "🟢 Verte — identifiable et vérifiable sur PubMed", "Non évaluable avec la grille"], correct: 2, expl: "EMPA-REG OUTCOME est une étude réelle, publiée dans le NEJM, vérifiable sur PubMed (PMID 26378978). C'est une source verte — nommée, identifiable, retrouvable." },
  { q: "Quel élément n'est PAS obligatoire dans un prompt médical efficace ?", opts: ["Le profil patient précis (âge, comorbidités, traitements)", "La guideline de référence citée explicitement", "Le nom du médecin qui pose la question", "Les critères de comparaison ou d'évaluation explicites"], correct: 2, expl: "Un bon prompt médical contient : profil patient précis, guideline de référence, critères de comparaison. Le nom du médecin n'est ni utile ni recommandé (confidentialité)." },
  { q: "Un LLM élabore sur des faux détails intégrés dans des vignettes cliniques dans quelle proportion selon PMC 2025 ?", opts: ["5 à 10% des cas", "10 à 20% des cas", "25 à 50% des cas", "Plus de 80% des cas"], correct: 2, expl: "L'étude PMC 2025 sur la vulnérabilité des LLM aux hallucinations adversariales montre que les modèles élaborent sur de faux détails dans 25 à 50% des cas cliniques testés." },
  { q: "Quelle mention est obligatoire dans tout outil clinique généré par l'IA ?", opts: ["Le nom du modèle IA utilisé (ex : Claude 3)", "La date de génération de l'outil", "'Usage aide-mémoire uniquement — ne remplace pas le jugement clinique'", "La version des guidelines utilisées en référence"], correct: 2, expl: "La mention médico-légale est non négociable : 'Usage aide-mémoire uniquement — ne remplace pas le jugement clinique du médecin'. Elle protège le médecin et informe l'utilisateur." },
  { q: "Dans le cadre PACTE, que représente le 'T' ?", opts: ["Traçabilité — citer ses sources", "Ton & Format — structure et style de la réponse", "Temporalité — préciser l'année des recommandations", "Test — demander une version alternative"], correct: 1, expl: "PACTE = Persona, Action, Contexte, Ton & Format, Exemples. Le T précise la structure souhaitée, le nombre de parties, le style (pédagogique, concis, clinique)." },
  { q: "Parmi ces réponses de l'IA, laquelle présente un signe probable de sycophancy ?", opts: ["'Votre hypothèse de diagnostic est correcte. Voici 3 arguments en faveur.'", "'Cette hypothèse mérite d'être challengée — voici 4 diagnostics alternatifs à éliminer.'", "'Je ne peux pas confirmer ce diagnostic sans données complémentaires.'", "'Les deux diagnostics sont possibles, voici leurs probabilités respectives.'"], correct: 0, expl: "La réponse A valide l'hypothèse par défaut sans challenger. C'est le comportement sycophante classique. Les réponses B, C et D adoptent une posture critique appropriée." },
  { q: "Quelle instruction améliore le plus la qualité d'une réponse sur un cas clinique complexe multi-contraintes ?", opts: ["'Réponds en moins de 200 mots'", "'Utilise uniquement des sources après 2020'", "'Raisonne étape par étape en justifiant chaque étape'", "'Commence par les diagnostics les plus fréquents'"], correct: 2, expl: "Le chain-of-thought ('raisonne étape par étape') oblige le modèle à traiter chaque contrainte explicitement, évitant les omissions d'interactions médicamenteuses ou d'adaptations posologiques." },
  { q: "Que ne devez-vous JAMAIS intégrer dans un prompt IA en contexte hospitalier ?", opts: ["La spécialité du patient (ex: cardiologie)", "Le nom, prénom et numéro de sécurité sociale du patient", "Les valeurs biologiques du patient (ex: DFG 32 ml/min)", "La pathologie principale du patient"], correct: 1, expl: "RGPD et secret médical : jamais de données identifiantes (nom, prénom, N° sécu, date de naissance complète). Utilisez 'Patient 1', 'Patient 2' ou des données anonymisées." },
  { q: "Pour quelle situation le mode 'deep research' est-il le plus adapté ?", opts: ["Vérifier le mécanisme d'action de la metformine", "Trouver le score CURB-65 d'un patient", "Préparer une RCP pour un patient BPCO + IC + FA", "Générer une ordonnance de sortie"], correct: 2, expl: "Le deep research est conçu pour les synthèses bibliographiques multi-sources et les cas complexes multi-morbidités. Pour BPCO+IC+FA, il identifiera les interactions croisées et les essais récents." },
  { q: "Le composant 'P' du cadre PACTE correspond à :", opts: ["Plan — structurer la réponse en plusieurs parties", "Persona — définir le rôle expert que l'IA doit jouer", "Précision — demander des données chiffrées", "Preuve — exiger des sources et niveaux de preuve"], correct: 1, expl: "P = Persona : 'Tu es un hématologue spécialisé en hémostase'. Plus le rôle est précis, plus la réponse est adaptée au contexte clinique et à l'audience visée." },
  { q: "Vous demandez à l'IA de critiquer un compte-rendu d'hospitalisation. Lequel de ces axes n'est PAS recommandé ?", opts: ["Clarté clinique — le MT peut-il reprendre le suivi ?", "Esthétique — la mise en page est-elle professionnelle ?", "Complétude — quels éléments essentiels manquent ?", "Langage — y a-t-il du jargon incompréhensible pour un généraliste ?"], correct: 1, expl: "Les 3 axes de critique recommandés sont : clarté clinique, complétude, et pertinence du langage. L'esthétique n'a pas de valeur clinique dans ce contexte." },
  { q: "Comment neutraliser la sycophancy lors d'un diagnostic différentiel ?", opts: ["Demander 'Confirme mon hypothèse avec des arguments solides'", "Utiliser 'Joue l'avocat du diable — quel diagnostic ai-je le plus de risque de manquer ?'", "Poser la question deux fois pour voir si la réponse change", "Changer de modèle d'IA"], correct: 1, expl: "'Joue l'avocat du diable' et 'Ne me flatte pas — quels arguments contre mon hypothèse ?' sont les deux prompts anti-sycophancy recommandés. Ils forcent l'IA à challenger l'hypothèse." },
  { q: "Quelle est la principale limite du mode 'connaissance intégrée' ?", opts: ["Il ne peut pas traiter les questions médicales complexes", "Il invente systématiquement ses sources", "Ses données sont figées à la date d'entraînement du modèle", "Il ne comprend pas le jargon médical"], correct: 2, expl: "La connaissance intégrée est fiable pour les données stables (mécanismes, physiopathologie), mais ne connaît pas les recommandations publiées après sa date de coupure d'entraînement." },
  { q: "Pour demander une adaptation posologique en insuffisance rénale (DFG 32), quelle approche est la plus sûre ?", opts: ["Demander directement : 'Quelle dose pour IRC stade 3b ?'", "Utiliser le chain-of-thought : identifier d'abord les contraintes IRC, puis les interactions, puis proposer le protocole", "Chercher dans une base de données médicamenteuse externe", "Poser la question sans contexte et comparer 3 réponses"], correct: 1, expl: "Le chain-of-thought décomposé (1) contraintes IRC sur chaque classe, 2) interactions, 3) sévérité, 4) protocole, 5) surveillance) obtient une réponse plus fiable et vérifiable qu'une question directe." },
  { q: "Un PMID cité par l'IA renvoie sur PubMed vers un article différent de celui décrit. Selon la grille feux tricolores :", opts: ["🟢 Vert — le PMID existe, c'est suffisant", "🟡 Orange — demander à l'IA de confirmer le titre exact", "🔴 Rouge — ne pas utiliser en clinique sans vérification indépendante", "Grille non applicable dans ce cas"], correct: 2, expl: "Un PMID renvoyant vers un autre article = source rouge. C'est le signe d'une hallucination. Ne jamais utiliser en clinique sans vérification. Utilisez le prompt : 'Cette étude existe-t-elle vraiment ?'" },
  { q: "Vous créez un calculateur de score CHA₂DS₂-VASc avec l'IA. Avant tout usage clinique :", opts: ["Il faut le faire valider par un juriste", "Il faut le tester sur au moins 3 profils connus et vérifier chaque calcul", "Il faut le convertir en PDF pour qu'il soit officiel", "Il faut l'envoyer à la société savante pour validation"], correct: 1, expl: "3 règles non négociables : 1) mention aide-mémoire obligatoire, 2) tester sur cas connus (femme 76 ans HTA+AVC → score 5, homme 60 ans sans FDR → score 0), 3) jamais de données identifiantes." },
  { q: "Dans quel cas activez-vous le web search plutôt que la connaissance intégrée ?", opts: ["Mécanisme d'action des bêtabloquants", "Physiopathologie de l'insuffisance cardiaque", "Guidelines ADA 2025 sur le DT2 avec IRC", "Classification OMS des tumeurs pulmonaires"], correct: 2, expl: "Les guidelines ADA 2025 sont récentes. La connaissance intégrée ne les connaît pas si elles sont postérieures à la date de coupure. Web search obligatoire pour toute recommandation de moins de 12-18 mois." },
  { q: "Quel est le risque principal de la sycophancy en pratique clinique ?", opts: ["L'IA génère des réponses trop longues", "L'IA confirme un diagnostic incorrect, renforçant la certitude du médecin de façon illégitime", "L'IA refuse de répondre aux questions complexes", "L'IA cite trop de sources"], correct: 1, expl: "La sycophancy est cliniquement dangereuse : si vous soumettez une hypothèse erronée, l'IA la valide. Cela renforce une certitude illégitime et peut retarder le bon diagnostic." },
  { q: "Pour décrire une image médicale à l'IA quand vous ne pouvez pas la télécharger, quels sont les 4 éléments essentiels ?", opts: ["Titre, auteur, date, résolution de l'image", "Description morphologique, localisation/échelle, anomalies identifiées, contexte clinique", "Modalité d'imagerie, service prescripteur, résultat attendu, traitement en cours", "Couleur, taille, forme, texture uniquement"], correct: 1, expl: "Les 4 éléments : 1) description morphologique (forme, couleur, contour), 2) localisation et échelle, 3) anomalies perçues, 4) contexte clinique (âge, symptômes, raison de l'examen)." }
];

// ══════════════════════════════════════════════
//  QCM ENGINE
// ══════════════════════════════════════════════
let qcmState = {
  current: 0, score: 0, answers: [], startTime: null,
  timerInterval: null, secondsLeft: 720, started: false
};

function initQCM() {
  qcmState = { current: 0, score: 0, answers: [], startTime: Date.now(),
    timerInterval: null, secondsLeft: 720, started: true };
  document.getElementById('qcm-results').style.display = 'none';
  document.getElementById('qcm-question-area').style.display = 'block';
  renderQuestion();
  startTimer();
}

function startTimer() {
  clearInterval(qcmState.timerInterval);
  qcmState.timerInterval = setInterval(() => {
    qcmState.secondsLeft--;
    const m = Math.floor(qcmState.secondsLeft / 60);
    const s = qcmState.secondsLeft % 60;
    const el = document.getElementById('qcm-timer');
    if (el) {
      el.textContent = `${m}:${s.toString().padStart(2,'0')}`;
      el.style.color = qcmState.secondsLeft < 120 ? '#F87171' : '#fff';
    }
    if (qcmState.secondsLeft <= 0) { clearInterval(qcmState.timerInterval); finishQCM(); }
  }, 1000);
}

function renderQuestion() {
  const q = QCM_QUESTIONS[qcmState.current];
  const pct = ((qcmState.current) / QCM_QUESTIONS.length * 100).toFixed(0);
  document.getElementById('qcm-progress-bar').style.width = Math.max(5, pct) + '%';
  document.getElementById('qcm-progress-label').textContent = `Question ${qcmState.current + 1} sur ${QCM_QUESTIONS.length}`;
  document.getElementById('qcm-score-live').textContent = `Score : ${qcmState.score} / ${qcmState.current}`;
  document.getElementById('qcm-question-area').innerHTML = `
    <div style="background:#fff;border:1px solid var(--rule);border-radius:var(--radius-xl);overflow:hidden;box-shadow:var(--shadow-md);">
      <div style="padding:2rem 2.5rem;border-bottom:1px solid var(--rule);">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--ink-lt);margin-bottom:.75rem;">Question ${qcmState.current + 1} sur ${QCM_QUESTIONS.length}</div>
        <p style="font-size:17px;color:var(--navy);font-weight:500;line-height:1.55;font-family:var(--font-display);">${q.q}</p>
      </div>
      <div style="padding:1.5rem 2.5rem;display:flex;flex-direction:column;gap:.65rem;" id="qcm-opts">
        ${q.opts.map((o, i) => `
          <button onclick="answerQCM(${i})" style="text-align:left;padding:1rem 1.25rem;border:1.5px solid var(--rule);border-radius:10px;background:#fff;font-size:14px;color:var(--ink-md);cursor:pointer;transition:all .15s;display:flex;align-items:flex-start;gap:12px;font-family:var(--font-body);line-height:1.5;" onmouseover="this.style.borderColor='var(--navy)';this.style.background='var(--navy-pale)'" onmouseout="this.style.borderColor='var(--rule)';this.style.background='#fff'">
            <span style="width:26px;height:26px;border-radius:50%;border:1.5px solid var(--rule);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;margin-top:1px;color:var(--ink-lt);">${['A','B','C','D'][i]}</span>
            ${o}
          </button>`).join('')}
      </div>
    </div>`;
}

function answerQCM(chosen) {
  const q = QCM_QUESTIONS[qcmState.current];
  const isCorrect = chosen === q.correct;
  if (isCorrect) qcmState.score++;
  qcmState.answers.push({ q: qcmState.current, chosen, correct: q.correct, ok: isCorrect });
  // Show feedback
  const btns = document.querySelectorAll('#qcm-opts button');
  btns.forEach((b, i) => {
    b.style.cursor = 'default';
    b.onmouseover = null; b.onmouseout = null;
    if (i === q.correct) { b.style.borderColor = 'var(--teal)'; b.style.background = 'var(--teal-lt)'; b.style.color = 'var(--teal-d)'; }
    else if (i === chosen && !isCorrect) { b.style.borderColor = 'var(--red)'; b.style.background = 'var(--red-lt)'; b.style.color = 'var(--red-d)'; }
  });
  // Explanation
  const area = document.getElementById('qcm-question-area');
  const expl = document.createElement('div');
  expl.style.cssText = 'margin-top:1rem;';
  expl.innerHTML = `
    <div style="background:${isCorrect ? 'var(--green-lt)' : 'var(--amber-lt)'};border:1px solid ${isCorrect ? '#B8DDA0' : '#F0C878'};border-radius:10px;padding:1rem 1.25rem;display:flex;gap:10px;">
      <span style="font-size:20px;flex-shrink:0;">${isCorrect ? '✅' : '⚠️'}</span>
      <div>
        <div style="font-size:12px;font-weight:700;color:${isCorrect ? 'var(--green-d)' : 'var(--amber-d)'};margin-bottom:3px;">${isCorrect ? 'Bonne réponse !' : 'Réponse incorrecte'}</div>
        <div style="font-size:13.5px;color:var(--ink-md);line-height:1.6;">${q.expl}</div>
      </div>
    </div>
    <div style="text-align:right;margin-top:.85rem;">
      <button onclick="${qcmState.current < QCM_QUESTIONS.length - 1 ? 'nextQuestion()' : 'finishQCM()'}" class="btn-primary" style="font-size:14px;padding:.7rem 1.75rem;">
        ${qcmState.current < QCM_QUESTIONS.length - 1 ? 'Question suivante →' : '✓ Terminer le QCM'}
      </button>
    </div>`;
  area.querySelector('div').appendChild(expl);
}

function nextQuestion() {
  qcmState.current++;
  renderQuestion();
}

function finishQCM() {
  clearInterval(qcmState.timerInterval);
  const elapsed = Math.floor((Date.now() - qcmState.startTime) / 1000);
  const em = Math.floor(elapsed / 60), es = elapsed % 60;
  const pct = Math.round(qcmState.score / QCM_QUESTIONS.length * 100);
  const pass = pct >= 70;

  document.getElementById('qcm-question-area').style.display = 'none';
  document.getElementById('qcm-results').style.display = 'block';
  document.getElementById('qcm-progress-bar').style.width = '100%';
  document.getElementById('qcm-progress-label').textContent = 'QCM terminé';
  document.getElementById('qcm-score-live').textContent = `Score final : ${qcmState.score} / ${QCM_QUESTIONS.length}`;

  document.getElementById('qcm-result-icon').textContent = pct >= 90 ? '🏆' : pct >= 70 ? '🎓' : '📚';
  document.getElementById('qcm-result-title').textContent = pct >= 90 ? 'Excellent !' : pct >= 70 ? 'Formation validée !' : 'À retravailler';
  document.getElementById('qcm-result-title').style.color = pass ? 'var(--teal)' : 'var(--amber)';
  document.getElementById('qcm-result-sub').textContent = pass
    ? `Vous avez validé la formation avec ${pct}%. Votre attestation est prête.`
    : `Score de ${pct}% — seuil de validation : 70%. Révisez les points faibles et retentez.`;
  document.getElementById('qcm-score-num').textContent = `${qcmState.score}/20`;
  document.getElementById('qcm-pct').textContent = `${pct}%`;
  document.getElementById('qcm-pct').style.color = pass ? 'var(--teal)' : 'var(--amber)';
  document.getElementById('qcm-time-used').textContent = `${em}:${es.toString().padStart(2,'0')}`;

  // Review
  const rev = document.getElementById('qcm-review');
  rev.innerHTML = qcmState.answers.map((a, i) => `
    <div style="display:flex;align-items:flex-start;gap:10px;padding:.6rem;border-radius:8px;background:${a.ok ? 'var(--green-lt)' : 'var(--red-lt)'};">
      <span style="font-size:16px;flex-shrink:0;">${a.ok ? '✅' : '❌'}</span>
      <div style="flex:1;">
        <div style="font-size:12.5px;font-weight:500;color:var(--ink);line-height:1.4;">${QCM_QUESTIONS[a.q].q.substring(0, 80)}…</div>
        ${!a.ok ? `<div style="font-size:12px;color:var(--red-d);margin-top:2px;">Correct : ${QCM_QUESTIONS[a.q].opts[a.correct]}</div>` : ''}
      </div>
    </div>`).join('');

  if (pass) {
    document.getElementById('qcm-cert-btn').style.display = 'inline-flex';
    // Store score for certificate
    window.qcmFinalScore = `${qcmState.score}/20 (${pct}%)`;
    document.getElementById('cert-score-display').textContent = `${qcmState.score}/20`;
    localStorage.setItem('iamed_qcm_score', qcmState.score);
    localStorage.setItem('iamed_qcm_pct', pct);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetQCM() {
  document.getElementById('qcm-results').style.display = 'none';
  document.getElementById('qcm-question-area').style.display = 'block';
  initQCM();
}

// ══════════════════════════════════════════════
//  EXERCICES ENGINE
// ══════════════════════════════════════════════
const EXERCISE_DATA = [
  { bloc: 0, id:'b1e1', num:'01', title:'Le diagnostic de vitesse', diff:'Débutant', color:'var(--blue)', bg:'var(--blue-lt)',
    scenario:'Vous êtes à la fin d\'une garde. Un interne vous pose une question rapide sur un mécanisme d\'action.',
    task:'Posez la question sur les iSGLT2 en connaissance intégrée et notez la qualité de la réponse.',
    prompt:'Tu es un pharmacologue expert. Explique de façon précise et structurée le mécanisme d\'action des inhibiteurs de SGLT2 dans le diabète de type 2, et leurs effets rénaux et cardiovasculaires. Niveau : médecin généraliste.',
    criteria:['Mécanisme ionique clair','Effets cardio et rénal cités','Pas besoin de vérifier sur web'] },
  { bloc: 0, id:'b1e2', num:'02', title:'La recommandation récente', diff:'Intermédiaire', color:'var(--blue)', bg:'var(--blue-lt)',
    scenario:'Un patient vous questionne sur les nouvelles recommandations pour l\'HTA résistante.',
    task:'Activez le web search et comparez la réponse avec et sans web search. Notez les différences.',
    prompt:'Recherche sur le web les dernières recommandations ESC/ESH 2024-2025 pour la prise en charge de l\'hypertension artérielle résistante. Donne-moi les seuils cibles, la stratégie par paliers et les situations nécessitant un bilan spécialisé. Cite tes sources.',
    criteria:['Sources ESC/ESH citées','Seuils numériques présents','Différence notable vs connaissance intégrée'] },
  { bloc: 0, id:'b1e3', num:'03', title:'La synthèse bibliographique', diff:'Avancé', color:'var(--blue)', bg:'var(--blue-lt)',
    scenario:'Vous préparez une RCP pour un patient 68 ans : BPCO sévère + IC FE réduite + FA.',
    task:'Utilisez le deep research pour la stratégie thérapeutique de cette comorbidité triple.',
    prompt:'DEEP RESEARCH — Synthèse bibliographique structurée : BPCO sévère (GOLD III) + IC FE réduite (<40%) + FA non valvulaire. Médicaments recommandés, à éviter, interactions croisées, essais 2022-2025, zones d\'incertitude. Fournis les sources.',
    criteria:['Interactions médicamenteuses croisées identifiées','Essais cliniques récents cités','Zones d\'incertitude soulignées'] },
  { bloc: 0, id:'b1e4', num:'04', title:'Le test des sources', diff:'Intermédiaire', color:'var(--blue)', bg:'var(--blue-lt)',
    scenario:'L\'IA vient de vous donner une réponse sans citer de source. Vous souhaitez la forcer à se justifier.',
    task:'Posez la question sur la metformine et appliquez la grille feux tricolores à chaque source citée.',
    prompt:'Quelles sont les données probantes sur l\'efficacité de la metformine en prévention cardiovasculaire chez les patients DT2 sans MCVP ? Cite les études princeps, leur niveau de preuve et les limites méthodologiques.',
    criteria:['Études nommées précisément','Niveau de preuve mentionné','1 PMID vérifié sur PubMed'] },
  { bloc: 1, id:'b2e1', num:'01', title:'Diagnostic différentiel assisté', diff:'Débutant', color:'var(--rose)', bg:'var(--rose-lt)',
    scenario:'Femme 34 ans, douleurs thoraciques gauches d\'effort irradiant épaule, ECG sinusal normal.',
    task:'Générez 8 diagnostics différentiels classés par probabilité avec 2 pour et 1 contre chacun.',
    prompt:'Tu es un interniste expérimenté. Femme 34 ans, sans ATCD cardio, douleurs thoraciques gauches d\'effort irradiant épaule, 5 min max, repos = disparition, ECG normal, bilan bio normal, IMC 22. Génère les 8 DD les plus importants classés par probabilité, 2 arguments pour et 1 contre chacun.',
    criteria:['≥6 diagnostics listés','Probabilités hiérarchisées','Origine extracardiaque incluse'] },
  { bloc: 1, id:'b2e2', num:'02', title:'Prompt PACTE complet', diff:'Intermédiaire', color:'var(--rose)', bg:'var(--rose-lt)',
    scenario:'Préparez une présentation staff sur la gestion des anticoagulants en péri-opératoire.',
    task:'Construisez un prompt complet en appliquant les 5 composantes PACTE.',
    prompt:'Tu es un hématologue spécialisé en hémostase et pédagogue expert. Structure un plan de présentation de 20 min pour un staff d\'anesthésistes-réanimateurs sur la gestion péri-op des anticoagulants. Service chirurgie digestive, niveau expert. Plan 4 parties, titre accrocheur, 3 messages clés/partie, 2 cas cliniques. Modèle : guidelines ESC/EHRA 2022.',
    criteria:['Structure en 4 parties','Messages clés explicites','Format adapté au staff'] },
  { bloc: 1, id:'b2e3', num:'03', title:'Détecter la sycophancy', diff:'Avancé', color:'var(--rose)', bg:'var(--rose-lt)',
    scenario:'Patient 45 ans, épisodes de déconnexion 30 s, 3×/semaine, 2 mois. Vous avez posé epilepsie focale.',
    task:'Testez la version sycophante puis la version anti-sycophancy. Notez la différence.',
    prompt:'VERSION 1 : "J\'ai posé un diagnostic d\'épilepsie focale chez ce patient. C\'est bien ça ?" — VERSION 2 : "Joue le rôle d\'un neurologue qui ne veut pas me flatter. Quels diagnostics alternatifs à l\'épilepsie focale dois-je absolument éliminer ? Donne les arguments contre mon hypothèse."',
    criteria:['Réponses 1 et 2 notablement différentes','Syncope et TIA évoqués','Arguments contre l\'épilepsie développés'] },
  { bloc: 1, id:'b2e4', num:'04', title:'Critique de compte-rendu', diff:'Intermédiaire', color:'var(--rose)', bg:'var(--rose-lt)',
    scenario:'Vous avez rédigé un CR d\'hospitalisation rapidement et souhaitez l\'améliorer.',
    task:'Soumettez un CR fictif et demandez une critique selon 3 axes médicaux.',
    prompt:'Voici mon compte-rendu d\'hospitalisation [coller votre texte]. Critique selon : 1) Clarté clinique : le MT peut-il reprendre le suivi sans appel ? 2) Complétude : éléments manquants ? 3) Langage : jargon incompréhensible ? Propose une version améliorée du paragraphe le plus faible.',
    criteria:['3 axes de critique couverts','Paragraphe amélioré fourni','Au moins 1 correction acceptée'] },
  { bloc: 2, id:'b3e1', num:'01', title:'Analyse données biologiques', diff:'Débutant', color:'var(--teal)', bg:'var(--teal-lt)',
    scenario:'Vous avez 12 résultats d\'HbA1c de votre cohorte DT2.',
    task:'Collez le tableau et demandez une analyse statistique avec identification des cas préoccupants.',
    prompt:'HbA1c de 12 patients DT2 : 7.2% | 9.8% | 6.8% | 11.2% | 7.5% | 8.1% | 7.0% | 10.4% | 6.5% | 8.9% | 7.3% | 9.1%. Calcule moyenne, médiane, écart-type. Identifie les patients >8%. Propose un tableau. Identifie les 2 patients prioritaires.',
    criteria:['Statistiques exactes','Patients hors cible identifiés','Hiérarchisation justifiée'] },
  { bloc: 2, id:'b3e2', num:'02', title:'Description ECG pédagogique', diff:'Intermédiaire', color:'var(--teal)', bg:'var(--teal-lt)',
    scenario:'Vous préparez un document pédagogique pour vos internes sur l\'ECG de FA.',
    task:'Décrivez l\'ECG de FA et demandez une description pédagogique en 4 parties.',
    prompt:'ECG de FA typique : absence onde P, ligne isoélectrique irrégulière avec oscillations f 350-600/min, QRS fins, R-R irréguliers, FC 110 bpm. Rédige une description pédagogique pour interne 1ère année : 1) Ce qu\'on voit 2) Pourquoi 3) Ce qu\'il faut chercher en plus 4) Le piège à ne pas manquer.',
    criteria:['Description morphologique précise','Mécanisme FA expliqué','Piège (flutter FA) évoqué'] },
  { bloc: 2, id:'b3e3', num:'03', title:'Calculateur CHA₂DS₂-VASc', diff:'Avancé', color:'var(--teal)', bg:'var(--teal-lt)',
    scenario:'Vous voulez un calculateur interactif de score CHA₂DS₂-VASc accessible depuis un navigateur.',
    task:'Demandez à l\'IA de créer l\'outil HTML/JS. Testez-le dans votre navigateur.',
    prompt:'Crée un calculateur de score CHA₂DS₂-VASc en HTML/CSS/JS, autonome (un seul fichier). Cases à cocher pour chaque critère avec son poids, calcul temps réel, recommandation anticoagulante (0: pas, 1H: envisager, ≥2: recommandé), design mobile. Mention obligatoire : "usage aide-mémoire uniquement".',
    criteria:['Code fonctionnel dans le navigateur','Calcul en temps réel','Mention médico-légale présente'] },
  { bloc: 2, id:'b3e4', num:'04', title:'Document patient imprimable', diff:'Intermédiaire', color:'var(--teal)', bg:'var(--teal-lt)',
    scenario:'Vous avez besoin d\'un document clair pour vos patients DT2 sur la surveillance glycémique.',
    task:'Demandez un document HTML A4 imprimable en langage non-médical.',
    prompt:'Crée un document HTML imprimable A4 pour patients DT2 sur surveillance glycémique à domicile. Contenu : quand faire la glycémie, valeurs cibles en langage simple, quand appeler le médecin, 3 signes d\'alarme en grands caractères. Police ≥14pt, couleurs apaisantes, espace pour cibles personnalisées.',
    criteria:['Lisible sans lunettes','Valeurs cibles claires','Espace de personnalisation présent'] },
  { bloc: 3, id:'b4cas', num:'CAS', title:'Cas intégrateur — Patient complexe', diff:'Intégrateur', color:'var(--amber)', bg:'var(--amber-lt)',
    scenario:'Patient 68 ans : BPCO sévère (GOLD III) + IC FE réduite (<40%) + FA non valvulaire + DT2 metformine + HTA. Hospitalisé pour décompensation cardiaque. Sortie dans 48h.',
    task:'Utilisez les 3 blocs en combinaison pour produire : synthèse thérapeutique (deep research), diagnostic différentiel décompensation (chain-of-thought + anti-sycophancy), document de sortie patient (outil sans code).',
    prompt:'CAS INTÉGRATEUR — utilisez librement les techniques des 3 blocs. Production attendue : 1) Synthèse thérapeutique BPCO+IC+FA (deep research, sources incluses) 2) DD des causes de décompensation (chain-of-thought + anti-sycophancy) 3) Document HTML de sortie pour le patient (langage accessible, signes d\'alarme, numéros utiles).',
    criteria:['Synthèse thérapeutique avec interactions croisées','DD challengé avec anti-sycophancy','Document patient HTML fonctionnel'] }
];

let currentBloc = 0;

function switchBloc(bloc, btn) {
  currentBloc = bloc;
  document.querySelectorAll('.ex-bloc-tab').forEach(b => {
    b.style.background = 'rgba(255,255,255,.05)';
    b.style.borderColor = 'rgba(255,255,255,.1)';
    b.style.color = 'rgba(255,255,255,.6)';
  });
  btn.style.background = 'rgba(255,255,255,.12)';
  btn.style.borderColor = 'rgba(255,255,255,.25)';
  btn.style.color = '#fff';
  renderExercices(bloc);
}

function renderExercices(bloc) {
  const exercises = EXERCISE_DATA.filter(e => e.bloc === bloc);
  const grid = document.getElementById('ex-grid');
  if (!grid) return;
  grid.innerHTML = exercises.map(ex => {
    const saved = localStorage.getItem('iamed_ex_' + ex.id) || '';
    const submitted = localStorage.getItem('iamed_ex_sub_' + ex.id) === 'true';
    const diffColor = ex.diff === 'Débutant' ? '#166534' : ex.diff === 'Intermédiaire' ? '#854D0E' : ex.diff === 'Avancé' ? '#991B1B' : '#633806';
    const diffBg = ex.diff === 'Débutant' ? '#DCFCE7' : ex.diff === 'Intermédiaire' ? '#FEF9C3' : ex.diff === 'Avancé' ? '#FEE2E2' : '#FAEEDA';
    return `
    <div style="background:#fff;border:1px solid var(--rule);border-radius:var(--radius-lg);overflow:hidden;margin-bottom:1.5rem;">
      <div style="padding:1.1rem 1.5rem;border-bottom:1px solid var(--rule);display:flex;align-items:center;gap:12px;">
        <div style="width:30px;height:30px;border-radius:50%;background:${ex.bg};color:${ex.color};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;">${ex.num}</div>
        <div style="flex:1;"><div style="font-size:14px;font-weight:600;color:var(--navy);">${ex.title}</div></div>
        <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:${diffBg};color:${diffColor};">${ex.diff}</span>
        ${submitted ? '<span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;background:var(--green-lt);color:var(--green-d);">✓ Soumis</span>' : ''}
      </div>
      <div style="padding:1.25rem 1.5rem;">
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--ink-lt);margin-bottom:4px;">Scénario</div>
        <p style="font-size:13px;color:var(--ink-md);line-height:1.6;border-left:2px solid var(--rule);padding-left:.75rem;font-style:italic;margin-bottom:1rem;">${ex.scenario}</p>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--ink-lt);margin-bottom:4px;">Tâche</div>
        <p style="font-size:13px;color:var(--ink);line-height:1.6;margin-bottom:1rem;">${ex.task}</p>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--ink-lt);margin-bottom:4px;">Prompt suggéré</div>
        <div style="background:var(--gray-50);border-left:3px solid ${ex.color};border-radius:6px;padding:.75rem 1rem;font-family:var(--font-mono);font-size:12px;line-height:1.65;color:var(--gray-900);margin-bottom:1rem;white-space:pre-wrap;">${ex.prompt}</div>
        <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--ink-lt);margin-bottom:6px;">Votre réponse &amp; observations</div>
        <textarea id="ta_${ex.id}" placeholder="Collez ici la réponse de l'IA et notez vos observations (ce qui a bien fonctionné, ce qui était surprenant, les sources vérifiées…)" style="width:100%;min-height:140px;padding:.85rem 1rem;border:1.5px solid var(--rule);border-radius:8px;font-size:13px;font-family:var(--font-body);color:var(--ink);line-height:1.6;resize:vertical;outline:none;transition:border-color .15s;" onfocus="this.style.borderColor='var(--navy)'" onblur="this.style.borderColor='var(--rule)';autoSaveEx('${ex.id}')">${saved}</textarea>
        <div style="display:flex;gap:.75rem;align-items:center;margin-top:.75rem;flex-wrap:wrap;">
          <div style="display:flex;gap:6px;flex-wrap:wrap;flex:1;">
            ${ex.criteria.map(c => `<span style="font-size:12px;background:var(--gray-50);border:1px solid var(--rule);border-radius:20px;padding:2px 9px;color:var(--ink-lt);">✓ ${c}</span>`).join('')}
          </div>
          <button onclick="submitExercise('${ex.id}')" style="padding:.55rem 1.1rem;border-radius:999px;font-size:13px;font-weight:600;border:none;background:${submitted ? 'var(--green-lt)' : 'var(--navy)'};color:${submitted ? 'var(--green-d)' : '#fff'};cursor:pointer;transition:all .15s;flex-shrink:0;">${submitted ? '✓ Soumis' : '📤 Soumettre'}</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function autoSaveEx(id) {
  const ta = document.getElementById('ta_' + id);
  if (ta) {
    localStorage.setItem('iamed_ex_' + id, ta.value);
    updateSavedIndicator(true);
  }
}

function saveAllExercises() {
  EXERCISE_DATA.forEach(ex => {
    const ta = document.getElementById('ta_' + ex.id);
    if (ta) localStorage.setItem('iamed_ex_' + ex.id, ta.value);
  });
  updateSavedIndicator(true);
  showToast('💾 Tous les exercices sauvegardés !');
}

function submitExercise(id) {
  const ta = document.getElementById('ta_' + id);
  if (!ta || ta.value.trim().length < 20) {
    showToast('⚠️ Rédigez votre réponse avant de soumettre (minimum 20 caractères)');
    return;
  }
  localStorage.setItem('iamed_ex_' + id, ta.value);
  localStorage.setItem('iamed_ex_sub_' + id, 'true');
  renderExercices(currentBloc);
  showToast('📤 Exercice soumis et sauvegardé !');
}

function updateSavedIndicator(saved) {
  const dot = document.getElementById('ex-saved-dot');
  const txt = document.getElementById('ex-saved-text');
  if (dot && txt) {
    dot.style.background = saved ? '#22C55E' : 'rgba(255,255,255,.2)';
    txt.textContent = saved ? 'Sauvegardé' : 'Non sauvegardé';
  }
}

// ══════════════════════════════════════════════
//  CERTIFICAT ENGINE
// ══════════════════════════════════════════════
function updateCert() {
  const name = document.getElementById('cert-name-input')?.value || 'Dr Prénom Nom';
  const job = document.getElementById('cert-job-input')?.value || 'Spécialité · Établissement';
  const nameEl = document.getElementById('cert-name');
  const jobEl = document.getElementById('cert-profession');
  if (nameEl) nameEl.textContent = name;
  if (jobEl) jobEl.textContent = job;
}

function generateCertCode(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash << 5) - hash + name.charCodeAt(i);
  return 'IAMED-2026-' + Math.abs(hash).toString(36).toUpperCase().substring(0, 6);
}

function initCert() {
  const scoreEl = document.getElementById('cert-score-display');
  const codeEl = document.getElementById('cert-code');
  const dateEl = document.getElementById('cert-date');
  const score = localStorage.getItem('iamed_qcm_score');
  const pct = localStorage.getItem('iamed_qcm_pct');
  const name = document.getElementById('cert-name-input')?.value || 'Dr Sophie Martin';
  if (scoreEl) scoreEl.textContent = score ? `${score}/20 (${pct}%)` : '—';
  if (codeEl) codeEl.textContent = generateCertCode(name + new Date().getFullYear());
  if (dateEl) {
    const now = new Date();
    dateEl.textContent = now.toLocaleDateString('fr-FR', { day:'numeric', month:'long', year:'numeric' });
  }
}

function printCert() { window.print(); }

function downloadCert() {
  const LOGO_URI_FULL = "assets/logo-banner.png";
  const LOGO_URI_SM = "assets/logo-seal.png";

  const preview = document.getElementById('cert-preview');
  if (!preview) return;
  const name = document.getElementById('cert-name-input')?.value || 'Dr Sophie Martin';
  const job = document.getElementById('cert-job-input')?.value || '';
  const score = document.getElementById('cert-score-display')?.textContent || '—';
  const code = document.getElementById('cert-code')?.textContent || 'IAMED-2026-XXXX';
  const date = document.getElementById('cert-date')?.textContent || new Date().toLocaleDateString('fr-FR');

  const certHTML = `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
<title>Attestation IAMED Academy — ${name}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@400;500;600&family=DM+Mono:wght@400&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'DM Sans',sans-serif;background:#fff;-webkit-print-color-adjust:exact;print-color-adjust:exact}
@page{size:A4;margin:0}
.cert{width:210mm;min-height:297mm;margin:0 auto;background:#fff;display:flex;flex-direction:column;}
.gold-top{height:8px;background:linear-gradient(90deg,#0B1F35 0%,#B8882E 40%,#D4A84B 60%,#0B1F35 100%);}
.header{background:#0B1F35;padding:2.5rem 3rem 2rem;position:relative;}
.brand{display:flex;align-items:center;gap:10px;margin-bottom:1.5rem;}
.brand-mark{width:40px;height:40px;background:linear-gradient(135deg,#B8882E,#D4A84B);border-radius:9px;display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:18px;font-weight:700;color:#0B1F35;}
.brand-name{font-family:'Playfair Display',serif;font-size:17px;font-weight:700;color:#fff;}
.brand-name span{color:#D4A84B;}
.kicker{font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#D4A84B;margin-bottom:.5rem;}
.header h2{font-family:'Playfair Display',serif;font-size:26px;font-weight:700;color:#fff;margin:0;}
.recipient{padding:2rem 3rem;text-align:center;border-bottom:1px solid #E0DDD6;background:linear-gradient(180deg,#fafaf6 0%,#fff 100%);}
.recipient-name{font-family:'Playfair Display',serif;font-size:36px;font-weight:700;color:#0B1F35;letter-spacing:-.01em;font-style:italic;margin-bottom:.3rem;}
.recipient-role{font-size:14px;color:#6B6B85;}
.course-info{padding:2rem 3rem;display:grid;grid-template-columns:1fr auto;gap:2rem;align-items:center;}
.course-label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9A7420;margin-bottom:.4rem;}
.course-title{font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:#0B1F35;margin-bottom:.3rem;line-height:1.3;}
.course-sub{font-size:13px;color:#6B6B85;}
.score-box{text-align:center;background:#F8F1E1;border:1px solid rgba(196,154,60,.3);border-radius:12px;padding:1rem 1.5rem;min-width:110px;}
.score-num{font-family:'Playfair Display',serif;font-size:30px;font-weight:700;color:#0B1F35;line-height:1;}
.score-label{font-size:11px;color:#C49A3C;margin-top:3px;}
.competences{padding:0 3rem 2rem;}
.comp-box{background:#F9F8F5;border-radius:10px;padding:1.25rem 1.5rem;}
.comp-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#6B6B85;margin-bottom:.85rem;}
.comp-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
.comp-item{font-size:12px;color:#3A3A52;display:flex;gap:7px;}
.comp-check{color:#0E8A6B;}
.footer{padding:1.5rem 3rem;border-top:1px solid #E0DDD6;display:flex;align-items:flex-end;justify-content:space-between;gap:2rem;margin-top:auto;}
.footer-left .label{font-size:11px;color:#6B6B85;margin-bottom:3px;}
.footer-left .value{font-size:13px;font-weight:600;color:#0B1F35;}
.code{font-family:'DM Mono',monospace;font-size:12px;color:#0B1F35;background:#F9F8F5;padding:3px 8px;border-radius:4px;border:1px solid #E0DDD6;letter-spacing:.08em;}
.signature{text-align:center;}
.sig-name{font-family:'Playfair Display',serif;font-size:18px;font-style:italic;color:#0B1F35;margin-bottom:4px;}
.sig-line{width:120px;height:1px;background:#E0DDD6;margin:0 auto 4px;}
.sig-role{font-size:10px;color:#6B6B85;}
.seal{width:80px;height:80px;border-radius:50%;border:3px solid #B8882E;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;}
.seal-text{font-size:7px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#9A7420;line-height:1.4;}
.gold-bottom{height:5px;background:linear-gradient(90deg,#B8882E 0%,#D4A84B 50%,transparent 100%);}
</style></head><body>
<div class="cert">
  <div class="gold-top"></div>
  <div class="header">
    <div class="brand">
      <div class="brand-mark">I</div>
      <div><div class="brand-name">IAMED <span>Academy</span></div><div style="font-size:10px;color:rgba(255,255,255,.4);letter-spacing:.08em;text-transform:uppercase;">Formation médicale continue · IA en santé</div></div>
    </div>
    <div class="kicker">Attestation de complétion</div>
    <h2>Certifie que</h2>
  </div>
  <div class="recipient">
    <div class="recipient-name">${name}</div>
    <div class="recipient-role">${job}</div>
  </div>
  <div class="course-info">
    <div>
      <div class="course-label">a complété avec succès la formation</div>
      <div class="course-title">Prompt Engineering pour Médecins</div>
      <div class="course-sub">Hôpital universitaire · Niveau débutant · 3 à 4 heures</div>
    </div>
    <div class="score-box"><div class="score-num">${score}</div><div class="score-label">Score QCM</div></div>
  </div>
  <div class="competences">
    <div class="comp-box">
      <div class="comp-title">Compétences validées</div>
      <div class="comp-grid">
        <div class="comp-item"><span class="comp-check">✓</span>3 modes d'interrogation IA (intégré, web, deep)</div>
        <div class="comp-item"><span class="comp-check">✓</span>Grille feux tricolores — évaluation des sources</div>
        <div class="comp-item"><span class="comp-check">✓</span>Cadre PACTE — prompts médicaux complexes</div>
        <div class="comp-item"><span class="comp-check">✓</span>Détection et correction de la sycophancy</div>
        <div class="comp-item"><span class="comp-check">✓</span>Analyse de données cliniques par IA</div>
        <div class="comp-item"><span class="comp-check">✓</span>Création d'outils médicaux sans programmation</div>
      </div>
    </div>
  </div>
  <div class="footer">
    <div class="footer-left">
      <div class="label">Date de délivrance</div><div class="value">${date}</div>
      <div class="label" style="margin-top:.75rem;">Code de vérification</div>
      <div class="code">${code}</div>
    </div>
    <div class="signature">
      <div class="sig-name">Dr R. Pédagogique</div>
      <div class="sig-line"></div>
      <div class="sig-role">Directeur de la formation</div>
      <div class="sig-role">IAMED Academy</div>
    </div>
    <div class="seal"><div class="seal-text">IAMED<br>ACADEMY<br>✦ 2026 ✦</div></div>
  </div>
  <div class="gold-bottom"></div>
</div></body></html>`;

  const blob = new Blob([certHTML], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Attestation_IAMED_${name.replace(/\s+/g,'_')}.html`;
  document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 1000);
  showToast('🏆 Attestation téléchargée ! Ouvrez le fichier et imprimez en PDF.');
}

// Page init hooks registered separately (see showPage)
