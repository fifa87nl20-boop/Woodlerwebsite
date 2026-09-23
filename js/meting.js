// Google Ads-meting van woodler.nl (AW-18137028329), rechtstreeks met gtag.js en zonder
// tagmanager-container. Volgorde op elke pagina:
// 1. Consent Mode v2 standaard 'denied' voor alle vier de signalen, voor alle meetcode.
// 2. Bewaarde keuze lezen (localStorage woodler_consent, eigen reservecookie als localStorage
//    niet werkt). Een bewaarde keuze telt alleen als de opslag aantoonbaar schrijft EN
//    terugleest; anders had een latere intrekking niet kunnen blijven staan (fail-closed).
// 3. Pas bij marketing-toestemming: consent update, config AW-18137028329 en gtag.js laden.
//    Zonder toestemming gaat er geen enkel verzoek naar Google, ook geen cookieloze ping
//    (Basic-profiel). ad_personalization blijft altijd 'denied': wij meten, wij personaliseren niet.
// De banner (cookiebanner.js) meldt een nieuwe keuze via window.woodlerKeuze(marketing).
// Conversies: een klik op het eigen telefoonnummer, WhatsApp-nummer of e-mailadres, en een
// bevestigde formulierinzending (main.js roept woodlerFormConversie aan na HTTP-ok en
// success === true). Een lege label vuurt niets: de vier hoofdwebsite-acties bestaan in Ads
// pas na de vrijgegeven aanmaak; fill-labels.mjs uit het werkdossier vult ze hier in.
(function () {
  'use strict';
  if (window.woodlerMetingGeladen) return;
  window.woodlerMetingGeladen = true;

  var AW = 'AW-18137028329';
  var LABELS = {
    bel: '',      /* Hoofdwebsite - Bel klik */
    whatsapp: '', /* Hoofdwebsite - WhatsApp klik */
    mail: '',     /* Hoofdwebsite - Mail klik */
    offerte: ''   /* Hoofdwebsite - Offerte formulier */
  };
  var SLEUTEL = 'woodler_consent', GELDIG = 365 * 864e5;
  var EIGEN_TEL = ['tel:0641265060', 'tel:+31641265060'];

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  gtag('consent', 'default', { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' });
  gtag('js', new Date());

  var marketing = false, geconfigureerd = false;
  window.woodlerKeuze = function (m) {
    marketing = m === true;
    var g = marketing ? 'granted' : 'denied';
    gtag('consent', 'update', { ad_storage: g, ad_user_data: g, ad_personalization: 'denied', analytics_storage: 'denied' });
    if (marketing && !geconfigureerd) {
      geconfigureerd = true;
      gtag('config', AW);
      var s = document.createElement('script');
      s.async = true;
      s.src = 'https://www.googletagmanager.com/gtag/js?id=' + AW;
      document.head.appendChild(s);
    }
  };

  // Opslagregels, gedeeld met cookiebanner.js. Van cookie en localStorage telt het recentste
  // geldige record; bij gelijke tijd de strengste keuze.
  function geldig(k) {
    return k && k.v === 1 && typeof k.t === 'number' && k.t <= Date.now() && Date.now() - k.t < GELDIG
      && typeof k.m === 'boolean' ? k : null;
  }
  function lees() {
    var a = null, b = null;
    try {
      var c = document.cookie.match(/(?:^|; )woodler_consent=([^;]*)/);
      if (c) a = geldig(JSON.parse(decodeURIComponent(c[1])));
    } catch (e) {}
    try { b = geldig(JSON.parse(localStorage.getItem(SLEUTEL))); } catch (e) {}
    if (!a || !b) return a || b;
    if (a.t !== b.t) return a.t > b.t ? a : b;
    return { v: 1, t: a.t, m: a.m && b.m };
  }
  // Persistprobe: schrijven EN teruglezen. Een setItem dat stil niets doet valt hierop door.
  function schrijfbaar() {
    var probe = 'woodler_consent_probe', nonce = String(Date.now()) + Math.random();
    try {
      localStorage.setItem(probe, nonce);
      var ok = localStorage.getItem(probe) === nonce;
      localStorage.removeItem(probe);
      if (ok) return true;
    } catch (e) {}
    try {
      document.cookie = probe + '=' + nonce + '; path=/; SameSite=Lax';
      var ok2 = document.cookie.indexOf(probe + '=' + nonce) !== -1;
      document.cookie = probe + '=; max-age=0; path=/';
      return ok2;
    } catch (e) { return false; }
  }
  window.woodlerOpslag = { lees: lees, schrijfbaar: schrijfbaar, sleutel: SLEUTEL };

  var bewaard = schrijfbaar() ? lees() : null;
  if (bewaard) window.woodlerKeuze(bewaard.m);

  // Klik op het eigen nummer, WhatsApp of e-mailadres: een conversie per klik, alleen met
  // toestemming. tel: en mailto: verlaten de pagina niet en gaan gewoon door. Een WhatsApp-link
  // die de pagina verlaat wacht hoogstens 1 seconde op de verzending; ook bij een adblocker
  // (gtag.js geblokkeerd) gaat de bezoeker dan gewoon naar WhatsApp.
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var h = a.getAttribute('href') || '', kaal = h.replace(/[\s().-]/g, '').toLowerCase(), label = '';
    if (EIGEN_TEL.indexOf(kaal) !== -1) label = LABELS.bel;
    else if (/^https:\/\/wa\.me\/31641265060\/?(\?|$)/i.test(h)) label = LABELS.whatsapp;
    else if (h.split('?')[0].toLowerCase() === 'mailto:info@woodler.nl') label = LABELS.mail;
    if (!label || !marketing) return;
    var weg = a.target !== '_blank' && /^https?:/i.test(h) && !e.defaultPrevented
      && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && e.button === 0;
    if (!weg) { gtag('event', 'conversion', { send_to: AW + '/' + label }); return; }
    e.preventDefault();
    var klaar = false, ga = function () { if (!klaar) { klaar = true; location.href = a.href; } };
    gtag('event', 'conversion', { send_to: AW + '/' + label, event_callback: ga });
    setTimeout(ga, 1000);
  }, true);

  // Formulier: main.js roept dit aan na een bevestigde inzending (HTTP-ok en success === true).
  // Hoogstens een conversie per paginabezoek: na succes staat de verstuurknop uit, en een
  // geslaagde nieuwe poging na een fout telt precies een keer.
  window.woodlerFormConversie = function () {
    if (window.__woodlerOfferteGemeld) return;
    window.__woodlerOfferteGemeld = true;
    if (marketing && LABELS.offerte) gtag('event', 'conversion', { send_to: AW + '/' + LABELS.offerte });
  };
}());
