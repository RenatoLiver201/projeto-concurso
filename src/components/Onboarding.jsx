/** Configurador guiado: reutiliza o painel existente sem impor concurso, banca ou conteúdos. */
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Field, NumberInput, Select, TextInput, Textarea } from "./ui/form";
import { newConcurso, newTopic } from "../data/defaults";
import { generatePlan } from "../lib/planner";
import { parseTopicLines, mergeEditalTopics } from "../lib/edital";
import { readEditalFile } from "../lib/editalFile";
import { today, uid } from "../lib/dates";

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const STEPS = ["Estudante", "Concurso", "Edital e matérias", "Rotina e plano"];
const modes = [
  ["oficial", "Edital atual (informado pelo estudante; verificar fonte)"],
  ["historico", "Edital anterior / referência histórica"],
  ["hipotese", "Disciplinas sugeridas pelo estudante"],
  ["nao_informado", "Ainda não tenho edital nem disciplinas"],
];
export function Onboarding({ profile, onFinish, onCancel, initialState, addCompetition = false }) {
  const [step, setStep] = useState(addCompetition ? 1 : 0);
  const [student, setStudent] = useState(profile.name === "Novo estudante" ? "" : profile.name);
  const [goal, setGoal] = useState({ orgao: "", cargo: "", area: "", banca: "", prova: "", status: "previsto" });
  const [sourceType, setSourceType] = useState("nao_informado");
  const [sourceTitle, setSourceTitle] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourceDate, setSourceDate] = useState("");
  const [topicsText, setTopicsText] = useState("");
  const [fileName, setFileName] = useState("");
  const [fileRaw, setFileRaw] = useState("");
  const [fileReading, setFileReading] = useState(false);
  const [err, setErr] = useState("");
  const [days, setDays] = useState([...initialState.settings.horasDia]);
  const [difficulty, setDifficulty] = useState("3");
  const [experience, setExperience] = useState("iniciante");
  const [learning, setLearning] = useState("misto");
  const [sessionSize, setSessionSize] = useState(initialState.settings.sessaoMin || 50);
  const [examWeeks, setExamWeeks] = useState(4);
  const [generating, setGenerating] = useState(false);
  const parsed = useMemo(() => parseTopicLines(topicsText), [topicsText]);
  const hours = days.reduce((s, x) => s + Number(x || 0), 0) / 60;

  const readFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileReading(true); setErr("");
    try {
      const result = await readEditalFile(file);
      setFileName(file.name);
      setFileRaw(result.extractedText || "");
      if (result.rows.length) setTopicsText(result.rows.map(r => `${r.disciplina} | ${r.nome}`).join("\n"));
      else setErr("Arquivo lido, mas os tópicos não puderam ser identificados com segurança. Consulte o texto extraído abaixo e cole uma lista no formato ‘Disciplina | Assunto’. O sistema não inventará matérias.");
      if (sourceType === "nao_informado") setSourceType("historico");
      if (!sourceTitle) setSourceTitle(file.name);
    } catch (error) { setErr(error.message || "Falha ao ler o arquivo."); }
    finally { setFileReading(false); event.target.value = ""; }
  };
  const next = () => {
    setErr("");
    if (step === 0 && !student.trim()) return setErr("Informe o nome ou apelido do estudante.");
    if (step === 1 && (!goal.orgao.trim() || !goal.cargo.trim())) return setErr("Informe o órgão/concurso e o cargo ou área desejada.");
    if (step === 2 && !parsed.rows.length && sourceType !== "nao_informado") {
      // Pode continuar com edital sem conteúdo extraído: plano fica pendente e editável.
    }
    setStep(x => Math.min(3, x + 1));
  };
  const finish = () => {
    if (sourceUrl && !/^https?:\/\//i.test(sourceUrl)) return setErr("A fonte deve ser um link HTTP ou HTTPS válido.");
    if (parsed.rows.length > 1200) return setErr("Importe até 1.200 assuntos por concurso para manter a interface leve.");
    if (!goal.orgao.trim() || !goal.cargo.trim()) return setErr("Concurso e cargo são necessários.");
    setErr(""); setGenerating(true);
    try {
      const contest = { ...newConcurso(), ...goal, orgao: goal.orgao.trim(), cargo: goal.cargo.trim(), dataProva: goal.prova,
        status: sourceType === "oficial" ? "edital_publicado" : "previsto", prioridade: 5,
        edital: sourceTitle || (sourceType === "nao_informado" ? "Pendente de publicação" : "Fonte informada pelo estudante"),
        verificacao: "",
        fontes: sourceTitle || sourceUrl ? [{ id: uid(), titulo: sourceTitle || "Fonte fornecida", url: sourceUrl, tipo: sourceType }] : [],
        pendencias: sourceType === "oficial" ? ["Conferir autenticidade, cargo, retificações e anexos na fonte oficial antes de tratar o edital como verificado."] : ["Plano provisório: verificar edital vigente, banca, pesos, conteúdo programático e data da prova."],
        editalMeta: { tipo: sourceType === "nao_informado" && parsed.rows.length ? "hipotese" : sourceType, fonte: sourceTitle, url: sourceUrl, dataDocumento: sourceDate, dataImportacao: today(), arquivo: fileName, revisadoPeloEstudante: true, verificadoOficialmente: false },
      };
      const current = initialState;
      const effectiveSourceType = sourceType === "nao_informado" && parsed.rows.length ? "hipotese" : sourceType;
      const sourceMeta = { tipo: effectiveSourceType, titulo: sourceTitle, url: sourceUrl, arquivo: fileName, confirmadoEm: today() };
      const merged = mergeEditalTopics(current.topics, parsed.rows, contest.id, () => ({ ...newTopic(current), dificuldade: Number(difficulty) }), sourceMeta);
      const available = days.map(m => Math.max(0, Math.round(Number(m) || 0)));
      const settings = { ...current.settings, concursoPrincipal: contest.id, horasDia: available, metaHorasSemana: Math.round(hours * 10) / 10,
        sessaoMin: Math.max(15, Number(sessionSize || 50)), provisorio: false, estagio: "auto", ciclo: { itens: [], ptr: 0 },
        diagnostic: { experience, learning, difficulty: Number(difficulty), createdAt: today() } };
      const updated = { ...current, concursos: [...current.concursos, contest], topics: merged.topics, settings,
        decisions: [...current.decisions, { id: uid(), data: today(), motivo: `Configuração guiada: ${contest.orgao} · ${contest.cargo} (${sourceType})`, acao: `${merged.added} assuntos vinculados` }] };
      const plan = merged.added && hours ? generatePlan(updated, today(), Math.max(7, Math.min(28, Number(examWeeks) * 7))) : { sessions: [] };
      onFinish({ name: student.trim() || profile.name, state: { ...updated, sessions: [...updated.sessions, ...plan.sessions] }, planned: plan.sessions.length, topics: merged.added });
    } catch (e) { setErr(e.message || "Falha ao configurar plano."); }
    finally { setGenerating(false); }
  };
  return (
    <div className="mx-auto max-w-3xl py-4 space-y-4">
      <div>
        <p className="text-xs font-medium text-accentInk">Mentor de Concursos · configuração personalizada</p>
        <h1 className="mt-1 text-xl font-semibold">{addCompetition ? "Adicionar concurso ao meu plano" : "Vamos construir seu plano de estudos"}</h1>
        <p className="mt-1 text-xs text-ink2">Uma conversa em quatro etapas. Nada de CGU, banca ou matéria obrigatória: você decide o que estudar.</p>
      </div>
      <div className="grid grid-cols-4 gap-1.5" aria-label="Etapas da configuração">
        {STEPS.map((label, i) => <div key={label} className={`rounded-md border px-2 py-2 text-center text-[11px] ${i === step ? "border-accent bg-accentSoft text-accentInk font-semibold" : "border-line text-ink2"}`}>{i + 1}. {label}</div>)}
      </div>
      {step === 0 && <Card title="Sobre você" sub="Seus dados ficam somente no navegador deste dispositivo.">
        <div className="space-y-3">
          <Field label="Como prefere ser chamado(a)?"><TextInput autoFocus value={student} onChange={e => setStudent(e.target.value)} placeholder="Nome ou apelido" maxLength={100}/></Field>
          <p className="text-xs text-ink2">Cada estudante terá seu próprio histórico de questões, sessões, simulados e relatórios. Você poderá criar outros perfis no menu, sem misturar dados.</p>
        </div>
      </Card>}
      {step === 1 && <Card title="Seu concurso" sub="Informe o que souber. Só concurso e cargo são obrigatórios.">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Concurso / órgão *"><TextInput value={goal.orgao} onChange={e => setGoal(p => ({ ...p, orgao: e.target.value }))} placeholder="Ex.: Tribunal de Justiça estadual" /></Field>
          <Field label="Cargo *"><TextInput value={goal.cargo} onChange={e => setGoal(p => ({ ...p, cargo: e.target.value }))} placeholder="Ex.: Analista Judiciário" /></Field>
          <Field label="Especialidade / área"><TextInput value={goal.area} onChange={e => setGoal(p => ({ ...p, area: e.target.value }))} placeholder="Ex.: Administração" /></Field>
          <Field label="Banca (se conhecida)"><TextInput value={goal.banca} onChange={e => setGoal(p => ({ ...p, banca: e.target.value }))} placeholder="Não definida" /></Field>
          <Field label="Data da prova (se confirmada)"><TextInput type="date" value={goal.prova} onChange={e => setGoal(p => ({ ...p, prova: e.target.value }))}/></Field>
          <Field label="Situação atual"><Select value={goal.status} onChange={e => setGoal(p => ({ ...p, status: e.target.value }))}><option value="previsto">Previsto / ainda sem edital</option><option value="edital_publicado">Edital já publicado</option></Select></Field>
        </div>
      </Card>}
      {step === 2 && <Card title="Edital e conteúdo programático" sub="Somente importe matérias que realmente façam sentido para este cargo.">
        <div className="space-y-3">
          <Field label="Base do conteúdo"><Select value={sourceType} onChange={e => setSourceType(e.target.value)}>{modes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select></Field>
          {sourceType !== "nao_informado" && <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Título e ano do edital / referência"><TextInput value={sourceTitle} onChange={e => setSourceTitle(e.target.value)} placeholder="Ex.: Edital de 2023, cargo X" /></Field>
            <Field label="Link da fonte, se disponível"><TextInput type="url" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)} placeholder="https://..." /></Field>
            <Field label="Data do documento (opcional)"><TextInput type="date" value={sourceDate} onChange={e => setSourceDate(e.target.value)}/></Field>
            <Field label="Importar arquivo local (PDF precisa de internet para carregar o leitor)"><input type="file" accept=".pdf,.txt,.md,.csv,.json,application/pdf" onChange={readFile} className="w-full text-xs" disabled={fileReading} /></Field>
          </div>}
          <div className="rounded-md border border-line bg-surface2 p-3 text-xs text-ink2">
            {sourceType === "oficial" ? "Um arquivo enviado é declarado pelo estudante, não validado automaticamente em um site oficial. Confira retificações e anexos." : "Sem edital atual, use edital anterior do mesmo cargo ou insira matérias sugeridas por você. Toda estimativa continuará identificada como provisória."}
            <div className="mt-2 flex flex-wrap gap-2">
              <a target="_blank" rel="noopener noreferrer" className="underline text-accentInk" href={`https://www.google.com/search?q=${encodeURIComponent(`site:gov.br edital ${goal.orgao} ${goal.cargo} conteúdo programático pdf`)}`}>Pesquisar editais oficiais e anteriores</a>
            </div>
          </div>
          <Field label="Matérias para importar (revise antes de concluir)" hint="Uma linha por tópico: Português | Interpretação de textos. Ou cabeçalho ‘Português:’ seguido de itens com hífen.">
            <Textarea rows={9} className="min-h-[175px] font-mono text-xs" placeholder={"Português | Interpretação de textos\nPortuguês | Concordância verbal\nDireito Administrativo | Atos administrativos"} value={topicsText} onChange={e => setTopicsText(e.target.value)}/>
          </Field>
          <p className="text-xs text-ink2">Prévia: <b className="text-ink">{parsed.rows.length} assuntos</b> em {new Set(parsed.rows.map(r => r.disciplina)).size} disciplinas. {parsed.ignored.length ? `${parsed.ignored.length} linha(s) sem disciplina foram ignoradas.` : ""} {fileName && `Arquivo: ${fileName}.`}</p>
          {fileRaw && <details className="rounded-md border border-line p-2"><summary className="cursor-pointer text-xs">Conferir texto extraído do arquivo (sem importação automática)</summary><pre className="mt-2 max-h-52 overflow-auto whitespace-pre-wrap break-words text-[11px]">{fileRaw.slice(0, 11000)}</pre></details>}
          {parsed.rows.length > 0 && <details className="rounded-md border border-line p-2"><summary className="cursor-pointer text-xs">Prévia das disciplinas e dos tópicos ({parsed.rows.length})</summary><ul className="mt-2 list-disc pl-5 text-xs">{parsed.rows.slice(0, 50).map((row,i) => <li key={i}>{row.disciplina}: {row.nome}</li>)}</ul></details>}
          {sourceType === "nao_informado" && !topicsText && <p className="text-xs text-warnInk">Você pode continuar sem edital. O painel ficará pronto para receber matérias depois; não será criado cronograma fictício.</p>}
        </div>
      </Card>}
      {step === 3 && <Card title="Sua rotina e seu diagnóstico" sub="Horas reais disponíveis após trabalho, deslocamento e outras obrigações.">
        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">{[1,2,3,4,5,6,0].map(day => <Field key={day} label={DAYS[day] + " (h)"}><NumberInput min="0" max="24" step="0.25" value={days[day] / 60} onChange={v => setDays(p => p.map((x,i) => i === day ? Math.max(0, Math.min(24, Number(v || 0))) * 60 : x))}/></Field>)}</div>
          <p className="text-xs text-ink2">Disponibilidade semanal: <b className="text-ink">{hours.toFixed(1)} h</b>. O plano desconta a margem de segurança configurada e respeita dias com 0 h.</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Experiência em concursos"><Select value={experience} onChange={e => setExperience(e.target.value)}><option value="iniciante">Começando agora</option><option value="intermediario">Já estudo há algum tempo</option><option value="avancado">Tenho base e faço simulados</option></Select></Field>
            <Field label="Dificuldade geral percebida"><Select value={difficulty} onChange={e => setDifficulty(e.target.value)}><option value="1">1 — tranquila</option><option value="2">2 — moderada</option><option value="3">3 — média</option><option value="4">4 — difícil</option><option value="5">5 — muito difícil</option></Select></Field>
            <Field label="Forma de estudo preferida"><Select value={learning} onChange={e => setLearning(e.target.value)}><option value="misto">Teoria + questões + revisões</option><option value="questoes">Mais questões</option><option value="leitura">Leitura e resumos</option><option value="video">Videoaulas e prática</option></Select></Field>
            <Field label="Minutos por sessão"><NumberInput min="15" max="180" value={sessionSize} onChange={v => setSessionSize(Math.max(15, Math.min(180, v || 50)))}/></Field>
            <Field label="Gerar cronograma para (semanas)"><Select value={examWeeks} onChange={e => setExamWeeks(Number(e.target.value))}><option value={2}>2 semanas</option><option value={3}>3 semanas</option><option value={4}>4 semanas</option></Select></Field>
          </div>
          <div className="rounded-md border border-line bg-surface2 p-3 text-xs text-ink2">
            <b className="text-ink">Resultado esperado:</b> {parsed.rows.length ? `serão vinculados ${parsed.rows.length} tópicos ao concurso ${goal.orgao || "escolhido"}` : "sem matérias confirmadas, o cronograma ficará vazio até você cadastrar o conteúdo"}. Revisões, questões e simulados utilizarão os registros reais e se ajustarão no replanejamento. Sessões já concluídas não serão apagadas.
          </div>
        </div>
      </Card>}
      {err && <p role="alert" className="rounded-md bg-warnSoft px-3 py-2 text-xs text-warnInk">{err}</p>}
      <div className="flex flex-wrap justify-between gap-2 border-t border-line pt-4">
        <Button icon={ArrowLeft} onClick={step ? () => setStep(x => x - 1) : onCancel} disabled={!step && !onCancel}>{step ? "Voltar" : "Cancelar"}</Button>
        {step < 3 ? <Button variant="primary" icon={ArrowRight} onClick={next}>Continuar</Button> : <Button variant="primary" icon={Check} disabled={generating} onClick={finish}>{generating ? "Gerando..." : "Criar plano no painel"}</Button>}
      </div>
    </div>
  );
}
