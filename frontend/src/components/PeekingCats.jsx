import { useEffect, useRef } from 'react';
import lottie from 'lottie-web';
import whiteCatData from '../assets/animations/WhiteCat.json';
import blackCatData from '../assets/animations/BlackCat.json';
import orangeCatData from '../assets/animations/OrangeCat.json';

const BASE_CATS = [
  { data: whiteCatData,  centerX: false, style: { left: '30px' } },
  { data: blackCatData,  centerX: true,  style: { left: '50%' } },
  { data: orangeCatData, centerX: false, style: { right: '30px' } },
];

// 6 entries: first 3 bottom, next 3 top (same positions, flipped)
const CATS = [
  ...BASE_CATS.map(c => ({ ...c, fromTop: false })),
  ...BASE_CATS.map(c => ({ ...c, fromTop: true })),
];

const getTransform = (cat, visible) => {
  const yHidden = cat.fromTop ? '-100%' : '100%';
  const yVal    = visible ? '0' : yHidden;
  const flip    = cat.fromTop ? ' scaleY(-1)' : '';
  return cat.centerX
    ? `translateX(-50%) translateY(${yVal})${flip}`
    : `translateY(${yVal})${flip}`;
};

export default function PeekingCats() {
  const containerRefs = useRef([]);
  const animRefs      = useRef([]);
  const timeoutIds    = useRef([]);
  const currentIndex  = useRef(0);

  useEffect(() => {
    CATS.forEach((cat, i) => {
      animRefs.current[i] = lottie.loadAnimation({
        container:     containerRefs.current[i],
        renderer:      'svg',
        loop:          false,
        autoplay:      false,
        animationData: cat.data,
      });
    });

    const schedule = (fn, delay) => {
      const id = setTimeout(fn, delay);
      timeoutIds.current.push(id);
    };

    const showCat = (index) => {
      const el   = containerRefs.current[index];
      const anim = animRefs.current[index];
      if (!el || !anim) return;

      el.style.transition = 'opacity 0.4s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)';
      el.style.opacity    = '1';
      el.style.transform  = getTransform(CATS[index], true);
      anim.goToAndPlay(0, true);
    };

    const hideCat = (index, onDone) => {
      const el = containerRefs.current[index];
      if (!el) return;

      el.style.transition = 'opacity 0.7s ease-in, transform 0.7s cubic-bezier(0.4,0,1,1)';
      el.style.opacity    = '0';
      el.style.transform  = getTransform(CATS[index], false);
      schedule(onDone, 750);
    };

    const advance = () => {
      const idx  = currentIndex.current;
      const anim = animRefs.current[idx];
      if (!anim) return;

      const onComplete = () => {
        anim.removeEventListener('complete', onComplete);
        hideCat(idx, () => {
          anim.stop();
          currentIndex.current = (idx + 1) % CATS.length;
          advance();
        });
      };

      anim.addEventListener('complete', onComplete);
      showCat(idx);
    };

    advance();

    return () => {
      timeoutIds.current.forEach(clearTimeout);
      timeoutIds.current = [];
      animRefs.current.forEach((anim) => anim?.destroy());
    };
  }, []);

  return (
    <div
      style={{
        position:      'absolute',
        inset:         0,
        overflow:      'hidden',
        pointerEvents: 'none',
        zIndex:        0,
      }}
    >
      {CATS.map((cat, i) => (
        <div
          key={i}
          ref={el => (containerRefs.current[i] = el)}
          style={{
            position:      'absolute',
            [cat.fromTop ? 'top' : 'bottom']: 0,
            pointerEvents: 'none',
            width:         '160px',
            height:        '160px',
            opacity:       0,
            transform:     getTransform(cat, false),
            transition:    'opacity 0.4s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
            ...cat.style,
          }}
        />
      ))}
    </div>
  );
}
