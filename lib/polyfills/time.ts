export function installTimeUppercase() {
  try {
    const orig = Date.prototype.toLocaleTimeString;
    // Avoid double-install
    if ((orig as any)?._orvion_uppercase_installed) return;
    const wrapped = function (this: Date, locales?: any, options?: any) {
      const v = orig.call(this, locales as any, options as any);
      try {
        if (typeof v === "string") return v.replace(/\b(am|pm)\b/gi, (m) => m.toUpperCase());
      } catch (e) {
        // ignore
      }
      return v;
    } as any;
    (wrapped as any)._orvion_uppercase_installed = true;
    Date.prototype.toLocaleTimeString = wrapped as any;
  } catch (e) {
    // noop
  }
}
