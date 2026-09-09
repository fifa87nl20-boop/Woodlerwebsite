/* Woodler — interactivity */

(function () {
    'use strict';

    // ---------- Language toggle ----------
    const langToggle = document.getElementById('langToggle');
    if (langToggle) {
        const STORAGE_KEY = 'woodler-lang';
        const applyLang = (lang) => {
            document.documentElement.lang = lang;
            langToggle.querySelectorAll('.lang-opt').forEach(b => {
                b.classList.toggle('active', b.dataset.lang === lang);
            });
            const attr = 'data-' + lang;
            document.querySelectorAll('[data-nl][data-en]').forEach(el => {
                const val = el.getAttribute(attr);
                if (val !== null) el.innerHTML = val;
            });
            // Placeholders
            const phAttr = 'data-' + lang + '-placeholder';
            document.querySelectorAll('[data-nl-placeholder][data-en-placeholder]').forEach(el => {
                const val = el.getAttribute(phAttr);
                if (val !== null) el.placeholder = val;
            });
            // Title attributes (tooltips)
            const tAttr = 'data-' + lang + '-title';
            document.querySelectorAll('[data-nl-title][data-en-title]').forEach(el => {
                const val = el.getAttribute(tAttr);
                if (val !== null) el.title = val;
            });
            // Document title
            const titleEl = document.querySelector('title');
            if (titleEl && titleEl.dataset.nl && titleEl.dataset.en) {
                document.title = titleEl.dataset[lang];
            }
        };
        const saved = localStorage.getItem(STORAGE_KEY) || 'nl';
        applyLang(saved);
        langToggle.addEventListener('click', (e) => {
            const btn = e.target.closest('.lang-opt');
            if (!btn) return;
            const lang = btn.dataset.lang;
            localStorage.setItem(STORAGE_KEY, lang);
            applyLang(lang);
        });
    }

    // ---------- Header scroll state ----------
    const header = document.getElementById('siteHeader');
    if (header) {
        const onScroll = () => {
            header.classList.toggle('scrolled', window.scrollY > 30);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    // ---------- Mobile nav toggle ----------
    const navToggle = document.getElementById('navToggle');
    if (navToggle && header) {
        navToggle.addEventListener('click', () => {
            header.classList.toggle('menu-open');
        });
        // close menu on link click
        header.querySelectorAll('.nav-links a').forEach(a => {
            a.addEventListener('click', () => header.classList.remove('menu-open'));
        });
    }

    // ---------- Reveal on scroll ----------
    const reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && reveals.length) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    io.unobserve(entry.target);
                }
            });
        }, { rootMargin: '0px 0px -80px 0px', threshold: 0.05 });
        reveals.forEach(el => io.observe(el));
    } else {
        reveals.forEach(el => el.classList.add('is-visible'));
    }

    // ---------- Calculator ----------
    const m2Input = document.getElementById('calc-m2');
    const finishSelect = document.getElementById('calc-finish');
    const amountEl = document.getElementById('calc-amount');
    const BASE = 19.95;

    function fmt(n) {
        return '€ ' + n.toLocaleString('nl-NL', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    function recalc() {
        if (!m2Input || !finishSelect || !amountEl) return;
        const m2 = parseFloat(m2Input.value);
        const finish = parseFloat(finishSelect.value);
        if (!m2 || m2 <= 0) {
            amountEl.textContent = '— €';
            return;
        }
        const total = m2 * (BASE + finish);
        amountEl.textContent = fmt(total);
    }

    if (m2Input) m2Input.addEventListener('input', recalc);
    if (finishSelect) finishSelect.addEventListener('change', recalc);

    // ---------- Before / After slider ----------
    const baWrap = document.getElementById('baWrap');
    const baAfter = document.getElementById('baAfter');
    const baHandle = document.getElementById('baHandle');

    if (baWrap && baAfter && baHandle) {
        let dragging = false;

        const setPos = (clientX) => {
            const rect = baWrap.getBoundingClientRect();
            let pct = ((clientX - rect.left) / rect.width) * 100;
            pct = Math.max(0, Math.min(100, pct));
            baAfter.style.clipPath = `inset(0 0 0 ${pct}%)`;
            baHandle.style.left = pct + '%';
        };

        const start = (e) => {
            dragging = true;
            const x = e.touches ? e.touches[0].clientX : e.clientX;
            setPos(x);
            e.preventDefault();
        };
        const move = (e) => {
            if (!dragging) return;
            const x = e.touches ? e.touches[0].clientX : e.clientX;
            setPos(x);
        };
        const stop = () => { dragging = false; };

        baWrap.addEventListener('mousedown', start);
        baWrap.addEventListener('touchstart', start, { passive: false });
        window.addEventListener('mousemove', move);
        window.addEventListener('touchmove', move, { passive: true });
        window.addEventListener('mouseup', stop);
        window.addEventListener('touchend', stop);

        // Hover preview (desktop only, when not dragging)
        baWrap.addEventListener('mousemove', (e) => {
            if (!dragging) setPos(e.clientX);
        });
    }

    // ---------- Floating-label select state ----------
    document.querySelectorAll('.field select').forEach(sel => {
        const update = () => sel.classList.toggle('has-value', !!sel.value);
        update();
        sel.addEventListener('change', update);
    });

    // ---------- Contactformulier versturen (Web3Forms) ----------
    // Hier stond tot 09-09-2026 een placeholder: de knop zei "Bedankt! We nemen contact op"
    // en het formulier werd geleegd, maar er ging niets de deur uit. Nu gaat de aanvraag naar
    // Web3Forms, hetzelfde postvak als de Ads-lander van Woodler. Web3Forms wil de aanroep
    // vanuit de browser hebben, vandaar deze fetch en geen gewone formulierpost.
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        const success = document.getElementById('formSuccess');
        const error = document.getElementById('formError');
        const button = contactForm.querySelector('button[type="submit"]');
        contactForm.addEventListener('submit', (e) => {
            // De browser controleert de verplichte velden voor dit punt, dus hier is alles ingevuld.
            e.preventDefault();
            const originalHTML = button.innerHTML;
            button.disabled = true;
            button.textContent = document.documentElement.lang === 'en' ? 'Sending...' : 'Versturen...';
            if (error) error.hidden = true;
            fetch(contactForm.action, {
                method: 'POST',
                body: new FormData(contactForm),
                headers: { Accept: 'application/json' }
            })
                .then(r => r.json())
                .then(res => {
                    if (!res.success) throw new Error(res.message || 'mislukt');
                    contactForm.classList.add('is-submitted');
                    if (success) {
                        success.hidden = false;
                        success.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                })
                .catch(() => {
                    // Geen alert en geen leeg formulier: het telefoonnummer komt in beeld en
                    // wat de bezoeker heeft ingevuld blijft staan, zodat hij het opnieuw kan proberen.
                    button.disabled = false;
                    button.innerHTML = originalHTML;
                    if (error) {
                        error.hidden = false;
                        error.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                });
        });
    }

})();
