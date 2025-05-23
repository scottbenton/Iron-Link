import { SvgIcon, SvgIconProps, useTheme } from "@mui/material";
import { useId } from "react";

export function D6Grey(props: SvgIconProps) {
  const { sx, ...rest } = props;
  const id = useId();

  const { palette } = useTheme();
  const stroke = palette.grey[600];
  const lightGrey = palette.grey[200];
  const midGrey = palette.grey[300];

  return (
    <SvgIcon
      sx={[
        {
          width: 24,
          height: 24,
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      color={"inherit"}
      viewBox="0 0 16.403461 13.540317"
      {...rest}
    >
      <defs>
        <clipPath id={id} clipPathUnits="userSpaceOnUse">
          <path d="M0 0h432v648H0Z" />
        </clipPath>
      </defs>
      <g
        clipPath={`url(#${id})`}
        transform="matrix(.35278 0 0 -.35278 -32.631344 132.77843)"
      >
        <path
          fill={stroke}
          d="M94.9013 337.9978h27.563c.338 0 .671.071.98.209l14.128 6.305c.866.387 1.424 1.247 1.424 2.195v27.27c0 1.327-1.076 2.403-2.404 2.403h-26.094c-.296 0-.589-.054-.864-.161l-15.598-6.012c-.927-.357-1.538-1.249-1.538-2.242v-27.564c0-1.327 1.076-2.403 2.403-2.403"
        />
        <path
          fill={lightGrey}
          d="M120.3014 367.4837h-23.237c-.928 0-1.682-.755-1.682-1.682v-23.237c0-.928.754-1.683 1.682-1.683h23.237c.928 0 1.682.755 1.682 1.683v23.237c0 .927-.754 1.682-1.682 1.682"
        />
        <path
          fill={midGrey}
          d="M136.5932 349.1105v22.944c0 .622-.295.994-.789.994-.165 0-.344-.04-.532-.121l-10.148-4.318c-.92-.392-1.698-1.567-1.698-2.568v-23.237c0-.609.282-.972.755-.972.167 0 .35.044.544.13l10.177 4.542c.917.409 1.691 1.603 1.691 2.606m-16.2918 19.8157c1.119 0 2.935.37 3.965.809l9.969 4.242h-21.574c-1.124 0-2.96-.342-4.009-.746l-11.168-4.305Z"
        />
      </g>
    </SvgIcon>
  );
}
