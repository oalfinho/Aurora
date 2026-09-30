import { Hand, ShieldAlert, Eye, HeartPulse, Brain, Lightbulb, MessageCircle } from 'lucide-react';

export const reportThemes = {
  'Assédio': { color: '#92502d', soft: '#fff4ec', icon: Hand, message: 'Você pode registrar o assédio sem descrever detalhes pessoais.' },
  'Ameaça': { color: '#a43d48', soft: '#fff0f2', icon: ShieldAlert, message: 'Vamos registrar a ameaça. Se houver risco imediato, procure apoio pelo 190.' },
  'Perseguição': { color: '#426799', soft: '#eff5ff', icon: Eye, message: 'Informe apenas uma região ampla, sem revelar sua rotina ou localização atual.' },
  'Violência física': { color: '#a12f54', soft: '#fff0f5', icon: HeartPulse, message: 'Você não precisa detalhar a agressão. Este canal registra relatos e não atende emergências.' },
  'Violência psicológica': { color: '#75518f', soft: '#f7f0fc', icon: Brain, message: 'Você pode registrar a situação sem identificar você ou outras pessoas.' },
  'Falta de iluminação': { color: '#756014', soft: '#fffae8', icon: Lightbulb, message: 'Vamos registrar a percepção sobre iluminação. O envio não abre uma solicitação à prefeitura.' },
  'Outra situação de insegurança': { color: '#296f69', soft: '#edf9f5', icon: MessageCircle, message: 'Vamos registrar sua percepção de insegurança com informações gerais.' },
};
export function reportTheme(category?: string) {
  return reportThemes[category as keyof typeof reportThemes] ?? { color: '#72538e', soft: '#f6f2f9', icon: MessageCircle, message: '' };
}
export const historyColors: Record<string, string> = { all: '#bd5964', vd: '#a12f54', fe: '#654184', te: '#a96620' };
