function getOrCreateFaviconLink() {
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');

  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.append(link);
  }

  return link;
}

function setFavicon(href: string) {
  if (typeof document === 'undefined' || !href) {
    return;
  }

  const link = getOrCreateFaviconLink();
  link.href = href;
}

export { setFavicon };
