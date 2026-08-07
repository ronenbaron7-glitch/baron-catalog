/* חישוב מחירי מדרגות כמות — מודול משותף לחנות ולבדיקות.
   בדפדפן נטען כ-<script> ומייצא ל-window.BaronPricing.
   תחת Node נטען עם require() ומייצא דרך module.exports. */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BaronPricing = api;
})(typeof self !== 'undefined' ? self : this, function () {

  var VALID_MODES = { price: true, percent: true };

  function round2(n) { return Math.round((n + Number.EPSILON) * 100) / 100; }

  /* "₪4.64" -> 4.64 ; "לפי בקשה" -> 0 */
  function basePrice(priceStr) {
    var n = parseFloat(String(priceStr == null ? '' : priceStr).replace(/[^0-9.]/g, ''));
    return isFinite(n) && n > 0 ? n : 0;
  }

  function sortTiers(tiers) {
    return (Array.isArray(tiers) ? tiers.slice() : []).sort(function (a, b) {
      return a.qty - b.qty;
    });
  }

  function resolveTiers(product, tierSets) {
    var p = product || {};
    if (Array.isArray(p.tiers) && p.tiers.length) return sortTiers(p.tiers);
    var id = p.tierSet || '';
    if (!id || !Array.isArray(tierSets)) return [];
    for (var i = 0; i < tierSets.length; i++) {
      if (tierSets[i] && tierSets[i].id === id) return sortTiers(tierSets[i].tiers);
    }
    return [];
  }

  /* המדרגה הגבוהה ביותר שהסף שלה <= הכמות. null = מחיר בסיס. */
  function pickTier(tiers, qty) {
    var sorted = sortTiers(tiers), found = null;
    for (var i = 0; i < sorted.length; i++) {
      if (sorted[i].qty <= qty) found = sorted[i]; else break;
    }
    return found;
  }

  function unitPrice(tier, base) {
    if (!tier) return base;
    var mode = VALID_MODES[tier.mode] ? tier.mode : 'price';
    /* אחוז מעל 100 נחסם ב-0 ולא הופך למחיר שלילי. השרת גוזם ל-100 בשמירה,
       אז זה רלוונטי רק ל-tiers.json שנערך ידנית. */
    if (mode === 'percent') return Math.max(0, round2(base * (1 - tier.value / 100)));
    return round2(tier.value);
  }

  /* ההנחה בפועל מול מחיר הבסיס — זהה בשני המצבים. */
  function savingsPercent(unit, base) {
    if (!base || unit >= base) return 0;
    return Math.round((1 - unit / base) * 100);
  }

  /* ערכי הצ'יפס: 1 (מחיר בסיס) ואחריו כל סף מדרגה. */
  function quantityOptions(tiers) {
    var sorted = sortTiers(tiers);
    if (!sorted.length) return [];
    var out = [1];
    for (var i = 0; i < sorted.length; i++) {
      if (out.indexOf(sorted[i].qty) === -1) out.push(sorted[i].qty);
    }
    return out;
  }

  function formatMoney(n) {
    var v = round2(n);
    return '₪' + (v % 1 === 0 ? String(v) : v.toFixed(2));
  }

  return {
    basePrice: basePrice,
    sortTiers: sortTiers,
    resolveTiers: resolveTiers,
    pickTier: pickTier,
    unitPrice: unitPrice,
    savingsPercent: savingsPercent,
    quantityOptions: quantityOptions,
    formatMoney: formatMoney
  };
});
