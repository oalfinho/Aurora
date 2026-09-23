import {saveReport} from '@/lib/report-store';
import {regions,categories,periods} from '@/lib/report-options';
export async function POST(request:Request){
 try{
  const origin=request.headers.get('origin');if(origin && origin!==new URL(request.url).origin)return Response.json({error:'Origem inválida.'},{status:403});
  const raw=await request.text();if(raw.length>1500)return Response.json({error:'Envio muito grande.'},{status:413});
  const p=JSON.parse(raw);const now=new Date().toISOString().slice(0,7);
  if(Object.keys(p).some(k=>!['id','region','category','period','month','consent'].includes(k))||!regions.includes(p.region)||!categories.includes(p.category)||!periods.includes(p.period)||!/^\d{4}-(0[1-9]|1[0-2])$/.test(p.month)||p.month<'2000-01'||p.month>now||p.consent!==true||!/^[-a-f0-9]{36}$/.test(p.id))return Response.json({error:'Confira as opções e o mês do relato.'},{status:400});
  await saveReport({id:p.id,region:p.region,category:p.category,period:p.period,month:p.month,status:'pending'});
  return Response.json({id:p.id,status:'pending'},{status:201,headers:{'Cache-Control':'no-store'}});
 }catch(e){console.error('Report save failed');return Response.json({error:'Não foi possível salvar agora. Suas escolhas continuam aqui. Tente novamente.'},{status:503});}
}
