import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function ScrollToTop() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    const scrollTopNow = () => {
      try {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      } catch (_) {
        window.scrollTo(0, 0);
      }
      document.body.scrollTop = 0; // 사파리 대응
      document.documentElement.scrollTop = 0; // 크롬/파이어폭스/IE
    };

    const id = setTimeout(scrollTopNow, 0);
    return () => clearTimeout(id);
  }, [pathname, hash, key]);

  return null;
}

export default ScrollToTop;


