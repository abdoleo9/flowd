"use client";

import { Outfit, DM_Sans } from "next/font/google";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { Check, Menu, X, Globe, ChevronDown } from "lucide-react";

const outfit = Outfit({ subsets: ["latin"], weight: ["400", "600", "700", "800"] });
const dmSans = DM_Sans({ subsets: ["latin"], weight: ["400", "500", "600"] });

// ─── Translations ────────────────────────────────────────────────────────────
const T = {
  fr: {
    dir: "ltr",
    nav: { features: "Fonctionnalités", chatbot: "Chatbot IA", delivery: "Livraison", pricing: "Tarifs", login: "Se connecter", cta: "Commencer gratuitement" },
    hero: {
      badge: "Conçu pour le e-commerce algérien",
      h1a: "Gérez tout votre",
      h1b: "e-commerce",
      h1c: "En un seul endroit.",
      sub: "Commandes Instagram, Messenger et boutique en ligne — réunies dans un dashboard intelligent propulsé par l'IA.",
      cta: "Commencer gratuitement →",
      demo: "Voir la démo",
      social: "Rejoignez les entrepreneurs algériens qui ont déjà transformé leur business",
    },
    problems: {
      title: "Vous reconnaissez-vous ici ?",
      cards: [
        { icon: "😩", title: "Les commandes partout", desc: "Instagram, Messenger, votre boutique... vous perdez le fil entre les DMs, commentaires et messages." },
        { icon: "📋", title: "Les formulaires de livraison", desc: "Remplir manuellement chaque bon de livraison, commande après commande. Des heures perdues chaque jour." },
        { icon: "🤖", title: "Répondre à tout le monde", desc: "Clients qui demandent les prix, les tailles, les délais... à toute heure. Impossible de tout gérer seul." },
      ],
    },
    features: {
      label: "CE QUE FLOWD FAIT POUR VOUS",
      title: "Un dashboard. Tout votre business.",
      cards: [
        { icon: "📦", title: "Toutes vos commandes", desc: "Instagram, Messenger et votre boutique réunies dans une seule liste en temps réel.", color: "#4361ee" },
        { icon: "🤖", title: "Chatbot IA multilingue", desc: "Parle darija, français et anglais. Prend les commandes automatiquement, transfère à un humain quand nécessaire.", color: "#c97aff" },
        { icon: "🚚", title: "Livraison en 1 clic", desc: "Yalidine, Ecotrack, Maystro... le formulaire se remplit tout seul. Zéro saisie manuelle.", color: "#3ecf8e" },
        { icon: "📊", title: "Dashboard en temps réel", desc: "CA, taux de livraison, taux de retour par wilaya. Tout sous les yeux.", color: "#ffd43b" },
        { icon: "🔗", title: "Toutes vos intégrations", desc: "Shopify, WooCommerce, Instagram, Google Sheets — connectez tout en quelques minutes.", color: "#4361ee" },
        { icon: "👥", title: "Gestion d'équipe", desc: "Ajoutez des confirmateurs, des agents. Chacun voit ce dont il a besoin.", color: "#3ecf8e" },
      ],
    },
    chatbot: {
      label: "CHATBOT IA",
      title: "Votre meilleur vendeur travaille 24h/24.",
      desc: "Le chatbot flowd répond à vos clients comme un vrai humain — en darija, français ou anglais. Il prend les commandes, répond aux questions, et vous alerte quand il a besoin de vous.",
      bullets: ["Détection automatique de la langue", "Prise de commande complète", "Transfert intelligent vers un agent", "Instructions personnalisées par vous"],
    },
    delivery: {
      label: "LIVRAISON",
      title: "Fini les formulaires. Un clic. C'est parti.",
      desc: "Connectez Yalidine, Ecotrack, Maystro ou n'importe quelle société de livraison avec API. flowd remplit le bordereau automatiquement avec les données de la commande.",
      stats: [{ stat: "0", label: "saisie manuelle" }, { stat: "48", label: "wilayas couvertes" }, { stat: "Live", label: "Suivi temps réel" }],
    },
    stats: [
      { stat: "2 min", label: "Temps moyen pour traiter une commande" },
      { stat: "0 DA", label: "Coût de remplissage des formulaires livraison" },
      { stat: "24/7", label: "Le chatbot ne dort jamais" },
      { stat: "58", label: "wilayas — Livraison partout en Algérie" },
    ],
    testimonial: { quote: "Avant flowd, je passais 3 heures par jour à remplir des formulaires Yalidine. Maintenant c'est 10 minutes.", name: "Amira K.", role: "Gérante de boutique en ligne, Blida" },
    integrations: { title: "Connectez ce que vous utilisez déjà", sub: "D'autres intégrations arrivent bientôt." },
    cta: { title: "Prêt à changer la façon dont vous gérez votre business ?", sub: "Rejoignez les entrepreneurs qui ont déjà automatisé leurs commandes, leur livraison et leur service client.", btn: "Commencer gratuitement →", note: "Aucune carte bancaire requise · Accès immédiat" },
    footer: { tagline: "Le dashboard de la nouvelle génération.", copy: "© 2026 flowd. Tous droits réservés." },
  },
  en: {
    dir: "ltr",
    nav: { features: "Features", chatbot: "AI Chatbot", delivery: "Delivery", pricing: "Pricing", login: "Sign in", cta: "Get started free" },
    hero: {
      badge: "Built for Algerian e-commerce",
      h1a: "Manage your entire",
      h1b: "e-commerce",
      h1c: "In one place.",
      sub: "Instagram, Messenger and online store orders — all in one AI-powered dashboard.",
      cta: "Get started free →",
      demo: "Watch demo",
      social: "Join Algerian entrepreneurs who have already transformed their business",
    },
    problems: {
      title: "Does this sound familiar?",
      cards: [
        { icon: "😩", title: "Orders everywhere", desc: "Instagram, Messenger, your store... you lose track between DMs, comments and messages." },
        { icon: "📋", title: "Delivery forms", desc: "Filling out each delivery slip manually, order after order. Hours wasted every day." },
        { icon: "🤖", title: "Answering everyone", desc: "Customers asking about prices, sizes, delays... at all hours. Impossible to manage alone." },
      ],
    },
    features: {
      label: "WHAT FLOWD DOES FOR YOU",
      title: "One dashboard. Your entire business.",
      cards: [
        { icon: "📦", title: "All your orders", desc: "Instagram, Messenger and your store unified in one real-time list.", color: "#4361ee" },
        { icon: "🤖", title: "Multilingual AI chatbot", desc: "Speaks darija, French and English. Takes orders automatically, transfers to a human when needed.", color: "#c97aff" },
        { icon: "🚚", title: "1-click delivery", desc: "Yalidine, Ecotrack, Maystro... the form fills itself. Zero manual entry.", color: "#3ecf8e" },
        { icon: "📊", title: "Real-time dashboard", desc: "Revenue, delivery rate, return rate by wilaya. Everything at a glance.", color: "#ffd43b" },
        { icon: "🔗", title: "All your integrations", desc: "Shopify, WooCommerce, Instagram, Google Sheets — connect everything in minutes.", color: "#4361ee" },
        { icon: "👥", title: "Team management", desc: "Add confirmers, agents. Each person sees exactly what they need.", color: "#3ecf8e" },
      ],
    },
    chatbot: {
      label: "AI CHATBOT",
      title: "Your best salesperson works 24/7.",
      desc: "The flowd chatbot responds to your customers like a real human — in darija, French or English. It takes orders, answers questions, and alerts you when it needs you.",
      bullets: ["Automatic language detection", "Complete order taking", "Smart transfer to an agent", "Custom instructions by you"],
    },
    delivery: {
      label: "DELIVERY",
      title: "No more forms. One click. Done.",
      desc: "Connect Yalidine, Ecotrack, Maystro or any delivery company with API. flowd fills the slip automatically with the order data.",
      stats: [{ stat: "0", label: "manual entry" }, { stat: "48", label: "wilayas covered" }, { stat: "Live", label: "Real-time tracking" }],
    },
    stats: [
      { stat: "2 min", label: "Average time to process an order" },
      { stat: "0 DA", label: "Cost of filling delivery forms" },
      { stat: "24/7", label: "The chatbot never sleeps" },
      { stat: "58", label: "wilayas — Delivery across Algeria" },
    ],
    testimonial: { quote: "Before flowd, I spent 3 hours a day filling Yalidine forms. Now it's 10 minutes.", name: "Amira K.", role: "Online store owner, Blida" },
    integrations: { title: "Connect what you already use", sub: "More integrations coming soon." },
    cta: { title: "Ready to change the way you manage your business?", sub: "Join entrepreneurs who have already automated their orders, delivery and customer service.", btn: "Get started free →", note: "No credit card required · Instant access" },
    footer: { tagline: "The next-generation dashboard.", copy: "© 2026 flowd. All rights reserved." },
  },
  ar: {
    dir: "rtl",
    nav: { features: "المميزات", chatbot: "الذكاء الاصطناعي", delivery: "التوصيل", pricing: "الأسعار", login: "تسجيل الدخول", cta: "ابدأ مجاناً" },
    hero: {
      badge: "مصمم للتجارة الإلكترونية الجزائرية",
      h1a: "أدر كل تجارتك",
      h1b: "الإلكترونية",
      h1c: "في مكان واحد.",
      sub: "طلبات إنستغرام وماسنجر والمتجر الإلكتروني — كلها في لوحة تحكم ذكية مدعومة بالذكاء الاصطناعي.",
      cta: "ابدأ مجاناً ←",
      demo: "شاهد العرض",
      social: "انضم إلى رواد الأعمال الجزائريين الذين غيروا طريقة عملهم",
    },
    problems: {
      title: "هل تتعرف على نفسك هنا؟",
      cards: [
        { icon: "😩", title: "الطلبات في كل مكان", desc: "إنستغرام، ماسنجر، متجرك... تضيع بين الرسائل والتعليقات." },
        { icon: "📋", title: "نماذج التوصيل", desc: "تعبئة كل وصل توصيل يدوياً، طلباً بعد طلب. ساعات ضائعة كل يوم." },
        { icon: "🤖", title: "الرد على الجميع", desc: "عملاء يسألون عن الأسعار والمقاسات والمواعيد... في كل ساعة. مستحيل إدارتها وحدك." },
      ],
    },
    features: {
      label: "ما يفعله فلاود لك",
      title: "لوحة تحكم واحدة. كل عملك.",
      cards: [
        { icon: "📦", title: "كل طلباتك", desc: "إنستغرام وماسنجر ومتجرك في قائمة واحدة في الوقت الفعلي.", color: "#4361ee" },
        { icon: "🤖", title: "روبوت ذكاء اصطناعي متعدد اللغات", desc: "يتحدث الدارجة والفرنسية والإنجليزية. يأخذ الطلبات تلقائياً، وينقلها لإنسان عند الحاجة.", color: "#c97aff" },
        { icon: "🚚", title: "توصيل بنقرة واحدة", desc: "يالدين، إيكوتراك، مايسترو... النموذج يملأ نفسه. صفر إدخال يدوي.", color: "#3ecf8e" },
        { icon: "📊", title: "لوحة تحكم في الوقت الفعلي", desc: "الإيراد، معدل التوصيل، معدل الإرجاع حسب الولاية. كل شيء أمام عينيك.", color: "#ffd43b" },
        { icon: "🔗", title: "كل تكاملاتك", desc: "شوبيفاي، ووكومرس، إنستغرام، جوجل شيتس — صلهم في دقائق.", color: "#4361ee" },
        { icon: "👥", title: "إدارة الفريق", desc: "أضف مؤكدين ووكلاء. كل شخص يرى ما يحتاجه.", color: "#3ecf8e" },
      ],
    },
    chatbot: {
      label: "روبوت الذكاء الاصطناعي",
      title: "أفضل مندوب مبيعات يعمل 24/7.",
      desc: "روبوت فلاود يرد على عملائك كإنسان حقيقي — بالدارجة أو الفرنسية أو الإنجليزية. يأخذ الطلبات ويجيب على الأسئلة وينبهك عند الحاجة.",
      bullets: ["كشف اللغة تلقائياً", "استلام الطلب بالكامل", "نقل ذكي إلى وكيل", "تعليمات مخصصة منك"],
    },
    delivery: {
      label: "التوصيل",
      title: "انتهت النماذج. نقرة واحدة. يكفي.",
      desc: "صل يالدين وإيكوتراك ومايسترو أو أي شركة توصيل عبر API. فلاود يملأ الوصل تلقائياً ببيانات الطلب.",
      stats: [{ stat: "0", label: "إدخال يدوي" }, { stat: "48", label: "ولاية مغطاة" }, { stat: "Live", label: "تتبع فوري" }],
    },
    stats: [
      { stat: "2 دق", label: "متوسط وقت معالجة طلب واحد" },
      { stat: "0 دج", label: "تكلفة تعبئة نماذج التوصيل" },
      { stat: "24/7", label: "الروبوت لا ينام أبداً" },
      { stat: "58", label: "ولاية — توصيل في كل الجزائر" },
    ],
    testimonial: { quote: "قبل فلاود، كنت أمضي 3 ساعات يومياً في ملء نماذج يالدين. الآن 10 دقائق.", name: "أميرة ك.", role: "صاحبة متجر إلكتروني، البليدة" },
    integrations: { title: "صل ما تستخدمه بالفعل", sub: "المزيد من التكاملات قريباً." },
    cta: { title: "مستعد لتغيير طريقة إدارة عملك؟", sub: "انضم إلى رواد الأعمال الذين أتمتوا طلباتهم وتوصيلهم وخدمة عملائهم.", btn: "ابدأ مجاناً ←", note: "لا بطاقة بنكية مطلوبة · وصول فوري" },
    footer: { tagline: "لوحة التحكم للجيل الجديد.", copy: "© 2026 فلاود. جميع الحقوق محفوظة." },
  },
} as const;

type Lang = keyof typeof T;

const LANG_OPTIONS: { code: Lang; label: string; flag: string }[] = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "ar", label: "العربية", flag: "🇩🇿" },
];

const INTEGRATIONS = ["Instagram", "Messenger", "Shopify", "WooCommerce", "Yalidine", "Ecotrack", "Maystro", "Google Sheets"];

const MOCK_ORDERS = [
  { id: 1, source: "Instagram", sourceColor: "#c97aff", name: "Amira Benali", product: "Chaussures 42", price: "4 100 DA", status: "Confirmée", statusColor: "#3ecf8e" },
  { id: 2, source: "Messenger", sourceColor: "#4361ee", name: "Karim Hadj", product: "Sac cuir noir", price: "8 500 DA", status: "En livraison", statusColor: "#4361ee" },
  { id: 3, source: "Shopify", sourceColor: "#3ecf8e", name: "Sara Meziane", product: "Robe soirée M", price: "6 200 DA", status: "En attente", statusColor: "#ffd43b" },
  { id: 4, source: "Instagram", sourceColor: "#c97aff", name: "Yacine Ould", product: "Sneakers 41", price: "5 800 DA", status: "Livrée", statusColor: "#3ecf8e" },
];

// ─── Logo Component ───────────────────────────────────────────────────────────
function FlowdLogo({ height = 32 }: { height?: number }) {
  return (
    <div className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="Flowd" style={{ height, width: height }} className="object-contain" />
      <span style={{ fontSize: height * 0.65, lineHeight: 1 }} className="font-bold text-white tracking-tight">flowd</span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("fr");
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState("hero");
  const heroRef = useRef<HTMLDivElement>(null);

  const t = T[lang];
  const isRtl = t.dir === "rtl";

  useEffect(() => {
    const saved = localStorage.getItem("flowd_lang") as Lang | null;
    if (saved && T[saved]) setLang(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("flowd_lang", lang);
    document.documentElement.setAttribute("dir", t.dir);
    document.documentElement.setAttribute("lang", lang);
  }, [lang, t.dir]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const revealObs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("in-view"); }),
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => revealObs.observe(el));

    const sectionObs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActiveSection(e.target.id); }),
      { threshold: 0.3 }
    );
    document.querySelectorAll("section[id]").forEach((s) => sectionObs.observe(s));

    return () => { revealObs.disconnect(); sectionObs.disconnect(); };
  }, []);

  // Counter animation for stats
  useEffect(() => {
    const counters = document.querySelectorAll("[data-count]");
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("counting");
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [lang]);

  const NAV_LINKS = [
    { href: "#features", label: t.nav.features },
    { href: "#chatbot", label: t.nav.chatbot },
    { href: "#delivery", label: t.nav.delivery },
    { href: "#pricing", label: t.nav.pricing },
  ];

  return (
    <>
      <style>{`
        html { scroll-behavior: smooth; }

        [data-reveal] {
          opacity: 0; transform: translateY(32px);
          transition: opacity 0.7s cubic-bezier(.16,1,.3,1), transform 0.7s cubic-bezier(.16,1,.3,1);
        }
        [data-reveal].in-view { opacity: 1; transform: translateY(0); }
        [data-delay="1"] { transition-delay: 90ms; }
        [data-delay="2"] { transition-delay: 180ms; }
        [data-delay="3"] { transition-delay: 270ms; }
        [data-delay="4"] { transition-delay: 360ms; }
        [data-delay="5"] { transition-delay: 450ms; }
        [data-delay="6"] { transition-delay: 540ms; }

        /* Word stagger animation */
        @keyframes word-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-word { display: inline-block; animation: word-up 0.6s cubic-bezier(.16,1,.3,1) both; }

        /* Floating card */
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33%  { transform: translateY(-8px) rotate(0.3deg); }
          66%  { transform: translateY(-4px) rotate(-0.3deg); }
        }
        .float-card { animation: float 7s ease-in-out infinite; }

        /* Pulse dot */
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.85); }
        }
        .live-dot { animation: pulse-dot 2s ease-in-out infinite; }

        /* Glow pulse on hero button */
        @keyframes glow-pulse {
          0%, 100% { box-shadow: 0 0 40px rgba(67,97,238,.35); }
          50% { box-shadow: 0 0 64px rgba(67,97,238,.6); }
        }
        .btn-primary { animation: glow-pulse 3s ease-in-out infinite; }

        /* Row hover */
        .order-row:hover { background: rgba(255,255,255,0.03); }

        /* Card hover */
        .feat-card {
          transition: border-color .25s, transform .3s cubic-bezier(.16,1,.3,1), box-shadow .3s;
        }
        .feat-card:hover {
          border-color: rgba(67,97,238,.4) !important;
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        }

        /* Integration pill hover */
        .int-pill {
          transition: border-color .2s, color .2s, transform .2s;
          cursor: default;
        }
        .int-pill:hover {
          border-color: rgba(67,97,238,.5) !important;
          color: white !important;
          transform: translateY(-2px);
        }

        /* Shine on CTA button */
        @keyframes shine {
          from { left: -100%; }
          to   { left: 200%; }
        }
        .btn-shine { position: relative; overflow: hidden; }
        .btn-shine::after {
          content: '';
          position: absolute;
          top: 0; left: -100%;
          width: 60%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,.15), transparent);
          animation: shine 3s ease-in-out 1s infinite;
        }

        /* Gradient text */
        .gradient-text {
          background: linear-gradient(135deg, #4361ee 0%, #7b8fff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Noise overlay */
        .noise {
          position: absolute; inset: 0; pointer-events: none; z-index: 0;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
          opacity: .022;
        }

        /* Dropdown transition */
        .lang-dropdown {
          transition: opacity .15s, transform .15s;
          transform-origin: top right;
        }

        /* Nav link active underline */
        .nav-active { color: white !important; }
        .nav-active::after {
          content: ''; display: block; height: 1.5px;
          background: #4361ee; border-radius: 2px;
          margin-top: 2px;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0c12; }
        ::-webkit-scrollbar-thumb { background: rgba(67,97,238,.4); border-radius: 3px; }
      `}</style>

      <div className={dmSans.className} style={{ backgroundColor: "#0a0c12", color: "white", minHeight: "100vh", overflowX: "hidden" }}>

        {/* ── Navbar ── */}
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
          backgroundColor: scrolled ? "rgba(10,12,18,0.96)" : "rgba(10,12,18,0.82)",
          borderBottom: "0.5px solid rgba(255,255,255,0.07)",
          transition: "background-color .3s ease",
        }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>

            {/* Logo */}
            <Link href="/landing" style={{ display: "flex", alignItems: "center", textDecoration: "none", flexShrink: 0 }}>
              <FlowdLogo height={28} />
            </Link>

            {/* Desktop nav links */}
            <div className="hidden md:flex" style={{ gap: 28, alignItems: "center" }}>
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} style={{
                  fontSize: 14, fontWeight: 500, textDecoration: "none",
                  color: activeSection === l.href.slice(1) ? "white" : "rgba(255,255,255,0.52)",
                  transition: "color .2s",
                  borderBottom: activeSection === l.href.slice(1) ? "1.5px solid #4361ee" : "1.5px solid transparent",
                  paddingBottom: 2,
                }}>
                  {l.label}
                </a>
              ))}
            </div>

            {/* Desktop right */}
            <div className="hidden md:flex" style={{ gap: 10, alignItems: "center" }}>
              {/* Language switcher */}
              <div style={{ position: "relative" }}>
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8, padding: "7px 12px", cursor: "pointer",
                    color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 500,
                    transition: "all .2s",
                  }}
                >
                  <Globe size={14} />
                  {LANG_OPTIONS.find((o) => o.code === lang)?.flag}{" "}
                  {lang.toUpperCase()}
                  <ChevronDown size={12} style={{ transform: langOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }} />
                </button>
                {langOpen && (
                  <div className="lang-dropdown" style={{
                    position: "absolute", top: "calc(100% + 8px)", right: 0,
                    backgroundColor: "#141720", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 10, overflow: "hidden", minWidth: 140,
                    boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                    zIndex: 200,
                  }}>
                    {LANG_OPTIONS.map((opt) => (
                      <button key={opt.code} onClick={() => { setLang(opt.code); setLangOpen(false); }} style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 10,
                        padding: "10px 14px", background: lang === opt.code ? "rgba(67,97,238,0.12)" : "none",
                        border: "none", cursor: "pointer", color: lang === opt.code ? "#7b8fff" : "rgba(255,255,255,0.7)",
                        fontSize: 13, fontWeight: lang === opt.code ? 600 : 400,
                        textAlign: isRtl ? "right" : "left",
                        transition: "background .15s",
                      }}>
                        <span>{opt.flag}</span> {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Link href="/login" style={{
                color: "rgba(255,255,255,0.6)", fontSize: 14, fontWeight: 500,
                textDecoration: "none", padding: "8px 16px", borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.1)", transition: "all .2s",
              }}>
                {t.nav.login}
              </Link>
              <Link href="/login?tab=signup" className="btn-shine" style={{
                backgroundColor: "#4361ee", color: "white", fontSize: 14, fontWeight: 700,
                textDecoration: "none", padding: "9px 18px", borderRadius: 8,
                display: "inline-flex", alignItems: "center",
              }}>
                {t.nav.cta}
              </Link>
            </div>

            {/* Mobile right */}
            <div className="md:hidden" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Mobile lang */}
              <button onClick={() => setLangOpen(!langOpen)} style={{
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8, padding: "7px 10px", cursor: "pointer", color: "white", fontSize: 13,
              }}>
                {LANG_OPTIONS.find((o) => o.code === lang)?.flag}
              </button>
              {langOpen && (
                <div style={{
                  position: "absolute", top: 60, right: 60, backgroundColor: "#141720",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, overflow: "hidden",
                  boxShadow: "0 12px 40px rgba(0,0,0,0.5)", zIndex: 200,
                }}>
                  {LANG_OPTIONS.map((opt) => (
                    <button key={opt.code} onClick={() => { setLang(opt.code); setLangOpen(false); }} style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 8,
                      padding: "10px 14px", background: lang === opt.code ? "rgba(67,97,238,0.12)" : "none",
                      border: "none", cursor: "pointer", color: lang === opt.code ? "#7b8fff" : "rgba(255,255,255,0.7)",
                      fontSize: 13, whiteSpace: "nowrap",
                    }}>
                      {opt.flag} {opt.label}
                    </button>
                  ))}
                </div>
              )}
              <button onClick={() => setMenuOpen(!menuOpen)} style={{
                background: "none", border: "none", color: "white", cursor: "pointer", padding: 6,
              }}>
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {menuOpen && (
            <div className="md:hidden" style={{
              backgroundColor: "rgba(10,12,18,0.98)",
              borderTop: "0.5px solid rgba(255,255,255,0.07)",
              padding: "12px 20px 20px",
            }}>
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} onClick={() => setMenuOpen(false)} style={{
                  display: "block", padding: "13px 0",
                  color: "rgba(255,255,255,0.65)", textDecoration: "none", fontSize: 15,
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}>{l.label}</a>
              ))}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 16 }}>
                <Link href="/login" onClick={() => setMenuOpen(false)} style={{
                  textAlign: "center", padding: "13px", border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: 8, color: "rgba(255,255,255,0.8)", textDecoration: "none",
                  fontSize: 14, fontWeight: 500,
                }}>{t.nav.login}</Link>
                <Link href="/login?tab=signup" onClick={() => setMenuOpen(false)} style={{
                  textAlign: "center", padding: "13px", backgroundColor: "#4361ee",
                  borderRadius: 8, color: "white", textDecoration: "none",
                  fontSize: 14, fontWeight: 700,
                }}>{t.nav.cta}</Link>
              </div>
            </div>
          )}
        </nav>

        <main onClick={() => setLangOpen(false)}>

          {/* ── Hero ── */}
          <section id="hero" ref={heroRef} style={{
            position: "relative", minHeight: "100vh",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            padding: "100px 20px 60px", textAlign: "center", overflow: "hidden",
          }}>
            <div className="noise" />
            {/* Top glow */}
            <div style={{
              position: "absolute", top: "10%", left: "50%", transform: "translateX(-50%)",
              width: 800, height: 500, borderRadius: "50%",
              background: "radial-gradient(ellipse, rgba(67,97,238,0.2) 0%, transparent 68%)",
              pointerEvents: "none", zIndex: 0,
            }} />

            <div style={{ position: "relative", zIndex: 1, maxWidth: 800, width: "100%" }}>
              {/* Badge */}
              <div data-reveal style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                backgroundColor: "rgba(67,97,238,0.1)", border: "1px solid rgba(67,97,238,0.25)",
                borderRadius: 100, padding: "6px 16px",
                fontSize: 13, fontWeight: 500, color: "#7b8fff", marginBottom: 28,
              }}>
                🇩🇿 {t.hero.badge}
              </div>

              {/* Headline — word-by-word stagger */}
              <h1 className={outfit.className} style={{
                fontSize: "clamp(28px, 5.5vw, 58px)", fontWeight: 800,
                lineHeight: 1.1, letterSpacing: "-0.025em",
                marginBottom: 22, color: "white",
              }}>
                {t.hero.h1a.split(" ").map((w, i) => (
                  <span key={i} className="hero-word" style={{ animationDelay: `${i * 60}ms`, marginRight: "0.25em" }}>{w}</span>
                ))}{" "}
                <span className="gradient-text hero-word" style={{ animationDelay: "240ms" }}>{t.hero.h1b}</span>
                {"."}<br />
                {t.hero.h1c.split(" ").map((w, i) => (
                  <span key={i} className="hero-word" style={{ animationDelay: `${(i + 5) * 60 + 100}ms`, marginRight: "0.25em" }}>{w}</span>
                ))}
              </h1>

              {/* Subheadline */}
              <p data-reveal data-delay="2" style={{
                fontSize: "clamp(15px, 2vw, 18px)",
                color: "rgba(255,255,255,0.52)", lineHeight: 1.72,
                maxWidth: 580, margin: "0 auto 36px",
              }}>
                {t.hero.sub}
              </p>

              {/* CTAs */}
              <div data-reveal data-delay="3" className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center mb-6">
                <Link href="/login?tab=signup" className="btn-shine w-full sm:w-auto" style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                  backgroundColor: "#4361ee", color: "white",
                  padding: "14px 28px", borderRadius: 10,
                  fontSize: 15, fontWeight: 700, textDecoration: "none",
                }}>
                  {t.hero.cta}
                </Link>
                <a href="#features" className="w-full sm:w-auto" style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                  border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.78)",
                  padding: "14px 28px", borderRadius: 10, fontSize: 15, fontWeight: 500,
                  textDecoration: "none", backgroundColor: "transparent",
                  transition: "background .2s, border-color .2s",
                }}>
                  {t.hero.demo}
                </a>
              </div>

              {/* Social proof */}
              <p data-reveal data-delay="4" style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", marginBottom: 60 }}>
                {t.hero.social}
              </p>
            </div>

            {/* Dashboard mockup */}
            <div data-reveal data-delay="5" style={{ position: "relative", width: "100%", maxWidth: 840, zIndex: 1, overflow: "hidden" }}>
              <div style={{
                position: "absolute", inset: -80,
                background: "radial-gradient(ellipse at center, rgba(67,97,238,0.15) 0%, transparent 65%)",
                pointerEvents: "none",
              }} />
              <div className="float-card" style={{
                backgroundColor: "#141720",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 18, overflow: "hidden",
                boxShadow: "0 48px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}>
                {/* Window chrome */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "12px 18px",
                  backgroundColor: "rgba(255,255,255,0.025)",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["#f97066", "#ffd43b", "#3ecf8e"].map((c) => (
                      <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: c, opacity: 0.75 }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", fontFamily: "monospace" }}>flowd — Commandes</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div className="live-dot" style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#3ecf8e" }} />
                    <span style={{ fontSize: 11, color: "#3ecf8e", fontWeight: 700 }}>Live</span>
                  </div>
                </div>

                {/* Table header */}
                <div style={{
                  display: "grid", gridTemplateColumns: "90px 1fr 1.4fr 110px 110px",
                  gap: 12, padding: "9px 18px",
                  fontSize: 10, color: "rgba(255,255,255,0.28)",
                  fontWeight: 700, letterSpacing: "0.08em",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                }}>
                  <span>SOURCE</span><span>CLIENT</span><span>PRODUIT</span><span>MONTANT</span><span>STATUT</span>
                </div>

                {MOCK_ORDERS.map((order, i) => (
                  <div key={order.id} className="order-row" style={{
                    display: "grid", gridTemplateColumns: "90px 1fr 1.4fr 110px 110px",
                    gap: 12, padding: "12px 18px",
                    borderBottom: i < MOCK_ORDERS.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
                    alignItems: "center", transition: "background .15s",
                  }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: order.sourceColor,
                      backgroundColor: `${order.sourceColor}1a`,
                      padding: "3px 9px", borderRadius: 100, display: "inline-block", whiteSpace: "nowrap",
                    }}>{order.source}</span>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.88)", fontWeight: 500 }}>{order.name}</span>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.42)" }}>{order.product}</span>
                    <span style={{ fontSize: 13, color: "white", fontWeight: 700 }}>{order.price}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: order.statusColor,
                      backgroundColor: `${order.statusColor}1a`,
                      padding: "3px 9px", borderRadius: 100, display: "inline-block", whiteSpace: "nowrap",
                    }}>{order.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Problems ── */}
          <section id="problems" style={{ padding: "80px 20px", backgroundColor: "#0f1119" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <h2 data-reveal className={outfit.className} style={{
                fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: 700, color: "white",
                textAlign: "center", marginBottom: 52,
              }}>{t.problems.title}</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
                {t.problems.cards.map((p, i) => (
                  <div key={i} data-reveal data-delay={`${i + 1}` as "1"|"2"|"3"} className="feat-card" style={{
                    backgroundColor: "#141720", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "28px 24px",
                  }}>
                    <div style={{ fontSize: 36, marginBottom: 16 }}>{p.icon}</div>
                    <h3 className={outfit.className} style={{ fontSize: 17, fontWeight: 700, color: "white", marginBottom: 8 }}>{p.title}</h3>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.48)", lineHeight: 1.65 }}>{p.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Features ── */}
          <section id="features" style={{ padding: "80px 20px" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 52 }}>
                <div data-reveal style={{
                  display: "inline-block", fontSize: 11, fontWeight: 700,
                  letterSpacing: "0.12em", color: "#4361ee", marginBottom: 14,
                }}>{t.features.label}</div>
                <h2 data-reveal data-delay="1" className={outfit.className} style={{
                  fontSize: "clamp(26px, 3.5vw, 36px)", fontWeight: 700, color: "white",
                }}>{t.features.title}</h2>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 18 }}>
                {t.features.cards.map((card, i) => (
                  <div key={i} data-reveal data-delay={`${(i % 3) + 1}` as "1"|"2"|"3"} className="feat-card" style={{
                    backgroundColor: "#141720", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, padding: "28px 24px",
                  }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 12,
                      backgroundColor: `${card.color}18`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 24, marginBottom: 18,
                    }}>{card.icon}</div>
                    <h3 className={outfit.className} style={{ fontSize: 16, fontWeight: 700, color: "white", marginBottom: 8 }}>{card.title}</h3>
                    <p style={{ fontSize: 14, color: "rgba(255,255,255,0.48)", lineHeight: 1.65 }}>{card.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Chatbot Highlight ── */}
          <section id="chatbot" style={{ padding: "80px 20px", backgroundColor: "#0f1119" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div data-reveal>
                <div style={{
                  display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
                  color: "#c97aff", backgroundColor: "rgba(201,122,255,0.1)",
                  padding: "4px 14px", borderRadius: 100, marginBottom: 18,
                }}>{t.chatbot.label}</div>
                <h2 className={outfit.className} style={{
                  fontSize: "clamp(24px, 3.2vw, 36px)", fontWeight: 700,
                  color: "white", lineHeight: 1.2, marginBottom: 16,
                }}>{t.chatbot.title}</h2>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.72, marginBottom: 28 }}>{t.chatbot.desc}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {t.chatbot.bullets.map((item, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%",
                        backgroundColor: "rgba(62,207,142,0.13)",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <Check size={12} color="#3ecf8e" strokeWidth={3} />
                      </div>
                      <span style={{ fontSize: 14, color: "rgba(255,255,255,0.72)" }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chat mockup */}
              <div data-reveal data-delay="2">
                <div style={{
                  backgroundColor: "#141720", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 20, overflow: "hidden",
                  boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
                    backgroundColor: "rgba(255,255,255,0.02)",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: "50%",
                      background: "linear-gradient(135deg, #4361ee, #c97aff)",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
                    }}>🤖</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "white" }}>Flowd AI</div>
                      <div style={{ fontSize: 11, color: "#c97aff", marginTop: 1 }}>via Instagram</div>
                    </div>
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
                      <div className="live-dot" style={{ width: 7, height: 7, borderRadius: "50%", backgroundColor: "#3ecf8e" }} />
                      <span style={{ fontSize: 11, color: "#3ecf8e", fontWeight: 600 }}>En ligne</span>
                    </div>
                  </div>
                  <div style={{ padding: "18px", display: "flex", flexDirection: "column", gap: 11 }}>
                    {[
                      { from: "client", text: "Salam, wach andkom taille 42 f les chaussures ?" },
                      { from: "bot", text: "Wa alaykom salam! Ih andna taille 42 👟\nPrix: 4 100 DA. Livraison Blida 2-3 jours.\nTridha ncréa lak commande?" },
                      { from: "client", text: "Ih, commande 🙌" },
                      { from: "bot", text: "Parfait! Donnez-moi votre nom complet et numéro de téléphone 📝" },
                    ].map((msg, i) => (
                      <div key={i} style={{ display: "flex", justifyContent: msg.from === "bot" ? "flex-end" : "flex-start" }}>
                        <div style={{
                          background: msg.from === "bot" ? "linear-gradient(135deg, #4361ee, #7b8fff)" : "rgba(255,255,255,0.08)",
                          borderRadius: msg.from === "bot" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                          padding: "10px 14px", maxWidth: "86%",
                          fontSize: 13, color: "rgba(255,255,255,0.9)", lineHeight: 1.55,
                          whiteSpace: "pre-line",
                        }}>{msg.text}</div>
                      </div>
                    ))}
                    <div style={{ display: "flex", alignItems: "center", gap: 4, paddingLeft: 2 }}>
                      {[0, 1, 2].map((d) => (
                        <div key={d} style={{
                          width: 6, height: 6, borderRadius: "50%",
                          backgroundColor: "rgba(255,255,255,0.22)",
                          animation: `pulse-dot 1.4s ease-in-out ${d * 0.2}s infinite`,
                        }} />
                      ))}
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.28)", marginLeft: 5 }}>Le client tape...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Delivery Highlight ── */}
          <section id="delivery" style={{ padding: "80px 20px" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              {/* Delivery card */}
              <div data-reveal className="order-2 lg:order-1">
                <div style={{
                  backgroundColor: "#141720", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 20, padding: "28px",
                  boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)", marginBottom: 16 }}>COMMANDE #2847</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 0, marginBottom: 22 }}>
                    {[
                      { label: "Client", value: "Amira Benali" },
                      { label: "Téléphone", value: "0556 234 890" },
                      { label: "Wilaya", value: "09 — Blida" },
                      { label: "Produit", value: "Chaussures 42 × 1" },
                      { label: "Montant COD", value: "4 100 DA" },
                    ].map((row) => (
                      <div key={row.label} style={{
                        display: "flex", justifyContent: "space-between",
                        fontSize: 13, padding: "9px 0",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}>
                        <span style={{ color: "rgba(255,255,255,0.38)" }}>{row.label}</span>
                        <span style={{ color: "white", fontWeight: 600 }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <button style={{
                    width: "100%", backgroundColor: "#4361ee", color: "white",
                    border: "none", borderRadius: 11, padding: "14px",
                    fontSize: 14, fontWeight: 700, cursor: "pointer", marginBottom: 12,
                    boxShadow: "0 4px 20px rgba(67,97,238,0.4)",
                    transition: "background .2s",
                  }}>Envoyer à Yalidine →</button>
                  <div style={{
                    backgroundColor: "rgba(62,207,142,0.07)", border: "1px solid rgba(62,207,142,0.2)",
                    borderRadius: 10, padding: "11px 15px",
                    display: "flex", alignItems: "center", gap: 9,
                  }}>
                    <Check size={14} color="#3ecf8e" strokeWidth={3} />
                    <span style={{ fontSize: 13, color: "#3ecf8e", fontWeight: 700 }}>#YLD-88231 créé automatiquement</span>
                  </div>
                </div>
              </div>

              {/* Text */}
              <div data-reveal data-delay="2" className="order-1 lg:order-2">
                <div style={{
                  display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
                  color: "#3ecf8e", backgroundColor: "rgba(62,207,142,0.1)",
                  padding: "4px 14px", borderRadius: 100, marginBottom: 18,
                }}>{t.delivery.label}</div>
                <h2 className={outfit.className} style={{
                  fontSize: "clamp(24px, 3.2vw, 36px)", fontWeight: 700,
                  color: "white", lineHeight: 1.2, marginBottom: 16,
                }}>{t.delivery.title}</h2>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,0.5)", lineHeight: 1.72, marginBottom: 36 }}>{t.delivery.desc}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  {t.delivery.stats.map((item) => (
                    <div key={item.label} style={{
                      textAlign: "center", padding: "18px 10px",
                      backgroundColor: "#141720", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12,
                    }}>
                      <div className={outfit.className} style={{ fontSize: 26, fontWeight: 800, color: "#4361ee", marginBottom: 4 }}>{item.stat}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)", lineHeight: 1.4 }}>{item.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Stats ── */}
          <section id="stats" style={{ padding: "80px 20px", backgroundColor: "#0f1119" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <div className="grid grid-cols-2 md:grid-cols-4" style={{
                borderRadius: 18, overflow: "hidden",
                border: "1px solid rgba(255,255,255,0.07)", marginBottom: 44,
              }}>
                {t.stats.map((item, i) => (
                  <div key={i} data-reveal data-delay={`${i + 1}` as "1"|"2"|"3"|"4"} style={{
                    backgroundColor: "#141720", padding: "32px 24px", textAlign: "center",
                    borderRight: i < t.stats.length - 1 ? "1px solid rgba(255,255,255,0.07)" : "none",
                  }}>
                    <div className={`${outfit.className} gradient-text`} style={{ fontSize: 40, fontWeight: 800, marginBottom: 10 }}>
                      {item.stat}
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Testimonial */}
              <div data-reveal style={{
                backgroundColor: "#141720", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 20, padding: "clamp(28px, 5vw, 48px)", textAlign: "center",
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: -80, left: "50%", transform: "translateX(-50%)",
                  width: 400, height: 250,
                  background: "radial-gradient(ellipse, rgba(67,97,238,0.07) 0%, transparent 70%)",
                  pointerEvents: "none",
                }} />
                <div style={{ fontSize: 44, opacity: 0.35, lineHeight: 1, marginBottom: 18 }}>❝</div>
                <p className={outfit.className} style={{
                  fontSize: "clamp(16px, 2.2vw, 21px)", fontWeight: 600,
                  color: "white", lineHeight: 1.55, maxWidth: 640, margin: "0 auto 24px",
                }}>{t.testimonial.quote}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: "linear-gradient(135deg, #4361ee, #c97aff)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 15, fontWeight: 800, color: "white",
                  }}>A</div>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>{t.testimonial.name}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)" }}>{t.testimonial.role}</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Integrations ── */}
          <section id="integrations" style={{ padding: "80px 20px" }}>
            <div style={{ maxWidth: 860, margin: "0 auto", textAlign: "center" }}>
              <h2 data-reveal className={outfit.className} style={{
                fontSize: "clamp(24px, 3.2vw, 36px)", fontWeight: 700, color: "white", marginBottom: 12,
              }}>{t.integrations.title}</h2>
              <p data-reveal data-delay="1" style={{ fontSize: 15, color: "rgba(255,255,255,0.38)", marginBottom: 44 }}>
                {t.integrations.sub}
              </p>
              <div data-reveal data-delay="2" style={{ display: "flex", flexWrap: "wrap", gap: 11, justifyContent: "center" }}>
                {INTEGRATIONS.map((name) => (
                  <div key={name} className="int-pill" style={{
                    backgroundColor: "#141720", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 100, padding: "9px 20px",
                    fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.7)",
                  }}>{name}</div>
                ))}
              </div>
            </div>
          </section>

          {/* ── CTA ── */}
          <section id="pricing" style={{
            padding: "80px 20px", textAlign: "center",
            position: "relative", overflow: "hidden", backgroundColor: "#0f1119",
          }}>
            <div className="noise" />
            <div style={{
              position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)",
              width: 700, height: 400,
              background: "radial-gradient(ellipse, rgba(67,97,238,0.15) 0%, transparent 68%)",
              pointerEvents: "none",
            }} />
            <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto" }}>
              <h2 data-reveal className={outfit.className} style={{
                fontSize: "clamp(26px, 4vw, 46px)", fontWeight: 800,
                color: "white", lineHeight: 1.12, marginBottom: 18,
              }}>{t.cta.title}</h2>
              <p data-reveal data-delay="1" style={{
                fontSize: 16, color: "rgba(255,255,255,0.46)", lineHeight: 1.7,
                marginBottom: 40, maxWidth: 540, margin: "0 auto 40px",
              }}>{t.cta.sub}</p>
              <div data-reveal data-delay="2" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
                <Link href="/login?tab=signup" className="btn-shine w-full sm:w-auto" style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                  backgroundColor: "#4361ee", color: "white",
                  padding: "16px 40px", borderRadius: 12,
                  fontSize: 16, fontWeight: 700, textDecoration: "none",
                }}>
                  {t.cta.btn}
                </Link>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.26)" }}>{t.cta.note}</p>
              </div>
            </div>
          </section>
        </main>

        {/* ── Footer ── */}
        <footer style={{
          borderTop: "0.5px solid rgba(255,255,255,0.07)",
          padding: "44px 20px", backgroundColor: "#0a0c12",
        }}>
          <div style={{
            maxWidth: 1100, margin: "0 auto",
            display: "flex", flexWrap: "wrap",
            flexDirection: "column",
            alignItems: "center", gap: 20, textAlign: "center",
          }} className="sm:flex-row sm:justify-between sm:text-left sm:items-center">
            <div>
              <FlowdLogo height={24} />
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.28)", marginTop: 8 }}>{t.footer.tagline}</p>
            </div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              {NAV_LINKS.map((l) => (
                <a key={l.href} href={l.href} style={{
                  fontSize: 13, color: "rgba(255,255,255,0.38)", textDecoration: "none",
                  transition: "color .2s",
                }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.38)")}
                >{l.label}</a>
              ))}
            </div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.2)" }}>{t.footer.copy}</p>
          </div>
        </footer>
      </div>
    </>
  );
}
