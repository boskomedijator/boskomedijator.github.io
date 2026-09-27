// Mobilni meni, godina u futeru i prekidač ćirilica / latinica.
// Sajt je napisan na ćirilici; latinica se pravi automatski, pa se tekst menja samo na jednom mestu.
(function () {
  var KLJUC = 'pismo';
  var html = document.documentElement;

  // ---------- preslovljavanje ćirilica -> latinica ----------
  var CIR = 'АБВГДЂЕЖЗИЈКЛЉМНЊОПРСТЋУФХЦЧЏШабвгдђежзијклљмнњопрстћуфхцчџш';
  var LAT = ['A','B','V','G','D','Đ','E','Ž','Z','I','J','K','L','Lj','M','N','Nj','O','P','R','S','T','Ć','U','F','H','C','Č','Dž','Š',
             'a','b','v','g','d','đ','e','ž','z','i','j','k','l','lj','m','n','nj','o','p','r','s','t','ć','u','f','h','c','č','dž','š'];
  var MAPA = {};
  for (var i = 0; i < CIR.length; i++) MAPA[CIR.charAt(i)] = LAT[i];
  var IMA_CIR = /[\u0400-\u04FF]/;

  function lat(s) {
    return s
      .replace(/[ЉЊЏ](?=[\u0400-\u042F])/g, function (c) { return { 'Љ': 'LJ', 'Њ': 'NJ', 'Џ': 'DŽ' }[c]; })
      .replace(/[\u0400-\u04FF]/g, function (c) { return MAPA[c] || c; });
  }

  var jeLat = false;
  try { jeLat = localStorage.getItem(KLJUC) === 'lat'; } catch (e) {}

  // Za druge skripte (npr. kontakt forma): Pismo.t('текст') vraća tekst u izabranom pismu
  window.Pismo = { t: function (s) { return jeLat ? lat(s) : s; } };

  // ---------- mobilni meni ----------
  var b = document.getElementById('burger'), n = document.getElementById('nav');
  function burgerLabel() {
    if (b) b.setAttribute('aria-label', window.Pismo.t(n && n.classList.contains('open') ? 'Затвори мени' : 'Отвори мени'));
  }
  if (b && n) {
    b.addEventListener('click', function () {
      var open = n.classList.toggle('open');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      burgerLabel();
    });
    n.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        n.classList.remove('open');
        b.setAttribute('aria-expanded', 'false');
        burgerLabel();
      });
    });
  }

  // ---------- godina u futeru ----------
  var g = document.getElementById('god');
  if (g) g.textContent = new Date().getFullYear();

  // ---------- pamćenje originalnog (ćiriličnog) teksta ----------
  var PRESKOCI = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1 };
  var ATRIBUTI = ['placeholder', 'aria-label', 'title', 'alt'];
  var tekstovi = new Map();   // tekstualni čvor -> { c: ćirilica, l: latinica }
  var atributi = new Map();   // element -> { atribut: { c, l } }
  var naslov = null;

  function preskoci(el) {
    return !el || PRESKOCI[el.nodeName] || (el.closest && el.closest('[data-pismo-skip]'));
  }

  function obradiTekst(t) {
    if (preskoci(t.parentElement)) return;
    var v = t.nodeValue, rec = tekstovi.get(t);
    if (rec && v === rec.l) return;                       // naša sopstvena izmena
    if (!IMA_CIR.test(v)) { tekstovi.delete(t); return; }
    var l = lat(v);
    tekstovi.set(t, { c: v, l: l });
    t.nodeValue = l;
  }

  function obradiAtribute(el) {
    for (var i = 0; i < ATRIBUTI.length; i++) {
      var a = ATRIBUTI[i], v = el.getAttribute(a);
      if (!v || !IMA_CIR.test(v)) continue;
      var l = lat(v), m = atributi.get(el) || {};
      m[a] = { c: v, l: l };
      atributi.set(el, m);
      el.setAttribute(a, l);
    }
  }

  function obradiStablo(koren) {
    if (koren.nodeType === 3) { obradiTekst(koren); return; }
    if (koren.nodeType !== 1 || preskoci(koren)) return;
    obradiAtribute(koren);
    var w = document.createTreeWalker(koren, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode: function (x) {
        if (x.nodeType === 1) return (PRESKOCI[x.nodeName] || x.hasAttribute('data-pismo-skip')) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var x, lista = [];
    while ((x = w.nextNode())) lista.push(x);
    lista.forEach(function (y) { if (y.nodeType === 3) obradiTekst(y); else obradiAtribute(y); });
  }

  // tekst koji skripte naknadno upišu (npr. kalkulator troškova) takođe ide u latinicu
  var posmatrac = new MutationObserver(function (promene) {
    promene.forEach(function (p) {
      if (p.type === 'characterData') obradiTekst(p.target);
      else p.addedNodes.forEach(obradiStablo);
    });
  });

  function uLatinicu() {
    obradiStablo(document.body);
    naslov = document.title;
    document.title = lat(naslov);
    posmatrac.observe(document.body, { subtree: true, childList: true, characterData: true });
  }

  function uCirilicu() {
    posmatrac.disconnect();
    posmatrac.takeRecords();
    tekstovi.forEach(function (rec, t) { if (t.nodeValue === rec.l) t.nodeValue = rec.c; });
    atributi.forEach(function (m, el) {
      for (var a in m) if (el.getAttribute(a) === m[a].l) el.setAttribute(a, m[a].c);
    });
    tekstovi.clear();
    atributi.clear();
    if (naslov !== null) document.title = naslov;
  }

  // ---------- prekidač ----------
  var dugme = document.getElementById('pismo');

  function primeni() {
    html.classList.toggle('pismo-lat', jeLat);
    html.lang = jeLat ? 'sr-Latn' : 'sr-Cyrl';
    if (dugme) dugme.setAttribute('aria-label', jeLat ? 'Prikaži sajt na ćirilici' : 'Прикажи сајт на латиници');
    burgerLabel();
  }

  if (dugme) {
    dugme.addEventListener('click', function () {
      jeLat = !jeLat;
      try { localStorage.setItem(KLJUC, jeLat ? 'lat' : 'cir'); } catch (e) {}
      if (jeLat) uLatinicu(); else uCirilicu();
      primeni();
    });
  }

  if (jeLat) uLatinicu();
  primeni();
  html.classList.remove('pismo-ceka');
})();
