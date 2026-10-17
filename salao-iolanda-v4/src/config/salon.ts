/**
 * Dados comerciais do Salão Iolanda, num lugar só.
 *
 * Tudo aqui foi informado pelo cliente ou aparece no Instagram oficial.
 * O que não foi informado (horários, preços, equipe, logo em arquivo, fotos
 * autorizadas) fica `null` ou vazio e o site não inventa: mostra a orientação
 * de consultar o salão ou um espaço reservado identificado como tal.
 *
 * Este arquivo é lido em dois momentos: no build (gera o HTML estático das
 * seções, que existe mesmo sem JavaScript) e no navegador.
 */

export const salon = {
  name: 'Salão Iolanda',
  category: 'Salão de Beleza e Estética',
  address: {
    street: 'Rua Castro Alves, 2995',
    city: 'Cascavel',
    region: 'PR',
    regionName: 'Paraná',
    country: 'BR',
  },
  phone: {
    display: '(45) 3224-7223',
    e164: '+554532247223',
  },
  /** somente dígitos, com DDI e DDD. Confirmar que o número recebe WhatsApp antes de publicar. */
  whatsapp: '554532247223',
  instagram: { handle: '@salaoiolanda', url: 'https://www.instagram.com/salaoiolanda/' },
  /** horários não informados: o site orienta a consultar pelo WhatsApp */
  hours: null as string | null,
  /** logo oficial ainda não recebida em arquivo; enquanto for null o cabeçalho usa o nome em texto */
  logo: null as string | null,
};

export const messages = {
  default: 'Olá! Vim pelo site do Salão Iolanda e gostaria de agendar um horário.',
  cabelo: 'Olá! Gostaria de informações sobre agendamento de cabelo.',
  unhas: 'Olá! Gostaria de agendar um serviço de unhas.',
  maquiagem: 'Olá! Gostaria de informações sobre maquiagem.',
  depilacao: 'Olá! Gostaria de informações sobre agendamento de depilação.',
  estetica: 'Olá! Gostaria de informações sobre os serviços de estética.',
} as const;

export type MessageKey = keyof typeof messages;

export function whatsappLink(key: MessageKey = 'default') {
  return `https://wa.me/${salon.whatsapp}?text=${encodeURIComponent(messages[key])}`;
}

export function mapsLink() {
  const q = `${salon.name}, ${salon.address.street}, ${salon.address.city} - ${salon.address.region}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

export function telLink() {
  return `tel:${salon.phone.e164}`;
}

/**
 * Serviços divulgados no Instagram (destaques e categorias do perfil).
 * Descrições curtas e factuais: sem preço, sem promessa de resultado,
 * sem procedimento que o salão não tenha divulgado.
 */
export interface Service {
  id: string;
  title: string;
  items: string[];
  text: string;
  message: MessageKey;
  cta: string;
  /** foto autorizada do salão; null = espaço reservado identificado */
  photo: string | null;
  photoAlt: string;
}

export const services: Service[] = [
  {
    id: 'cabelo',
    title: 'Cabelo',
    items: ['Cortes', 'Penteados', 'Hidratação', 'Progressiva', 'Mechas'],
    text: 'Do corte ao penteado para uma ocasião especial, com cuidado em cada etapa.',
    message: 'cabelo',
    cta: 'Agendar cabelo',
    photo: null,
    photoAlt: 'Trabalho de cabelo realizado no Salão Iolanda',
  },
  {
    id: 'unhas',
    title: 'Manicure e pedicure',
    items: ['Manicure', 'Pedicure'],
    text: 'Mãos e pés cuidados com atenção, do preparo ao acabamento do esmalte.',
    message: 'unhas',
    cta: 'Agendar unhas',
    photo: null,
    photoAlt: 'Unhas feitas no Salão Iolanda',
  },
  {
    id: 'maquiagem',
    title: 'Maquiagem',
    items: ['Maquiagem'],
    text: 'Produção para eventos, festas e ocasiões especiais.',
    message: 'maquiagem',
    cta: 'Falar sobre maquiagem',
    photo: null,
    photoAlt: 'Maquiagem feita no Salão Iolanda',
  },
  {
    id: 'depilacao',
    title: 'Depilação',
    items: ['Depilação'],
    text: 'Horário combinado diretamente com o salão, pelo WhatsApp.',
    message: 'depilacao',
    cta: 'Agendar depilação',
    photo: null,
    photoAlt: 'Ambiente de atendimento do Salão Iolanda',
  },
  {
    id: 'estetica',
    title: 'Estética',
    items: ['Estética'],
    text: 'Cuidados de estética no mesmo endereço. Consulte os serviços disponíveis.',
    message: 'estetica',
    cta: 'Consultar estética',
    photo: null,
    photoAlt: 'Atendimento de estética no Salão Iolanda',
  },
];

/** destaques capilares divulgados no Instagram */
export const hairHighlights = ['Cortes', 'Penteados', 'Hidratação', 'Progressiva', 'Mechas'];

/**
 * Portfólio. Cada item vira um quadro da galeria e do lightbox.
 * Enquanto `src` for null o quadro aparece como espaço reservado, com o aviso
 * "foto autorizada pendente": nenhuma imagem ilustrativa é apresentada como
 * trabalho do salão. Para publicar: coloque o arquivo em public/portfolio/,
 * preencha `src`, `alt` e `caption`, e confirme a autorização da cliente.
 */
export interface PortfolioItem {
  src: string | null;
  category: 'Cabelos' | 'Penteados' | 'Maquiagem' | 'Unhas' | 'Outros';
  caption: string;
  alt: string;
  /** proporção do quadro: retrato (padrão), alto ou quadrado */
  shape?: 'tall' | 'square';
}

export const portfolio: PortfolioItem[] = [
  { src: null, category: 'Cabelos', caption: 'Mechas', alt: 'Mechas feitas no Salão Iolanda', shape: 'tall' },
  { src: null, category: 'Penteados', caption: 'Penteado para evento', alt: 'Penteado feito no Salão Iolanda' },
  { src: null, category: 'Cabelos', caption: 'Corte e finalização', alt: 'Corte e finalização no Salão Iolanda', shape: 'square' },
  { src: null, category: 'Maquiagem', caption: 'Maquiagem', alt: 'Maquiagem feita no Salão Iolanda' },
  { src: null, category: 'Cabelos', caption: 'Progressiva', alt: 'Progressiva feita no Salão Iolanda', shape: 'tall' },
  { src: null, category: 'Unhas', caption: 'Manicure', alt: 'Unhas feitas no Salão Iolanda', shape: 'square' },
  { src: null, category: 'Penteados', caption: 'Penteado', alt: 'Penteado feito no Salão Iolanda' },
  { src: null, category: 'Cabelos', caption: 'Hidratação', alt: 'Cabelo após hidratação no Salão Iolanda' },
];
