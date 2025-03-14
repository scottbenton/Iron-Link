import { Icon, IconProps } from "@chakra-ui/react";

export interface TrackTickProps extends Omit<IconProps, "size"> {
  value: number;
  size?: number;
}

const DEFAULT_SIZE = 7;

export function TrackTick(props: TrackTickProps) {
  const { value, size = DEFAULT_SIZE, ...iconProps } = props;

  return (
    <Icon
      asChild
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden={true}
      color="fg.muted"
      {...iconProps}
    >
      <svg>
        <g strokeLinecap="round" strokeWidth="2" stroke="currentColor">
          {value > 0 && <path d="m38.621 38.621-29.241-29.241" />}
          {value > 1 && <path d="m9.3795 38.621 29.241-29.241" />}
          {value > 2 && <path d="m24 4.5259v38.948" />}
          {value > 3 && <path d="m43.474 24h-38.948" />}
        </g>
      </svg>
    </Icon>
  );
}
