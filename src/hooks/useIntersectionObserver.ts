import { useEffect, useRef } from 'react';

export function useIntersectionObserver(options = {}) {
  const elementsRef = useRef<NodeListOf<Element> | null>(null);

  useEffect(() => {
    elementsRef.current = document.querySelectorAll('.stagger-up, .stagger-item');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
        }
      });
    }, {
      threshold: 0.1,
      ...options
    });

    elementsRef.current.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [options]);
}
