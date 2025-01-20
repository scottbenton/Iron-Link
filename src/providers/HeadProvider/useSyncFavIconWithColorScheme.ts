import { useTheme } from "@mui/material";
import { useEffect } from "react";

export function useSyncFavIconWithColorScheme() {
  const theme = useTheme();

  const color1 = theme.palette.primary.main;
  const color2 = theme.palette.secondary.main;

  useEffect(() => {
    const svg = `
      <svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g clip-path="url(#clip0)">
          <path d="M58 3.4641C61.7128 1.32051 66.2872 1.32051 70 3.4641L113.426 28.5359C117.138 30.6795 119.426 34.641 119.426 38.9282V89.0718C119.426 93.359 117.138 97.3205 113.426 99.4641L70 124.536C66.2872 126.679 61.7128 126.679 58 124.536L14.5744 99.4641C10.8616 97.3205 8.57438 93.359 8.57438 89.0718V38.9282C8.57438 34.641 10.8616 30.6795 14.5744 28.5359L58 3.4641Z" fill="url(#paint0)"/>
          <path d="M64.1222 44.2444C70.8171 44.2444 76.2444 38.8171 76.2444 32.1222C76.2444 25.4273 70.8171 20 64.1222 20C57.4273 20 52 25.4273 52 32.1222C52 38.8171 57.4273 44.2444 64.1222 44.2444Z" fill="white"/>
          <path d="M35.0935 57.884C33.6421 57.884 32.6895 59.3714 33.3043 60.6862C34.453 63.1426 36.0884 66.6302 37.1322 68.8575C37.4615 69.5602 38.1661 70.0062 38.9422 70.0062H90.2414C91.0175 70.0062 91.7221 69.5602 92.0515 68.8575C93.0958 66.6303 94.7325 63.1426 95.8822 60.6862C96.4975 59.3715 95.5452 57.884 94.0937 57.884H35.0935Z" fill="white"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M62.0024 125.976C60.6149 125.742 59.2593 125.262 58.0024 124.536L52.5601 121.394L54.3452 77.8362C54.4331 75.6926 56.1964 74 58.3418 74H62.0024V125.976Z" fill="white"/>
          <path fill-rule="evenodd" clip-rule="evenodd" d="M75.4424 121.394L70 124.536C68.7431 125.262 67.3875 125.742 66 125.976V74H69.6606C71.806 74 73.5694 75.6926 73.6572 77.8362L75.4424 121.394Z" fill="white"/>
        </g>
        <defs>
          <linearGradient id="paint0" x1="33.3452" y1="6.02853" x2="98.3423" y2="120.092" gradientUnits="userSpaceOnUse">
            <stop stop-color="${color2}"/>
            <stop offset="1" stop-color="${color1}"/>
          </linearGradient>
          <clipPath id="clip0">
            <rect width="128" height="128" fill="white"/>
          </clipPath>
        </defs>
      </svg>
    `;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/svg+xml";
    link.href = url;

    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
      URL.revokeObjectURL(url);
    };
  }, [color1, color2]);
}
