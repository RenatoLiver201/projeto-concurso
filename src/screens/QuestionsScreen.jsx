/**
 * Questões: registro, caderno de erros, calibração (confiança × acerto) e lançamento de lote.
 */
import { useEffect, useState } from "react";
import { Check, ExternalLink, Layers, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button, IconButton } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { EmptyState, PageHeader, StatCard, Tabs } from "../components/ui/feedback";
import { Checkbox, Field, NumberInput, Select, TextInput, Textarea } from "../components/ui/form";
import { DataTable, Td, Thead, Tr } from "../components/ui/table";
import { useApp } from "../context/AppContext";
import { CONFIDENCE_LABELS, CORRECTNESS_BADGE } from "../data/constants";
import { newQuestion } from "../data/defaults";
import { useSortableTable } from "../hooks/useSortableTable";
import { formatDM, today, uid } from "../lib/dates";
import { evidenceLevel, formatPct, questionStats, wilsonInterval } from "../lib/stats";

export function QuestionsScreen() {
  let { state, setState, upsert, remove } = useApp(),
    settings = state.settings,
    [o, d] = useState("reg"),
    [u, L] = useState(null),
    [g, m] = useState(false),
    [h, f] = useState(""),
    [n, i] = useState(""),
    [w, v] = useState(""),
    [C, x] = useState(""),
    b = (P) => state.topics.find((K) => K.id === P),
    N = state.questions
      .filter(
        (P) =>
          (!h || P.concursoId === h) &&
          (!n || P.topicId === n) &&
          (w === "" || String(P.correto) === w) &&
          (!C || P.tipoErro === C),
      )
      .map((P) => ({
        ...P,
        assunto: b(P.topicId)?.nome || "",
        disc: b(P.topicId)?.disciplina || "",
      })),
    { sorted: I, th: A } = useSortableTable(N, "date", "desc"),
    R = questionStats(N),
    scoringConcurso = state.concursos.find(p => p.id === (h || (state.questions.every(q => q.concursoId === state.settings.concursoPrincipal) ? state.settings.concursoPrincipal : ""))),
    scoring = scoringConcurso?.scoring,
    score = scoring ? R.c * (Number(scoring.acerto) || 1) - R.e * (Number(scoring.erro) || 0) : null,
    S = wilsonInterval(R.c, R.valid),
    O = state.questions
      .filter((P) => P.correto === false)
      .sort((P, K) => Number(K.revisar) - Number(P.revisar) || K.date.localeCompare(P.date));
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Questões e caderno de erros"
        sub="Registre cada questão com a confiança antes de ver o gabarito. É a evidência que valida (ou não) o que você acha que sabe."
      >
        <Button icon={Layers} onClick={() => m(true)}>
          Lançar lote
        </Button>
        <Button variant="primary" icon={Plus} onClick={() => L(newQuestion(state))}>
          Nova questão
        </Button>
      </PageHeader>
      <Tabs
        tabs={[
          ["reg", "Registro"],
          ["erros", `Caderno de erros (${O.length})`],
          ["calib", "Calibração"],
        ]}
        value={o}
        onChange={d}
      />
      {o === "reg" && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              label="Questões (filtro)"
              value={R.total}
              sub={`${R.c} certas · ${R.e} erradas · ${R.b} em branco`}
            />
            <StatCard
              label="Taxa de acerto"
              value={R.valid ? formatPct(R.acc) : "—"}
              sub={
                R.valid
                  ? `n=${R.valid} · IC95% ${formatPct(S[0])}–${formatPct(S[1])} · amostra ${evidenceLevel(R.valid, settings.amostraMin)}`
                  : "Sem questões válidas"
              }
              def="Certas ÷ (certas + erradas). Em branco fica fora do denominador."
            />
            <StatCard
              label="Pontuação configurada"
              value={R.valid && score != null ? score : "—"}
              sub={scoring ? `${scoring.acerto ?? 1} por acerto; ${scoring.erro ?? 0} por erro` : "Selecione um concurso com regra informada"}
              def="A pontuação segue a regra registrada para o concurso; não presume anulação de acertos em provas de múltipla escolha."
            />
            <StatCard
              label="Tempo médio"
              value={R.avgSec ? `${Math.round(R.avgSec)} s` : "—"}
              sub={
                R.avgSec
                  ? `n=${R.timedN} · meta ${settings.segPorItemMeta} s`
                  : "Registre o tempo para medir"
              }
              tone={R.avgSec > settings.segPorItemMeta ? "warn" : undefined}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              aria-label="Concurso"
              className="w-48"
              value={h}
              onChange={(P) => f(P.target.value)}
            >
              <option value="">Todos os concursos</option>
              {state.concursos.map((P) => (
                <option key={P.id} value={P.id}>
                  {P.orgao.split("(")[0].trim()}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Assunto"
              className="w-56"
              value={n}
              onChange={(P) => i(P.target.value)}
            >
              <option value="">Todos os assuntos</option>
              {state.topics.map((P) => (
                <option key={P.id} value={P.id}>
                  {P.nome}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Resultado"
              className="w-36"
              value={w}
              onChange={(P) => v(P.target.value)}
            >
              <option value="">Todos</option>
              <option value="true">Certas</option>
              <option value="false">Erradas</option>
              <option value="null">Em branco</option>
            </Select>
            <Select
              aria-label="Tipo de erro"
              className="w-48"
              value={C}
              onChange={(P) => x(P.target.value)}
            >
              <option value="">Todos os erros</option>
              {settings.tiposErro.map((P) => (
                <option key={P}>{P}</option>
              ))}
            </Select>
          </div>
          {N.length ? (
            <DataTable className={"[&_table]:min-w-[820px]"}>
              <Thead>
                {A("date", "Data")}
                {A("assunto", "Assunto")}
                {A("banca", "Banca")}
                {A("correto", "Resultado")}
                {A("tempoSeg", "Tempo")}
                {A("confianca", "Confiança")}
                {A("tipoErro", "Tipo de erro")}
                <th />
              </Thead>
              <tbody>
                {I.slice(0, 200).map((P) => (
                  <Tr key={P.id}>
                    <Td className="text-xs tabular-nums">{formatDM(P.date)}</Td>
                    <Td className="max-w-[16rem]">
                      <div className="truncate text-[13px]" title={P.assunto}>
                        {P.assunto || <span className="text-muted">sem assunto</span>}
                      </div>
                      <div className="truncate text-[11px] text-muted">{P.fonte}</div>
                    </Td>
                    <Td className="text-xs">{P.banca}</Td>
                    <Td>
                      <Badge tone={CORRECTNESS_BADGE[P.correto][1]}>
                        {CORRECTNESS_BADGE[P.correto][0]}
                      </Badge>
                    </Td>
                    <Td className="text-xs tabular-nums">{P.tempoSeg ? P.tempoSeg + " s" : "—"}</Td>
                    <Td className="text-xs">
                      {P.confianca ? CONFIDENCE_LABELS[P.confianca] : "—"}
                    </Td>
                    <Td className="text-xs">
                      {P.tipoErro || "—"}
                      {P.revisar && (
                        <Badge tone="warn" className="ml-1">
                          revisar
                        </Badge>
                      )}
                    </Td>
                    <Td>
                      <IconButton icon={Pencil} label="Editar" onClick={() => L(P)} />
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </DataTable>
          ) : (
            <EmptyState
              title={
                state.questions.length ? "Nada com esses filtros" : "Nenhuma questão registrada"
              }
              action={
                !state.questions.length && (
                  <Button variant="primary" onClick={() => L(newQuestion(state))}>
                    Registrar a primeira
                  </Button>
                )
              }
            >
              {"Comece pelo diagnóstico: "}
              {settings.amostraMin}
              {" questões cronometradas por assunto, anotando a confiança antes de ver o gabarito."}
            </EmptyState>
          )}
          {I.length > 200 && (
            <p className="text-xs text-muted">
              {"Mostrando 200 de "}
              {I.length}. Use os filtros.
            </p>
          )}
        </>
      )}
      {o === "erros" &&
        (O.length ? (
          <ul className="flex flex-col gap-2">
            {O.map((P) => (
              <li key={P.id} className="rounded-lg border border-line bg-surface p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="muted">{formatDM(P.date)}</Badge>
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
                    {b(P.topicId)?.nome || "Sem assunto"}
                  </span>
                  <Badge tone="crit">{P.tipoErro || "Sem classificação"}</Badge>
                  {P.revisar && <Badge tone="warn">revisar</Badge>}
                </div>
                {P.justificativa && (
                  <p className="mt-1.5 text-[13px] text-ink2">{P.justificativa}</p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                  <span>
                    {P.banca}
                    {" · "}
                    {P.fonte || "fonte não informada"}
                    {" · confiança "}
                    {P.confianca ? CONFIDENCE_LABELS[P.confianca] : "—"}
                  </span>
                  {P.notebookRef && (
                    <span className="inline-flex items-center gap-1 text-accentInk">
                      <ExternalLink size={12} aria-hidden />
                      {P.notebookRef}
                    </span>
                  )}
                  <span className="ml-auto flex gap-1">
                    {P.revisar && (
                      <Button
                        size="sm"
                        icon={Check}
                        onClick={() =>
                          upsert("questions", {
                            ...P,
                            revisar: false,
                          })
                        }
                      >
                        Marcar revisado
                      </Button>
                    )}
                    <Button size="sm" onClick={() => L(P)}>
                      Editar
                    </Button>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState title="Caderno vazio">
            Questões erradas aparecem aqui, com o tipo de erro e a justificativa. Marque “precisa
            revisar” para trazê-las ao plano.
          </EmptyState>
        ))}
      {o === "calib" && <ConfidenceChart />}
      <QuestionModal q={u} onClose={() => L(null)} />
      <BatchQuestionsModal open={g} onClose={() => m(false)} />
    </div>
  );
}

function ConfidenceChart() {
  let { state } = useApp(),
    settings = state.settings,
    t = [1, 2, 3, 4, 5].map((l) => {
      let o = questionStats(state.questions.filter((d) => d.confianca === l));
      return {
        c: l,
        ...o,
      };
    }),
    r = t.reduce((l, o) => l + o.total, 0);
  return (
    <Card title="Confiança × acerto" sub="Mostra se sua sensação de saber corresponde ao resultado">
      {r ? (
        <DataTable>
          <Thead>
            {["Confiança antes de responder", "Questões", "Acerto", "Leitura"].map((l) => (
              <th
                key={l}
                className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink2"
              >
                {l}
              </th>
            ))}
          </Thead>
          <tbody>
            {t.map((l) => (
              <Tr key={l.c}>
                <Td className="text-[13px]">
                  {l.c}
                  {" · "}
                  {CONFIDENCE_LABELS[l.c]}
                </Td>
                <Td className="text-xs tabular-nums">{l.valid}</Td>
                <Td className="text-xs tabular-nums">{l.valid ? formatPct(l.acc) : "—"}</Td>
                <Td className="text-xs text-ink2">
                  {l.valid < settings.amostraMin
                    ? "amostra pequena"
                    : l.c >= 4 && l.acc < 0.7
                      ? "excesso de confiança"
                      : l.c <= 2 && l.acc > 0.7
                        ? "você sabe mais do que acha"
                        : "coerente"}
                </Td>
              </Tr>
            ))}
          </tbody>
        </DataTable>
      ) : (
        <EmptyState title="Sem dados de confiança">
          Marque a confiança ao registrar questões.
        </EmptyState>
      )}
      <p className="mt-3 text-xs text-muted">
        Chute (1) com acerto próximo de 50% em C/E é esperado. Em prova com penalização, deixar em
        branco quando a confiança é 1 costuma proteger o saldo.
      </p>
    </Card>
  );
}

function QuestionModal({ q: a, onClose }) {
  let { state, upsert, remove } = useApp(),
    settings = state.settings,
    [d, u] = useState(null),
    [L, g] = useState(false);
  if (
    (useEffect(() => {
      (u(
        a
          ? {
              ...a,
            }
          : null,
      ),
        g(false));
    }, [a]),
    !a || !d)
  )
    return null;
  let m = state.questions.some((f) => f.id === d.id),
    h = (f) =>
      u({
        ...d,
        ...f,
      });
  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={m ? "Questão" : "Nova questão"}
      footer={
        <>
          {m &&
            (L ? (
              <Button
                variant="danger"
                onClick={() => {
                  (remove("questions", d.id), onClose());
                }}
              >
                Confirmar exclusão
              </Button>
            ) : (
              <Button variant="danger" icon={Trash2} className="mr-auto" onClick={() => g(true)}>
                Excluir
              </Button>
            ))}
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            icon={Check}
            onClick={() => {
              (upsert("questions", {
                ...d,
                revisar: d.correto === false ? d.revisar : false,
                tipoErro: d.correto === true ? "" : d.tipoErro,
              }),
                onClose());
            }}
          >
            Salvar
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Data">
          <TextInput
            type="date"
            value={d.date}
            onChange={(f) =>
              h({
                date: f.target.value,
              })
            }
          />
        </Field>
        <Field label="Concurso">
          <Select
            value={d.concursoId}
            onChange={(f) => {
              let n = state.concursos.find((i) => i.id === f.target.value);
              h({
                concursoId: f.target.value,
                banca: n?.banca?.split(" ")[0] || d.banca,
              });
            }}
          >
            <option value="">—</option>
            {state.concursos.map((f) => (
              <option key={f.id} value={f.id}>
                {f.orgao.split("(")[0].trim()}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Assunto" className="sm:col-span-2">
          <Select
            value={d.topicId}
            onChange={(f) =>
              h({
                topicId: f.target.value,
              })
            }
          >
            <option value="">— sem assunto —</option>
            {state.topics.map((f) => (
              <option key={f.id} value={f.id}>
                {f.disciplina}
                {" · "}
                {f.nome}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Banca">
          <TextInput
            value={d.banca}
            onChange={(f) =>
              h({
                banca: f.target.value,
              })
            }
          />
        </Field>
        <Field label="Fonte da questão">
          <TextInput
            value={d.fonte}
            onChange={(f) =>
              h({
                fonte: f.target.value,
              })
            }
            placeholder="Ex.: Cebraspe/2023, caderno X, Q12"
          />
        </Field>
        <Field label="Confiança antes da resposta">
          <Select
            value={d.confianca || ""}
            onChange={(f) =>
              h({
                confianca: f.target.value ? Number(f.target.value) : null,
              })
            }
          >
            <option value="">—</option>
            {Object.entries(CONFIDENCE_LABELS).map(([f, n]) => (
              <option key={f} value={f}>
                {f}
                {" · "}
                {n}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Resultado">
          <Select
            value={String(d.correto)}
            onChange={(f) =>
              h({
                correto: f.target.value === "null" ? null : f.target.value === "true",
              })
            }
          >
            <option value="true">Certa</option>
            <option value="false">Errada</option>
            <option value="null">Em branco</option>
          </Select>
        </Field>
        <Field label="Tempo de resolução (s)">
          <NumberInput
            value={d.tempoSeg}
            onChange={(f) =>
              h({
                tempoSeg: f,
              })
            }
          />
        </Field>
        {d.correto !== true && (
          <Field label="Tipo de erro">
            <Select
              value={d.tipoErro}
              onChange={(f) =>
                h({
                  tipoErro: f.target.value,
                })
              }
            >
              <option value="">—</option>
              {settings.tiposErro.map((f) => (
                <option key={f}>{f}</option>
              ))}
            </Select>
          </Field>
        )}
        {d.correto !== true && (
          <Field label="Justificativa / o que aprendi" className="sm:col-span-2">
            <Textarea
              value={d.justificativa}
              onChange={(f) =>
                h({
                  justificativa: f.target.value,
                })
              }
            />
          </Field>
        )}
        <Field
          label="Referência no NotebookLM"
          className="sm:col-span-2"
          hint="Nome do notebook, fonte e página, ou link"
        >
          <TextInput
            value={d.notebookRef}
            onChange={(f) =>
              h({
                notebookRef: f.target.value,
              })
            }
          />
        </Field>
        {d.correto === false && (
          <Checkbox
            label="Precisa revisar (entra no caderno de erros e no plano)"
            checked={d.revisar}
            onChange={(f) =>
              h({
                revisar: f,
              })
            }
          />
        )}
      </div>
    </Modal>
  );
}

function BatchQuestionsModal({ open, onClose }) {
  let { state, setState } = useApp(),
    [l, o] = useState({
      topicId: "",
      c: 0,
      e: 0,
      b: 0,
      seg: null,
      banca: state.concursos.find(c => c.id === state.settings.concursoPrincipal)?.banca || "",
      date: today(),
    }),
    d = (l.c || 0) + (l.e || 0) + (l.b || 0),
    u = () => {
      let L = state.concursos.find((h) => h.id === state.settings.concursoPrincipal),
        g = (h) => ({
          id: uid(),
          date: l.date,
          concursoId: L?.id || "",
          banca: l.banca,
          topicId: l.topicId,
          fonte: "Lote",
          correto: h,
          tempoSeg: l.seg,
          tipoErro: "",
          justificativa: "",
          confianca: null,
          revisar: false,
          notebookRef: "",
        }),
        m = [
          ...Array(l.c || 0)
            .fill(0)
            .map(() => g(true)),
          ...Array(l.e || 0)
            .fill(0)
            .map(() => g(false)),
          ...Array(l.b || 0)
            .fill(0)
            .map(() => g(null)),
        ];
      (setState((h) => ({
        ...h,
        questions: [...h.questions, ...m],
      })),
        onClose(),
        o({
          ...l,
          c: 0,
          e: 0,
          b: 0,
        }));
    };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Lançar lote de questões"
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" disabled={!d || d > 300} onClick={u}>
            {"Registrar "}
            {d || ""}
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <p className="text-xs text-ink2 sm:col-span-3">
          Para quando você resolveu várias questões e só tem o placar. Perde detalhes (confiança,
          tipo de erro); use para volume e diagnóstico rápido.
        </p>
        <Field label="Assunto" className="sm:col-span-3">
          <Select
            value={l.topicId}
            onChange={(L) =>
              o({
                ...l,
                topicId: L.target.value,
              })
            }
          >
            <option value="">— sem assunto —</option>
            {state.topics.map((L) => (
              <option key={L.id} value={L.id}>
                {L.disciplina}
                {" · "}
                {L.nome}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Certas">
          <NumberInput
            value={l.c}
            onChange={(L) =>
              o({
                ...l,
                c: Math.max(0, L || 0),
              })
            }
          />
        </Field>
        <Field label="Erradas">
          <NumberInput
            value={l.e}
            onChange={(L) =>
              o({
                ...l,
                e: Math.max(0, L || 0),
              })
            }
          />
        </Field>
        <Field label="Em branco">
          <NumberInput
            value={l.b}
            onChange={(L) =>
              o({
                ...l,
                b: Math.max(0, L || 0),
              })
            }
          />
        </Field>
        <Field label="Tempo médio (s)">
          <NumberInput
            value={l.seg}
            onChange={(L) =>
              o({
                ...l,
                seg: L,
              })
            }
          />
        </Field>
        <Field label="Banca">
          <TextInput
            value={l.banca}
            onChange={(L) =>
              o({
                ...l,
                banca: L.target.value,
              })
            }
          />
        </Field>
        <Field label="Data">
          <TextInput
            type="date"
            value={l.date}
            onChange={(L) =>
              o({
                ...l,
                date: L.target.value,
              })
            }
          />
        </Field>
      </div>
    </Modal>
  );
}
