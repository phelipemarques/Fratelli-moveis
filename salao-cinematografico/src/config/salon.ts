/**
 * Dados do salão. Nada aqui é informação comercial confirmada:
 * todos os campos `null` aguardam o cliente (ver docs/PENDENCIAS.md).
 * O site não exibe dado inventado; onde o campo falta, mostra o aviso de pendência.
 */
export const salon = {
  /** nome provisório até o cliente enviar nome e logo */
  name: 'Seu Salão',
  logo: null as string | null,
  address: null as string | null,
  /** somente dígitos, com DDI e DDD, ex.: 5545999999999 */
  whatsapp: null as string | null,
  instagram: null as string | null,
  hours: null as string | null,
};

export function whatsappLink(message: string) {
  if (!salon.whatsapp) return null;
  return `https://wa.me/${salon.whatsapp}?text=${encodeURIComponent(message)}`;
}
