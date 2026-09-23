"use client";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  MapPin,
  ShieldCheck,
  MessageCircle,
  ArrowUpRight,
  ArrowRight,
  X,
  Bell,
  LocateFixed,
  Layers,
  Info,
  Search,
  Check,
  Heart,
  LockKeyhole,
  ChevronRight,
  Sparkles,
  Phone,
  Map as MapIcon,
  BarChart3,
  RotateCcw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import data from "@/data/aurora.json";
import { regions, categories, periods } from "@/lib/report-options";
type Layer = "history" | "survey" | "community";
function Picker({
  value,
  onChange,
  items,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  items: string[];
  label: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={label} className="picker">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {items.map((x) => (
          <SelectItem value={x} key={x}>
            {x}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
const labels: Record<string, string> = {
  all: "Todas as categorias",
  vd: "Violência doméstica",
  fe: "Feminicídio",
  te: "Tentativa de feminicídio",
};

// Troque para 'square' se quiser voltar aos quadrados.
const MAP_HISTORY_SHAPE: "circle" | "square" = "circle";
export default function Aurora() {
  const [layer, setLayer] = useState<Layer>("history"),
    [category, setCategory] = useState("all"),
    [view, setView] = useState("map"),
    [chat, setChat] = useState(true),
    [modal, setModal] = useState(""),
    [ready, setReady] = useState(false),
    [mapError, setMapError] = useState(false),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState<any>(null),
    [alerts, setAlerts] = useState(false),
    [alertText, setAlertText] = useState(""),
    [step, setStep] = useState(0),
    [answers, setAnswers] = useState<string[]>([]),
    [choice, setChoice] = useState(""),
    [month, setMonth] = useState(new Date().toISOString().slice(0, 7)),
    [consent, setConsent] = useState(false),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [sent, setSent] = useState("");
  const mapEl = useRef<HTMLDivElement>(null),
    map = useRef<any>(null),
    overlays = useRef<any>(null),
    watch = useRef<number | null>(null),
    location = useRef<any>(null),
    chatBottom = useRef<HTMLDivElement>(null),
    reportId = useRef("");
  const cells = useMemo(
    () =>
      data.cells.filter((c) => category === "all" || (c as any)[category] >= 5),
    [category],
  );
  const points =
    layer === "survey" ? data.survey.regions : layer === "history" ? cells : [];
  const filtered = points.filter((p: any) =>
    (p.name || p.label || `Área ${p.id}`)
      .toLocaleLowerCase("pt-BR")
      .includes(search.toLocaleLowerCase("pt-BR")),
  );
  useEffect(() => {
    if (view !== "map") return;
    let cancelled = false;
    const start = () => {
      if (cancelled || map.current || !mapEl.current) return;
      const L = (window as any).L;
      if (!L) {
        setMapError(true);
        return;
      }
      map.current = L.map(mapEl.current, {
        zoomControl: false,
        scrollWheelZoom: true,
      }).setView([-22.406, -47.565], 13);
      L.control.zoom({ position: "bottomright" }).addTo(map.current);
      const tiles = L.tileLayer(
        "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 18,
        },
      ).addTo(map.current);
      let errors = 0;
      tiles.on("tileerror", () => {
        if (++errors > 3) setMapError(true);
      });
      tiles.on("tileload", () => setMapError(false));
      L.geoJSON(data.boundary, {
        style: {
          color: "#8c769e",
          weight: 1.5,
          fillOpacity: 0.025,
          dashArray: "5 7",
        },
      }).addTo(map.current);
      overlays.current = L.layerGroup().addTo(map.current);
      setReady(true);
    };
    const css = document.createElement("link");
    css.rel = "stylesheet";
    css.href = "/vendor/leaflet.css";
    document.head.appendChild(css);
    const script = document.createElement("script");
    script.src = "/vendor/leaflet.js";
    script.onload = start;
    script.onerror = () => setMapError(true);
    document.body.appendChild(script);
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      setReady(false);
      script.remove();
      css.remove();
    };
  }, [view]);
  useEffect(
    () => () => {
      if (watch.current !== null)
        navigator.geolocation.clearWatch(watch.current);
    },
    [],
  );
  useEffect(() => {
    if (!ready) return;
    const L = (window as any).L;
    overlays.current.clearLayers();
    setSelected(null);
    points.forEach((p: any) => {
      const count =
        layer === "history"
          ? category === "all"
            ? p.total
            : p[category]
          : p.count;
      const color = layer === "survey" ? "#9270bb" : "#bd5964";
      const shape =
        layer === "history"
          ? MAP_HISTORY_SHAPE === "circle"
            ? L.circle([p.lat, p.lng], {
                radius: Math.max(180, Math.min(820, 160 + count * 12)),
                color,
                weight: 1.5,
                fillColor: color,
                fillOpacity: Math.min(0.18 + count / 180, 0.65),
              })
            : L.rectangle(
                [
                  [p.lat - 0.005, p.lng - 0.005],
                  [p.lat + 0.005, p.lng + 0.005],
                ],
                {
                  color,
                  weight: 1,
                  fillColor: color,
                  fillOpacity: Math.min(0.15 + count / 180, 0.65),
                },
              )
          : L.circle([p.lat, p.lng], {
              radius: 650,
              color,
              weight: 2,
              fillOpacity: 0.2,
            });
      shape.addTo(overlays.current);
      shape.bindTooltip(
        `${layer === "survey" ? p.name : p.label} · ${count} ${layer === "survey" ? "menções" : "registros"}`,
      );
      shape.on("click", () => setSelected(p));
    });
  }, [ready, layer, category]);
  useEffect(() => {
    setTimeout(() => map.current?.invalidateSize(), 250);
  }, [chat, view]);
  useEffect(() => {
    if (step > 0)
      chatBottom.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
  }, [step, sent, error]);
  useEffect(() => {
    const ctx = (document as any).modelContext;
    if (!ctx?.registerTool) return;
    const ctrl = new AbortController();
    Promise.resolve(
      ctx.registerTool(
        {
          name: "set_map_layer",
          description:
            "Seleciona a camada histórica, percepção ou comunidade no mapa Aurora.",
          inputSchema: {
            type: "object",
            properties: {
              layer: {
                type: "string",
                enum: ["history", "survey", "community"],
              },
            },
            required: ["layer"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false },
          execute: async (input: any) => {
            if (!["history", "survey", "community"].includes(input?.layer))
              throw new Error("Camada inválida");
            setLayer(input.layer);
            setView("map");
            return { layer: input.layer };
          },
        },
        { signal: ctrl.signal },
      ),
    ).catch(() => {});
    return () => ctrl.abort();
  }, []);
  function openChat() {
    setChat(true);
    setView("map");
    setTimeout(
      () =>
        document
          .querySelector(".chat-card")
          ?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
      200,
    );
  }
  function focus(p: any) {
    setSelected(p);
    map.current?.setView([p.lat, p.lng], 14);
  }
  function toggleAlerts(on: boolean) {
    if (!on) {
      if (watch.current !== null)
        navigator.geolocation.clearWatch(watch.current);
      watch.current = null;
      location.current?.remove();
      setAlerts(false);
      setAlertText("Alertas desativados.");
      return;
    }
    if (!navigator.geolocation) {
      setAlertText("Este navegador não oferece localização.");
      return;
    }
    setAlertText("Aguardando sua permissão de localização…");
    setAlerts(true);
    watch.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        const L = (window as any).L;
        if (L && map.current) {
          location.current?.remove();
          location.current = L.circle([lat, lng], {
            radius: Math.max(accuracy, 30),
            color: "#2b8979",
            fillOpacity: 0.15,
          }).addTo(map.current);
        }
        if (accuracy > 500) {
          setAlertText(
            "Localização imprecisa. Aguardando um sinal melhor para alertar.",
          );
          return;
        }
        const near = data.cells.filter((p) => {
          const dy = (p.lat - lat) * 111320,
            dx = (p.lng - lng) * 111320 * Math.cos((lat * Math.PI) / 180);
          return Math.hypot(dx, dy) < 1200;
        });
        setAlertText(
          near.length
            ? "Você está próxima de uma área com registros históricos. Esses dados não indicam um perigo acontecendo agora."
            : "Nenhuma área histórica exibida nas proximidades. Isso não garante segurança.",
        );
      },
      (e) => {
        setAlerts(false);
        setAlertText(
          e.code === 1
            ? "Localização não autorizada. Você pode continuar consultando o mapa."
            : "Localização indisponível. Tente novamente.",
        );
        if (watch.current !== null)
          navigator.geolocation.clearWatch(watch.current);
        watch.current = null;
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 20000 },
    );
  }
  function reset() {
    setStep(0);
    setAnswers([]);
    setChoice("");
    setSent("");
    setError("");
    setConsent(false);
    reportId.current = "";
  }
  function next(v: string) {
    setAnswers((a) => [...a, v]);
    setStep((s) => s + 1);
    setChoice("");
  }
  async function send() {
    setSaving(true);
    setError("");
    if (!reportId.current) reportId.current = crypto.randomUUID();
    try {
      const r = await fetch("/api/relatos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reportId.current,
          category: answers[0],
          region: answers[1],
          period: answers[2],
          month,
          consent,
        }),
      });
      const j: any = await r.json();
      if (!r.ok) throw new Error(j.error);
      setSent(j.id);
    } catch (e: any) {
      setError(e.message || "Não foi possível enviar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="app-shell">
      <aside className="rail">
        <a className="brand" href="/" aria-label="Aurora início">
          <span className="brand-symbol">
            a<span>✦</span>
          </span>
          <span>
            aurora<small>JUNTAS, MAIS ATENTAS</small>
          </span>
        </a>
        <div className="city">
          <MapPin size={16} />
          Rio Claro, SP
        </div>
        <nav>
          <button
            className={view === "map" ? "active" : ""}
            onClick={() => setView("map")}
          >
            <MapIcon />
            Explorar mapa
          </button>
          <button
            className={view === "data" ? "active" : ""}
            onClick={() => setView("data")}
          >
            <BarChart3 />
            Dados e pesquisa
          </button>
          <button onClick={openChat}>
            <MessageCircle />
            Registrar relato
          </button>
          <button onClick={() => setModal("alerts")}>
            <Bell />
            Meus alertas{alerts && <span className="on-dot" />}
          </button>
        </nav>
        <div className="rail-bottom">
          <div className="help-box">
            <Heart size={23} />
            <h3>Você não está sozinha.</h3>
            <p>Encontre orientação e canais de acolhimento.</p>
            <button onClick={() => setModal("help")}>
              Preciso de apoio <ArrowUpRight size={16} />
            </button>
          </div>
          <button className="method-link" onClick={() => setModal("method")}>
            <Info size={16} />
            Sobre os dados
          </button>
          <span className="edition">AURORA / MVP 01</span>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div className="breadcrumb">
            Rio Claro <ChevronRight size={14} />
            <strong>
              {view === "map" ? "Mapa colaborativo" : "Dados e pesquisa"}
            </strong>
          </div>
          <div className="top-actions">
            <span className="private-label">
              <LockKeyhole size={14} />
              Sem identificação no relato
            </span>
            <button
              className="exit-button"
              onClick={() => window.location.replace("https://www.google.com")}
            >
              Sair rápido <ArrowUpRight size={15} />
            </button>
          </div>
        </header>
        <section className="page-heading">
          <div>
            <div className="eyebrow">INFORMAÇÃO PARA O SEU CAMINHO</div>
            <h1>
              {view === "map"
                ? "Olhe ao redor. Vá com informação."
                : "O que os dados nos contam."}
            </h1>
            <p>
              {view === "map"
                ? "Explore registros e percepções de segurança em Rio Claro."
                : "Duas fontes, contextos diferentes. Conheça o recorte de cada uma."}
            </p>
          </div>
          <button className="primary new-report" onClick={openChat}>
            <MessageCircle size={18} />
            Registrar um relato
          </button>
        </section>
        {view === "map" ? (
          <>
            <section className="stats-strip">
              <div>
                <span className="stat-icon rose">
                  <Layers size={21} />
                </span>
                <div>
                  <strong>683</strong>
                  <span>registros no recorte histórico</span>
                </div>
                <small>JAN 2025 — ABR 2026</small>
              </div>
              <div>
                <span className="stat-icon purple">
                  <MessageCircle size={21} />
                </span>
                <div>
                  <strong>51</strong>
                  <span>respostas à pesquisa</span>
                </div>
                <small>SETEMBRO 2026</small>
              </div>
              <div className="stat-note">
                <ShieldCheck size={24} />
                <p>
                  Seu relato importa.
                  <br />
                  <strong>Sua identidade é preservada no formulário.</strong>
                </p>
              </div>
            </section>
            <div className={"workspace " + (!chat ? "chat-closed" : "")}>
              <section className="map-card">
                <div className="map-toolbar">
                  <div className="layer-pills" aria-label="Camada do mapa">
                    {(["history", "survey", "community"] as Layer[]).map(
                      (l, i) => (
                        <button
                          key={l}
                          aria-pressed={layer === l}
                          className={layer === l ? "selected" : ""}
                          onClick={() => setLayer(l)}
                        >
                          {["Histórico", "Percepção", "Comunidade"][i]}
                        </button>
                      ),
                    )}
                  </div>
                  <button
                    className="icon-button"
                    title="Sobre as camadas"
                    aria-label="Sobre as camadas"
                    onClick={() => setModal("method")}
                  >
                    <Info size={18} />
                  </button>
                </div>
                <div className="map-filters">
                  {layer === "history" ? (
                    <Picker
                      label="Categoria de registros"
                      value={labels[category]}
                      items={Object.values(labels)}
                      onChange={(v) =>
                        setCategory(
                          Object.keys(labels).find((k) => labels[k] === v) ||
                            "all",
                        )
                      }
                    />
                  ) : (
                    <span>
                      {layer === "survey"
                        ? "Pesquisa de percepção · 51 respostas"
                        : "Relatos recebidos passam por revisão"}
                    </span>
                  )}
                  <span className="period-label">
                    {layer === "history"
                      ? "jan/2025 — abr/2026"
                      : layer === "survey"
                        ? "setembro/2026"
                        : "Sem relatos publicados"}
                  </span>
                </div>
                <div className="map-wrap">
                  <div
                    ref={mapEl}
                    className="map-canvas"
                    aria-label="Mapa interativo de Rio Claro"
                  />
                  {mapError && (
                    <div className="map-failure">
                      O mapa de ruas não carregou. As áreas e a lista continuam
                      disponíveis.
                    </div>
                  )}
                  <div className="map-chip">
                    <MapPin size={14} />
                    RIO CLARO <span>SP</span>
                  </div>
                  <button
                    className="recenter"
                    aria-label="Centralizar em Rio Claro"
                    onClick={() => map.current?.setView([-22.406, -47.565], 13)}
                  >
                    <LocateFixed size={19} />
                  </button>
                  {selected && (
                    <div className="map-detail">
                      <button
                        aria-label="Fechar detalhe"
                        onClick={() => setSelected(null)}
                      >
                        <X size={16} />
                      </button>
                      <span className="eyebrow">
                        {layer === "survey"
                          ? "PERCEPÇÃO DE SEGURANÇA"
                          : "ÁREA APROXIMADA · ~1 KM"}
                      </span>
                      <h3>
                        {selected.name ||
                          selected.label ||
                          "Registros nesta área"}
                      </h3>
                      <strong>
                        {layer === "survey"
                          ? selected.count
                          : category === "all"
                            ? selected.total
                            : selected[category]}{" "}
                        <small>
                          {layer === "survey"
                            ? "menções na pesquisa"
                            : "registros históricos"}
                        </small>
                      </strong>
                      <p>
                        {layer === "survey"
                          ? "Localização aproximada. Menções de insegurança não são ocorrências."
                          : "Dados agregados a partir das posições médias dos bairros. Não representam endereços individuais."}
                      </p>
                    </div>
                  )}
                  {points.length === 0 && (
                    <div className="empty-map">
                      <ShieldCheck />
                      <h3>
                        {layer === "community"
                          ? "O primeiro passo é escutar."
                          : "Sem áreas exibidas nesta categoria."}
                      </h3>
                      <p>
                        {layer === "community"
                          ? "Os relatos enviados ficam aguardando revisão. Nenhum relato comunitário foi publicado neste MVP."
                          : "Para preservar a privacidade, só mostramos áreas com 5 ou mais registros da categoria. Consulte os totais em Dados e pesquisa."}
                      </p>
                      {layer === "community" && (
                        <button className="primary" onClick={openChat}>
                          Fazer um relato
                        </button>
                      )}
                    </div>
                  )}
                  <div className="map-legend">
                    <span
                      className="legend-dot"
                      style={{
                        background: layer === "survey" ? "#9270bb" : "#bd5964",
                      }}
                    />
                    {layer === "survey"
                      ? "Menções de insegurança"
                      : "Concentração de registros"}
                    <span className="legend-scale" />{" "}
                    <small>menor → maior</small>
                  </div>
                </div>
                <div className="map-caption">
                  <Info size={16} />
                  <p>
                    {layer === "history"
                      ? `${cells.reduce((s, c) => s + (category === "all" ? c.total : (c as any)[category]), 0)} registros em áreas exibidas. O histórico não indica risco atual nem permite definir uma rota segura.`
                      : layer === "survey"
                        ? "Mostramos apenas regiões com 5 ou mais menções explícitas. A pesquisa não representa todas as mulheres de Rio Claro."
                        : "Um relato recebido não confirma que o fato ocorreu. A publicação depende de revisão."}
                  </p>
                </div>
                <div className="area-list">
                  <div className="area-list-heading">
                    <h3>
                      {layer === "survey"
                        ? "Regiões mencionadas"
                        : "Explore as áreas"}
                    </h3>
                    <label className="search-box">
                      <Search size={15} />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar na lista"
                        aria-label="Buscar na lista de áreas"
                      />
                    </label>
                  </div>
                  <div className="area-items">
                    {filtered.map((p: any) => (
                      <button key={p.id || p.name} onClick={() => focus(p)}>
                        <MapPin size={17} />
                        <span>
                          {p.name || p.label}
                          <small>
                            {layer === "survey"
                              ? "Percepção · localização aproximada"
                              : "Histórico · célula de aproximadamente 1 km"}
                          </small>
                        </span>
                        <strong>
                          {layer === "survey"
                            ? p.count
                            : category === "all"
                              ? p.total
                              : p[category]}
                        </strong>
                        <ChevronRight size={16} />
                      </button>
                    ))}
                    {!filtered.length && (
                      <p className="empty-list">
                        {layer === "community"
                          ? "Ainda não há relatos publicados."
                          : "Nenhuma área encontrada com esse filtro."}
                      </p>
                    )}
                  </div>
                </div>
              </section>
              {chat && (
                <aside className="chat-card">
                  <div className="chat-header">
                    <div className="bot-avatar">
                      <Sparkles size={22} />
                    </div>
                    <div>
                      <h2>Converse com a Aurora</h2>
                      <span>Assistente de relato guiado</span>
                    </div>
                    <button
                      className="icon-button"
                      aria-label="Fechar chatbot"
                      onClick={() => setChat(false)}
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="chat-privacy">
                    <LockKeyhole size={14} />
                    Sem nome, telefone ou endereço exato
                  </div>
                  <div className="chat-content">
                    <div className="chat-day">ESTE É UM ESPAÇO DE ESCUTA</div>
                    <div className="bubble">
                      Oi, estou aqui para te ajudar a registrar uma situação em
                      Rio Claro. Você escolhe o que compartilhar.
                      <span className="bubble-note">
                        Este relato não é um boletim de ocorrência. Em
                        emergência, ligue 190.
                      </span>
                    </div>
                    {step === 0 && !sent && (
                      <>
                        <div className="bubble">
                          Vamos começar pelo tipo de situação?
                        </div>
                        <div className="choices">
                          {categories.map((c) => (
                            <button key={c} onClick={() => next(c)}>
                              {c}
                              <ChevronRight size={14} />
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                    {answers.map((a, i) => (
                      <div key={i}>
                        <div className="bubble user-bubble">{a}</div>
                        {i === 0 && step === 1 && (
                          <div className="bubble">
                            Em qual região aconteceu? Escolha só o bairro ou uma
                            região ampla.
                          </div>
                        )}
                        {i === 1 && step === 2 && (
                          <div className="bubble">Em qual período do dia?</div>
                        )}
                      </div>
                    ))}
                    {step === 1 && (
                      <div className="chat-select">
                        <Picker
                          label="Região do relato"
                          value={choice}
                          items={regions}
                          onChange={setChoice}
                        />
                        <button
                          className="primary"
                          disabled={!choice}
                          onClick={() => next(choice)}
                        >
                          Continuar <ArrowRight size={16} />
                        </button>
                      </div>
                    )}
                    {step === 2 && (
                      <div className="choices">
                        {periods.map((p) => (
                          <button key={p} onClick={() => next(p)}>
                            {p}
                            <ChevronRight size={14} />
                          </button>
                        ))}
                      </div>
                    )}
                    {step === 3 && !sent && (
                      <>
                        <div className="bubble">
                          Em que mês aconteceu? Depois, confira suas escolhas
                          antes de enviar.
                        </div>
                        <label className="month-label">
                          Mês da situação
                          <input
                            type="month"
                            min="2000-01"
                            max={new Date().toISOString().slice(0, 7)}
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                          />
                        </label>
                        <div className="review">
                          <strong>Seu relato</strong>
                          {answers.map((a) => (
                            <span key={a}>{a}</span>
                          ))}
                          <small>
                            Será guardado para revisão, sem publicação
                            automática. Não há equipe de atendimento em tempo
                            real neste MVP.
                          </small>
                        </div>
                        <div className="consent">
                          <Switch
                            id="consent"
                            checked={consent}
                            onCheckedChange={setConsent}
                          />
                          <label htmlFor="consent">
                            Concordo em guardar essas informações para revisão.
                          </label>
                        </div>
                        <button
                          className="primary full"
                          disabled={!consent || !month || saving}
                          onClick={send}
                        >
                          {saving ? "Enviando…" : "Enviar relato"}
                          <ArrowRight size={16} />
                        </button>
                      </>
                    )}
                    {sent && (
                      <div className="success">
                        <Check size={24} />
                        <h3>Relato recebido.</h3>
                        <p>
                          Aguardando revisão. Ele ainda não aparece no mapa.
                        </p>
                        <small>Protocolo: {sent}</small>
                        <button onClick={reset}>Registrar outro relato</button>
                      </div>
                    )}
                    {error && (
                      <p className="error" role="alert">
                        {error}
                      </p>
                    )}
                    <div ref={chatBottom} />
                  </div>
                  <div className="chat-footer">
                    <button onClick={reset}>
                      <RotateCcw size={14} />
                      Recomeçar
                    </button>
                    <button onClick={() => setModal("privacy")}>
                      Como cuidamos dos dados <ArrowUpRight size={13} />
                    </button>
                  </div>
                </aside>
              )}
            </div>
          </>
        ) : (
          <section className="data-page">
            <div className="data-grid">
              <article>
                <span className="eyebrow">HISTÓRICO FORNECIDO</span>
                <h2>
                  683 <small>registros</small>
                </h2>
                <p>Comunicações de jan/2025 a abr/2026</p>
                {Object.entries(data.totals).map(([k, v]) => (
                  <div className="metric-row" key={k}>
                    <span>{labels[k]}</span>
                    <strong>{v}</strong>
                  </div>
                ))}
                <p className="footnote">
                  A soma reproduz as categorias do trabalho fornecido; não deve
                  ser interpretada como total de vítimas únicas.
                </p>
              </article>
              <article>
                <span className="eyebrow">PESQUISA LOCAL · 51 RESPOSTAS</span>
                <h2>
                  86% <small>evitam locais</small>
                </h2>
                <p>
                  44 responderam “Sim, frequentemente” ou “Sim, algumas vezes”.
                </p>
                <div className="metric-row">
                  <span>Vivenciaram insegurança ou ameaça</span>
                  <strong>42 / 51</strong>
                </div>
                <div className="metric-row">
                  <span>Usariam ou provavelmente usariam o mapa</span>
                  <strong>48 / 51</strong>
                </div>
                <p className="footnote">
                  Coleta: 10 a 18/09/2026. Amostra de conveniência; não
                  representa a população municipal.
                </p>
              </article>
              <article>
                <span className="eyebrow">PERCEPÇÃO POR HORÁRIO</span>
                <h3>Quando se sentem menos seguras?</h3>
                {[
                  "Noite",
                  "Madrugada",
                  "Início da noite",
                  "Manhã",
                  "Tarde",
                ].map((p) => (
                  <div className="bar-row" key={p}>
                    <span>
                      {p}
                      <b>{(data.survey.periods as any)[p]} / 51</b>
                    </span>
                    <div>
                      <i
                        style={{
                          width:
                            ((data.survey.periods as any)[p] / 51) * 100 + "%",
                        }}
                      />
                    </div>
                  </div>
                ))}
                <p className="footnote">
                  Múltiplas respostas por pessoa. Os percentuais não somam 100%.
                </p>
              </article>
              <article>
                <span className="eyebrow">COBERTURA DO MAPA</span>
                <h3>O que aparece e o que fica de fora</h3>
                {[
                  ["Exibidos em células agregadas", data.mapped],
                  ["Área rural com posição artificial", data.rural],
                  ["Sem coordenada de bairro", data.unlocated],
                  [
                    "Células com menos de 5 registros",
                    data.total - data.mapped - data.rural - data.unlocated,
                  ],
                ].map(([k, v]) => (
                  <div className="metric-row" key={k}>
                    <span>{k}</span>
                    <strong>{v}</strong>
                  </div>
                ))}
                <button
                  className="text-link"
                  onClick={() => setModal("method")}
                >
                  Ler metodologia <ArrowUpRight size={15} />
                </button>
              </article>
            </div>
          </section>
        )}
        <footer className="page-footer">
          <span>
            <ShieldCheck size={14} />
            Informação com cuidado. Nenhum mapa garante segurança.
          </span>
          <button onClick={() => setModal("method")}>
            Fontes e metodologia <ArrowUpRight size={14} />
          </button>
        </footer>
      </main>
      <Dialog open={!!modal} onOpenChange={(o) => !o && setModal("")}>
        <DialogContent className="aurora-dialog">
          <DialogHeader>
            <DialogTitle>
              {
                (
                  {
                    alerts: "Alertas durante o caminho",
                    help: "Você pode buscar apoio",
                    method: "Fontes e metodologia",
                    privacy: "Privacidade no Aurora",
                  } as any
                )[modal]
              }
            </DialogTitle>
            <DialogDescription>
              {modal === "alerts"
                ? "Você controla quando compartilhar sua localização."
                : modal === "help"
                  ? "Canais nacionais de emergência e orientação."
                  : modal === "method"
                    ? "Entenda o que cada camada representa."
                    : "Compartilhe a situação sem identificar pessoas."}
            </DialogDescription>
          </DialogHeader>
          {modal === "alerts" && (
            <div className="dialog-body">
              <div className="setting">
                <div>
                  <strong>Alertas de proximidade</strong>
                  <p>Enquanto esta página estiver aberta e ativa.</p>
                </div>
                <Switch
                  checked={alerts}
                  onCheckedChange={toggleAlerts}
                  aria-label="Ativar alertas de proximidade"
                />
              </div>
              <p>
                O Aurora avisa quando sua posição estiver a até aproximadamente
                1,2 km do centro de uma área histórica exibida. O alerta não
                confirma perigo atual.
              </p>
              <p>
                A localização é processada no seu aparelho e não é enviada ao
                banco de relatos. O navegador pode suspender os alertas em
                segundo plano.
              </p>
              <p className="alert-status" role="status">
                {alertText || "Alertas desativados."}
              </p>
            </div>
          )}
          {modal === "help" && (
            <div className="dialog-body">
              <a className="support-link" href="tel:190">
                <Phone />
                <span>
                  <strong>190 · Polícia Militar</strong>
                  <small>Para uma emergência ou risco imediato.</small>
                </span>
                <ArrowUpRight />
              </a>
              <a className="support-link" href="tel:180">
                <Heart />
                <span>
                  <strong>180 · Central de Atendimento à Mulher</strong>
                  <small>Orientação e encaminhamento de denúncias.</small>
                </span>
                <ArrowUpRight />
              </a>
              <p>
                O Aurora não aciona a polícia nem acompanha emergências. Se
                puder, procure um local seguro e alguém de confiança.
              </p>
              <a
                className="text-link"
                href="https://www.gov.br/mulheres/pt-br/ligue180"
                target="_blank"
                rel="noreferrer"
              >
                Informações oficiais do Ligue 180 <ArrowUpRight size={14} />
              </a>
              <p>
                Sair rápido abre o Google, mas não apaga o histórico do
                navegador.
              </p>
            </div>
          )}
          {modal === "privacy" && (
            <div className="dialog-body">
              <p>
                O formulário guarda apenas categoria, região ampla, período do
                dia, mês e um protocolo aleatório. Não solicitamos nome,
                contato, endereço exato ou texto livre.
              </p>
              <p>
                Relatos ficam pendentes de revisão. Não são publicados
                automaticamente. A infraestrutura de hospedagem pode processar
                dados técnicos de acesso; este MVP não promete anonimato
                absoluto.
              </p>
              <p>
                Os dados do questionário aparecem somente em resumos. No mapa,
                usamos áreas aproximadas e um mínimo de cinco registros ou
                menções.
              </p>
              <p>
                A camada de ruas é fornecida por OpenStreetMap. Ao abrir o mapa,
                seu navegador solicita imagens a esse serviço.
              </p>
            </div>
          )}
          {modal === "method" && (
            <div className="dialog-body">
              <h3>Registros históricos</h3>
              <p>{data.source}</p>
              <p>{data.method}</p>
              <p>
                As coordenadas originais eram médias de bairros, não polígonos
                oficiais. O agrupamento é uma aproximação espacial e não permite
                medir risco por rua. Os totais incluem 42 registros sem posição
                e 84 registros rurais que não entram no mapa.
              </p>
              <h3>Pesquisa de percepção</h3>
              <p>
                51 respostas, coletadas de 10 a 18/09/2026. Contamos menções
                explícitas de Bela Vista, Centro/Central, Vila Alemã e Vila
                Indaiá, sem duplicar uma mesma região dentro da mesma resposta.
                Só regiões com cinco ou mais menções são exibidas. Locais
                ambíguos não foram geocodificados.
              </p>
              <p>
                Uma resposta pode citar várias regiões. Percepção não equivale a
                ocorrência criminal. Os pontos são aproximados a partir do
                trabalho recebido.
              </p>
              <h3>Relatos da comunidade</h3>
              <p>
                O chatbot segue perguntas predefinidas. Os envios são guardados
                para revisão. Não existe publicação automática, equipe de
                moderação operacional ou atendimento em tempo real neste MVP.
              </p>
              <a className="text-link" href="/data/resumo.json" download>
                Baixar dados agregados <ArrowUpRight size={15} />
              </a>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {alerts && modal !== "alerts" && (
        <button className="alert-toast" onClick={() => setModal("alerts")}>
          <Bell size={18} />
          <span>{alertText || "Alertas de proximidade ativos"}</span>
        </button>
      )}
    </div>
  );
}
