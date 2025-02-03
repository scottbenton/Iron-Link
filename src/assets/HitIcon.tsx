import { SvgIcon, SvgIconProps, useTheme } from "@mui/material";

export function HitIcon(props: SvgIconProps) {
  const { sx, ...rest } = props;

  const { palette } = useTheme();

  const grey = palette.grey[palette.mode === "light" ? 900 : 700];
  const blue = palette.info.light;

  return (
    <SvgIcon
      width="18"
      height="18"
      sx={[{}, ...(Array.isArray(sx) ? sx : [sx])]}
      color={"inherit"}
      {...rest}
      xmlSpace="preserve"
      fillRule="evenodd"
      strokeMiterlimit="10"
      clipRule="evenodd"
      viewBox="0 0 98.28 111.99"
    >
      <path
        fill={grey}
        fillRule="nonzero"
        d="M2.2 26.35A4.89 4.89 0 0 0 0 30.17v51.65c0 1.4 1 3.12 2.2 3.82l44.74 25.83c1.2.7 3.2.7 4.4 0l44.74-25.83a4.9 4.9 0 0 0 2.2-3.82V30.17c0-1.4-1-3.12-2.2-3.82L51.35.52a4.9 4.9 0 0 0-4.41 0z"
      />
      <path
        fill="none"
        stroke={blue}
        strokeWidth="7.08"
        d="M12.69 34.95v42.1l36.45 21.04L85.6 77.04v-42.1L49.14 13.9z"
      />
      <path
        fill="#fff"
        fillRule="nonzero"
        d="m26.64 55.22 6.52-6.52 11.17 11.18 20.8-20.8 6.51 6.52-27.3 27.32z"
      />
    </SvgIcon>
  );
}
