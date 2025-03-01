import { IronLinkLogo } from "@/assets/IronLinkLogo";
import { ProgressBar } from "@/components/common/ProgressBar";
import { AuthStatus, useAuthStatus } from "@/stores/auth.store";
import { Container, Heading } from "@chakra-ui/react";
import { useState } from "react";
import { Redirect } from "wouter";

import { pageConfig } from "../pageConfig";
import { EmailSection } from "./EmailSection";
import { NameSection } from "./NameSection";
import { OTPSection } from "./OTPSection";

enum AuthStep {
  Email,
  OTP,
  Name,
}

export default function AuthPage() {
  const [step, setStep] = useState<AuthStep>(AuthStep.Email);
  const [email, setEmail] = useState<string>("");

  const authStatus = useAuthStatus();

  if (authStatus === AuthStatus.Loading) {
    return <ProgressBar />;
  }
  if (authStatus === AuthStatus.Authenticated) {
    return <Redirect to={pageConfig.gameSelect} />;
  }

  return (
    <Container
      display="flex"
      flexGrow={1}
      alignItems="center"
      flexDir={"column"}
      maxW="md"
      pb={8}
      pt={{ base: 8, sm: "10vh" }}
    >
      <IronLinkLogo w={16} h={16} />
      <Heading as="h1" size="2xl" textTransform="uppercase" mt={4}>
        Login or Create an Account
      </Heading>
      {step === AuthStep.Email && (
        <EmailSection
          onComplete={(email) => {
            setStep(AuthStep.OTP);
            setEmail(email);
          }}
        />
      )}
      {step === AuthStep.OTP && (
        <OTPSection email={email} afterVerify={() => setStep(AuthStep.Name)} />
      )}
      {step === AuthStep.Name && <NameSection />}
    </Container>
  );
}
