import { IronLinkLogo } from "@/assets/IronLinkLogo";
import { RadioCardItem, RadioCardRoot } from "@/components/ui/radio-card";
import { LocalThemeProvider } from "@/providers/ThemeProvider";
import { ColorScheme } from "@/repositories/shared.types";
import { Heading } from "@chakra-ui/react";

export interface ColorSchemeSelectorProps {
  selectedColorScheme: ColorScheme;
  onChange: (colorScheme: ColorScheme) => void;
}

export function ColorSchemeSelector(props: ColorSchemeSelectorProps) {
  const { selectedColorScheme, onChange } = props;

  return (
    <RadioCardRoot
      value={selectedColorScheme}
      onValueChange={({ value }) => onChange(value as ColorScheme)}
      display="grid"
      gridTemplateColumns={{ base: "1fr", md: "1fr 1fr" }}
      gap={2}
    >
      {Object.values(ColorScheme).map((scheme) => (
        <LocalThemeProvider key={scheme} colorScheme={scheme}>
          <RadioCardItem
            cursor="pointer"
            value={scheme}
            label={<Heading textTransform={"capitalize"}>{scheme}</Heading>}
            icon={<IronLinkLogo forcedColorScheme={scheme} />}
          />
        </LocalThemeProvider>
      ))}
    </RadioCardRoot>
  );
}
