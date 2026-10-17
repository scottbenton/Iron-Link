import SearchIcon from "@mui/icons-material/Search";
import { InputAdornment, TextField } from "@mui/material";
import { useTranslation } from "react-i18next";

// Filters a category's entries by name and subtitle.
export function WorldEntrySearch({
  categoryName,
  value,
  onChange,
}: {
  categoryName: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();
  const label = t("worlds.categories.filter", "Filter {{category}}", {
    category: categoryName,
  });
  return (
    <TextField
      size="small"
      placeholder={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      sx={{
        width: 240,
        maxWidth: "100%",
        "& .MuiInputBase-root": { bgcolor: "background.paper" },
      }}
      slotProps={{
        htmlInput: { "aria-label": label },
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
