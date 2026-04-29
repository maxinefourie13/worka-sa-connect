import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

const SITE_NAME = 'Sjoh'
const SITE_URL = 'https://sjoh.co.za'

const EarlyAccessProEmail = () => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>First dibs when Sjoh opens its doors — your free month is locked in</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={brandSection}>
          <Text style={wordmark}>
            sjoh<span style={dot}>.</span>co<span style={dot}>.</span>za
          </Text>
        </Section>

        <Heading style={h1}>You're in, ous.</Heading>

        <Text style={lead}>
          Welkom to the Founding Pros list. You're officially first-in-line when
          we open the doors — and your perks are locked in.
        </Text>

        <Section style={perksBox}>
          <Text style={perkLine}>
            <span style={tick}>✓</span> An extra month free, on top of your 30-day trial
          </Text>
          <Text style={perkLine}>
            <span style={tick}>✓</span> Founding Pro badge on your profile — clients see it first
          </Text>
          <Text style={perkLine}>
            <span style={tick}>✓</span> First-in-line for vetting & verification
          </Text>
        </Section>

        <Heading as="h2" style={h2}>What happens next?</Heading>
        <Text style={text}>
          We'll holla the moment Sjoh goes live — usually with a heads-up a day
          or two before so you can claim your spot before the rush. No spam in
          between, just the important stuff.
        </Text>

        <Text style={text}>
          In the meantime, sharpen up that pitch. Sjoh is built for ous who do the
          graft properly — no commission games, no middlemen, just clients
          finding the right person for the job.
        </Text>

        <Text style={signoff}>
          Sharp,<br />
          The {SITE_NAME} team
        </Text>

        <Text style={footer}>
          You're getting this because you signed up for early access at{' '}
          <a href={SITE_URL} style={link}>sjoh.co.za</a>.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: EarlyAccessProEmail,
  subject: "You're on the list, ous — your free month is locked in",
  displayName: 'Early access — Pro welcome',
  previewData: {},
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif',
  margin: 0,
  padding: 0,
}
const container = {
  maxWidth: '560px',
  margin: '0 auto',
  padding: '32px 28px 40px',
}
const brandSection = { textAlign: 'center' as const, margin: '0 0 28px' }
const wordmark = {
  fontSize: '24px',
  fontWeight: 800,
  letterSpacing: '-0.02em',
  color: '#0f0f10',
  margin: 0,
}
const dot = { color: '#e8665a' }
const h1 = {
  fontSize: '32px',
  fontWeight: 800,
  letterSpacing: '-0.02em',
  color: '#0f0f10',
  lineHeight: 1.15,
  margin: '0 0 16px',
}
const h2 = {
  fontSize: '18px',
  fontWeight: 800,
  letterSpacing: '-0.01em',
  color: '#0f0f10',
  margin: '28px 0 8px',
}
const lead = {
  fontSize: '16px',
  color: '#3a3a3d',
  lineHeight: 1.55,
  margin: '0 0 24px',
}
const text = {
  fontSize: '15px',
  color: '#3a3a3d',
  lineHeight: 1.6,
  margin: '0 0 16px',
}
const perksBox = {
  backgroundColor: '#fff5f4',
  border: '1px solid #fad5d1',
  borderRadius: '14px',
  padding: '18px 20px',
  margin: '8px 0 24px',
}
const perkLine = {
  fontSize: '15px',
  color: '#0f0f10',
  fontWeight: 600,
  lineHeight: 1.5,
  margin: '6px 0',
}
const tick = {
  color: '#e8665a',
  fontWeight: 800,
  marginRight: '8px',
}
const signoff = {
  fontSize: '15px',
  color: '#0f0f10',
  lineHeight: 1.5,
  margin: '28px 0 24px',
}
const footer = {
  fontSize: '12px',
  color: '#888888',
  lineHeight: 1.5,
  margin: '24px 0 0',
  borderTop: '1px solid #eeeeee',
  paddingTop: '16px',
}
const link = { color: '#e8665a', textDecoration: 'underline' }
