const FMT = new Intl.NumberFormat("fr-FR");
export const formatMoney = (v) =>
  v === null || v === undefined || v === "" ? "—" : `${FMT.format(Number(v))} FCFA`;
