import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const scrollContainer = document.getElementById('scrollable-container');
    if (scrollContainer) {
      scrollContainer.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
}
