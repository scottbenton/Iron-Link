import { Trans, useTranslation } from "react-i18next";

import { Link } from "ui/components/Link";
import { Text } from "ui/components/Text";
import { PageContent, PageHeader } from "ui/layout";
import { Stack } from "ui/primitives";

import { useDocumentTitle } from "hooks/useDocumentTitle";
import {
  PageCategory,
  useSendPageViewEvent,
} from "hooks/useSendPageViewEvents";

import { SUPPORT_EMAIL } from "lib/support.lib";

import { PolicyList } from "./components/PolicyList";
import { PolicySection } from "./components/PolicySection";

const LAST_UPDATED = "October 4, 2026";

export default function PrivacyPolicyPage() {
  const { t } = useTranslation();
  useDocumentTitle(t("privacy.title", "Privacy Policy"));
  useSendPageViewEvent(PageCategory.Privacy);

  const contactComponents = {
    contact: <Link href={`mailto:${SUPPORT_EMAIL}`} />,
  };
  const strong = { strong: <strong /> };

  return (
    <>
      <PageHeader
        maxWidth="md"
        title={t("privacy.title", "Privacy Policy")}
        subtitle={t("privacy.last-updated", "Last updated {{date}}", {
          date: LAST_UPDATED,
        })}
      />
      <PageContent maxWidth="md">
        <Stack gap="6" paddingBlockEnd="8">
          <Text>
            {t(
              "privacy.intro",
              "Iron Link is a free, fan-made companion app for the Ironsworn and Starforged tabletop roleplaying games. It is run by an independent developer, not a company. This page explains what information Iron Link collects, why, and what you can do about it. The short version: we collect what we need to run the app, we never sell your data, and you can ask us to delete it at any time.",
            )}
          </Text>

          <PolicySection
            title={t("privacy.collect.title", "Information we collect")}
          >
            <Text weight="semibold">
              {t("privacy.collect.account.title", "Account information")}
            </Text>
            <PolicyList>
              <li>
                <Trans
                  i18nKey="privacy.collect.account.email"
                  defaults="<strong>Email address</strong>, used to sign you in with a one time password and to identify your account."
                  components={strong}
                />
              </li>
              <li>
                <Trans
                  i18nKey="privacy.collect.account.display-name"
                  defaults="<strong>Display name</strong>, which you choose. Other players in your games and worlds can see it."
                  components={strong}
                />
              </li>
              <li>
                <Trans
                  i18nKey="privacy.collect.account.provider"
                  defaults="<strong>Sign-in provider details</strong>. If you sign in with Google or Discord, we receive the basic profile those services share: your email address, name or username, and profile picture. We use your email address to find or create your Iron Link account. We do not get access to your contacts, messages, servers, or anything else in those accounts."
                  components={strong}
                />
              </li>
            </PolicyList>

            <Text weight="semibold">
              {t("privacy.collect.content.title", "Content you create")}
            </Text>
            <Text>
              {t(
                "privacy.collect.content.body",
                "Games, characters, notes, worlds, homebrew, game logs and dice rolls, and any images you upload (such as character portraits, note images, and world maps). This content is shared with the people you play with, according to the sharing settings you choose. Uploaded images are stored at public web addresses, so anyone who has an image's link can view it. Please don't upload anything you wouldn't want others to see.",
              )}
            </Text>

            <Text weight="semibold">
              {t("privacy.collect.analytics.title", "Usage analytics")}
            </Text>
            <Text>
              {t(
                "privacy.collect.analytics.body",
                "We use PostHog to understand how the app is used and to find bugs. When you are signed in, analytics events are linked to your account ID (not your email address). We record events such as which pages you visit and when you create or delete things, along with error reports and basic technical details like your browser, device type, and approximate location derived from your IP address.",
              )}
            </Text>

            <Text weight="semibold">
              {t("privacy.collect.technical.title", "Technical data")}
            </Text>
            <Text>
              {t(
                "privacy.collect.technical.body",
                "Like any website, our hosting and database providers process your IP address and standard request information to deliver the app and keep it secure.",
              )}
            </Text>
          </PolicySection>

          <PolicySection
            title={t("privacy.use.title", "How we use your information")}
          >
            <PolicyList>
              <li>
                {t(
                  "privacy.use.account",
                  "To create and secure your account and sign you in.",
                )}
              </li>
              <li>
                {t(
                  "privacy.use.games",
                  "To save your games and share them with the people you invite.",
                )}
              </li>
              <li>
                {t(
                  "privacy.use.improve",
                  "To fix bugs and decide what to improve.",
                )}
              </li>
              <li>
                {t(
                  "privacy.use.support",
                  "To respond to support requests and fix problems. When needed, we may access your account and its content to investigate an issue.",
                )}
              </li>
            </PolicyList>
            <Text>
              {t(
                "privacy.use.no-selling",
                "We do not sell your information, show you ads, or use your data for advertising.",
              )}
            </Text>
          </PolicySection>

          <PolicySection
            title={t("privacy.services.title", "Services we rely on")}
          >
            <Text>
              {t(
                "privacy.services.intro",
                "We share data with these providers only so they can run parts of the app for us:",
              )}
            </Text>
            <PolicyList>
              <li>
                <Trans
                  i18nKey="privacy.services.supabase"
                  defaults="<strong>Supabase</strong>: database, file storage, authentication, and sign-in emails."
                  components={strong}
                />
              </li>
              <li>
                <Trans
                  i18nKey="privacy.services.cloudflare"
                  defaults="<strong>Cloudflare</strong>: hosting the website."
                  components={strong}
                />
              </li>
              <li>
                <Trans
                  i18nKey="privacy.services.posthog"
                  defaults="<strong>PostHog</strong>: usage analytics and error reporting."
                  components={strong}
                />
              </li>
              <li>
                <Trans
                  i18nKey="privacy.services.sign-in"
                  defaults="<strong>Google</strong> and <strong>Discord</strong>: only if you choose to sign in with them."
                  components={strong}
                />
              </li>
            </PolicyList>
            <Text>
              {t(
                "privacy.services.location",
                "These providers may store data in countries other than your own, including the United States.",
              )}
            </Text>
          </PolicySection>

          <PolicySection
            title={t("privacy.storage.title", "Cookies and local storage")}
          >
            <Text>
              {t(
                "privacy.storage.body",
                "Iron Link stores a sign-in token in your browser so you stay logged in, along with your app preferences (such as accessibility settings). PostHog stores an identifier so it can group your analytics events together. We do not use advertising or cross-site tracking cookies.",
              )}
            </Text>
          </PolicySection>

          <PolicySection
            title={t("privacy.retention.title", "How long we keep your data")}
          >
            <Text>
              {t(
                "privacy.retention.body",
                "We keep your account and content for as long as your account exists. When an account is deleted, its characters, notes, and other personal content are deleted with it. Entries you made in shared game logs may remain, but they will no longer be linked to you. Analytics data is kept according to PostHog's retention settings.",
              )}
            </Text>
          </PolicySection>

          <PolicySection
            title={t("privacy.rights.title", "Your choices and rights")}
          >
            <Text>
              <Trans
                i18nKey="privacy.rights.body"
                defaults="You can change your display name and edit or delete your content in the app at any time. To get a copy of your data, correct it, or delete your account, email <contact>{{email}}</contact>. Depending on where you live, you may have additional rights under laws such as the GDPR or CCPA, and we will honor those requests."
                values={{ email: SUPPORT_EMAIL }}
                components={contactComponents}
              />
            </Text>
          </PolicySection>

          <PolicySection title={t("privacy.children.title", "Children")}>
            <Text>
              {t(
                "privacy.children.body",
                "Iron Link is not directed at children under 13, and we do not knowingly collect information from them. If you believe a child has created an account, contact us and we will delete it.",
              )}
            </Text>
          </PolicySection>

          <PolicySection
            title={t("privacy.changes.title", "Changes to this policy")}
          >
            <Text>
              {t(
                "privacy.changes.body",
                "If we make meaningful changes, we will update the date at the top of this page and announce them in the app or the Iron Link community.",
              )}
            </Text>
          </PolicySection>

          <PolicySection title={t("privacy.contact.title", "Contact")}>
            <Text>
              <Trans
                i18nKey="privacy.contact.body"
                defaults="Questions or requests: <contact>{{email}}</contact>"
                values={{ email: SUPPORT_EMAIL }}
                components={contactComponents}
              />
            </Text>
          </PolicySection>
        </Stack>
      </PageContent>
    </>
  );
}
