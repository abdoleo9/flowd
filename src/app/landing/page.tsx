"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// ─── Logo path ────────────────────────────────────────────────────────────────
const LOGO_D =
  "M34.893 2.980 C 19.862 4.180,7.960 13.311,3.079 27.388 C 2.801 28.192,2.355 28.850,2.089 28.850 C 1.823 28.850,1.480 29.052,1.327 29.300 C 1.174 29.548,1.208 29.652,1.402 29.532 C 1.612 29.402,1.704 94.957,1.630 191.753 C 1.504 357.037,1.515 358.511,2.899 362.183 C 4.876 367.430,5.623 369.046,7.248 371.591 C 12.336 379.558,21.188 385.452,30.994 387.402 C 36.434 388.483,362.752 388.478,368.226 387.397 C 373.497 386.355,379.766 383.852,382.620 381.648 C 390.569 375.510,395.160 368.429,397.125 359.279 C 397.881 355.758,397.984 37.858,397.231 32.749 C 395.148 18.617,384.798 7.464,370.175 3.594 C 368.059 3.034,41.702 2.436,34.893 2.980 M319.923 71.779 C 320.708 72.646,321.116 124.497,320.359 127.207 C 319.830 129.102,322.484 129.048,229.917 129.043 C 159.500 129.039,141.701 129.137,141.445 129.529 C 141.268 129.799,141.135 134.318,141.148 139.571 C 141.161 144.825,141.162 158.987,141.151 171.044 L 141.131 192.964 140.141 193.613 C 139.240 194.203,136.466 194.264,109.491 194.290 L 79.831 194.319 79.082 193.394 C 78.357 192.499,78.337 191.602,78.445 165.143 L 78.558 137.817 79.831 135.379 C 84.396 126.639,87.213 125.923,117.013 125.933 C 128.591 125.937,138.227 125.839,138.427 125.715 C 138.645 125.580,138.793 117.096,138.795 104.558 L 138.799 83.626 139.754 81.575 C 142.315 76.073,146.944 72.180,151.876 71.378 C 152.935 71.206,191.012 71.042,236.492 71.014 L 319.184 70.962 319.923 71.779 M278.608 192.284 C 279.244 193.313,279.049 194.704,278.053 196.242 C 277.478 197.129,276.786 198.294,276.517 198.830 C 276.247 199.366,275.675 200.375,275.245 201.072 C 273.272 204.272,272.870 204.954,272.251 206.140 C 271.888 206.837,271.448 207.407,271.273 207.407 C 271.098 207.407,270.955 207.637,270.955 207.919 C 270.955 208.200,270.604 208.807,270.175 209.267 C 269.747 209.727,269.396 210.211,269.396 210.342 C 269.396 210.473,268.908 211.314,268.312 212.210 C 267.715 213.107,266.986 214.320,266.690 214.906 C 266.394 215.492,265.829 216.318,265.435 216.741 C 265.040 217.165,264.717 217.700,264.717 217.931 C 264.717 218.417,263.703 220.118,262.738 221.248 C 262.372 221.676,261.596 222.950,261.013 224.077 C 260.431 225.205,259.795 226.226,259.601 226.346 C 259.406 226.466,258.990 227.122,258.676 227.804 C 258.362 228.487,257.883 229.388,257.610 229.807 C 255.793 232.605,253.021 237.093,253.021 237.238 C 253.021 237.620,250.269 241.685,249.810 241.982 C 249.539 242.157,225.166 242.388,195.646 242.495 C 166.127 242.602,141.850 242.815,141.697 242.969 C 141.543 243.122,141.394 260.090,141.365 280.676 C 141.305 322.822,141.579 319.253,138.402 319.289 C 112.505 319.581,79.715 319.232,79.080 318.657 C 78.396 318.038,78.363 316.684,78.363 289.277 C 78.363 257.546,78.243 259.013,81.014 256.864 C 82.022 256.082,86.969 252.161,92.008 248.150 C 103.733 238.818,104.608 238.131,105.663 237.427 C 106.146 237.105,107.087 236.347,107.754 235.742 C 108.851 234.748,119.848 225.950,128.065 219.493 C 133.041 215.583,155.976 197.407,157.458 196.200 C 158.182 195.610,159.836 194.381,161.133 193.470 L 163.491 191.813 220.904 191.813 C 265.341 191.813,278.382 191.919,278.608 192.284";

function FlowdLogo({ fill = "#0052FF", size = 36 }: { fill?: string; size?: number }) {
  return (
    <svg width={size} height={Math.round(size * 0.975)} viewBox="0 0 400 390" aria-label="Flowd logo">
      <path fill={fill} d={LOGO_D} />
    </svg>
  );
}

// ─── Translations ─────────────────────────────────────────────────────────────
type Lang = "dz" | "fr" | "en";

const T = {
  dz: {
    nav: { features: "Lmizat", how: "Kifach kheddem", integrations: "Intégrations", pricing: "Prix", login: "Connecter", cta: "Bda majani" },
    hero: {
      badge: "Mabni l ecommerce dziri",
      h1a: "Bi3 kter.", h1b: "Thetnem aqel.",
      sub: "Dashboard wahda l kol commandatek, chatbot AI yehki darija, w suivi livraison live — mabni l bay3in li jidin.",
      cta: "Bda bla flous", demo: "Chof demo", note: "Majani · Bla carte bancaire",
    },
    logos: "Marchands dziryin fih confiance · Intégré ma3",
    features: {
      tag: "Lmizat", h: "Kol tool li thtaglou tbi3 biha akthar",
      sub: "Waqfou tbadlou bin 5 apps. Flowd tjma3 kollchi bach tركزوا على البيع.",
      cards: [
        { icon: "🤖", title: "Chatbot AI b Darija", desc: "L AI dyalk yrod 3la l 3mliya fl darija, français wla ingliziya — b soutok w cataloguetek. Yakhod commandate, yrod 3la so2alat, w ma ynam." },
        { icon: "📊", title: "Dashboard commandate", desc: "Commandate men Instagram, Messenger, Shopify wla manuelle — kollha f table wahda. Filtri, confirmi, chot bil batch bla ma tbadel tabs." },
        { icon: "🚚", title: "Suivi livraison live", desc: "Connecti Yalidine, ZR Express, Maystro, w EddyApp. Suiviw kol colis live w t3arref bih fl moment li tsal wla t7bes." },
        { icon: "⚡", title: "Pages produit IA", desc: "Chargi foto produit w Gemini AI ygeneri lak page complète f 30 secondes. Partagi le lien — commandate tjik whedha." },
        { icon: "🔗", title: "Kol canaux, connectés", desc: "Instagram DMs, Messenger, WhatsApp, Shopify, WooCommerce, Google Sheets — webhook wahda, kollchi ydkhol fl Flowd whedh." },
        { icon: "👥", title: "Team w permissions", desc: "Inviti agents, confirmateurs, w admins b permissions granulaires. Mabni l teams li tekbar bsre3a." },
      ],
    },
    how: {
      tag: "Kifach kheddem", h: "Men DM l delivery — f flow wahda",
      steps: [
        { title: "L 3mil yab3et DM", desc: "Wahd l 3mil yjawbek 3la Instagram wla Messenger. L AI dyal Flowd ydetek b lgha w yrod fl 7in — bla takhir, bla missed messages." },
        { title: "AI yakhod la commande", desc: "L chatbot ykhod produit, quantité, wilaya, w contact — w ydir commande confirmée f dashboard dyalk automatic." },
        { title: "Tersel b click wahda", desc: "Ikhtari Yalidine, ZR Express, Maystro, wla EddyApp w tersel. ID tracking ytgeniri w yetlia b commande fl 7al." },
        { title: "Suiviw kollchi live", desc: "Choufi kol colis 3la kol carriers f tableau wahd. T3arref bih fl moment li tsal wla thta7 l attention." },
      ],
    },
    integrations: { tag: "Intégrations", h: "Connecti kol stack dyalak", sub: "Kol platform li katkhdmou bih déjà, mconnecté m3 Flowd f quelques minutes." },
    pricing: {
      tag: "Prix", h: "Prix simple, bla tkhbiya", sub: "Kol prix b Dinar Dziri. Bla frais cachés. Cancel imti voules.",
      plans: [
        { name: "Starter", price: "Majani", period: "/ chahr", tagline: "Bach tbda w tjreb la plateforme.", features: ["7ata 100 commandate / chahr", "Canal wahda (Instagram wla Messenger)", "Chatbot AI (limitée)", "Société livraison wahda"], btn: "Bda majani", btnStyle: "outline", popular: false },
        { name: "Growth", price: "4 900", period: "DA / chahr", tagline: "L bay3in li actifs li bgha yscalaw.", features: ["Commandate unlimited", "Kol canaux connectés", "Chatbot AI complet (Darija, FR, EN)", "Kol sociétés livraison", "Pages produit IA", "Team 7ata 5 membres"], btn: "Essai gratuit 14 jours", btnStyle: "solid", popular: true },
        { name: "Pro", price: "9 900", period: "DA / chahr", tagline: "L teams w opérations multi-boutiques.", features: ["Kol li f Growth", "Multi-workspace", "Membres équipe unlimited", "Support prioritaire", "Persona chatbot personnalisé"], btn: "Contactana", btnStyle: "outline", popular: false },
      ],
    },
    testimonials: {
      tag: "Témoignages", h: "Bay3in kaysanaw Flowd",
      cards: [
        { quote: '"Chatbot IA yehki Darija bhal ana. L 3mliya ma katerfou htta annou bot. Commandate zdadu b 40% f chahr lwel."', name: "Sofia Amrani", meta: "Mode boutique · Alger", initials: "SA", color: "#0052FF" },
        { quote: '"Kont ndiru 3 tableurs w 4 apps. Daba kollchi f Flowd. Nchoufi kol commande, kol colis, f chi wahda. 3jibatli l 7ayat."', name: "Karim Moussa", meta: "Electronique · Oran", initials: "KM", color: "#0EA5E9" },
        { quote: '"Pages produit IA waheda ta7la l abonnement. 30 secondes bach t3mel page complète men foto wahda."', name: "Nadia Benmoussa", meta: "Cosmétiques · Constantine", initials: "NB", color: "#F97316" },
      ],
    },
    cta: { badge: "Rejoignez des centaines de vendeurs algériens", h1: "Dirou kollchi men", h2: "chi wahda.", sub: "Bla carte bancaire. Bla engagement. Ghi akthar bi3 w aqel stress.", btn: "Bda majani", demo: "Chof kifach kheddem" },
    footer: { copy: "© 2026 Flowd · Mabni l ecommerce dziri", links: ["Confidentialité", "CGU", "Contact"] },
  },
  fr: {
    nav: { features: "Fonctionnalités", how: "Comment ça marche", integrations: "Intégrations", pricing: "Tarifs", login: "Se connecter", cta: "Commencer gratuitement" },
    hero: {
      badge: "Conçu pour le e-commerce algérien",
      h1a: "Vendez plus.", h1b: "Stressez moins.",
      sub: "Un dashboard pour toutes vos commandes, un chatbot IA qui parle darija, et un suivi livraison en temps réel — conçu pour les vendeurs sérieux.",
      cta: "Commencer gratuitement", demo: "Voir la démo", note: "Gratuit · Aucune carte bancaire",
    },
    logos: "Approuvé par les vendeurs algériens · Intégré avec",
    features: {
      tag: "Fonctionnalités", h: "Tous les outils pour vendre plus vite",
      sub: "Fini les 5 apps. Flowd centralise tout pour que vous puissiez vous concentrer sur la vente.",
      cards: [
        { icon: "🤖", title: "Chatbot IA en Darija", desc: "Votre IA répond instantanément en darija, français ou anglais — avec votre ton et votre catalogue. Il prend les commandes et ne dort jamais." },
        { icon: "📊", title: "Dashboard commandes unifié", desc: "Commandes d'Instagram, Messenger, Shopify ou manuel — tout dans un seul tableau. Filtrez, confirmez et expédiez en masse sans changer d'onglet." },
        { icon: "🚚", title: "Suivi livraison en temps réel", desc: "Connectez Yalidine, ZR Express, Maystro, et EddyApp. Suivez chaque colis en direct et soyez alerté dès qu'une livraison échoue ou réussit." },
        { icon: "⚡", title: "Pages produit IA", desc: "Uploadez une photo produit et Gemini AI génère une page complète en 30 secondes. Partagez le lien — les commandes arrivent automatiquement." },
        { icon: "🔗", title: "Tous les canaux, connectés", desc: "Instagram DMs, Messenger, WhatsApp, Shopify, WooCommerce, Google Sheets — un webhook, tout rentre dans Flowd automatiquement." },
        { icon: "👥", title: "Équipe & permissions", desc: "Invitez des agents, confirmateurs et admins avec des permissions granulaires. Conçu pour les équipes qui grandissent vite." },
      ],
    },
    how: {
      tag: "Comment ça marche", h: "Du DM à la livraison — en un seul flux",
      steps: [
        { title: "Le client envoie un DM", desc: "Un client vous contacte sur Instagram ou Messenger. L'IA de Flowd détecte sa langue et répond instantanément — aucun délai, aucun message manqué." },
        { title: "L'IA collecte la commande", desc: "Le chatbot recueille le produit, la quantité, la wilaya et le contact — puis crée une commande confirmée dans votre dashboard automatiquement." },
        { title: "Vous expédiez en un clic", desc: "Choisissez Yalidine, ZR Express, Maystro, ou EddyApp et expédiez. Un ID de suivi est généré et lié à la commande immédiatement." },
        { title: "Suivez tout en temps réel", desc: "Suivez tous les colis sur tous les transporteurs sur un seul tableau de bord. Sachez immédiatement quand une livraison réussit ou nécessite attention." },
      ],
    },
    integrations: { tag: "Intégrations", h: "Connectez toute votre stack", sub: "Chaque plateforme que vous utilisez déjà, branchée sur Flowd en quelques minutes." },
    pricing: {
      tag: "Tarifs", h: "Des prix simples et honnêtes", sub: "Tous les prix en Dinar Algérien. Aucun frais caché. Annulez à tout moment.",
      plans: [
        { name: "Starter", price: "Gratuit", period: "/ mois", tagline: "Pour démarrer et tester la plateforme.", features: ["Jusqu'à 100 commandes / mois", "1 canal (Instagram ou Messenger)", "Chatbot AI (limité)", "1 société de livraison"], btn: "Commencer gratuitement", btnStyle: "outline", popular: false },
        { name: "Growth", price: "4 900", period: "DA / mois", tagline: "Pour les vendeurs actifs qui veulent scaler.", features: ["Commandes illimitées", "Tous les canaux connectés", "Chatbot AI complet (Darija, FR, EN)", "Toutes les sociétés de livraison", "Pages produit IA", "Équipe jusqu'à 5 membres"], btn: "Essai gratuit 14 jours", btnStyle: "solid", popular: true },
        { name: "Pro", price: "9 900", period: "DA / mois", tagline: "Pour les équipes et opérations multi-boutiques.", features: ["Tout ce qui est dans Growth", "Multi-workspace", "Membres d'équipe illimités", "Support prioritaire", "Persona chatbot personnalisé"], btn: "Nous contacter", btnStyle: "outline", popular: false },
      ],
    },
    testimonials: {
      tag: "Témoignages", h: "Les vendeurs adorent Flowd",
      cards: [
        { quote: '"Le chatbot IA parle Darija exactement comme moi. Mes clients ne savent même pas que c\'est un bot. Les commandes ont augmenté de 40% le premier mois."', name: "Sofia Amrani", meta: "Boutique mode · Alger", initials: "SA", color: "#0052FF" },
        { quote: '"Je gérais 3 tableurs et 4 apps. Maintenant tout est dans Flowd. Je vois chaque commande, chaque colis, sur un seul écran. 3jibatli l 7ayat."', name: "Karim Moussa", meta: "Électronique · Oran", initials: "KM", color: "#0EA5E9" },
        { quote: '"La génération de pages produit IA vaut à elle seule l\'abonnement. 30 secondes pour une page complète à partir d\'une simple photo."', name: "Nadia Benmoussa", meta: "Cosmétiques · Constantine", initials: "NB", color: "#F97316" },
      ],
    },
    cta: { badge: "Rejoignez des centaines de vendeurs algériens", h1: "Gérez tout depuis", h2: "un seul onglet.", sub: "Pas de carte de crédit. Pas d'engagement. Juste plus de ventes et moins de stress.", btn: "Commencer gratuitement", demo: "Voir comment ça marche" },
    footer: { copy: "© 2026 Flowd · Fait pour le e-commerce algérien", links: ["Confidentialité", "CGU", "Contact"] },
  },
  en: {
    nav: { features: "Features", how: "How it works", integrations: "Integrations", pricing: "Pricing", login: "Sign in", cta: "Get started free" },
    hero: {
      badge: "Built for Algerian e-commerce",
      h1a: "Sell more.", h1b: "Stress less.",
      sub: "One dashboard for all your orders, an AI chatbot that speaks Darija, and real-time delivery tracking — built for sellers who mean business.",
      cta: "Start for free", demo: "Watch demo", note: "Free forever · No credit card needed",
    },
    logos: "Trusted by sellers across Algeria · Integrated with",
    features: {
      tag: "Features", h: "Every tool you need to grow faster",
      sub: "Stop juggling 5 apps. Flowd brings everything together so you can focus on selling.",
      cards: [
        { icon: "🤖", title: "AI Chatbot in Darija", desc: "Your AI replies instantly in Darija, French, or English — using your tone and your catalog. It takes orders, handles questions, and never sleeps." },
        { icon: "📊", title: "Unified order dashboard", desc: "Orders from Instagram, Messenger, Shopify, or manual — all in one table. Filter, confirm, and ship in bulk without switching tabs." },
        { icon: "🚚", title: "Real-time delivery tracking", desc: "Connect Yalidine, ZR Express, Maystro, and EddyApp. Monitor every parcel live and get alerted the moment a delivery fails or succeeds." },
        { icon: "⚡", title: "AI product landing pages", desc: "Upload a product photo and Gemini AI generates a full landing page in 30 seconds. Share the link — orders flow in automatically." },
        { icon: "🔗", title: "All channels, connected", desc: "Instagram DMs, Messenger, WhatsApp, Shopify, WooCommerce, Google Sheets — one webhook, everything flows into Flowd automatically." },
        { icon: "👥", title: "Team & permission roles", desc: "Invite agents, confirmers, and admins with granular permissions. Built for teams growing fast and staying organized." },
      ],
    },
    how: {
      tag: "How it works", h: "From DM to delivered — in one flow",
      steps: [
        { title: "Customer sends a DM", desc: "A customer messages you on Instagram or Messenger. Flowd's AI detects their language and replies instantly — no delay, no missed messages." },
        { title: "AI collects the order", desc: "The chatbot gathers product, quantity, wilaya, and contact info — then creates a confirmed order in your dashboard automatically." },
        { title: "You ship with one click", desc: "Select Yalidine, ZR Express, Maystro, or EddyApp and dispatch. A tracking ID is generated and linked to the order immediately." },
        { title: "Track everything in real-time", desc: "Monitor all parcels across all carriers on a single board. Know immediately when a delivery succeeds or needs attention." },
      ],
    },
    integrations: { tag: "Integrations", h: "Connect your entire stack", sub: "Every platform you already use, plugged into Flowd in minutes." },
    pricing: {
      tag: "Pricing", h: "Simple, honest pricing", sub: "All prices in Algerian Dinar. No hidden fees. Cancel anytime.",
      plans: [
        { name: "Starter", price: "Free", period: "/ month", tagline: "To get started and test the platform.", features: ["Up to 100 orders / month", "1 channel (Instagram or Messenger)", "AI Chatbot (limited)", "1 delivery company"], btn: "Get started free", btnStyle: "outline", popular: false },
        { name: "Growth", price: "4,900", period: "DA / month", tagline: "For active sellers who want to scale.", features: ["Unlimited orders", "All channels connected", "Full AI Chatbot (Darija, FR, EN)", "All delivery companies", "AI product landing pages", "Team up to 5 members"], btn: "14-day free trial", btnStyle: "solid", popular: true },
        { name: "Pro", price: "9,900", period: "DA / month", tagline: "For teams and multi-store operations.", features: ["Everything in Growth", "Multi-workspace", "Unlimited team members", "Priority support", "Custom chatbot persona"], btn: "Contact us", btnStyle: "outline", popular: false },
      ],
    },
    testimonials: {
      tag: "Testimonials", h: "Sellers love Flowd",
      cards: [
        { quote: '"The AI chatbot speaks Darija exactly like me. My customers don\'t even know it\'s a bot. Orders increased by 40% in the first month."', name: "Sofia Amrani", meta: "Fashion boutique · Alger", initials: "SA", color: "#0052FF" },
        { quote: '"I was managing 3 spreadsheets and 4 apps. Now everything is in Flowd. I see every order, every parcel, on one screen. 3jibatli l 7ayat."', name: "Karim Moussa", meta: "Electronics · Oran", initials: "KM", color: "#0EA5E9" },
        { quote: '"The AI product page generator alone is worth the subscription. 30 seconds for a complete page from a single photo."', name: "Nadia Benmoussa", meta: "Cosmetics · Constantine", initials: "NB", color: "#F97316" },
      ],
    },
    cta: { badge: "Join hundreds of Algerian sellers", h1: "Manage everything from", h2: "one tab.", sub: "No credit card. No commitment. Just more sales and less stress.", btn: "Get started free", demo: "See how it works" },
    footer: { copy: "© 2026 Flowd · Built for Algerian e-commerce", links: ["Privacy", "Terms", "Contact"] },
  },
} as const;

const LANG_OPTIONS: { code: Lang; label: string; flag: string }[] = [
  { code: "dz", label: "Darija", flag: "🇩🇿" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
];

// ─── How-it-works visual content (dangerouslySetInnerHTML) ────────────────────
const VIS_STEPS = [
  {
    title: "AI Chatbot · Live conversation",
    html: `<div style="display:flex;flex-direction:column;gap:10px"><div><div class="cb-label">Customer · Instagram</div><div class="cbubble cb-user">Salam, wach 3andkom sac cuir?</div></div><div><div class="cb-label" style="color:var(--blue)">Flowd AI · Darija</div><div class="cbubble cb-bot">Wah! 3andna 3 modèles: noir, marron, khamri. Min 4500 DA. Nwarjik les photos?</div></div><div><div class="cb-label">Customer</div><div class="cbubble cb-user">iyeh warini lkhamri</div></div><div style="font-size:11px;color:var(--muted2);margin-top:4px;display:flex;align-items:center;gap:6px"><div class="live-dot" style="width:5px;height:5px;border-radius:50%;background:#22C55E;animation:pulse 2s ease infinite"></div>AI detected Darija · replied in 0.4s</div></div>`,
  },
  {
    title: "Order dashboard · Auto-created",
    html: `<div><div style="font-size:11px;color:var(--muted);margin-bottom:14px;text-transform:uppercase;letter-spacing:.08em;font-weight:600">Nouvelle commande · Depuis Instagram</div><div style="background:var(--surface);border:1.5px solid var(--border);border-radius:10px;padding:16px;display:flex;flex-direction:column;gap:10px"><div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:var(--muted)">Référence</span><span style="font-family:monospace;font-weight:600;color:var(--text)">ORD-8F2A3B1C</span></div><div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:var(--muted)">Cliente</span><span style="font-weight:600;color:var(--text)">Leila Rahmani</span></div><div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:var(--muted)">Wilaya</span><span style="color:var(--text)">Alger (16)</span></div><div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:var(--muted)">Total</span><span style="color:var(--blue);font-weight:700">4 500 DA</span></div></div><div style="display:flex;gap:8px;margin-top:12px"><div style="flex:1;background:var(--blue);color:white;padding:9px;border-radius:7px;text-align:center;font-size:12px;font-weight:700">Confirmer</div><div style="background:var(--card-bg);border:1.5px solid var(--border);padding:9px;border-radius:7px;text-align:center;font-size:12px;color:var(--muted);flex:1">Voir détails</div></div></div>`,
  },
  {
    title: "Livraison · Expédier via Yalidine",
    html: `<div style="display:flex;flex-direction:column;gap:10px"><div style="display:flex;gap:8px"><div style="flex:1;padding:12px;border-radius:8px;border:2px solid var(--blue);background:var(--blue-light);text-align:center"><div style="font-size:12px;color:var(--blue);font-weight:700;margin-bottom:3px">Yalidine</div><div style="font-size:11px;color:var(--muted)">700 DA · J+1</div></div><div style="flex:1;padding:12px;border-radius:8px;border:1.5px solid var(--border);text-align:center"><div style="font-size:12px;color:var(--muted);font-weight:600;margin-bottom:3px">ZR Express</div><div style="font-size:11px;color:var(--muted)">800 DA · J+2</div></div></div><div style="background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:14px;font-size:12px;display:flex;flex-direction:column;gap:8px"><div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">Destinataire</span><span style="font-weight:600;color:var(--text)">Leila Rahmani · Alger</span></div><div style="display:flex;justify-content:space-between"><span style="color:var(--muted)">Montant COD</span><span style="color:var(--blue);font-weight:700">4 500 DA</span></div></div><div style="background:var(--blue);color:white;padding:11px;border-radius:8px;text-align:center;font-size:13px;font-weight:700">Expédier avec Yalidine →</div></div>`,
  },
  {
    title: "Suivi livraisons · Temps réel",
    html: `<div style="display:flex;flex-direction:column;gap:8px"><div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surface);border:1.5px solid var(--border);border-radius:8px;font-size:12px"><span style="color:var(--muted);font-family:monospace">YLD-884521</span><span style="font-weight:600;color:var(--text)">Alger · Leila R.</span><span style="padding:3px 9px;border-radius:100px;background:#DCFCE7;color:#15803D;font-size:10px;font-weight:700">Livré</span></div><div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surface);border:1.5px solid var(--border);border-radius:8px;font-size:12px"><span style="color:var(--muted);font-family:monospace">YLD-884490</span><span style="font-weight:600;color:var(--text)">Oran · Karim M.</span><span style="padding:3px 9px;border-radius:100px;background:var(--blue-light);color:var(--blue);font-size:10px;font-weight:700">En transit</span></div><div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surface);border:1.5px solid var(--border);border-radius:8px;font-size:12px"><span style="color:var(--muted);font-family:monospace">ZR-21033</span><span style="font-weight:600;color:var(--text)">Constantine · Nadia B.</span><span style="padding:3px 9px;border-radius:100px;background:#FEF3C7;color:#A16207;font-size:10px;font-weight:700">En livraison</span></div><div style="display:flex;align-items:center;justify-content:space-between;padding:10px 12px;background:var(--surface);border:1.5px solid var(--border);border-radius:8px;font-size:12px"><span style="color:var(--muted);font-family:monospace">YLD-883901</span><span style="font-weight:600;color:var(--text)">Sétif · Ahmed T.</span><span style="padding:3px 9px;border-radius:100px;background:var(--surface);color:var(--muted);font-size:10px;font-weight:700">Préparation</span></div></div>`,
  },
];

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [lang, setLang] = useState<Lang>("dz");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  // Persist preferences
  useEffect(() => {
    const savedLang = localStorage.getItem("flowd_lang3") as Lang | null;
    if (savedLang && ["dz", "fr", "en"].includes(savedLang)) setLang(savedLang);
    const savedTheme = localStorage.getItem("flowd_theme") as "light" | "dark" | null;
    if (savedTheme) setTheme(savedTheme);
  }, []);

  useEffect(() => {
    localStorage.setItem("flowd_lang3", lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("flowd_theme", theme);
  }, [theme]);

  // AOS scroll reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("visible"); }),
      { threshold: 0.08 }
    );
    document.querySelectorAll(".aos").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [lang]);

  const t = T[lang];

  function closeMenu() {
    setMenuOpen(false);
    setLangOpen(false);
  }

  const navLinks = [
    { href: "#features", label: t.nav.features },
    { href: "#how", label: t.nav.how },
    { href: "#integrations", label: t.nav.integrations },
    { href: "#pricing", label: t.nav.pricing },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

        /* ── LIGHT VARIABLES (default) ── */
        :root{
          --blue:#0052FF;--blue-dark:#0040CC;--blue-light:#EBF0FF;--blue-mid:#D0DCFF;
          --black:#121212;--white:#ffffff;--surface:#F4F7FF;--border:#E2E8F8;--border2:#C5D0EF;
          --text:#121212;--muted:#6B7A99;--muted2:#94A3C0;--card-bg:#ffffff;
          --font:'Inter',system-ui,sans-serif;
        }

        /* ── DARK VARIABLES ── */
        [data-theme="dark"]{
          --blue:#3b8eff;--blue-dark:#2a7aff;--blue-light:#0d1d3a;--blue-mid:#102545;
          --black:#e8ecf5;--white:#0d1117;--surface:#161c2c;--border:#1e2a3d;--border2:#2a3d5e;
          --text:#e8ecf5;--muted:#8b9ab8;--muted2:#5b6a8a;--card-bg:#1a2235;
        }

        html{scroll-behavior:smooth}
        body{background:var(--white);color:var(--text);font-family:var(--font);font-size:16px;line-height:1.6;overflow-x:hidden;-webkit-font-smoothing:antialiased}

        /* ── DARK MODE OVERRIDES ── */
        [data-theme="dark"] nav{
          background:rgba(13,17,23,0.95)!important;
          border-bottom-color:rgba(255,255,255,0.08)!important;
        }
        [data-theme="dark"] .nav-logo-text{color:var(--text)!important}
        [data-theme="dark"] .hamburger span{background:var(--text)!important}
        [data-theme="dark"] .mobile-menu{background:#0d1117!important}
        [data-theme="dark"] .mobile-menu a{color:var(--text)!important}
        [data-theme="dark"] .hero{background:#0d1117!important}
        [data-theme="dark"] .logos{background:#111827!important;border-color:rgba(255,255,255,0.06)!important}
        [data-theme="dark"] .how-section{background:#111827!important;border-color:rgba(255,255,255,0.06)!important}
        [data-theme="dark"] .how-visual{background:#161c2c!important}
        [data-theme="dark"] .vis-header{background:#111827!important;border-color:#1e2a3d!important}
        [data-theme="dark"] .browser-frame{background:#1a2235!important}
        [data-theme="dark"] .browser-bar{background:#0d1117!important;border-color:#1e2a3d!important}
        [data-theme="dark"] .browser-url{background:#111827!important;border-color:#1e2a3d!important;color:var(--muted)!important}
        [data-theme="dark"] .dash-sidebar{background:#080d18!important}
        [data-theme="dark"] .dash-main{background:#111827!important}
        [data-theme="dark"] .metric{background:#1a2235!important}
        [data-theme="dark"] .dcard{background:#1a2235!important}
        [data-theme="dark"] .ws-badge{background:#1a2235!important;border-color:#2a3d5e!important}
        [data-theme="dark"] .feat-card{background:#161c2c!important}
        [data-theme="dark"] .feat-grid{background:var(--border)!important;border-color:var(--border)!important}
        [data-theme="dark"] .int-card{background:#1a2235!important}
        [data-theme="dark"] .pcard{background:#1a2235!important}
        [data-theme="dark"] .pcard.featured{background:linear-gradient(160deg,#0d1d3a 0%,#1a2235 50%)!important}
        [data-theme="dark"] .pb-outline{border-color:#2a3d5e!important;color:var(--text)!important}
        [data-theme="dark"] .pb-outline:hover{border-color:var(--blue)!important;color:var(--blue)!important}
        [data-theme="dark"] .tcard{background:#161c2c!important;border-color:#1e2a3d!important}
        [data-theme="dark"] .pricing-section{background:#111827!important;border-color:rgba(255,255,255,0.06)!important}
        [data-theme="dark"] .cta-section{background:#060b16!important}
        [data-theme="dark"] footer{background:#060b16!important;border-top-color:rgba(255,255,255,0.07)!important}
        [data-theme="dark"] .footer-logo-txt{color:white!important}
        [data-theme="dark"] .footer-copy{color:rgba(255,255,255,0.3)!important}
        [data-theme="dark"] .footer-links a{color:rgba(255,255,255,0.35)!important}
        [data-theme="dark"] .step{border-color:#1e2a3d!important}
        [data-theme="dark"] .step-num{background:#1a2235!important;border-color:#2a3d5e!important}
        [data-theme="dark"] .step.active .step-num{background:var(--blue)!important;border-color:var(--blue)!important}
        [data-theme="dark"] .plan-divider{border-color:#1e2a3d!important}
        [data-theme="dark"] .orow{border-color:#1e2a3d!important}
        [data-theme="dark"] .int-card:hover{border-color:var(--blue)!important}
        [data-theme="dark"] .tcard:hover{border-color:var(--blue-mid)!important}

        /* ── NAV ── */
        nav{position:fixed;top:0;left:0;right:0;z-index:200;display:flex;align-items:center;justify-content:space-between;padding:0 56px;height:68px;background:rgba(255,255,255,0.93);backdrop-filter:blur(16px);border-bottom:1px solid var(--border);transition:background .3s}
        .nav-logo{display:flex;align-items:center;gap:10px;text-decoration:none;z-index:201}
        .nav-logo-text{font-size:20px;font-weight:800;color:var(--black);letter-spacing:-0.03em}
        .nav-links{display:flex;align-items:center;gap:36px;list-style:none}
        .nav-links a{color:var(--muted);text-decoration:none;font-size:14px;font-weight:500;transition:color .18s}
        .nav-links a:hover{color:var(--black)}
        .nav-actions{display:flex;align-items:center;gap:8px}
        .hamburger{display:none;flex-direction:column;gap:5px;cursor:pointer;padding:8px;z-index:201;background:none;border:none}
        .hamburger span{display:block;width:22px;height:2px;background:var(--black);border-radius:2px;transition:all .25s}
        .hamburger.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}
        .hamburger.open span:nth-child(2){opacity:0}
        .hamburger.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
        .mobile-menu{display:none;position:fixed;inset:0;background:var(--white);z-index:199;flex-direction:column;align-items:center;justify-content:center;gap:28px;opacity:0;transition:opacity .25s;padding:20px}
        .mobile-menu.open{opacity:1}
        .mobile-menu a{font-size:22px;font-weight:700;color:var(--text);text-decoration:none;letter-spacing:-0.02em}
        .mobile-menu a:hover{color:var(--blue)}
        .mobile-menu-actions{display:flex;flex-direction:column;gap:12px;align-items:stretch;width:100%;max-width:280px;margin-top:8px}

        /* Lang switcher */
        .lang-btn{display:flex;align-items:center;gap:5px;background:transparent;border:1.5px solid var(--border2);border-radius:7px;padding:7px 11px;cursor:pointer;color:var(--muted);font-size:13px;font-weight:500;font-family:var(--font);transition:all .18s}
        .lang-btn:hover{border-color:var(--blue);color:var(--blue);background:var(--blue-light)}
        .lang-dropdown{position:absolute;top:calc(100% + 8px);right:0;background:var(--white);border:1.5px solid var(--border);border-radius:10px;overflow:hidden;min-width:140px;box-shadow:0 12px 40px rgba(0,0,0,.12);z-index:300}
        [data-theme="dark"] .lang-dropdown{background:#1a2235;border-color:#2a3d5e;box-shadow:0 12px 40px rgba(0,0,0,.5)}
        .lang-option{width:100%;display:flex;align-items:center;gap:10px;padding:10px 14px;background:none;border:none;cursor:pointer;color:var(--muted);font-size:13px;font-weight:400;font-family:var(--font);text-align:left;transition:background .15s}
        .lang-option:hover,.lang-option.active{background:var(--blue-light);color:var(--blue)}
        .lang-option.active{font-weight:700}

        /* Theme toggle */
        .theme-btn{display:flex;align-items:center;justify-content:center;width:36px;height:36px;border-radius:8px;border:1.5px solid var(--border2);cursor:pointer;background:transparent;font-size:16px;transition:all .18s;line-height:1}
        .theme-btn:hover{background:var(--surface);border-color:var(--blue)}

        /* ── BUTTONS ── */
        .btn{display:inline-flex;align-items:center;gap:8px;text-decoration:none;border-radius:8px;font-family:var(--font);font-weight:600;font-size:14px;cursor:pointer;transition:all .18s;border:none}
        .btn-ghost{background:transparent;color:var(--text);padding:9px 18px;border:1.5px solid var(--border2)}
        .btn-ghost:hover{background:var(--surface);border-color:var(--blue);color:var(--blue)}
        .btn-primary{background:var(--blue);color:#fff;padding:10px 22px}
        .btn-primary:hover{background:var(--blue-dark);transform:translateY(-1px);box-shadow:0 4px 16px rgba(0,82,255,.3)}
        .btn-primary-lg{padding:14px 32px;font-size:16px;border-radius:10px}
        .btn-outline-lg{background:transparent;color:var(--blue);padding:14px 32px;font-size:16px;border:1.5px solid var(--blue);border-radius:10px;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:8px;transition:all .18s}
        .btn-outline-lg:hover{background:var(--blue-light)}

        /* ── HERO ── */
        .hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:100px 24px 80px;background:var(--white);position:relative;overflow:hidden}
        .hero::before{content:'';position:absolute;inset:0;background-image:linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px);background-size:64px 64px;opacity:.4;pointer-events:none}
        .hero::after{content:'';position:absolute;width:800px;height:500px;border-radius:50%;background:radial-gradient(ellipse,rgba(0,82,255,.08) 0%,transparent 70%);top:20%;left:50%;transform:translateX(-50%);pointer-events:none}
        .hero-badge{display:inline-flex;align-items:center;gap:8px;background:var(--blue-light);border:1px solid var(--blue-mid);border-radius:100px;padding:6px 16px;font-size:13px;font-weight:600;color:var(--blue);margin-bottom:32px;position:relative;z-index:1;animation:fadeUp .5s ease both}
        .badge-pulse{width:7px;height:7px;border-radius:50%;background:var(--blue);animation:pulse 2s ease infinite;flex-shrink:0}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.7)}}
        .hero h1{font-size:clamp(40px,6.5vw,88px);font-weight:900;line-height:1.0;letter-spacing:-0.04em;max-width:820px;position:relative;z-index:1;animation:fadeUp .5s ease .1s both;color:var(--text)}
        .hero h1 .blue{color:var(--blue)}
        .hero-sub{margin-top:24px;font-size:18px;color:var(--muted);max-width:520px;line-height:1.7;font-weight:400;position:relative;z-index:1;animation:fadeUp .5s ease .2s both}
        .hero-actions{margin-top:40px;display:flex;align-items:center;gap:14px;position:relative;z-index:1;animation:fadeUp .5s ease .3s both;flex-wrap:wrap;justify-content:center}
        .hero-note{margin-top:14px;font-size:13px;color:var(--muted2);position:relative;z-index:1;animation:fadeUp .5s ease .35s both}

        /* ── DASHBOARD MOCKUP ── */
        .hero-visual{margin-top:72px;width:100%;max-width:1080px;position:relative;z-index:1;animation:fadeUp .7s ease .4s both}
        .browser-frame{background:var(--white);border:1.5px solid var(--border);border-radius:16px;overflow:hidden;box-shadow:0 24px 80px rgba(0,82,255,.1),0 4px 24px rgba(18,18,18,.08)}
        .browser-bar{display:flex;align-items:center;gap:8px;padding:13px 20px;background:var(--surface);border-bottom:1px solid var(--border)}
        .b-dot{width:11px;height:11px;border-radius:50%}
        .b1{background:#FF5F57}.b2{background:#FEBC2E}.b3{background:#28C840}
        .browser-url{margin-left:12px;background:var(--white);border:1px solid var(--border);border-radius:6px;padding:5px 16px;font-size:12px;color:var(--muted)}
        .dash-layout{display:grid;grid-template-columns:220px 1fr;min-height:380px}
        .dash-sidebar{background:#121212;padding:20px 0;display:flex;flex-direction:column}
        .dash-sidebar-logo{display:flex;align-items:center;gap:10px;padding:0 20px 20px;border-bottom:1px solid rgba(255,255,255,.07);margin-bottom:12px}
        .dash-sidebar-logo-text{font-size:16px;font-weight:800;color:white;letter-spacing:-0.03em}
        .snav{display:flex;align-items:center;gap:10px;padding:9px 20px;font-size:13px;font-weight:500;color:rgba(255,255,255,.4);cursor:pointer;transition:all .15s;border-left:2px solid transparent}
        .snav.active{color:white;background:rgba(255,255,255,.06);border-left-color:var(--blue)}
        .snav svg{width:15px;height:15px;flex-shrink:0}
        .dash-main{background:var(--surface);padding:24px}
        .dash-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
        .dash-topbar-title{font-size:18px;font-weight:700;letter-spacing:-0.02em;color:var(--text)}
        .ws-badge{display:flex;align-items:center;gap:6px;background:var(--white);border:1px solid var(--border);border-radius:6px;padding:6px 12px;font-size:12px;color:var(--muted);font-weight:500}
        .ws-dot{width:7px;height:7px;border-radius:50%;background:#22C55E}
        .metrics{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:16px}
        .metric{background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px}
        .metric-lbl{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px}
        .metric-val{font-size:22px;font-weight:800;letter-spacing:-0.03em;color:var(--text)}
        .metric-delta{font-size:11px;color:#22C55E;font-weight:600;margin-top:4px}
        .metric-delta.blue{color:var(--blue)}
        .dash-cards{display:grid;grid-template-columns:1fr .85fr;gap:10px}
        .dcard{background:var(--white);border:1px solid var(--border);border-radius:10px;padding:16px}
        .dcard-title{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em;margin-bottom:12px;font-weight:600}
        .orow{display:flex;align-items:center;justify-content:space-between;padding:7px 0;border-bottom:1px solid var(--border);font-size:12px}
        .orow:last-child{border:none}
        .oname{font-weight:600;color:var(--text)}
        .owil{font-size:11px;color:var(--muted);margin-top:1px}
        .sbadge{font-size:10px;font-weight:600;padding:3px 9px;border-radius:100px}
        .sb-conf{background:#DCFCE7;color:#15803D}.sb-ship{background:var(--blue-light);color:var(--blue)}.sb-pend{background:#FEF9C3;color:#A16207}
        .cbubble{display:inline-block;padding:8px 12px;border-radius:10px;font-size:12px;line-height:1.5;max-width:90%;margin-bottom:8px}
        .cb-user{background:var(--surface);border:1px solid var(--border);color:var(--text);margin-left:auto;display:block}
        .cb-bot{background:var(--blue);color:white}
        .cb-label{font-size:10px;color:var(--muted2);margin-bottom:3px}
        .cursor-blink{display:inline-block;width:2px;height:12px;background:white;animation:blink 1s step-end infinite;margin-left:2px;vertical-align:middle}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}

        /* ── LOGOS ── */
        .logos{background:var(--surface);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:48px 56px;text-align:center}
        .logos-ttl{font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:var(--muted2);font-weight:600;margin-bottom:32px}
        .logos-row{display:flex;align-items:center;justify-content:center;gap:48px;flex-wrap:wrap}
        .lpill{display:flex;align-items:center;gap:8px;font-size:14px;font-weight:600;color:var(--muted);opacity:.65;transition:opacity .2s;cursor:default}
        .lpill:hover{opacity:1}
        .lico{width:30px;height:30px;border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:15px}

        /* ── SECTIONS ── */
        .section{padding:100px 56px;max-width:1200px;margin:0 auto}
        .section-tag{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--blue);margin-bottom:20px}
        .section-tag::before{content:'';width:18px;height:2px;background:var(--blue);border-radius:1px}
        .section-h{font-size:clamp(28px,4vw,50px);font-weight:900;letter-spacing:-0.04em;line-height:1.05;max-width:540px;color:var(--text)}
        .section-sub{font-size:17px;color:var(--muted);font-weight:400;max-width:480px;margin-top:16px;line-height:1.7}
        .feat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border);border:1.5px solid var(--border);border-radius:16px;overflow:hidden;margin-top:64px}
        .feat-card{background:var(--white);padding:40px 32px;transition:background .2s;cursor:default}
        .feat-card:hover{background:var(--surface)}
        .feat-icon{width:48px;height:48px;border-radius:12px;display:flex;align-items:center;justify-content:center;margin-bottom:22px;font-size:22px}
        .fi-blue{background:var(--blue-light)}.fi-dark{background:#EEF0F4}.fi-green{background:#DCFCE7}.fi-orange{background:#FEF3C7}.fi-purple{background:#F3E8FF}.fi-red{background:#FEE2E2}
        [data-theme="dark"] .fi-dark{background:#1a2235}
        [data-theme="dark"] .fi-green{background:#0d2218}
        [data-theme="dark"] .fi-orange{background:#221a08}
        [data-theme="dark"] .fi-purple{background:#1a1030}
        [data-theme="dark"] .fi-red{background:#2a1020}
        .feat-title{font-size:16px;font-weight:700;letter-spacing:-0.02em;margin-bottom:10px;color:var(--text)}
        .feat-desc{font-size:14px;color:var(--muted);line-height:1.65}

        /* ── HOW IT WORKS ── */
        .how-section{background:var(--surface);border-top:1px solid var(--border);border-bottom:1px solid var(--border);padding:100px 56px}
        .how-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:start}
        .steps{display:flex;flex-direction:column;margin-top:48px}
        .step{display:flex;gap:18px;padding:24px 0;border-bottom:1px solid var(--border);cursor:pointer}
        .step:first-child{padding-top:0}.step:last-child{border:none}
        .step-num{width:30px;height:30px;border-radius:50%;border:1.5px solid var(--border2);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;color:var(--muted);flex-shrink:0;transition:all .2s;background:var(--white)}
        .step.active .step-num{background:var(--blue);border-color:var(--blue);color:white}
        .step-content{flex:1}
        .step-title{font-size:15px;font-weight:700;color:var(--muted);margin-bottom:6px;transition:color .2s;letter-spacing:-0.01em}
        .step.active .step-title{color:var(--text)}
        .step-desc{font-size:13px;color:var(--muted2);line-height:1.65;max-height:0;overflow:hidden;transition:max-height .3s ease}
        .step.active .step-desc{max-height:80px}
        .how-visual{background:var(--white);border:1.5px solid var(--border);border-radius:16px;overflow:hidden;min-height:400px;box-shadow:0 8px 32px rgba(0,82,255,.06);position:sticky;top:90px}
        .vis-header{padding:14px 20px;border-bottom:1px solid var(--border);font-size:12px;font-weight:600;color:var(--muted);background:var(--surface);display:flex;align-items:center;justify-content:space-between;text-transform:uppercase;letter-spacing:.08em}
        .vis-live{display:flex;align-items:center;gap:6px;color:#22C55E;font-size:11px}
        .live-dot{width:6px;height:6px;border-radius:50%;background:#22C55E;animation:pulse 2s ease infinite}
        .vis-body{padding:24px}

        /* ── INTEGRATIONS ── */
        .int-section{padding:100px 56px;text-align:center}
        .int-inner{max-width:1100px;margin:0 auto}
        .int-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-top:60px}
        .int-card{background:var(--white);border:1.5px solid var(--border);border-radius:14px;padding:28px 16px;display:flex;flex-direction:column;align-items:center;gap:10px;transition:all .2s;cursor:default}
        .int-card:hover{border-color:var(--blue);transform:translateY(-3px);box-shadow:0 8px 24px rgba(0,82,255,.1)}
        .int-ico{width:42px;height:42px;border-radius:11px;display:flex;align-items:center;justify-content:center;font-size:20px}
        .int-name{font-size:12px;font-weight:600;color:var(--muted)}

        /* ── PRICING ── */
        .pricing-section{background:var(--surface);border-top:1px solid var(--border);padding:100px 56px}
        .pricing-inner{max-width:1000px;margin:0 auto;text-align:center}
        .pricing-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px;margin-top:60px;text-align:left}
        .pcard{background:var(--white);border:1.5px solid var(--border);border-radius:16px;padding:36px;position:relative;transition:box-shadow .2s}
        .pcard:hover{box-shadow:0 8px 32px rgba(0,82,255,.08)}
        .pcard.featured{border-color:var(--blue);background:linear-gradient(160deg,var(--blue-light) 0%,var(--white) 50%)}
        .pop-badge{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--blue);color:white;font-size:11px;font-weight:700;padding:4px 16px;border-radius:100px;white-space:nowrap}
        .plan-name{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin-bottom:14px}
        .plan-price{font-size:40px;font-weight:900;letter-spacing:-0.04em;line-height:1;margin-bottom:4px;color:var(--text)}
        .plan-price sub{font-size:15px;font-weight:500;color:var(--muted)}
        .plan-tagline{font-size:13px;color:var(--muted);margin-bottom:28px;line-height:1.5}
        .plan-divider{border:none;border-top:1px solid var(--border);margin:0 0 24px}
        .plan-feat{display:flex;align-items:flex-start;gap:10px;font-size:13px;color:var(--muted);margin-bottom:10px;line-height:1.5}
        .ck{color:var(--blue);font-size:14px;flex-shrink:0;margin-top:1px;font-weight:700}
        .plan-btn{display:block;width:100%;text-align:center;margin-top:28px;padding:12px;border-radius:9px;font-size:14px;font-weight:700;text-decoration:none;transition:all .18s}
        .pb-outline{border:1.5px solid var(--border2);color:var(--text);background:transparent}
        .pb-outline:hover{border-color:var(--blue);color:var(--blue)}
        .pb-solid{background:var(--blue);color:white;border:none}
        .pb-solid:hover{background:var(--blue-dark);box-shadow:0 4px 16px rgba(0,82,255,.3)}

        /* ── TESTIMONIALS ── */
        .testi-section{padding:100px 56px}
        .testi-inner{max-width:1100px;margin:0 auto}
        .testi-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:60px}
        .tcard{background:var(--surface);border:1.5px solid var(--border);border-radius:16px;padding:32px;transition:border-color .2s}
        .tcard:hover{border-color:var(--blue-mid)}
        .tquote{font-size:15px;line-height:1.75;color:var(--text);margin-bottom:24px}
        .tquote em{font-style:normal;font-weight:700;color:var(--blue)}
        .tauthor{display:flex;align-items:center;gap:12px}
        .tavatar{width:38px;height:38px;border-radius:50%;color:white;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex-shrink:0}
        .tname{font-size:14px;font-weight:700;letter-spacing:-0.01em;color:var(--text)}
        .tmeta{font-size:12px;color:var(--muted)}

        /* ── CTA ── */
        .cta-section{background:#121212;padding:100px 56px;text-align:center;position:relative;overflow:hidden}
        .cta-section::before{content:'';position:absolute;width:700px;height:400px;border-radius:50%;background:radial-gradient(ellipse,rgba(0,82,255,.25) 0%,transparent 70%);top:50%;left:50%;transform:translate(-50%,-50%);pointer-events:none}
        .cta-inner{position:relative;z-index:1}
        .cta-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(0,82,255,.15);border:1px solid rgba(0,82,255,.3);border-radius:100px;padding:6px 16px;font-size:13px;font-weight:600;color:#6699FF;margin-bottom:32px}
        .cta-h{font-size:clamp(32px,5vw,68px);font-weight:900;letter-spacing:-0.04em;line-height:1.04;color:white;max-width:680px;margin:0 auto 20px}
        .cta-h .blue-hl{color:var(--blue)}
        .cta-sub{color:rgba(255,255,255,.5);font-size:18px;font-weight:400;max-width:440px;margin:0 auto 44px}
        .cta-actions{display:flex;align-items:center;justify-content:center;gap:14px;flex-wrap:wrap}
        .btn-cta-p{background:var(--blue);color:white;padding:16px 36px;border-radius:10px;font-size:16px;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:8px;transition:all .18s}
        .btn-cta-p:hover{background:var(--blue-dark);box-shadow:0 8px 32px rgba(0,82,255,.4);transform:translateY(-2px)}
        .btn-cta-g{background:transparent;color:rgba(255,255,255,.6);padding:16px 32px;border-radius:10px;font-size:16px;font-weight:600;text-decoration:none;border:1.5px solid rgba(255,255,255,.15);transition:all .18s}
        .btn-cta-g:hover{color:white;border-color:rgba(255,255,255,.35)}

        /* ── FOOTER ── */
        footer{background:#121212;border-top:1px solid rgba(255,255,255,.07);padding:32px 56px;display:flex;align-items:center;justify-content:space-between;font-size:13px;flex-wrap:wrap;gap:16px}
        .footer-logo{display:flex;align-items:center;gap:10px}
        .footer-logo-txt{font-size:17px;font-weight:800;color:white;letter-spacing:-0.03em}
        .footer-copy{color:rgba(255,255,255,.3)}
        .footer-links{display:flex;gap:24px}
        .footer-links a{color:rgba(255,255,255,.35);text-decoration:none;transition:color .18s}
        .footer-links a:hover{color:rgba(255,255,255,.7)}

        /* ── ANIMATIONS ── */
        @keyframes fadeUp{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:translateY(0)}}
        .aos{opacity:0;transform:translateY(24px);transition:opacity .6s ease,transform .6s ease}
        .aos.visible{opacity:1;transform:translateY(0)}
        .aos-d1{transition-delay:.1s}

        /* ── TABLET ≤ 1024px ── */
        @media(max-width:1024px){
          nav{padding:0 32px}
          .logos,.section,.how-section,.int-section,.pricing-section,.testi-section,.cta-section{padding-left:32px;padding-right:32px}
          footer{padding:28px 32px}
          .feat-grid{grid-template-columns:repeat(2,1fr)}
          .how-inner{grid-template-columns:1fr;gap:40px}
          .how-visual{position:relative;top:0;min-height:300px}
          .steps{margin-top:32px}
          .int-grid{grid-template-columns:repeat(4,1fr)}
          .pricing-grid{grid-template-columns:1fr 1fr;gap:16px}
          .pricing-grid .pcard:last-child{grid-column:span 2}
          .testi-grid{grid-template-columns:1fr 1fr}
          .testi-grid .tcard:last-child{grid-column:span 2}
        }

        /* ── MOBILE ≤ 768px ── */
        @media(max-width:768px){
          nav{padding:0 20px;height:60px}
          .nav-links,.nav-actions{display:none}
          .hamburger{display:flex}
          .mobile-menu{display:flex}
          .hero{padding:80px 20px 56px}
          .hero h1{font-size:clamp(34px,9vw,48px);letter-spacing:-0.03em}
          .hero-sub{font-size:16px;max-width:100%}
          .hero-badge{font-size:12px;padding:5px 14px}
          .hero-actions{flex-direction:column;align-items:stretch;width:100%;max-width:300px}
          .btn-primary-lg,.btn-outline-lg{justify-content:center;padding:13px 20px;font-size:15px;width:100%}
          .hero-visual{margin-top:48px}
          .browser-url{display:none}
          .dash-layout{grid-template-columns:1fr}
          .dash-sidebar{display:none}
          .dash-main{padding:16px}
          .dash-topbar-title{font-size:14px}
          .ws-badge{font-size:11px;padding:4px 9px}
          .metrics{grid-template-columns:1fr 1fr;gap:8px}
          .metric{padding:12px}
          .metric-val{font-size:18px}
          .metric-lbl{font-size:10px}
          .metric-delta{font-size:10px}
          .dash-cards{grid-template-columns:1fr}
          .logos{padding:32px 20px}
          .logos-row{gap:16px}
          .lpill{font-size:12px}
          .lico{width:26px;height:26px;font-size:13px}
          .section{padding:64px 20px}
          .section-h{font-size:clamp(24px,7vw,34px)}
          .section-sub{font-size:15px}
          .feat-grid{grid-template-columns:1fr;margin-top:36px}
          .feat-card{padding:24px 20px}
          .how-section{padding:64px 20px}
          .how-inner{gap:32px}
          .steps{margin-top:24px}
          .how-visual{min-height:260px}
          .vis-body{padding:16px}
          .int-section{padding:64px 20px}
          .int-grid{grid-template-columns:repeat(2,1fr);gap:10px;margin-top:36px}
          .int-card{padding:20px 12px}
          .int-ico{width:36px;height:36px;font-size:18px}
          .pricing-section{padding:64px 20px}
          .pricing-grid{grid-template-columns:1fr;margin-top:36px}
          .pricing-grid .pcard:last-child{grid-column:auto}
          .pcard{padding:24px 20px}
          .plan-price{font-size:32px}
          .testi-section{padding:64px 20px}
          .testi-grid{grid-template-columns:1fr;margin-top:36px}
          .testi-grid .tcard:last-child{grid-column:auto}
          .tcard{padding:22px 18px}
          .tquote{font-size:14px}
          .cta-section{padding:64px 20px}
          .cta-sub{font-size:16px}
          .cta-actions{flex-direction:column;align-items:stretch;max-width:300px;margin:0 auto;gap:12px}
          .btn-cta-p,.btn-cta-g{padding:14px 20px;font-size:15px;width:100%;justify-content:center}
          footer{padding:24px 20px;flex-direction:column;align-items:flex-start;gap:16px}
          .footer-copy{font-size:12px}
        }

        @media(max-width:400px){
          .hero h1{font-size:32px}
          .metrics{grid-template-columns:1fr 1fr}
          .int-grid{grid-template-columns:1fr 1fr}
          .cta-badge{font-size:11px;padding:5px 12px;text-align:center}
        }
      `}</style>

      {/* ROOT WRAPPER with theme */}
      <div data-theme={theme}>

        {/* ── NAV ── */}
        <nav>
          <Link href="/landing" className="nav-logo">
            <FlowdLogo fill={theme === "dark" ? "white" : "#0052FF"} size={36} />
            <span className="nav-logo-text">Flowd</span>
          </Link>

          <ul className="nav-links">
            {navLinks.map((l) => (
              <li key={l.href}><a href={l.href}>{l.label}</a></li>
            ))}
          </ul>

          <div className="nav-actions">
            {/* Lang switcher */}
            <div style={{ position: "relative" }}>
              <button
                className="lang-btn"
                onClick={() => setLangOpen(!langOpen)}
                aria-label="Change language"
              >
                {LANG_OPTIONS.find((o) => o.code === lang)?.flag}&nbsp;{lang.toUpperCase()}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ transform: langOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}>
                  <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {langOpen && (
                <div className="lang-dropdown">
                  {LANG_OPTIONS.map((opt) => (
                    <button
                      key={opt.code}
                      className={`lang-option${lang === opt.code ? " active" : ""}`}
                      onClick={() => { setLang(opt.code); setLangOpen(false); }}
                    >
                      {opt.flag} {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button
              className="theme-btn"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label="Toggle dark mode"
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>

            <Link href="/login" className="btn btn-ghost">{t.nav.login}</Link>
            <Link href="/login?tab=signup" className="btn btn-primary">{t.nav.cta}</Link>
          </div>

          {/* Hamburger */}
          <button
            className={`hamburger${menuOpen ? " open" : ""}`}
            id="hamburger"
            aria-label="Open menu"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span /><span /><span />
          </button>
        </nav>

        {/* ── MOBILE MENU ── */}
        <div className={`mobile-menu${menuOpen ? " open" : ""}`} onClick={() => setMenuOpen(false)}>
          {navLinks.map((l) => (
            <a key={l.href} href={l.href} onClick={closeMenu}>{l.label}</a>
          ))}
          {/* Mobile lang + theme */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {LANG_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                onClick={(e) => { e.stopPropagation(); setLang(opt.code); }}
                style={{
                  background: lang === opt.code ? "var(--blue-light)" : "transparent",
                  border: `1.5px solid ${lang === opt.code ? "var(--blue)" : "var(--border2)"}`,
                  borderRadius: 8, padding: "6px 12px", cursor: "pointer",
                  fontSize: 13, fontWeight: lang === opt.code ? 700 : 500,
                  color: lang === opt.code ? "var(--blue)" : "var(--muted)", fontFamily: "var(--font)",
                }}
              >
                {opt.flag} {opt.label}
              </button>
            ))}
            <button
              className="theme-btn"
              onClick={(e) => { e.stopPropagation(); setTheme(theme === "light" ? "dark" : "light"); }}
              aria-label="Toggle dark mode"
            >
              {theme === "light" ? "🌙" : "☀️"}
            </button>
          </div>
          <div className="mobile-menu-actions">
            <Link href="/login" className="btn btn-ghost" style={{ fontSize: 15, padding: "12px 24px", justifyContent: "center" }} onClick={closeMenu}>
              {t.nav.login}
            </Link>
            <Link href="/login?tab=signup" className="btn btn-primary" style={{ fontSize: 15, padding: "12px 24px", justifyContent: "center" }} onClick={closeMenu}>
              {t.nav.cta}
            </Link>
          </div>
        </div>

        {/* ── HERO ── */}
        <section className="hero" onClick={() => setLangOpen(false)}>
          <div className="hero-badge"><span className="badge-pulse" />{t.hero.badge}</div>
          <h1>
            {t.hero.h1a}<br />
            <span className="blue">{t.hero.h1b}</span>
          </h1>
          <p className="hero-sub">{t.hero.sub}</p>
          <div className="hero-actions">
            <Link href="/login?tab=signup" className="btn btn-primary btn-primary-lg">
              {t.hero.cta}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            </Link>
            <a href="#how" className="btn-outline-lg">{t.hero.demo}</a>
          </div>
          <p className="hero-note">{t.hero.note}</p>

          {/* Dashboard mockup */}
          <div className="hero-visual">
            <div className="browser-frame">
              <div className="browser-bar">
                <div className="b-dot b1" /><div className="b-dot b2" /><div className="b-dot b3" />
                <div className="browser-url">app.flowd.dz/dashboard</div>
              </div>
              <div className="dash-layout">
                <div className="dash-sidebar">
                  <div className="dash-sidebar-logo">
                    <FlowdLogo fill="white" size={28} />
                    <span className="dash-sidebar-logo-text">Flowd</span>
                  </div>
                  <div className="snav active">
                    <svg viewBox="0 0 15 15" fill="none"><rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="1" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" /><rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" /></svg>
                    Dashboard
                  </div>
                  <div className="snav">
                    <svg viewBox="0 0 15 15" fill="none"><path d="M1.5 3h12M1.5 7.5h8M1.5 12h10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                    Orders
                  </div>
                  <div className="snav">
                    <svg viewBox="0 0 15 15" fill="none"><path d="M7.5 1C4.46 1 2 3.46 2 6.5c0 1.6.7 3.04 1.81 4.05L2 13l2.61-1.17A5.46 5.46 0 007.5 12c3.04 0 5.5-2.46 5.5-5.5S10.54 1 7.5 1z" stroke="currentColor" strokeWidth="1.3" /></svg>
                    Chatbot
                  </div>
                  <div className="snav">
                    <svg viewBox="0 0 15 15" fill="none"><path d="M2.5 6a5 5 0 0110 0v5.5a1 1 0 01-1 1h-8a1 1 0 01-1-1V6z" stroke="currentColor" strokeWidth="1.3" /><path d="M5 6V4a2.5 2.5 0 015 0v2" stroke="currentColor" strokeWidth="1.3" /></svg>
                    Delivery
                  </div>
                  <div className="snav" style={{ marginTop: "auto" }}>
                    <svg viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.3" /><path d="M1.5 13c0-2.76 2.69-5 6-5s6 2.24 6 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
                    Settings
                  </div>
                </div>
                <div className="dash-main">
                  <div className="dash-topbar">
                    <div className="dash-topbar-title">Dashboard</div>
                    <div className="ws-badge"><div className="ws-dot" />Mon Workspace · Alger</div>
                  </div>
                  <div className="metrics">
                    <div className="metric"><div className="metric-lbl">Orders today</div><div className="metric-val">147</div><div className="metric-delta">↑ 12% vs hier</div></div>
                    <div className="metric"><div className="metric-lbl">Revenue (DA)</div><div className="metric-val">384K</div><div className="metric-delta">↑ 8% cette semaine</div></div>
                    <div className="metric"><div className="metric-lbl">Delivered</div><div className="metric-val">89%</div><div className="metric-delta">Rate ce mois</div></div>
                    <div className="metric"><div className="metric-lbl">AI chats</div><div className="metric-val">24</div><div className="metric-delta blue">↑ Tout géré</div></div>
                  </div>
                  <div className="dash-cards">
                    <div className="dcard">
                      <div className="dcard-title">Recent orders</div>
                      <div className="orow"><div><div className="oname">Amira Benali</div><div className="owil">Alger · Instagram</div></div><div className="sbadge sb-conf">Confirmed</div></div>
                      <div className="orow"><div><div className="oname">Yacine Hadj</div><div className="owil">Oran · Messenger</div></div><div className="sbadge sb-ship">Shipped</div></div>
                      <div className="orow"><div><div className="oname">Selma Kaci</div><div className="owil">Constantine · Manuel</div></div><div className="sbadge sb-pend">Pending</div></div>
                    </div>
                    <div className="dcard">
                      <div className="dcard-title">AI Chatbot · Live</div>
                      <div style={{ marginBottom: 4 }}><div className="cb-label">Customer</div><div className="cbubble cb-user">wach 3andkom hoodie taille L?</div></div>
                      <div><div className="cb-label">Flowd AI</div><div className="cbubble cb-bot">Ah wah! 3andna L, noir w gris. 2800 DA. Ndir lik commande? 😊<span className="cursor-blink" /></div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── LOGOS ── */}
        <div className="logos aos" onClick={() => setLangOpen(false)}>
          <div className="logos-ttl">{t.logos}</div>
          <div className="logos-row">
            <div className="lpill"><div className="lico" style={{ background: "#FFF0F0" }}>📸</div>Instagram</div>
            <div className="lpill"><div className="lico" style={{ background: "#EBF5FF" }}>💬</div>Messenger</div>
            <div className="lpill"><div className="lico" style={{ background: "#F0FFF4" }}>📦</div>Yalidine</div>
            <div className="lpill"><div className="lico" style={{ background: "#FFF8EB" }}>🛍</div>Shopify</div>
            <div className="lpill"><div className="lico" style={{ background: "#F5F0FF" }}>🚀</div>ZR Express</div>
            <div className="lpill"><div className="lico" style={{ background: "#EBFFF8" }}>📊</div>Google Sheets</div>
          </div>
        </div>

        {/* ── FEATURES ── */}
        <section className="section" id="features" onClick={() => setLangOpen(false)}>
          <div className="aos">
            <div className="section-tag">{t.features.tag}</div>
            <h2 className="section-h">{t.features.h}</h2>
            <p className="section-sub">{t.features.sub}</p>
          </div>
          <div className="feat-grid aos aos-d1">
            {t.features.cards.map((card, i) => {
              const icons = ["fi-blue", "fi-dark", "fi-green", "fi-orange", "fi-purple", "fi-red"];
              return (
                <div key={i} className="feat-card">
                  <div className={`feat-icon ${icons[i]}`}>{card.icon}</div>
                  <div className="feat-title">{card.title}</div>
                  <div className="feat-desc">{card.desc}</div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="how-section" id="how" onClick={() => setLangOpen(false)}>
          <div className="how-inner">
            <div>
              <div className="aos">
                <div className="section-tag">{t.how.tag}</div>
                <h2 className="section-h" style={{ maxWidth: 400 }}>{t.how.h}</h2>
              </div>
              <div className="steps">
                {t.how.steps.map((step, i) => (
                  <div
                    key={i}
                    className={`step${activeStep === i ? " active" : ""}`}
                    onClick={() => setActiveStep(i)}
                  >
                    <div className="step-num">{i + 1}</div>
                    <div className="step-content">
                      <div className="step-title">{step.title}</div>
                      <div className="step-desc">{step.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="how-visual aos aos-d1">
              <div className="vis-header">
                <span>{VIS_STEPS[activeStep].title}</span>
                <div className="vis-live"><div className="live-dot" />Live</div>
              </div>
              <div className="vis-body" dangerouslySetInnerHTML={{ __html: VIS_STEPS[activeStep].html }} />
            </div>
          </div>
        </section>

        {/* ── INTEGRATIONS ── */}
        <section className="int-section" id="integrations" onClick={() => setLangOpen(false)}>
          <div className="int-inner">
            <div className="aos">
              <div className="section-tag" style={{ justifyContent: "center" }}>{t.integrations.tag}</div>
              <h2 className="section-h" style={{ maxWidth: 500, margin: "0 auto", textAlign: "center" }}>{t.integrations.h}</h2>
              <p className="section-sub" style={{ margin: "16px auto 0", textAlign: "center" }}>{t.integrations.sub}</p>
            </div>
            <div className="int-grid aos aos-d1">
              {[
                { ico: "📸", bg: "#FFF0F0", name: "Instagram" },
                { ico: "💬", bg: "#EBF5FF", name: "Messenger" },
                { ico: "📱", bg: "#F0FFF4", name: "WhatsApp" },
                { ico: "🛍", bg: "#FFF8EB", name: "Shopify" },
                { ico: "🔷", bg: "#EBF0FF", name: "WooCommerce" },
                { ico: "📊", bg: "#F0FFF4", name: "Google Sheets" },
                { ico: "📦", bg: "#FFF0F0", name: "Yalidine" },
                { ico: "🚀", bg: "#FFF8EB", name: "ZR Express" },
                { ico: "✈️", bg: "#F5F0FF", name: "Maystro" },
                { ico: "⚡", bg: "#FFF0F8", name: "EddyApp" },
              ].map((item) => (
                <div key={item.name} className="int-card">
                  <div className="int-ico" style={{ background: item.bg }}>{item.ico}</div>
                  <div className="int-name">{item.name}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section className="pricing-section" id="pricing" onClick={() => setLangOpen(false)}>
          <div className="pricing-inner">
            <div className="aos">
              <div className="section-tag" style={{ justifyContent: "center" }}>{t.pricing.tag}</div>
              <h2 className="section-h" style={{ margin: "0 auto", textAlign: "center" }}>{t.pricing.h}</h2>
              <p className="section-sub" style={{ margin: "16px auto 0", textAlign: "center" }}>{t.pricing.sub}</p>
            </div>
            <div className="pricing-grid aos aos-d1">
              {t.pricing.plans.map((plan, i) => (
                <div key={i} className={`pcard${plan.popular ? " featured" : ""}`}>
                  {plan.popular && <div className="pop-badge">Le plus populaire</div>}
                  <div className="plan-name">{plan.name}</div>
                  <div className="plan-price">{plan.price} <sub>{plan.period}</sub></div>
                  <div className="plan-tagline">{plan.tagline}</div>
                  <hr className="plan-divider" />
                  {plan.features.map((feat, j) => (
                    <div key={j} className="plan-feat"><span className="ck">✓</span>{feat}</div>
                  ))}
                  <Link
                    href={plan.btnStyle === "solid" ? "/login?tab=signup" : i === 0 ? "/login?tab=signup" : "/login"}
                    className={`plan-btn ${plan.btnStyle === "solid" ? "pb-solid" : "pb-outline"}`}
                  >
                    {plan.btn}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="testi-section" onClick={() => setLangOpen(false)}>
          <div className="testi-inner">
            <div className="aos">
              <div className="section-tag">{t.testimonials.tag}</div>
              <h2 className="section-h">{t.testimonials.h}</h2>
            </div>
            <div className="testi-grid aos aos-d1">
              {t.testimonials.cards.map((card, i) => (
                <div key={i} className="tcard">
                  <div className="tquote">{card.quote}</div>
                  <div className="tauthor">
                    <div className="tavatar" style={{ background: card.color }}>{card.initials}</div>
                    <div>
                      <div className="tname">{card.name}</div>
                      <div className="tmeta">{card.meta}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="cta-section" onClick={() => setLangOpen(false)}>
          <div className="cta-inner">
            <div className="cta-badge"><span className="badge-pulse" style={{ background: "#6699FF" }} />{t.cta.badge}</div>
            <h2 className="cta-h">
              {t.cta.h1}<br />
              <span className="blue-hl">{t.cta.h2}</span>
            </h2>
            <p className="cta-sub">{t.cta.sub}</p>
            <div className="cta-actions">
              <Link href="/login?tab=signup" className="btn-cta-p">
                {t.cta.btn}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </Link>
              <a href="#how" className="btn-cta-g">{t.cta.demo}</a>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer onClick={() => setLangOpen(false)}>
          <div className="footer-logo">
            <FlowdLogo fill="white" size={32} />
            <span className="footer-logo-txt">Flowd</span>
          </div>
          <span className="footer-copy">{t.footer.copy}</span>
          <div className="footer-links">
            {t.footer.links.map((link) => (
              <a key={link} href="#">{link}</a>
            ))}
          </div>
        </footer>

      </div>
    </>
  );
}
