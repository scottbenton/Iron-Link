import { SvgIcon, SvgIconProps } from "@mui/material";

export function GoogleIcon(props: SvgIconProps) {
  const { sx, ...rest } = props;

  return (
    <SvgIcon
      width="18"
      height="18"
      viewBox="0 0 18 18"
      sx={[{}, ...(Array.isArray(sx) ? sx : [sx])]}
      color={"inherit"}
      {...rest}
    >
      <defs>
        <filter
          x="-0.059999999"
          y="-0.059999999"
          width="1.12"
          height="1.145"
          filterUnits="objectBoundingBox"
        >
          <feOffset
            dx="0"
            dy="1"
            in="SourceAlpha"
            result="shadowOffsetOuter1"
          />
          <feGaussianBlur
            stdDeviation="0.5"
            in="shadowOffsetOuter1"
            result="shadowBlurOuter1"
          />
          <feColorMatrix
            values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.168 0"
            in="shadowBlurOuter1"
            type="matrix"
            result="shadowMatrixOuter1"
          />
          <feOffset
            dx="0"
            dy="0"
            in="SourceAlpha"
            result="shadowOffsetOuter2"
          />
          <feGaussianBlur
            stdDeviation="0.5"
            in="shadowOffsetOuter2"
            result="shadowBlurOuter2"
          />
          <feColorMatrix
            values="0 0 0 0 0   0 0 0 0 0   0 0 0 0 0  0 0 0 0.084 0"
            in="shadowBlurOuter2"
            type="matrix"
            result="shadowMatrixOuter2"
          />
          <feMerge id="feMerge112">
            <feMergeNode in="shadowMatrixOuter1" />
            <feMergeNode in="shadowMatrixOuter2" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <rect x="0" y="0" width="40" height="40" rx="2" />
      </defs>
      <g
        stroke="none"
        strokeWidth="1"
        fill="none"
        fillRule="evenodd"
        transform="translate(-14,-14)"
      >
        <g transform="translate(14,14)">
          <path
            d="m 17.64,9.2045455 c 0,-0.6381819 -0.05727,-1.2518182 -0.163636,-1.8409091 H 9 V 10.845 h 4.843636 C 13.635,11.97 13.000909,12.923182 12.047727,13.561364 v 2.258182 h 2.908637 C 16.658182,14.252727 17.64,11.945455 17.64,9.2045455 Z"
            fill="#4285f4"
          />
          <path
            d="m 9,18 c 2.43,0 4.467273,-0.805909 5.956364,-2.180454 L 12.047727,13.561364 C 11.241818,14.101364 10.210909,14.420455 9,14.420455 6.6559091,14.420455 4.6718182,12.837273 3.9640909,10.71 H 0.95727273 v 2.331818 C 2.4381818,15.983182 5.4818182,18 9,18 Z"
            fill="#34a853"
          />
          <path
            d="M 3.9640909,10.71 C 3.7840909,10.17 3.6818182,9.5931818 3.6818182,9 c 0,-0.5931818 0.1022727,-1.17 0.2822727,-1.71 V 4.9581818 H 0.95727273 C 0.34772727,6.1731818 0,7.5477273 0,9 c 0,1.452273 0.34772727,2.826818 0.95727273,4.041818 z"
            fill="#fbbc05"
          />
          <path
            d="m 9,3.5795455 c 1.321364,0 2.507727,0.4540909 3.440455,1.3459091 L 15.021818,2.3440909 C 13.463182,0.89181818 11.425909,0 9,0 5.4818182,0 2.4381818,2.0168182 0.95727273,4.9581818 L 3.9640909,7.29 C 4.6718182,5.1627273 6.6559091,3.5795455 9,3.5795455 Z"
            fill="#ea4335"
          />
          <path d="M 0,0 H 18 V 18 H 0 Z" />
        </g>
      </g>
    </SvgIcon>
  );
}
