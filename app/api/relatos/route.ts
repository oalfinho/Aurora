import {saveReport} from '@/lib/report-store';
import {regions, categories, periods} from '@/lib/report-options';
import {z} from 'zod';

export const runtime = 'nodejs';
const reportSchema = z.object({
  id: z.string().uuid(),
  region: z.string().refine((value) => regions.includes(value)),
  category: z.string().refine((value) => categories.includes(value)),
  period: z.string().refine((value) => periods.includes(value)),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/).refine((value) => value >= '2000-01' && value <= new Date().toISOString().slice(0, 7)),
  consent: z.literal(true),
}).strict();

export async function POST(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return Response.json({error: 'Origem inválida.'}, {status: 403});
  // Bound the streamed body, including requests without Content-Length.
  const reader = request.body?.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    if (reader) {
      while (true) {
        const {done, value} = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 1500) {
          await reader.cancel();
          return Response.json({error: 'Envio muito grande.'}, {status: 413});
        }
        chunks.push(value);
      }
    }
  } catch {
    return Response.json({error: 'Envio interrompido. Tente novamente.'}, {status: 400});
  }
  let parsed;
  try {
    parsed = reportSchema.safeParse(JSON.parse(Buffer.concat(chunks).toString('utf8')));
  } catch {
    return Response.json({error: 'Formato de envio inválido.'}, {status: 400});
  }
  if (!parsed.success) return Response.json({error: 'Confira as opções e o mês do relato.'}, {status: 400});
  const {id, region, category, period, month} = parsed.data;
  const report = {id, region, category, period, month};
  try {
    await saveReport({...report, status: 'pending'});
    return Response.json({id: report.id, status: 'pending'}, {status: 201, headers: {'Cache-Control': 'no-store'}});
  } catch {
    return Response.json({error: 'Não foi possível salvar agora. Suas escolhas continuam aqui. Tente novamente.'}, {status: 503});
  }
}
