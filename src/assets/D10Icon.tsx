import { SvgIcon, SvgIconProps } from "@mui/material";

export function D10Icon(props: SvgIconProps) {
  const { sx, ...rest } = props;
  return (
    <SvgIcon
      viewBox="0 0 512 512"
      sx={[
        {
          width: 24,
          height: 24,
          strokeLinejoin: "round",
          strokeWidth: 16,
          stroke: "currentcolor",
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      color={"inherit"}
      {...rest}
    >
      <g transform="translate(0)">
        <path
          d="m375.48 251.24-109.98 51.138 0.213 183.38 211.29-219.42-86.993-21.81zm-253.88-6.909-84.71 21.763 209.58 219.9v-183.62l-109.95-51.137zm-94.413 4.531c78.765-82.135 126.84-133.83 199.84-213.42-35.907 63.228-71.922 126.39-107.8 189.64zm257.83-213.49c74.611 82.333 124.53 135.88 199.79 213.27l-91.572-22.941c-36.098-63.428-72.151-126.88-108.22-190.33zm-29.031-9.371-118.53 205.03 118.53 55.05 118.6-55.05z"
          fill="none"
        />
      </g>
    </SvgIcon>
  );
}
