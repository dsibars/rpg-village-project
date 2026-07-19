/**
 * Mobile context: vertical smartphone viewport.
 */
export default {
  name: 'mobile',
  label: 'Mobile Browser Vertical (390x844)',
  viewport: { width: 390, height: 844 },
  browserContextOptions: {
    userAgent:
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  },
}
