
export const goBack = (fallbackTab: string = 'landing') => {
  if (window.history.length > 1) {
    window.history.back();
  } else {
    // If no history, navigate to fallback
    window.history.pushState({}, '', `/${fallbackTab}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
};

export const navigateTo = (tab: string, path: string = '') => {
  const fullPath = path ? `/${tab}/${path}` : `/${tab}`;
  window.history.pushState({}, '', fullPath);
  window.dispatchEvent(new PopStateEvent('popstate'));
};
