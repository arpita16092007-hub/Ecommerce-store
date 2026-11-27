(function () {
  const ICONS = {
    bag: '<svg class="arp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 7h12l1 13H5L6 7z"/><path d="M9 7V5a3 3 0 0 1 6 0v2"/></svg>',
    order: '<svg class="arp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 8l-9-5-9 5v8l9 5 9-5V8z"/><path d="M3.3 7.3L12 12l8.7-4.7"/><path d="M12 22V12"/></svg>',
    delivery: '<svg class="arp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="15" height="12" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>',
    returns: '<svg class="arp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10h11a5 5 0 0 1 0 10H9"/><path d="M7 6L3 10l4 4"/></svg>',
    upi: '<svg class="arp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="2.5"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
    card: '<svg class="arp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2.5"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="15" x2="10" y2="15"/></svg>',
    bank: '<svg class="arp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 3 2 8 22 8 12 3"/><line x1="5" y1="11" x2="5" y2="18"/><line x1="10" y1="11" x2="10" y2="18"/><line x1="14" y1="11" x2="14" y2="18"/><line x1="19" y1="11" x2="19" y2="18"/><line x1="2" y1="21" x2="22" y2="21"/></svg>',
    cod: '<svg class="arp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/></svg>',
    care: '<svg class="arp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 8.5 8.5 0 0 1-4-.9L3 20l1-4.8A8.4 8.4 0 0 1 3 11.5a8.5 8.5 0 0 1 9-8.5 8.5 8.5 0 0 1 9 8.5z"/></svg>',
    user: '<svg class="arp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c1.8-3.6 5-5.5 8-5.5s6.2 1.9 8 5.5"/></svg>',
    admin: '<svg class="arp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9c.2.6.8 1 1.5 1H21a2 2 0 1 1 0 4h-.1c-.7 0-1.3.4-1.5 1z"/></svg>',
    pin: '<svg class="arp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/></svg>',
    logout: '<svg class="arp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>',
    crest: '<svg class="arp-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 19 12 12 22 5 12 12 2"/><circle cx="12" cy="12" r="2.2"/></svg>'
  };

  const EMOJI_MAP = [
    ["🛒", ICONS.bag],
    ["📦", ICONS.order],
    ["🚚", ICONS.delivery],
    ["🔄", ICONS.returns],
    ["📱", ICONS.upi],
    ["💳", ICONS.card],
    ["🏦", ICONS.bank],
    ["💵", ICONS.cod],
    ["💬", ICONS.care],
    ["👤", ICONS.user],
    ["♙", ICONS.user],
    ["⚙", ICONS.admin],
    ["📍", ICONS.pin],
    ["❖", ICONS.crest]
  ];

  function upgradeIconsInRoot(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement && !["SCRIPT", "STYLE", "TEXTAREA", "INPUT"].includes(node.parentElement.tagName)) {
        if (EMOJI_MAP.some(([em]) => node.nodeValue.includes(em))) {
          textNodes.push(node);
        }
      }
    }
    for (const tNode of textNodes) {
      let html = tNode.nodeValue
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      for (const [em, svg] of EMOJI_MAP) {
        html = html.split(em).join(svg);
      }
      const span = document.createElement("span");
      span.className = "arp-ico-wrap";
      span.innerHTML = html;
      tNode.parentNode.replaceChild(span, tNode);
    }
  }

  window.ARPIARES_ICONS = ICONS;

  document.addEventListener("DOMContentLoaded", () => {
    upgradeIconsInRoot(document.body);
    const obs = new MutationObserver(mutations => {
      for (const m of mutations) {
        m.addedNodes.forEach(added => {
          if (added.nodeType === 1) upgradeIconsInRoot(added);
        });
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  });
})();
