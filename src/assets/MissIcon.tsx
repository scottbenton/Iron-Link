import { SvgIcon, SvgIconProps, useTheme } from "@mui/material";

export function MissIcon(props: SvgIconProps) {
  const { sx, ...rest } = props;

  const { palette } = useTheme();
  const grey = palette.grey[palette.mode === "light" ? 900 : 700];
  const red = palette.error.light;
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
        d="M2.2 26.35A4.89 4.89 0 0 0 0 30.17v51.65c0 1.4 1 3.12 2.2 3.82l44.74 25.83c1.2.7 3.2.7 4.4 0l44.74-25.83a4.9 4.9 0 0 0 2.2-3.82V30.17c0-1.4-1-3.12-2.2-3.82L51.35.53a4.9 4.9 0 0 0-4.41 0z"
      />
      <path
        fill="none"
        stroke={red}
        strokeWidth="7.08"
        d="M12.68 34.95v42.1l36.46 21.04L85.6 77.05v-42.1L49.14 13.9z"
      />
      <path
        fill="#fff"
        fillRule="nonzero"
        d="M48.8 62.8 37.33 74.27a.47.47 0 0 1-.66 0l-5.8-5.8a.47.47 0 0 1 0-.66l11.49-11.5a.47.47 0 0 0 0-.66l-11.5-11.48a.48.48 0 0 1 0-.67l5.8-5.8a.46.46 0 0 1 .67 0l11.48 11.5c.18.18.48.18.67 0l11.48-11.48a.47.47 0 0 1 .67 0l5.8 5.79a.5.5 0 0 1 0 .67l-11.5 11.48a.47.47 0 0 0 0 .67l11.5 11.49a.5.5 0 0 1 0 .66l-5.8 5.8a.48.48 0 0 1-.67 0L49.48 62.79a.47.47 0 0 0-.67 0"
      />
    </SvgIcon>
  );
}
