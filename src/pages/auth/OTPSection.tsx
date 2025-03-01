import { PinInput } from "@/components/ui/pin-input";
import { useAuthTranslations } from "@/hooks/i18n/useAuthTranslations";
import { useAuthStore } from "@/stores/auth.store";
import { Alert, Box, Button, Field, Link } from "@chakra-ui/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const otpSchema = z.object({
  code: z.string().length(6),
});
type OTPFormData = z.infer<typeof otpSchema>;

export interface OTPSectionProps {
  email: string;
  afterVerify: () => void;
}

export function OTPSection(props: OTPSectionProps) {
  const { email, afterVerify } = props;

  const t = useAuthTranslations();
  const verifyOTP = useAuthStore((state) => state.verifyOTPCode);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<OTPFormData>({
    resolver: zodResolver(otpSchema),
  });

  const onSubmit = handleSubmit((data) => {
    return new Promise((resolve, reject) => {
      const otp = data.code;
      verifyOTP(email, otp)
        .then(() => {
          afterVerify();
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
            In a local environment, emails are sent to fake inboxes. You can
            check the inbox for {email} to get the OTP{" "}
            <Link href={`http://localhost:54324/m/${email}`} target="_blank">
              here
            </Link>
            .
          </Alert.Description>
        </Alert.Content>
      </Alert.Root>
      <Field.Root
        mt={4}
        required
        invalid={!!errors.code}
        disabled={isSubmitting}
      >
        <Field.Label>
          {t("codeSection.code-input", "One Time Passcode")}
          <Field.RequiredIndicator />
        </Field.Label>
        <PinInput count={6} required {...register("code")} />
        {errors.code && (
          <Field.ErrorText>{errors.code.message}</Field.ErrorText>
        )}
      </Field.Root>
      <Button type="submit" mt={6} w="100%" loading={isSubmitting}>
        {t("codeSection.continue", "Continue")}
      </Button>
    </Box>
  );
}
