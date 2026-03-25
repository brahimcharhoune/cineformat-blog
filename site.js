// Inject nav and footer into every page
(function() {
  const path = window.location.pathname.split('/').pop() || 'index.html';

  const nav = `
  <nav>
    <a class="nav-logo" href="index.html">Cine<span>Format</span> AI</a>
    <ul class="nav-links">
      <li><a href="how-to-format-screenplay-in-google-docs.html" ${path.includes('how-to') ? 'class="active"' : ''}>How-To Guide</a></li>
      <li><a href="screenplay-format-guide.html" ${path.includes('format-guide') ? 'class="active"' : ''}>Format Guide</a></li>
      <li><a href="cineformat-ai-vs-screenwriting-software.html" ${path.includes('vs') ? 'class="active"' : ''}>vs. Software</a></li>
      <li><a href="blog.html" ${path === 'blog.html' ? 'class="active"' : ''}>Blog</a></li>
      <li><a href="faq.html" ${path === 'faq.html' ? 'class="active"' : ''}>FAQ</a></li>
    </ul>
    <a class="nav-cta" href="index.html#install">Install Add-on</a>
  </nav>`;

  const footer = `
  <footer>
    <span>© 2026 CineFormat AI. All rights reserved.</span>
    <div class="footer-links">
      <a href="how-to-format-screenplay-in-google-docs.html">How-To Guide</a>
      <a href="screenplay-format-guide.html">Format Guide</a>
      <a href="cineformat-ai-vs-screenwriting-software.html">vs. Software</a>
      <a href="blog.html">Blog</a>
      <a href="faq.html">FAQ</a>
      <a href="Support-Page.html">Support</a>
      <a href="terms-of-service.html">Terms</a>
      <a href="privacy.html">Privacy</a>
    </div>
  </footer>`;

  document.body.insertAdjacentHTML('afterbegin', nav);
  document.body.insertAdjacentHTML('beforeend', footer);

  // FAQ accordion
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.parentElement.classList.toggle('open');
    });
  });
})();
