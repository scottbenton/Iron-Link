/**
 * Layout primitives: the only way Iron Link's screens lay things out.
 *
 * App code imports these from `ui/primitives` and never calls Panda
 * (`styled-system/*`) itself, so the styling system can be swapped by
 * changing this module alone. ESLint enforces that outside `src/ui`.
 *
 * Each takes style props that use the theme's tokens
 * (`<Stack gap="4" padding="3" bg="bg.surface">`), plus `css` for anything
 * the props do not cover. Panda finds them by name at build time, so always
 * import them from here and never rename them on import.
 *
 * MUI to primitives:
 * - `Box` -> `Box`
 * - `Stack` -> `Stack` (column) or `HStack` (row); `spacing={2}` -> `gap="4"`
 * - `Grid container` -> `Grid`, `Grid item` -> `GridItem`
 * - `Container` -> `Container` with a `size`
 */
export {
  Box,
  Center,
  Container,
  Flex,
  Grid,
  GridItem,
  HStack,
  Spacer,
  Stack,
  VStack,
} from "styled-system/jsx";

export type {
  BoxProps,
  CenterProps,
  ContainerProps,
  FlexProps,
  GridItemProps,
  GridProps,
  HstackProps as HStackProps,
  SpacerProps,
  StackProps,
  VstackProps as VStackProps,
} from "styled-system/jsx";
