import { useAuthTranslations } from "@/hooks/i18n/useAuthTranslations";
import { useAuthStore } from "@/stores/auth.store";
import { Alert, Box, Button, Field, Input } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const emailSchema = z.object({
  email: z.string().email(),
});
type EmailFormData = z.infer<typeof emailSchema>;

interface EmailSectionProps {
  onComplete: (email: string) => void;
}

export function EmailSection(props: EmailSectionProps) {
  const { onComplete } = props;

  const t = useAuthTranslations();
  const requestOTP = useAuthStore((state) => state.sendOTPCodeToEmail);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = handleSubmit((data) => {
    return new Promise((resolve, reject) => {
      const email = data.email;
      requestOTP(email)
        .then(() => {
          onComplete(email);
          resolve(null);
        })
        .catch((e) => {
          console.error(e);
          reject(e);
        });
    });
  });

  return (
    <Box w="100%" as="form" mt={12} onSubmit={onSubmit}>
      <Alert.Root status="info">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Description>
            {t(
              "emailSection.email-delivery-info",
              "Iron Link will send a one time password to your email. ",
            )}
          </Alert.Description>
        </Alert.Content>
      </Alert.Root>
      <Field.Root
        mt={4}
        required
        invalid={!!errors.email}
        disabled={isSubmitting}
      >
        <Field.Label>
          {t("emailSection.email-address", "Email Address")}
          <Field.RequiredIndicator />
        </Field.Label>
        <Input type="email" required {...register("email")} />
        {errors.email && (
          <Field.ErrorText>{errors.email.message}</Field.ErrorText>
        )}
      </Field.Root>
      <Button type="submit" mt={6} w="100%" loading={isSubmitting}>
        {t("emailSection.continue", "Continue")}
      </Button>
    </Box>
  );
}
