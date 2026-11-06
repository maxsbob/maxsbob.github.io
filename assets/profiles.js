(() => {
  for (const item of document.querySelectorAll('[data-profile]')) {
    const url = window.profileLinks?.[item.dataset.profile]?.trim();
    if (!url || !/^https?:\/\//i.test(url)) continue;
    const link = document.createElement('a');
    link.href = url;
    link.append(...item.firstElementChild.childNodes);
    item.replaceChildren(link);
  }
})();
