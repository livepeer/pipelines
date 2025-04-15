import { useCallback, useMemo } from "react";

const hashString = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const getColorFromHash = (hash: number, index: number): string => {
  const h = (hash + index * 30) % 360;
  const s = 65 + (hash % 35);
  const l = 55 + (hash % 15);
  return `hsl(${h}, ${s}%, ${l}%)`;
};

type GradientType = "linear" | "radial" | "conic" | "mesh";

interface UseGradientAvatarOptions {
  defaultString?: string;
  size?: number;
}

export const useGradientAvatar = ({
  defaultString = "user",
  size = 40,
}: UseGradientAvatarOptions = {}) => {
  const generateAvatar = useCallback(
    (inputString: string) => {
      const str = inputString || defaultString;
      const hash = hashString(str);

      const gradientTypes: GradientType[] = [
        "linear",
        "radial",
        "conic",
        "mesh",
      ];
      const gradientType = gradientTypes[hash % gradientTypes.length];

      const color1 = getColorFromHash(hash, 0);
      const color2 = getColorFromHash(hash, 1);
      const color3 = getColorFromHash(hash, 2);

      let gradientDef = "";
      let fillAttribute = "";

      const gradientId = `gradient-${hash}`;

      switch (gradientType) {
        case "linear":
          const angle = hash % 360;
          gradientDef = `
          <linearGradient id="${gradientId}" x1="0%" y1="0%" x2="100%" y2="100%" gradientTransform="rotate(${angle}, 0.5, 0.5)">
            <stop offset="0%" stop-color="${color1}" />
            <stop offset="50%" stop-color="${color2}" />
            <stop offset="100%" stop-color="${color3}" />
          </linearGradient>
        `;
          break;
        case "radial":
          const cx = 30 + (hash % 40);
          const cy = 30 + ((hash >> 4) % 40);
          gradientDef = `
          <radialGradient id="${gradientId}" cx="${cx}%" cy="${cy}%" r="70%" fx="${cx}%" fy="${cy}%">
            <stop offset="0%" stop-color="${color1}" />
            <stop offset="60%" stop-color="${color2}" />
            <stop offset="100%" stop-color="${color3}" />
          </radialGradient>
        `;
          break;
        case "conic":
          const conicAngle = hash % 360;
          gradientDef = `
          <linearGradient id="grad1-${hash}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${color1}" />
            <stop offset="100%" stop-color="${color2}" />
          </linearGradient>
          <radialGradient id="grad2-${hash}" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stop-color="${color2}" />
            <stop offset="100%" stop-color="${color3}" />
          </radialGradient>
          <pattern id="${gradientId}" patternUnits="userSpaceOnUse" width="120" height="120" patternTransform="rotate(${conicAngle}, 60, 60)">
            <path d="M0,0 h120 v120 h-120 z" fill="url(#grad2-${hash})" />
            <path d="M0,0 h60 v60 h-60 z" fill="url(#grad1-${hash})" />
            <path d="M60,60 h60 v60 h-60 z" fill="url(#grad1-${hash})" />
          </pattern>
        `;
          break;
        case "mesh":
          const meshRotate = hash % 360;
          gradientDef = `
          <radialGradient id="baseGrad-${hash}" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stop-color="${color1}" />
            <stop offset="100%" stop-color="${color2}" />
          </radialGradient>
          <linearGradient id="grad1-${hash}" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="${color1}" stop-opacity="0.8" />
            <stop offset="100%" stop-color="${color2}" stop-opacity="0.8" />
          </linearGradient>
          <linearGradient id="grad2-${hash}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="${color3}" stop-opacity="0.8" />
            <stop offset="100%" stop-color="${color1}" stop-opacity="0.8" />
          </linearGradient>
          <pattern id="meshPattern-${hash}" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(${meshRotate})">
            <rect x="0" y="0" width="10" height="10" fill="url(#grad1-${hash})" />
            <rect x="10" y="0" width="10" height="10" fill="url(#grad2-${hash})" />
            <rect x="0" y="10" width="10" height="10" fill="url(#grad2-${hash})" />
            <rect x="10" y="10" width="10" height="10" fill="url(#grad1-${hash})" />
          </pattern>
          <mask id="circleMask-${hash}">
            <circle cx="50" cy="50" r="50" fill="white" />
          </mask>
          <g id="${gradientId}">
            <circle cx="50" cy="50" r="50" fill="url(#baseGrad-${hash})" />
            <rect x="0" y="0" width="100" height="100" fill="url(#meshPattern-${hash})" mask="url(#circleMask-${hash})" />
          </g>
        `;
          fillAttribute = `fill="url(#${gradientId})"`;
          break;
      }

      if (gradientType !== "mesh") {
        fillAttribute = `fill="url(#${gradientId})"`;
      }

      const svg = `
      <svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          ${gradientDef}
        </defs>
        ${
          gradientType === "mesh"
            ? `<use href="#${gradientId}" />`
            : `<circle cx="50" cy="50" r="50" ${fillAttribute} />`
        }
      </svg>
    `;

      return `data:image/svg+xml;base64,${btoa(svg)}`;
    },
    [defaultString, size],
  );

  const defaultAvatar = useMemo(
    () => generateAvatar(defaultString),
    [generateAvatar, defaultString],
  );

  return {
    generateAvatar,
    defaultAvatar,
  };
};
