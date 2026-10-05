import { Link, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { PageContent, PageHeader } from "components/Layout";

import {
  PageCategory,
  useSendPageViewEvent,
} from "hooks/useSendPageViewEvents";

// TODO: replace with the address that should receive privacy requests.
const CONTACT_EMAIL = "CONTACT_EMAIL_HERE";
const LAST_UPDATED = "October 4, 2026";

// The policy body is intentionally English-only so there is a single
// authoritative version of the legal text.
export default function PrivacyPolicyPage() {
  const { t } = useTranslation();
  useSendPageViewEvent(PageCategory.Privacy);

  const contactLink = (
    <Link href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Link>
  );

  return (
    <>
      <PageHeader
        label={t("privacy.title", "Privacy Policy")}
        subLabel={`Last updated ${LAST_UPDATED}`}
        maxWidth={"md"}
      />
      <PageContent maxWidth={"md"}>
        <Stack spacing={3} pb={4}>
          <Typography>
            Iron Link is a free, fan-made companion app for the Ironsworn and
            Starforged tabletop roleplaying games. It is run by an independent
            developer, not a company. This page explains what information Iron
            Link collects, why, and what you can do about it. The short version:
            we collect what we need to run the app, we never sell your data, and
            you can ask us to delete it at any time.
          </Typography>

          <Stack spacing={1}>
            <Typography variant={"h6"} component={"h2"}>
              Information we collect
            </Typography>
            <Typography fontWeight={600}>Account information</Typography>
            <Typography component={"ul"} sx={{ m: 0, pl: 3 }}>
              <li>
                <strong>Email address</strong>, used to sign you in with a one
                time password and to identify your account.
              </li>
              <li>
                <strong>Display name</strong>, which you choose. Other players
                in your games and worlds can see it.
              </li>
              <li>
                <strong>Sign-in provider details</strong>. If you sign in with
                Google or Discord, we receive the basic profile those services
                share: your email address, name or username, and profile
                picture. We use your email address to find or create your Iron
                Link account. We do not get access to your contacts, messages,
                servers, or anything else in those accounts.
              </li>
            </Typography>

            <Typography fontWeight={600}>Content you create</Typography>
            <Typography>
              Games, characters, notes, worlds, homebrew, game logs and dice
              rolls, and any images you upload (such as character portraits,
              note images, and world maps). This content is shared with the
              people you play with, according to the sharing settings you
              choose. Uploaded images are stored at public web addresses, so
              anyone who has an image&apos;s link can view it. Please don&apos;t
              upload anything you wouldn&apos;t want others to see.
            </Typography>

            <Typography fontWeight={600}>Usage analytics</Typography>
            <Typography>
              We use PostHog to understand how the app is used and to find bugs.
              When you are signed in, analytics events are linked to your
              account ID (not your email address). We record events such as
              which pages you visit and when you create or delete things, along
              with error reports and basic technical details like your browser,
              device type, and approximate location derived from your IP
              address.
            </Typography>

            <Typography fontWeight={600}>Technical data</Typography>
            <Typography>
              Like any website, our hosting and database providers process your
              IP address and standard request information to deliver the app and
              keep it secure.
            </Typography>
          </Stack>

          <Stack spacing={1}>
            <Typography variant={"h6"} component={"h2"}>
              How we use your information
            </Typography>
            <Typography component={"ul"} sx={{ m: 0, pl: 3 }}>
              <li>To create and secure your account and sign you in.</li>
              <li>
                To save your games and share them with the people you invite.
              </li>
              <li>To fix bugs and decide what to improve.</li>
              <li>
                To respond to support requests and fix problems. When needed, we
                may access your account and its content to investigate an issue.
              </li>
            </Typography>
            <Typography>
              We do not sell your information, show you ads, or use your data
              for advertising.
            </Typography>
          </Stack>

          <Stack spacing={1}>
            <Typography variant={"h6"} component={"h2"}>
              Services we rely on
            </Typography>
            <Typography>
              We share data with these providers only so they can run parts of
              the app for us:
            </Typography>
            <Typography component={"ul"} sx={{ m: 0, pl: 3 }}>
              <li>
                <strong>Supabase</strong>: database, file storage,
                authentication, and sign-in emails.
              </li>
              <li>
                <strong>Cloudflare</strong>: hosting the website.
              </li>
              <li>
                <strong>PostHog</strong>: usage analytics and error reporting.
              </li>
              <li>
                <strong>Google</strong> and <strong>Discord</strong>: only if
                you choose to sign in with them.
              </li>
            </Typography>
            <Typography>
              These providers may store data in countries other than your own,
              including the United States.
            </Typography>
          </Stack>

          <Stack spacing={1}>
            <Typography variant={"h6"} component={"h2"}>
              Cookies and local storage
            </Typography>
            <Typography>
              Iron Link stores a sign-in token in your browser so you stay
              logged in, along with your app preferences (such as accessibility
              settings). PostHog stores an identifier so it can group your
              analytics events together. We do not use advertising or cross-site
              tracking cookies.
            </Typography>
          </Stack>

          <Stack spacing={1}>
            <Typography variant={"h6"} component={"h2"}>
              How long we keep your data
            </Typography>
            <Typography>
              We keep your account and content for as long as your account
              exists. When an account is deleted, its characters, notes, and
              other personal content are deleted with it. Entries you made in
              shared game logs may remain, but they will no longer be linked to
              you. Analytics data is kept according to PostHog&apos;s retention
              settings.
            </Typography>
          </Stack>

          <Stack spacing={1}>
            <Typography variant={"h6"} component={"h2"}>
              Your choices and rights
            </Typography>
            <Typography>
              You can change your display name and edit or delete your content
              in the app at any time. To get a copy of your data, correct it, or
              delete your account, email {contactLink}. Depending on where you
              live, you may have additional rights under laws such as the GDPR
              or CCPA, and we will honor those requests.
            </Typography>
          </Stack>

          <Stack spacing={1}>
            <Typography variant={"h6"} component={"h2"}>
              Children
            </Typography>
            <Typography>
              Iron Link is not directed at children under 13, and we do not
              knowingly collect information from them. If you believe a child
              has created an account, contact us and we will delete it.
            </Typography>
          </Stack>

          <Stack spacing={1}>
            <Typography variant={"h6"} component={"h2"}>
              Changes to this policy
            </Typography>
            <Typography>
              If we make meaningful changes, we will update the date at the top
              of this page and announce them in the app or the Iron Link
              community.
            </Typography>
          </Stack>

          <Stack spacing={1}>
            <Typography variant={"h6"} component={"h2"}>
              Contact
            </Typography>
            <Typography>Questions or requests: {contactLink}</Typography>
          </Stack>
        </Stack>
      </PageContent>
    </>
  );
}
