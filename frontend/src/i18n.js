import i18n from "i18next"
import { initReactI18next } from "react-i18next"

const resources = {
  it: {
    translation: {
      nav_prodotto: "Prodotto",
      nav_prezzi: "Prezzi",
      hero_tag: "Voice to Document",
      hero_title_1: "Trasforma",
      hero_title_2: "la tua voce in",
      hero_title_3: "pronti all'uso.",
      hero_desc: "Parla liberamente. VoiceMint genera presentazioni PowerPoint in pochi secondi, grazie all'AI.",
      hero_cta: "Unisciti alla waitlist",
      hero_sub: "Nessuna carta richiesta. Accesso anticipato gratuito.",
      words: ["PowerPoint"],
      stats_1: "Per generare un documento",
      stats_2: "Formati di output",
      stats_3: "Piano Pro al mese",
      how_tag: "Come funziona",
      how_title: "Tre passi.",
      how_desc: "VoiceMint combina la trascrizione di OpenAI Whisper con la strutturazione automatica di GPT-4o per trasformare qualsiasi parlato in contenuto professionale.",
      step_1_title: "Parla",
      step_1_desc: "Premi Registra e parla liberamente. Anche in italiano.",
      step_2_title: "AI elabora",
      step_2_desc: "Whisper trascrive. GPT-4o struttura il contenuto automaticamente.",
      step_3_title: "Scarica",
      step_3_desc: "PowerPoint pronto in pochi secondi.",
      pricing_tag: "Prezzi",
      free_forever: "Per sempre",
      free_f1: "3 minuti audio / mese",
      free_f2: "PPT base",
      free_f3: "PowerPoint extra",
      free_cta: "Inizia gratis",
      pro_month: "Al mese",
      pro_f1: "Audio illimitato",
      pro_f2: "PowerPoint illimitato",
      pro_f3: "Priorità nella coda",
      pro_f4: "Supporto dedicato",
      pro_cta: "Unisciti alla waitlist",
      section_deliver_title: "Cosa ottieni",
      section_deliver_desc:
        "Slide con titoli, punti chiave e riepilogo. Un tema colori coerente generato dall'AI, pronto da presentare o modificare in PowerPoint.",
      section_audience_title: "Per chi è pensato",
      section_audience_desc:
        "Studenti, professionisti e creator che vogliono passare dalla voce a una presentazione senza partire da zero o aprire il template sbagliato.",
      faq_tag: "FAQ",
      faq_section_title: "Domande e risposte",
      faq_section_desc:
        "Tutto quello che serve su VoiceMint: lingue, privacy, account e piano.",
      faq_cta: "Inizia gratis →",
      faq_1_q: "Che lingue supporta?",
      faq_1_a: "Italiano, inglese e oltre 50 lingue grazie a OpenAI Whisper.",
      faq_2_q: "I miei dati sono al sicuro?",
      faq_2_a: "Sì. Le trascrizioni vengono elaborate e poi eliminate dai nostri server.",
      faq_3_q: "Posso cancellare quando voglio?",
      faq_3_a: "Assolutamente. Nessun vincolo, cancelli in un click.",
      faq_4_q: "Quanto costa VoiceMint?",
      faq_4_a:
        "È disponibile un piano gratuito con limiti mensili e un piano Pro con più funzioni. I dettagli sono nel tuo account dopo la registrazione.",
      footer: "© 2026 VoiceMint",
      footer_tagline: "Voice to document — PowerPoint dalla voce.",
      footer_column_links: "Link",
      footer_link_login: "Accedi",
      footer_link_terms: "Termini di servizio",
      footer_link_privacy: "Privacy Policy",
      cookie_banner_title: "Cookie e privacy",
      cookie_banner_text:
        "Usiamo cookie tecnici necessari al funzionamento del sito e, solo se accetti, strumenti per migliorare l’esperienza. Puoi consultare Termini e Privacy Policy e scegliere se accettare o rifiutare i cookie non strettamente necessari.",
      cookie_link_terms: "Termini di servizio",
      cookie_link_privacy: "Privacy Policy",
      cookie_accept: "Accetta",
      cookie_reject: "Rifiuta",
      legal_back: "Indietro",
      legal_terms_title: "Termini di servizio",
      legal_terms_updated: "Ultimo aggiornamento: marzo 2026",
      legal_privacy_title: "Privacy Policy",
      legal_privacy_updated: "Ultimo aggiornamento: marzo 2026",
      legal_terms_sections: [
        {
          title: "1. Oggetto",
          body:
            "I presenti Termini di servizio (“Termini”) regolano l’accesso e l’utilizzo di VoiceMint (“Servizio”), un prodotto software che consente di generare presentazioni PowerPoint a partire da input audio. Utilizzando il Servizio accetti questi Termini.",
        },
        {
          title: "2. Account",
          body:
            "Per alcune funzioni può essere richiesta la registrazione. Sei responsabile della riservatezza delle credenziali e di tutte le attività svolte tramite il tuo account. Devi fornire informazioni veritiere e aggiornate.",
        },
        {
          title: "3. Uso consentito",
          body:
            "Ti impegni a non utilizzare il Servizio in modo illecito, a non tentare accessi non autorizzati, a non interferire con l’infrastruttura e a non caricare contenuti che violino diritti di terzi o norme applicabili.",
        },
        {
          title: "4. Contenuti e licenza",
          body:
            "Mantieni la proprietà dei contenuti che fornisci. Ci concedi una licenza limitata per elaborare tali contenuti al fine di erogare il Servizio. L’output generato dall’AI è fornito “così com’è”; è tua responsabilità verificarne l’adeguatezza prima dell’uso professionale o pubblico.",
        },
        {
          title: "5. Servizio e modifiche",
          body:
            "Il Servizio può essere aggiornato, sospeso o limitato per manutenzione o motivi tecnici. Possiamo modificare i Termini: in caso di cambiamenti rilevanti, cercheremo di informarti tramite il sito o l’app. L’uso continuato dopo la modifica costituisce accettazione.",
        },
        {
          title: "6. Limitazione di responsabilità",
          body:
            "Nella misura massima consentita dalla legge, VoiceMint non è responsabile per danni indiretti, perdita di dati o profitti, né per l’esito di presentazioni generate in contesti critici. Restano i rimedi obbligatori per legge.",
        },
        {
          title: "7. Legge applicabile",
          body:
            "Per quanto non derogabile, si applica la legge italiana. Foro competente: Italia, salvo diversa competenza inderogabile del consumatore.",
        },
      ],
      legal_privacy_sections: [
        {
          title: "1. Titolare",
          body:
            "Il titolare del trattamento dei dati personali raccolti tramite VoiceMint è il gestore del servizio indicato sul sito (di seguito “noi”). Per esercitare i tuoi diritti puoi contattarci tramite i canali indicati sul sito.",
        },
        {
          title: "2. Dati trattati",
          body:
            "Possiamo trattare: dati di account (es. email, nome utente), contenuti audio inviati per la generazione, metadati tecnici (log, indirizzo IP, tipo di browser), dati di utilizzo del Servizio.",
        },
        {
          title: "3. Finalità e base giuridica",
          body:
            "I dati sono trattati per: erogare il Servizio ed eseguire il contratto (art. 6(1)(b) GDPR); adempiere obblighi legali (art. 6(1)(c)); sicurezza e prevenzione abusi (legittimo interesse, art. 6(1)(f)); miglioramento del prodotto, previo consenso ove richiesto (art. 6(1)(a)).",
        },
        {
          title: "4. Conservazione",
          body:
            "I dati sono conservati per il tempo necessario alle finalità indicate e secondo obblighi di legge. I contenuti elaborati possono essere conservati per periodi brevi per finalità operative e poi cancellati o anonimizzati, salvo diversa indicazione nel Servizio.",
        },
        {
          title: "5. Cookie",
          body:
            "Utilizziamo cookie tecnici necessari al funzionamento. Altri strumenti (es. analitici) possono essere attivati solo in base alla tua scelta dal banner cookie. Puoi modificare le preferenze cancellando i cookie dal browser o contattandoci.",
        },
        {
          title: "6. Trasferimenti extra-UE",
          body:
            "Se utilizziamo fornitori extra-UE, adottiamo garanzie adeguate (es. Clausole contrattuali tipo) ove richiesto dalla normativa.",
        },
        {
          title: "7. Diritti",
          body:
            "Hai diritto di accesso, rettifica, cancellazione, limitazione, opposizione, portabilità e di proporre reclamo all’autorità di controllo (in Italia il Garante Privacy). Per esercitare i diritti, contattaci tramite i canali sul sito.",
        },
      ],
      auth_home: "Home",
      auth_title_login: "Accedi o registrati",
      auth_subtitle_login: "Entra con il tuo account VoiceMint.",
      auth_title_register: "Crea il tuo account",
      auth_subtitle_register: "Registrati per salvare le tue presentazioni e usare VoiceMint.",
      auth_google: "Continua con Google",
      auth_github: "Continua con GitHub",
      auth_social_soon: "Disponibile a breve",
      auth_or_email: "oppure con email",
      auth_email: "Email",
      auth_username: "Username",
      auth_password: "Password",
      auth_email_ph: "nome@email.com",
      auth_username_ph: "il tuo username",
      auth_password_ph: "••••••••",
      auth_submit_login: "Accedi",
      auth_submit_register: "Registrati",
      auth_loading: "Caricamento…",
      auth_toggle_no_account: "Non hai un account?",
      auth_toggle_has_account: "Hai già un account?",
      auth_toggle_to_register: "Registrati",
      auth_toggle_to_login: "Accedi",
      auth_terms_prefix: "Continuando accetti i nostri",
      auth_terms_link: "Termini di servizio",
      auth_terms_and: "e la",
      auth_privacy_link: "Privacy Policy",
      auth_error_connection: "Errore di connessione",
    }
  },
  en: {
    translation: {
      nav_prodotto: "Product",
      nav_prezzi: "Pricing",
      hero_tag: "Voice to Document",
      hero_title_1: "Transform",
      hero_title_2: "your voice into",
      hero_title_3: "ready to use.",
      hero_desc: "Speak freely. VoiceMint generates PowerPoint presentations in seconds, powered by AI.",
      hero_cta: "Join the waitlist",
      hero_sub: "No credit card required. Free early access.",
      words: ["PowerPoint"],
      stats_1: "To generate a document",
      stats_2: "Output formats",
      stats_3: "Pro plan per month",
      how_tag: "How it works",
      how_title: "Three steps.",
      how_desc: "VoiceMint combines OpenAI Whisper transcription with GPT-4o automatic structuring to turn any speech into professional content.",
      step_1_title: "Speak",
      step_1_desc: "Press Record and speak freely. In any language.",
      step_2_title: "AI processes",
      step_2_desc: "Whisper transcribes. GPT-4o structures the content automatically.",
      step_3_title: "Download",
      step_3_desc: "PowerPoint ready in seconds.",
      pricing_tag: "Pricing",
      free_forever: "Forever",
      free_f1: "3 minutes audio / month",
      free_f2: "Basic PowerPoint",
      free_f3: "Extra PowerPoint",
      free_cta: "Start for free",
      pro_month: "Per month",
      pro_f1: "Unlimited audio",
      pro_f2: "Unlimited PowerPoint",
      pro_f3: "Priority queue",
      pro_f4: "Dedicated support",
      pro_cta: "Join the waitlist",
      section_deliver_title: "What you get",
      section_deliver_desc:
        "Slides with titles, key points and a summary. A consistent color theme generated by AI—ready to present or edit in PowerPoint.",
      section_audience_title: "Who it's for",
      section_audience_desc:
        "Students, professionals and creators who want to go from voice to a presentation without starting from scratch.",
      faq_tag: "FAQ",
      faq_section_title: "Questions & answers",
      faq_section_desc:
        "Everything you need to know about VoiceMint: languages, privacy, account and pricing.",
      faq_cta: "Start for free →",
      faq_1_q: "What languages are supported?",
      faq_1_a: "Italian, English and over 50 languages thanks to OpenAI Whisper.",
      faq_2_q: "Is my data safe?",
      faq_2_a: "Yes. Transcriptions are processed and then deleted from our servers.",
      faq_3_q: "Can I cancel anytime?",
      faq_3_a: "Absolutely. No commitment, cancel in one click.",
      faq_4_q: "How much does VoiceMint cost?",
      faq_4_a:
        "There is a free plan with monthly limits and a Pro plan with more features. Details appear in your account after signup.",
      footer: "© 2026 VoiceMint",
      footer_tagline: "Voice to document — PowerPoint from your voice.",
      footer_column_links: "Links",
      footer_link_login: "Log in",
      footer_link_terms: "Terms of Service",
      footer_link_privacy: "Privacy Policy",
      cookie_banner_title: "Cookies & privacy",
      cookie_banner_text:
        "We use cookies that are strictly necessary for the site to work and, if you accept, tools to improve your experience. You can read our Terms and Privacy Policy and choose to accept or reject non-essential cookies.",
      cookie_link_terms: "Terms of Service",
      cookie_link_privacy: "Privacy Policy",
      cookie_accept: "Accept",
      cookie_reject: "Reject",
      legal_back: "Back",
      legal_terms_title: "Terms of Service",
      legal_terms_updated: "Last updated: March 2026",
      legal_privacy_title: "Privacy Policy",
      legal_privacy_updated: "Last updated: March 2026",
      legal_terms_sections: [
        {
          title: "1. Scope",
          body:
            'These Terms of Service (“Terms”) govern access to and use of VoiceMint (the “Service”), a software product that generates PowerPoint presentations from audio input. By using the Service you agree to these Terms.',
        },
        {
          title: "2. Account",
          body:
            "Registration may be required for some features. You are responsible for keeping your credentials confidential and for all activity under your account. You must provide accurate information.",
        },
        {
          title: "3. Acceptable use",
          body:
            "You agree not to use the Service unlawfully, not to attempt unauthorized access, not to interfere with infrastructure, and not to upload content that infringes third-party rights or applicable laws.",
        },
        {
          title: "4. Content and licences",
          body:
            "You retain ownership of content you submit. You grant us a limited licence to process it to provide the Service. AI output is provided “as is”; you are responsible for verifying suitability before professional or public use.",
        },
        {
          title: "5. Service and changes",
          body:
            "The Service may be updated, suspended or limited for maintenance or technical reasons. We may change these Terms; for material changes we will try to notify you via the site or app. Continued use after changes constitutes acceptance.",
        },
        {
          title: "6. Limitation of liability",
          body:
            "To the maximum extent permitted by law, VoiceMint is not liable for indirect damages, loss of data or profits, or outcomes of presentations generated in critical contexts. Mandatory statutory rights remain unaffected.",
        },
        {
          title: "7. Governing law",
          body:
            "Unless mandatory law provides otherwise, Italian law applies. Competent courts: Italy, without prejudice to mandatory consumer jurisdiction rules.",
        },
      ],
      legal_privacy_sections: [
        {
          title: "1. Data controller",
          body:
            "The controller of personal data collected through VoiceMint is the service operator identified on the website (“we”). To exercise your rights, contact us via the channels listed on the site.",
        },
        {
          title: "2. Data we process",
          body:
            "We may process: account data (e.g. email, username), audio content submitted for generation, technical metadata (logs, IP address, browser type), and usage data.",
        },
        {
          title: "3. Purposes and legal bases",
          body:
            "Data are processed to: provide the Service and perform the contract (Art. 6(1)(b) GDPR); comply with legal obligations (Art. 6(1)(c)); ensure security and prevent abuse (legitimate interest, Art. 6(1)(f)); improve the product where consent is required (Art. 6(1)(a)).",
        },
        {
          title: "4. Retention",
          body:
            "Data are kept as long as needed for the stated purposes and as required by law. Processed content may be stored briefly for operational purposes and then deleted or anonymised unless otherwise stated in the Service.",
        },
        {
          title: "5. Cookies",
          body:
            "We use strictly necessary cookies. Other tools (e.g. analytics) may be activated only based on your choice in the cookie banner. You can change preferences by clearing browser cookies or contacting us.",
        },
        {
          title: "6. Transfers outside the EU",
          body:
            "If we use providers outside the EU, we implement appropriate safeguards (e.g. Standard Contractual Clauses) where required.",
        },
        {
          title: "7. Your rights",
          body:
            "You have the right of access, rectification, erasure, restriction, objection, portability, and to lodge a complaint with a supervisory authority. To exercise your rights, contact us via the channels on the site.",
        },
      ],
      auth_home: "Home",
      auth_title_login: "Sign in or join",
      auth_subtitle_login: "Sign in to your VoiceMint account.",
      auth_title_register: "Create your account",
      auth_subtitle_register: "Sign up to save your presentations and use VoiceMint.",
      auth_google: "Continue with Google",
      auth_github: "Continue with GitHub",
      auth_social_soon: "Coming soon",
      auth_or_email: "or with email",
      auth_email: "Email",
      auth_username: "Username",
      auth_password: "Password",
      auth_email_ph: "you@email.com",
      auth_username_ph: "your username",
      auth_password_ph: "••••••••",
      auth_submit_login: "Sign in",
      auth_submit_register: "Sign up",
      auth_loading: "Loading…",
      auth_toggle_no_account: "No account yet?",
      auth_toggle_has_account: "Already have an account?",
      auth_toggle_to_register: "Sign up",
      auth_toggle_to_login: "Sign in",
      auth_terms_prefix: "By continuing you agree to our",
      auth_terms_link: "Terms of Service",
      auth_terms_and: "and",
      auth_privacy_link: "Privacy Policy",
      auth_error_connection: "Connection error",
    }
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem("lang") || "it",
    fallbackLng: "it",
    interpolation: { escapeValue: false }
  })

export default i18n