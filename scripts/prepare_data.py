"""python scripts/prepare_data.py <HTML recebido> <CSV formulário>.
Não distribui respostas individuais. Reprocessamento determinístico sem rede.
"""
import sys,json,csv,re,math,unicodedata,collections,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[1]
s=Path(sys.argv[1]).read_text(); rows=list(csv.reader(Path(sys.argv[2]).open()))[1:]
d=json.JSONDecoder().raw_decode(s.split('window.__DADOS__ =',1)[1].lstrip())[0]
rc=[x for x in d['bairros'] if x['c'].strip().upper()=='RIO CLARO'];ng=[x for x in d['cidades_ng'] if x['c']=='RIO CLARO']
geo=json.JSONDecoder().raw_decode(s[s.index('{"type":"FeatureCollection"'):])[0]
boundary=next(x for x in geo['features'] if x['properties']['n']=='Rio Claro')
norm=lambda v:unicodedata.normalize('NFKD',v).encode('ascii','ignore').decode().lower().strip()
groups={}; rural=0
for x in rc:
 if 'rural' in norm(x['b']):rural+=sum(x[k] for k in ['vd','fe','te']);continue
 key=(math.floor(x['lat']*100),math.floor(x['lng']*100))
 g=groups.setdefault(key,dict(id=f'{key[0]}_{key[1]}',lat=(key[0]+.5)/100,lng=(key[1]+.5)/100,vd=0,fe=0,te=0,names={}))
 g['names'][x['b']]=g['names'].get(x['b'],0)+sum(x[k] for k in ['vd','fe','te'])
 for k in ['vd','fe','te']:g[k]+=x[k]
for g in groups.values():
 g['label']=max(g['names'],key=g['names'].get).title()+' e arredores';del g['names']
# Publish only cells with at least five records; category-specific map also uses threshold five.
cells=[dict(x,total=x['vd']+x['fe']+x['te']) for x in groups.values() if x['vd']+x['fe']+x['te']>=5]
regions=[('Bela Vista','bela vista','BELA VISTA'),('Centro','centro','CENTRO'),('Vila Alemã','vila alema','VILA ALEMÃ'),('Vila Indaiá','vila indaia','VILA INDAIA')]
perception=[]
for name,alias,source in regions:
 n=sum(alias in norm(r[11]) or (name=='Centro' and norm(r[11])=='central') for r in rows)
 if n>=5:
  match=next(x for x in rc if x['b']==source)
  perception.append(dict(name=name,count=n,lat=round(match['lat'],2),lng=round(match['lng'],2)))
summary=dict(n=len(rows),avoid=sum(r[6].startswith('Sim') for r in rows),experienced=sum(r[8]=='Sim' for r in rows),wouldUse=sum(r[17] in ['Com certeza','Provavelmente sim'] for r in rows),periods=dict(collections.Counter(t for r in rows for t in r[5].split(';'))),regions=perception,period='10 a 15 de setembro de 2026')
print('survey dates',rows[0][0],rows[-1][0])
summary['period']='Setembro de 2026'
totals={k:sum(x[k] for x in rc+ng) for k in ['vd','fe','te']}
output=dict(totals=totals,total=sum(totals.values()),cells=cells,boundary=boundary,survey=summary,rural=rural,unlocated=sum(sum(x[k] for k in ['vd','fe','te']) for x in ng),mapped=sum(x['total'] for x in cells),period='jan/2025 a abr/2026',source='Trabalho fornecido (HTML v1.9.5a), que atribui os dados à SSP-SP / RDO via Fala.SP. Não houve conferência independente com a base primária.',method='Filtro exato RIO CLARO. Coordenadas médias de bairros reagrupadas em células de 0,01 grau (~1 km). Células com menos de 5 registros não são exibidas. Pontos rurais distribuídos artificialmente no arquivo de origem foram excluídos do mapa e mantidos nos totais. O recorte usa data de registro, não necessariamente data do fato.',inputHashes={Path(p).name:hashlib.sha256(Path(p).read_bytes()).hexdigest() for p in sys.argv[1:]})
(root/'data/aurora.json').write_text(json.dumps(output,ensure_ascii=False))
(root/'public/data/resumo.json').write_text(json.dumps(output,ensure_ascii=False))
styles=re.findall(r'<style[^>]*>([\s\S]*?)</style>',s); scripts=re.findall(r'<script[^>]*>([\s\S]*?)</script>',s)
(root/'public/vendor/leaflet.css').write_text(styles[0]);leaf=next(x for x in scripts if 'L.version' in x or 'Leaflet 1.' in x);(root/'public/vendor/leaflet.js').write_text(leaf)
print(json.dumps({k:output[k] for k in ['totals','total','mapped','rural','unlocated','survey']},ensure_ascii=False))
