import data from './site.json';

export interface SocialLink {
  label: string;
  handle: string;
  url: string;
}
export interface NavItem {
  label: string;
  href: string;
}
export interface Stat {
  value: string;
  label: string;
}
export interface ProcessStep {
  no: string;
  title: string;
  text: string;
}
export interface Faq {
  q: string;
  a: string;
}

export interface Site {
  name: string;
  shortName: string;
  role: string;
  location: string;
  email: string;
  domain: string;
  seo: { title: string; description: string; ogImage: string };
  hero: {
    kicker: string;
    headline: string[];
    intro: string;
    scrollLabel: string;
  };
  disciplines: string[];
  about: {
    kicker: string;
    heading: string;
    paragraphs: string[];
    signature: string;
    portrait: string;
    portraitAlt: string;
  };
  stats: Stat[];
  process: ProcessStep[];
  commissions: { kicker: string; heading: string; items: string[] };
  faqs: Faq[];
  socials: SocialLink[];
  nav: NavItem[];
  credits: { year: number; builtNote: string };
}

export const site = data as Site;
export default site;

/** Renders simple *markdown-ish* emphasis (*word*) used in JSON copy. */
export function emphasize(text: string): string {
  return text.replace(
    /\*([^*]+)\*/g,
    '<em class="italic text-accent">$1</em>'
  );
}
