import { Icon, IconProps } from "@chakra-ui/react";

export function FolderUserIcon(props: IconProps) {
  return (
    <Icon size="lg" color={"inherit"} asChild {...props}>
      <svg
        viewBox="0 0 24 24"
        fillRule="evenodd"
        clipRule="evenodd"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M10.993,20L4,20C2.903,20 2,19.097 2,18L2,5C2,3.903 2.903,3 4,3L7.9,3C8.579,2.993 9.217,3.333 9.59,3.9L10.4,5.1C10.77,5.661 11.398,6 12.07,6L20,6C21.097,6 22,6.903 22,8L22,10.5"
          strokeWidth="2px"
          fill="none"
          stroke="currentcolor"
        />
        <g transform="matrix(1,0,0,1,6,2)">
          <path
            d="M15,18C15,16.354 13.646,15 12,15C10.354,15 9,16.354 9,18"
            strokeWidth="2px"
            fill="none"
            stroke="currentcolor"
          />
        </g>
        <g transform="matrix(1,0,0,1,6,2)">
          <circle
            cx="12"
            cy="13"
            r="2"
            strokeWidth="2px"
            fill="none"
            stroke="currentcolor"
          />
        </g>
      </svg>
    </Icon>
  );
}
