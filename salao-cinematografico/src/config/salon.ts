/**
 * Dados do Salão Iolanda. Só entra aqui o que o cliente informou;
 * o que falta fica `null` e o site mostra o aviso de pendência (ver docs/PENDENCIAS.md).
 */
export const salon = {
  name: 'Salão Iolanda',
  city: 'Cascavel/PR',
  /** logo oficial ainda não recebida: o cabeçalho usa o nome em texto, sem recriar a marca */
  logo: null as string | null,
  address: 'Rua Castro Alves, 2995 — Cascavel/PR',
  instagram: 'https://www.instagram.com/salaoiolanda/',
  /** número como foi informado; o DDD ainda não foi confirmado */
  phoneDisplay: '3224-7223',
  phoneConfirmed: false,
  /** somente dígitos, com DDI e DDD, ex.: 5545999999999. Fica nulo até o número completo ser confirmado. */
  whatsapp: null as string | null,
  /** horários não informados: não exibir horário inventado */
  hours: null as string | null,
};

export function whatsappLink(message: string) {
  if (!salon.whatsapp) return null;
  return `https://wa.me/${salon.whatsapp}?text=${encodeURIComponent(message)}`;
}

export function mapsLink() {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(salon.address)}`;
}
