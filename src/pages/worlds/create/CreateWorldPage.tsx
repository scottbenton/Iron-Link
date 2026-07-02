import {
  Alert,
  Card,
  CardActionArea,
  LinearProgress,
  Radio,
  TextField,
  Typography,
} from "@mui/material";
import Box from "@mui/material/Box";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { GradientButton } from "components/GradientButton";
import { PageContent, PageHeader } from "components/Layout";

import { pathConfig } from "pages/pathConfig";

import {
  PageCategory,
  useSendPageViewEvent,
} from "hooks/useSendPageViewEvents";

import { useWorldStore } from "stores/world.store";

import { useWorldSettings } from "../hooks/useWorldSettings";

export default function CreateWorldPage() {
  const { t } = useTranslation();
  useSendPageViewEvent(PageCategory.WorldCreate);

  const navigate = useNavigate();
  const createWorld = useWorldStore((store) => store.createWorld);

  const { settings, loading: settingsLoading } = useWorldSettings();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [settingKey, setSettingKey] = useState<string | undefined>();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleCreate = () => {
    if (!name.trim()) {
      setError(
        t("worlds.create.name-required", "Please enter a name for your world"),
      );
      return;
    }
    if (!settingKey) {
      setError(t("worlds.create.setting-required", "Please choose a setting"));
      return;
    }
    setError(undefined);
    setCreating(true);
    createWorld(name.trim(), description.trim() || undefined, settingKey)
      .then((worldId) => {
        navigate(pathConfig.world(worldId));
      })
      .catch(() => {
        setCreating(false);
        setError(
          t(
            "worlds.create.error-creating-world",
            "Failed to create world. Please try again.",
          ),
        );
      });
  };

  return (
    <>
      <PageHeader label={t("worlds.create.header", "Create a World")} />
      <PageContent>
        <Box
          display="flex"
          flexDirection="column"
          gap={2}
          maxWidth={600}
          component="form"
          onSubmit={(evt) => {
            evt.preventDefault();
            handleCreate();
          }}
        >
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label={t("worlds.create.name", "Name")}
            value={name}
            onChange={(evt) => setName(evt.target.value)}
            required
          />
          <TextField
            label={t("worlds.create.description", "Description")}
            value={description}
            onChange={(evt) => setDescription(evt.target.value)}
            multiline
            minRows={2}
          />
          <Typography variant="h6" component="p">
            {t("worlds.create.setting-header", "Setting")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t(
              "worlds.create.setting-description",
              "The setting determines which truths your world starts from and where oracle fields look first.",
            )}
          </Typography>
          {settingsLoading ? (
            <LinearProgress />
          ) : (
            <Box display="flex" flexDirection="column" gap={1}>
              {settings.map((setting) => (
                <Card key={setting.key} variant="outlined">
                  <CardActionArea
                    onClick={() => setSettingKey(setting.key)}
                    sx={{ p: 1, display: "flex", alignItems: "center" }}
                  >
                    <Radio checked={settingKey === setting.key} />
                    <Typography>{setting.label}</Typography>
                  </CardActionArea>
                </Card>
              ))}
            </Box>
          )}
          <Box>
            <GradientButton type="submit" disabled={creating}>
              {t("worlds.create.submit", "Create World")}
            </GradientButton>
          </Box>
        </Box>
      </PageContent>
    </>
  );
}
