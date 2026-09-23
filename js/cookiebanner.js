// Cookiebanner van woodler.nl. Eerste laag: Accepteren, Alleen noodzakelijk en Aanpassen, even
// makkelijk te kiezen. Aanpassen toont de twee categorieen (noodzakelijk vast, marketing =
// Google Ads-meting). De keuze staat 12 maanden in localStorage onder woodler_consent, met een
// eigen cookie als reserve; meting.js (in de head) las die al in en zet de Google-toestemming.
// Hier alleen tonen, opslaan met terugleescontrole en de nieuwe keuze doorgeven via
// woodlerKeuze. Intrekken wist de eigen Google Ads-cookies (_gcl_*, _gac_*) op woodler.nl en
// herlaadt de pagina, zodat een al geladen gtag.js echt weg is. Tekst volgt de taalkeuze
// (html lang, gezet door main.js).
(function () {
  'use strict';
  var O = window.woodlerOpslag;
  if (!O) return;
  var SLEUTEL = O.sleutel;

  function T() {
    return /^en/i.test(document.documentElement.lang) ? {
      titel: 'Cookies on woodler.nl',
      tekst: 'We use necessary cookies to make the site and the contact form work. With your permission we use Google Ads to measure whether a call, message, email or request came through our advertisement; without it no Google measurement script is loaded. You can change your choice at any time via Cookie settings at the bottom of the page.',
      accepteren: 'Accept', noodzakelijk: 'Necessary only', aanpassen: 'Customise', opslaan: 'Save choice',
      cats: [
        ['noodzakelijk', 'Necessary', 'Needed for the site, your language choice and this cookie choice. Always on.'],
        ['marketing', 'Marketing', 'Google Ads: measures whether your call, message, email or request came through our advertisement. Google places cookies (_gcl) on woodler.nl for this, for at most 90 days.']
      ]
    } : {
      titel: 'Cookies op woodler.nl',
      tekst: 'Wij gebruiken noodzakelijke cookies om de site en het contactformulier te laten werken. Met uw toestemming meten we via Google Ads of een belletje, appje, mail of aanvraag via onze advertentie kwam; zonder toestemming laden we geen meetscript van Google. Wijzigen kan altijd via Cookie-instellingen onderaan de pagina.',
      accepteren: 'Accepteren', noodzakelijk: 'Alleen noodzakelijk', aanpassen: 'Aanpassen', opslaan: 'Keuze opslaan',
      cats: [
        ['noodzakelijk', 'Noodzakelijk', 'Nodig voor de site, uw taalkeuze en deze cookiekeuze. Staat altijd aan.'],
        ['marketing', 'Marketing', 'Google Ads: meet of uw belletje, appje, mail of aanvraag via onze advertentie kwam. Google plaatst hiervoor cookies (_gcl) op woodler.nl, maximaal 90 dagen.']
      ]
    };
  }

  // Een bewaarde keuze telt alleen met een schrijfbaar opslagkanaal (zelfde regel als meting.js).
  var bewaard = O.schrijfbaar() ? O.lees() : null;
  var huidig = bewaard || { m: false }, gekozen = !!bewaard;

  // Schrijft naar localStorage en leest terug; lukt dat niet, dan de reservecookie, ook met
  // terugleescontrole. Geeft true als het record aantoonbaar is opgeslagen.
  function schrijf(waarde) {
    try {
      localStorage.setItem(SLEUTEL, waarde);
      if (localStorage.getItem(SLEUTEL) === waarde) {
        try { document.cookie = SLEUTEL + '=; max-age=0; path=/'; } catch (e) {}
        return true;
      }
    } catch (e) {}
    try {
      var enc = encodeURIComponent(waarde);
      document.cookie = SLEUTEL + '=' + enc + '; max-age=31536000; path=/; SameSite=Lax'
        + (location.protocol === 'https:' ? '; Secure' : '');
      return document.cookie.indexOf(SLEUTEL + '=' + enc) !== -1;
    } catch (e) { return false; }
  }

  // Eigen Google Ads-meetcookies weg op elk domein/pad waar gtag.js ze kan hebben gezet
  // (woodler.nl en .woodler.nl, pad /). De noodzakelijke keuze zelf blijft staan.
  function wisMeetcookies() {
    var namen = [];
    try {
      namen = document.cookie.split('; ').map(function (c) { return c.split('=')[0]; })
        .filter(function (n) { return /^(_gcl_|_gac_)/.test(n); });
    } catch (e) { return namen; }
    var domeinen = ['', location.hostname, '.' + location.hostname, 'woodler.nl', '.woodler.nl'];
    namen.forEach(function (n) {
      domeinen.forEach(function (d) {
        try { document.cookie = n + '=; max-age=0; path=/' + (d ? '; domain=' + d : ''); } catch (e) {}
      });
    });
    return namen;
  }

  function bewaar(m) {
    var intrekken = huidig.m && !m, t = Date.now();
    var opgeslagen = schrijf(JSON.stringify({ v: 1, t: t, m: m }));
    var terug = O.lees();
    opgeslagen = opgeslagen && !!terug && terug.t === t && terug.m === m;
    huidig = { m: m }; gekozen = true;
    if (window.woodlerKeuze) window.woodlerKeuze(m);
    if (intrekken) {
      wisMeetcookies();
      // Herladen haalt een al geladen gtag.js echt weg, maar alleen als de nieuwe keuze
      // aantoonbaar terugleesbaar is; anders zou de banner blijven terugkomen.
      if (opgeslagen) { location.reload(); return; }
    }
    sluit();
  }

  var el, vorigeFocus, modaal, meter, stil = [];
  function sluit() {
    if (!el) return;
    el.remove(); el = null;
    if (meter) meter.disconnect();
    document.documentElement.classList.remove('ckb-open');
    document.documentElement.style.removeProperty('--ckb-ruimte');
    document.documentElement.style.removeProperty('--ckb-boven');
    stil.forEach(function (n) { n.inert = false; }); stil = [];
    if (vorigeFocus && vorigeFocus.focus) vorigeFocus.focus();
  }

  function toon(metKeuzes) {
    var terugNaar = el ? vorigeFocus : document.activeElement;
    sluit();
    vorigeFocus = terugNaar;
    modaal = metKeuzes;
    var t = T(), k = huidig;
    el = document.createElement('div');
    el.className = 'ckb';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', metKeuzes ? 'true' : 'false');
    el.setAttribute('aria-labelledby', 'ckb-titel');
    el.setAttribute('aria-describedby', 'ckb-tekst');
    var keuzes = t.cats.map(function (c, i) {
      var vast = i === 0, aan = vast || k.m;
      return '<label class="ckb__cat"><input type="checkbox" data-cat="' + c[0] + '"'
        + (aan ? ' checked' : '') + (vast ? ' disabled' : '') + '>'
        + '<span><b>' + c[1] + '</b><small>' + c[2] + '</small></span></label>';
    }).join('');
    el.innerHTML = '<div class="ckb__in">'
      + '<h2 class="ckb__titel" id="ckb-titel">' + t.titel + '</h2>'
      + '<p class="ckb__tekst" id="ckb-tekst">' + t.tekst + '</p>'
      + '<div class="ckb__cats"' + (metKeuzes ? '' : ' hidden') + '>' + keuzes + '</div>'
      + '<div class="ckb__knoppen">'
      + '<button type="button" class="btn btn-primary" data-ckb="alles">' + t.accepteren + '</button>'
      + '<button type="button" class="ckb__knop" data-ckb="noodzakelijk">' + t.noodzakelijk + '</button>'
      + '<button type="button" class="ckb__knop" data-ckb="' + (metKeuzes ? 'opslaan' : 'aanpassen') + '">'
      + (metKeuzes ? t.opslaan : t.aanpassen) + '</button>'
      + '</div></div>';
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ckb]');
      if (!b) return;
      var actie = b.getAttribute('data-ckb');
      if (actie === 'alles') bewaar(true);
      else if (actie === 'noodzakelijk') bewaar(false);
      else if (actie === 'aanpassen') toon(true);
      else bewaar(el.querySelector('[data-cat=marketing]').checked);
    });
    // Vooraan in de DOM: de eerste Tab op de pagina komt direct bij de keuze.
    document.body.insertBefore(el, document.body.firstChild);
    // Zolang de banner er staat krijgt de pagina onderin ruimte ter hoogte van wat hij afdekt
    // (style.css, html.ckb-open): een gefocust element scrolt dan boven de banner in beeld.
    document.documentElement.classList.add('ckb-open');
    // --ckb-boven is de hoogte van de vaste kopbalk: een gefocust element scrolt tussen kop en banner in beeld.
    // Direct meten (een focus in dezelfde beurt rekent er al mee) en daarna bij elke maatwijziging.
    var kop = document.getElementById('siteHeader');
    function meet() {
      if (!el) return;
      document.documentElement.style.setProperty('--ckb-ruimte', Math.ceil(innerHeight - el.getBoundingClientRect().top) + 'px');
      if (kop) document.documentElement.style.setProperty('--ckb-boven', Math.ceil(kop.getBoundingClientRect().height) + 'px');
    }
    meet();
    if (window.ResizeObserver) {
      meter = new ResizeObserver(meet);
      meter.observe(el);
      if (kop) meter.observe(kop);
    }
    // Alleen focus verplaatsen als de bezoeker de banner zelf opende (voettekst of Aanpassen).
    // De instellingen zijn modaal: de pagina erachter is inert.
    if (metKeuzes) {
      [].forEach.call(document.body.children, function (n) { if (n !== el && !n.inert) { n.inert = true; stil.push(n); } });
      el.querySelector('[data-cat=marketing]').focus({ preventScroll: true });
    }
  }

  // In de open instellingen gaan Tab en Shift+Tab rond binnen de banner. Escape sluit zonder
  // iets te wijzigen: zonder eerdere keuze terug naar de eerste laag, anders dicht.
  document.addEventListener('keydown', function (e) {
    if (!el || !modaal) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      if (gekozen) sluit();
      else { toon(false); el.querySelector('[data-ckb=aanpassen]').focus(); }
      return;
    }
    if (e.key !== 'Tab') return;
    e.preventDefault();
    var f = [].slice.call(el.querySelectorAll('a[href], input:not([disabled]), button')), i = f.indexOf(document.activeElement);
    f[e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : (i + 1) % f.length].focus();
  });

  // Bij de eerste laag: een tekstvak dat na het scrollen van de browser nog deels onder de
  // banner staat, komt midden in het vrije deel erboven. Wachten tot het scrollen stilstaat.
  document.addEventListener('focusin', function (e) {
    var t = e.target, wacht;
    if (!el || modaal || t.tagName !== 'TEXTAREA') return;
    function klaar() {
      removeEventListener('scroll', uitstel);
      if (el && document.activeElement === t && t.getBoundingClientRect().bottom > el.getBoundingClientRect().top) t.scrollIntoView({ block: 'center' });
    }
    function uitstel() { clearTimeout(wacht); wacht = setTimeout(klaar, 120); }
    addEventListener('scroll', uitstel, { passive: true }); uitstel();
  });

  document.addEventListener('click', function (e) {
    var c = e.target.closest ? e.target.closest('[data-cookie-instellingen]') : null;
    if (c) { e.preventDefault(); toon(true); return; }
    // Taalwissel (main.js) terwijl de banner open staat: tekst opnieuw in de gekozen taal.
    if (el && e.target.closest && e.target.closest('#langToggle .lang-opt')) toon(modaal);
  });

  if (!bewaard) toon(false);
}());
