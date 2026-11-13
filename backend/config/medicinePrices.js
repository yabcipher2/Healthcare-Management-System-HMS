// Pharmacy billing tariff.
//
// Doctors write prescription lines with a drug name only (no price), and the
// seeded stock rows do not all carry a price. Without a server-side tariff
// every pharmacy bill totals 0.00 ETB and the cashier cannot take payment, so
// prices are resolved here: live stock tariff first, then this catalogue.
const DEFAULT_MEDICINE_PRICE = 100;

const MEDICINE_TARIFF = [
  { match: /paracetamol|panadol/i, price: 25 },
  { match: /amoxicillin/i, price: 45 },
  { match: /azithromycin/i, price: 185 },
  { match: /omeprazole/i, price: 85 },
  { match: /metformin/i, price: 150 },
  { match: /atorvastatin/i, price: 410 },
  { match: /losartan/i, price: 260 },
  { match: /metronidazole/i, price: 60 },
  { match: /ciprofloxacin/i, price: 120 },
  { match: /ceftriaxone/i, price: 320 },
  { match: /salbutamol/i, price: 240 },
  { match: /insulin/i, price: 950 },
  { match: /ibuprofen/i, price: 30 },
  { match: /diclofenac/i, price: 45 },
  { match: /amlodipine/i, price: 95 },
  { match: /cotrimoxazole/i, price: 55 },
];

const firstToken = (value) =>
  String(value || "")
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter(Boolean)[0] || "";

const tariffPrice = (name) =>
  MEDICINE_TARIFF.find((entry) => entry.match.test(String(name || "")))?.price ??
  DEFAULT_MEDICINE_PRICE;

// Same drug can be spelled "Amoxicillin" in stock and
// "Amoxicillin 500mg Capsules" on the prescription, so match on the drug name.
const medicinePrice = (name, inventory = []) => {
  const token = firstToken(name);
  if (token) {
    const stockItem = inventory.find(
      (item) => firstToken(item.name) === token && Number(item.price) > 0,
    );
    if (stockItem) return Number(stockItem.price);
  }
  return tariffPrice(name);
};

const lineQuantity = (line) => {
  const quantity = Number(line?.quantity) || Number(line?.quantityRequired) || 0;
  return quantity > 0 ? quantity : 1;
};

// Returns billable lines (price + quantity + lineTotal) and the invoice total.
const resolveMedicationLines = (medications = [], inventory = []) => {
  const lines = (Array.isArray(medications) ? medications : []).map((line) => {
    const quantity = lineQuantity(line);
    const storedPrice = Number(line.price);
    const price =
      storedPrice > 0 ? storedPrice : medicinePrice(line.name, inventory);
    return {
      ...line,
      quantity,
      price,
      lineTotal: Number((price * quantity).toFixed(2)),
    };
  });

  const totalAmount = Number(
    lines.reduce((sum, line) => sum + line.lineTotal, 0).toFixed(2),
  );

  return { lines, totalAmount };
};

module.exports = {
  DEFAULT_MEDICINE_PRICE,
  MEDICINE_TARIFF,
  medicinePrice,
  resolveMedicationLines,
};
