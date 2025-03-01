import { ProgressBar } from "@/components/common/ProgressBar";
import { useAuthTranslations } from "@/hooks/i18n/useAuthTranslations";
import { useContinueQueryParam } from "@/hooks/useContinueQueryParam";
import { useUID } from "@/stores/auth.store";
import { useUserNameWithStatus, useUsersStore } from "@/stores/users.store";
import { Box, Button, Field, Input } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Redirect, useLocation } from "wouter";
import { z } from "zod";

import { pageConfig } from "../pageConfig";

const nameSchema = z.object({
  name: z.string(),
});
type NameFormData = z.infer<typeof nameSchema>;

export function NameSection() {
  const t = useAuthTranslations();
  const continuePath = useContinueQueryParam();

  const uid = useUID();

  const navigate = useLocation()[1];

  const usersName = useUserNameWithStatus(uid ?? null);
  const updateName = useUsersStore((store) => store.setUserName);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<NameFormData>({
    resolver: zodResolver(nameSchema),
  });

  const onSubmit = handleSubmit((data) => {
    return new Promise((resolve, reject) => {
      const newName = data.name;
      if (!uid) {
        reject(new Error("UID is required"));
        return;
      }
      updateName(uid, newName)
        .then(() => {
          navigate(continuePath ?? pageConfig.gameSelect);
          resolve(null);
        })
        .catch((e) => {
          console.error(e);
          reject(e);
        });
    });
  });

  console.debug(uid, usersName);

  if (usersName.loading) {
    return <ProgressBar />;
  }

  if (usersName.name) {
    return <Redirect to={continuePath ?? pageConfig.gameSelect} />;
  }

  return (
    <Box w="100%" as="form" mt={12} onSubmit={onSubmit}>
      <Field.Root
        mt={4}
        required
        invalid={!!errors.name}
        disabled={isSubmitting}
      >
        <Field.Label>
          {t("nameSection.name-input", "Display Name")}
          <Field.RequiredIndicator />
        </Field.Label>
        <Input required {...register("name")} />
        {errors.name && (
          <Field.ErrorText>{errors.name.message}</Field.ErrorText>
        )}
      </Field.Root>
      <Button type="submit" mt={6} w="100%" loading={isSubmitting}>
        {t("nameSection.start-playing", "Start Playing")}
      </Button>
    </Box>
  );
}
