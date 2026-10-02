import '@fontsource/noto-sans-jp/700.css';
import '@fontsource/noto-sans-jp/900.css';
import '@fontsource-variable/outfit/index.css';
import { useEffect, useState } from 'react';
import { cancelRender, continueRender, delayRender } from 'remotion';

const SPECS = ['700 40px "Noto Sans JP"', '900 40px "Noto Sans JP"', '600 40px "Outfit Variable"', '800 40px "Outfit Variable"'];

// Noto Sans JP from fontsource is split into unicode-range slices, so we ask the
// browser to load every slice needed for the text that actually appears.
export const useFonts = (text: string) => {
  const [handle] = useState(() => delayRender('Loading fonts'));
  useEffect(() => {
    Promise.all(SPECS.map((spec) => document.fonts.load(spec, text)))
      .then(() => continueRender(handle))
      .catch((err) => cancelRender(err));
  }, [handle, text]);
};
