// Mobilni meni + godina u futeru
(function(){
  var b = document.getElementById('burger'), n = document.getElementById('nav');
  if(b && n){
    b.addEventListener('click', function(){
      var open = n.classList.toggle('open');
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      b.setAttribute('aria-label', open ? 'Zatvori meni' : 'Otvori meni');
    });
    n.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        n.classList.remove('open');
        b.setAttribute('aria-expanded','false');
      });
    });
  }
  var g = document.getElementById('god');
  if(g) g.textContent = new Date().getFullYear();
})();
