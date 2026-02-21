export const themeScript = `
(function() {
  try {
    var theme = localStorage.getItem('kyodo-bi-theme');
    var dark = theme === 'dark' || (theme !== 'light' && theme !== 'dark' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;
