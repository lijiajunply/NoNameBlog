export function isGaEnabled() {
  return Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim());
}

export function trackPageView(path: string, title?: string) {
  if (typeof window === "undefined") {
    return;
  }

  const gtag = (window as Window & {
    gtag?: (...args: unknown[]) => void;
  }).gtag;
  if (!gtag) {
    return;
  }

  gtag("event", "page_view", {
    page_path: path,
    page_title: title,
  });
}
