/**
 * Matriz de disciplinas: hierarquia de assuntos, prioridades, diagnóstico inicial, edição e importação em massa.
 */
import { Fragment, useEffect, useMemo, useState } from "react";
import { Check, Plus, Search, Trash2, Upload } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { EmptyState, PageHeader, ProgressBar, Tabs } from "../components/ui/feedback";
import { Checkbox, Field, NumberInput, Select, TextInput, Textarea } from "../components/ui/form";
import { DataTable, Td, Thead, Tr } from "../components/ui/table";
import { useApp } from "../context/AppContext";
import {
  CLASS_LABELS,
  FAMILIARITY_LABELS,
  PRIORITY_FACTORS,
  TOPIC_STATUS_LABELS,
} from "../data/constants";
import { newTopic } from "../data/defaults";
import { formatDM, formatMinutes, today, uid } from "../lib/dates";
import { classifyTopic, computePriorities, scheduleFirstReview } from "../lib/planner";
import { formatPct, topicStats } from "../lib/stats";

export function MatrixScreen() {
  let { state, upsert, setState } = useApp(),
    [r, l] = useState("hier"),
    [o, d] = useState(null),
    [u, L] = useState(false),
    [g, m] = useState(""),
    [h, f] = useState(""),
    [n, i] = useState(""),
    [w, v] = useState(false),
    todayStr = today(),
    settings = state.settings,
    b = useMemo(() => computePriorities(state, todayStr), [state, todayStr]),
    N = Object.fromEntries(
      b.map((S, O) => [
        S.t.id,
        {
          ...S,
          rank: O + 1,
        },
      ]),
    ),
    I = state.topics.filter(
      (S) =>
        (!g || S.concursos.includes(g)) &&
        (!h || S.status === h) &&
        (!n || (S.nome + S.disciplina).toLowerCase().includes(n.toLowerCase())),
    ),
    A = ({ t: S, depth: O }) => {
      let P = N[S.id],
        K = P.st,
        B = state.questions
          .filter((c) => c.topicId === S.id && c.confianca)
          .map((c) => c.confianca),
        H = B.length ? B.reduce((c, p) => c + p, 0) / B.length : null;
      return (
        <Tr className="hover:bg-surface2">
          <Td>
            <button
              className="text-left text-[13px] hover:text-accentInk"
              style={{
                paddingLeft: O * 16,
              }}
              onClick={() => d(S)}
            >
              {S.nome}
            </button>
            {S.subPendentes && (
              <div
                className="text-[11px] text-muted"
                style={{
                  paddingLeft: O * 16,
                }}
              >
                subtópicos oficiais pendentes
              </div>
            )}
          </Td>
          <Td className="w-28">
            <div className="flex items-center gap-2">
              <span className="w-6 text-right text-xs tabular-nums">
                {(P.score * 100).toFixed(0)}
              </span>
              <div className="w-14">
                <ProgressBar value={P.score} />
              </div>
            </div>
          </Td>
          <Td>
            <Badge
              tone={S.status === "estudado" ? "good" : S.status === "estudando" ? "info" : "muted"}
            >
              {TOPIC_STATUS_LABELS[S.status]}
            </Badge>
          </Td>
          <Td className="text-xs tabular-nums">{formatMinutes(K.minutes)}</Td>
          <Td className="text-xs tabular-nums">
            {K.n || "—"}
            {K.valid ? (
              <span className="text-muted">
                {" ("}
                {K.c}
                {"✓ "}
                {K.e}✗)
              </span>
            ) : (
              ""
            )}
          </Td>
          <Td className="text-xs tabular-nums">
            {K.valid ? (
              <span
                className={
                  K.valid < settings.amostraMin
                    ? "text-muted"
                    : K.acc < 0.6
                      ? "text-critInk font-medium"
                      : ""
                }
              >
                {formatPct(K.acc)}
                <span className="text-muted">
                  {" n="}
                  {K.valid}
                </span>
              </span>
            ) : (
              <span className="text-muted">sem dados</span>
            )}
          </Td>
          <Td className="text-xs tabular-nums">{K.last ? formatDM(K.last) : "—"}</Td>
          <Td className="text-xs tabular-nums">
            {S.rev?.due ? (
              <span className={S.rev.due <= todayStr ? "font-medium text-warnInk" : ""}>
                {formatDM(S.rev.due)}
              </span>
            ) : (
              "—"
            )}
          </Td>
          <Td className="text-xs tabular-nums">{H != null ? H.toFixed(1) + "/5" : "—"}</Td>
        </Tr>
      );
    },
    R = state.concursos.filter((S) => !g || S.id === g);
  return (
    <div>
      <PageHeader
        title="Matriz de disciplinas"
        sub="Concurso → disciplina → assunto → subassunto. Concluir a teoria não significa dominar: o domínio vem de questões e revisões."
      >
        <Button icon={Upload} onClick={() => L(true)}>
          Importar lista
        </Button>
        <Button variant="primary" icon={Plus} onClick={() => d(newTopic(state))}>
          Novo assunto
        </Button>
      </PageHeader>
      <Tabs
        tabs={[
          ["hier", "Hierarquia"],
          ["prio", "Prioridades"],
          ["diag", "Diagnóstico"],
        ]}
        value={r}
        onChange={l}
      />
      <div className="mt-4 flex flex-col gap-4">
        {r !== "diag" && (
          <div className="flex flex-wrap gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-2.5 text-muted" aria-hidden />
              <TextInput
                aria-label="Buscar assunto"
                placeholder="Buscar assunto"
                value={n}
                onChange={(S) => i(S.target.value)}
                className="w-52 pl-8"
              />
            </div>
            <Select
              aria-label="Filtrar por concurso"
              className="w-56"
              value={g}
              onChange={(S) => m(S.target.value)}
            >
              <option value="">Todos os concursos</option>
              {state.concursos.map((S) => (
                <option key={S.id} value={S.id}>
                  {S.orgao.split("(")[0].trim()}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Filtrar por situação"
              className="w-48"
              value={h}
              onChange={(S) => f(S.target.value)}
            >
              <option value="">Todas as situações</option>
              {Object.entries(TOPIC_STATUS_LABELS).map(([S, O]) => (
                <option key={S} value={S}>
                  {O}
                </option>
              ))}
            </Select>
          </div>
        )}
        {r === "hier" &&
          (I.length === 0 ? (
            <EmptyState title="Nenhum assunto encontrado">
              Ajuste os filtros ou cadastre assuntos. Para concursos sem edital publicado, deixe o
              conteúdo como pendente.
            </EmptyState>
          ) : (
            <DataTable className={"[&_table]:min-w-[820px]"}>
              <Thead>
                {[
                  "Assunto",
                  "Prioridade",
                  "Situação",
                  "Tempo",
                  "Questões",
                  "Acerto",
                  "Último",
                  "Revisão",
                  "Confiança",
                ].map((S) => (
                  <th
                    key={S}
                    className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink2"
                  >
                    {S}
                  </th>
                ))}
              </Thead>
              <tbody>
                {R.map((S) => {
                  let O = I.filter((K) => K.concursos.includes(S.id));
                  if (!O.length) return null;
                  let P = [...new Set(O.map((K) => K.disciplina))];
                  return (
                    <Fragment key={S.id}>
                      <tr className="bg-surface2">
                        <td colSpan={9} className="px-3 py-1.5 text-xs font-semibold">
                          {S.orgao.split("(")[0].trim()}
                          {" · "}
                          {S.area}
                        </td>
                      </tr>
                      {P.map((K) => (
                        <Fragment key={K}>
                          <tr>
                            <td
                              colSpan={9}
                              className="border-t border-line px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink2"
                            >
                              {K}
                            </td>
                          </tr>
                          {O.filter((B) => B.disciplina === K && !B.parentId).map((B) => (
                            <Fragment key={B.id}>
                              <A t={B} depth={0} />
                              {O.filter((H) => H.parentId === B.id).map((H) => (
                                <A key={H.id} t={H} depth={1} />
                              ))}
                            </Fragment>
                          ))}
                        </Fragment>
                      ))}
                    </Fragment>
                  );
                })}
                {I.filter((S) => !S.concursos.length).map((S) => (
                  <A key={S.id} t={S} depth={0} />
                ))}
              </tbody>
            </DataTable>
          ))}
        {r === "prio" && (
          <PriorityView
            prios={b.filter((S) => I.some((O) => O.id === S.t.id))}
            perHour={w}
            setPerHour={v}
            onEdit={d}
          />
        )}
        {r === "diag" && <DiagnosticView prios={b} onEdit={d} />}
      </div>
      <TopicModal t={o} onClose={() => d(null)} />
      <ImportTopicsModal open={u} onClose={() => L(false)} />
    </div>
  );
}

function PriorityView({ prios, perHour, setPerHour, onEdit }) {
  let { state, nav } = useApp(),
    d = state.settings.pesos,
    u = [...prios].sort((L, g) => (perHour ? g.perHour - L.perHour : g.score - L.score));
  return (
    <div className="flex flex-col gap-3">
      <Card
        title="Como a prioridade é calculada"
        right={
          <Button size="sm" onClick={() => nav("config")}>
            Ajustar pesos
          </Button>
        }
      >
        <p className="max-w-3xl text-xs text-ink2">
          Cada componente é normalizado de 0 a 1 antes de entrar. A nota final (0–100) é a média
          ponderada só dos componentes que têm dado: se o edital não informa o peso da prova, o
          componente sai e os demais são reponderados, sem inventar valor. Sem questões, a lacuna
          vale 0,5, o que mantém o assunto na fila do diagnóstico.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Object.entries(PRIORITY_FACTORS).map(([L, g]) => (
            <Badge key={L} tone="muted" title={g.ajuda}>
              {g.nome}
              {" × "}
              {d[L]}
            </Badge>
          ))}
        </div>
        <div className="mt-3">
          <Checkbox
            label="Ordenar por prioridade por hora estimada (custo de oportunidade)"
            checked={perHour}
            onChange={setPerHour}
          />
        </div>
      </Card>
      <DataTable className={"[&_table]:min-w-[760px]"}>
        <Thead>
          {[
            "#",
            "Assunto",
            "Nota",
            ...Object.values(PRIORITY_FACTORS).map((L) => L.nome),
            perHour ? "Nota/hora" : "",
          ].map((L, g) => (
            <th
              key={L + g}
              className="px-2 py-2 text-left text-[10px] font-semibold uppercase leading-tight tracking-wide text-ink2"
            >
              {L}
            </th>
          ))}
        </Thead>
        <tbody>
          {u.map((L, g) => (
            <Tr key={L.t.id}>
              <Td className="text-xs tabular-nums text-muted">{g + 1}</Td>
              <Td>
                <button
                  className="text-left text-[13px] hover:text-accentInk"
                  onClick={() => onEdit(L.t)}
                >
                  {L.t.nome}
                </button>
              </Td>
              <Td className="text-sm font-semibold tabular-nums">{(L.score * 100).toFixed(0)}</Td>
              {L.parts.map((m) => (
                <Td key={m.k} className="px-2 text-[11px] tabular-nums">
                  {m.v == null ? (
                    <span className="text-muted" title="Sem dado: componente fora do cálculo">
                      —
                    </span>
                  ) : (
                    <span className={m.w ? "" : "text-muted"}>{m.v.toFixed(2)}</span>
                  )}
                </Td>
              ))}
              {perHour && <Td className="text-xs tabular-nums">{(L.perHour * 100).toFixed(0)}</Td>}
            </Tr>
          ))}
        </tbody>
      </DataTable>
    </div>
  );
}

function DiagnosticView({ prios, onEdit }) {
  let { state, nav } = useApp(),
    settings = state.settings,
    o = prios.map((u) => ({
      ...u,
      cls: classifyTopic(state, u.t, u.st),
    })),
    d = {};
  return (
    o.forEach((u) => u.cls.forEach((L) => (d[L] = (d[L] || 0) + 1))),
    (
      <div className="flex flex-col gap-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(CLASS_LABELS).map(([u, L]) => (
            <div key={u} className="rounded-lg border border-line bg-surface p-3">
              <Badge tone={L.tone}>{L.nome}</Badge>
              <div className="mt-2 text-2xl font-semibold tabular-nums">{d[u] || 0}</div>
            </div>
          ))}
        </div>
        <Card title="Protocolo de diagnóstico inicial">
          <ol className="list-decimal space-y-1.5 pl-5 text-[13px] text-ink2">
            <li>
              {"Em cada assunto, resolva "}
              <b className="text-ink">
                {settings.amostraMin}
                {" questões"}
              </b>
              {" da banca escolhida, quando confirmada, sem consulta, com cronômetro."}
            </li>
            <li>
              {"Antes de ver o gabarito, marque a "}
              <b className="text-ink">confiança</b>
              {" de cada resposta (1 = chute, 5 = certeza)."}
            </li>
            <li>
              Classifique cada erro: falta de conhecimento, interpretação, confusão conceitual etc.
            </li>
            <li>
              {"Refaça um lote menor após 5–7 dias para medir "}
              <b className="text-ink">retenção</b>.
            </li>
            <li>
              {"Só depois o sistema classifica o assunto. Com menos de "}
              {settings.amostraMin}
              {" questões válidas, o diagnóstico fica "}
              <b className="text-ink">pendente</b>: nada de nota estimada.
            </li>
          </ol>
          <p className="mt-2 text-xs text-muted">
            Domínio exige: teoria concluída, ≥{settings.amostraMin}
            {
              " questões, acerto ≥ 80% e revisões sem lapsos recorrentes. “Prática, não validado” é o que você declara usar no trabalho, mas ainda não provou em questões. Velocidade usa "
            }
            {settings.segPorItemMeta}
            {" s/item (meta editável para sua prova)."}
          </p>
        </Card>
        <DataTable className={"[&_table]:min-w-[700px]"}>
          <Thead>
            {[
              "Assunto",
              "Familiaridade declarada",
              "Questões válidas",
              "Acerto",
              "Tempo médio",
              "Revisões (lapsos)",
              "Classificação",
            ].map((u) => (
              <th
                key={u}
                className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink2"
              >
                {u}
              </th>
            ))}
          </Thead>
          <tbody>
            {o.map((u) => (
              <Tr key={u.t.id}>
                <Td>
                  <button
                    className="text-left text-[13px] hover:text-accentInk"
                    onClick={() => onEdit(u.t)}
                  >
                    {u.t.nome}
                  </button>
                </Td>
                <Td className="text-xs">{FAMILIARITY_LABELS[u.t.familiaridade]}</Td>
                <Td className="text-xs tabular-nums">{u.st.valid}</Td>
                <Td className="text-xs tabular-nums">{u.st.valid ? formatPct(u.st.acc) : "—"}</Td>
                <Td className="text-xs tabular-nums">
                  {u.st.avgSec ? Math.round(u.st.avgSec) + " s" : "—"}
                </Td>
                <Td className="text-xs tabular-nums">
                  {u.st.reviews}
                  {" ("}
                  {u.st.lapses})
                </Td>
                <Td>
                  <div className="flex flex-wrap gap-1">
                    {u.cls.map((L) => (
                      <Badge key={L} tone={CLASS_LABELS[L].tone}>
                        {CLASS_LABELS[L].nome}
                      </Badge>
                    ))}
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </DataTable>
        <div>
          <Button onClick={() => nav("questoes")}>Registrar questões do diagnóstico</Button>
        </div>
      </div>
    )
  );
}

function TopicModal({ t: a, onClose }) {
  let { state, upsert, remove, log } = useApp(),
    [d, u] = useState(null),
    [L, g] = useState(false);
  if (
    (useEffect(() => {
      (u(a ? JSON.parse(JSON.stringify(a)) : null), g(false));
    }, [a]),
    !a || !d)
  )
    return null;
  let m = state.topics.some((C) => C.id === d.id),
    h = (C) =>
      u({
        ...d,
        ...C,
      }),
    f = topicStats(state, d.id),
    n = computePriorities(state, today()).find((C) => C.t.id === d.id),
    i = [...new Set(state.topics.map((C) => C.disciplina).filter(Boolean))],
    w = state.concursos.flatMap((C) =>
      (C.blocos || [])
        .filter((x) => x.tipo === "objetiva")
        .map((x) => ({
          ...x,
          c: C,
        })),
    ),
    v = () => {
      let C = {
        ...d,
        nome: d.nome.trim(),
      };
      (C.status === "estudado" && !C.rev?.due && (C = scheduleFirstReview(state, C, today())),
        upsert("topics", C),
        m &&
          a.status !== C.status &&
          log(`Assunto “${C.nome}”: ${a.status} → ${C.status}`, "situação de aprendizagem"),
        onClose());
    };
  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={m ? "Assunto" : "Novo assunto"}
      footer={
        <>
          {m &&
            (L ? (
              <Button
                variant="danger"
                onClick={() => {
                  (remove("topics", d.id), onClose());
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
            disabled={!d.nome.trim() || !d.disciplina.trim()}
            onClick={v}
          >
            Salvar
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Assunto" className="sm:col-span-2">
          <TextInput
            value={d.nome}
            onChange={(C) =>
              h({
                nome: C.target.value,
              })
            }
          />
        </Field>
        <Field label="Disciplina">
          <TextInput
            list="discs"
            value={d.disciplina}
            onChange={(C) =>
              h({
                disciplina: C.target.value,
              })
            }
          />
          <datalist id="discs">
            {i.map((C) => (
              <option key={C} value={C} />
            ))}
          </datalist>
        </Field>
        <Field label="Subassunto de">
          <Select
            value={d.parentId || ""}
            onChange={(C) =>
              h({
                parentId: C.target.value || null,
              })
            }
          >
            <option value="">— (assunto principal)</option>
            {state.topics
              .filter((C) => C.id !== d.id && !C.parentId)
              .map((C) => (
                <option key={C.id} value={C.id}>
                  {C.nome}
                </option>
              ))}
          </Select>
        </Field>
        <Field label="Bloco de prova (para o peso)" hint="Opcional">
          <Select
            value={d.blocoId || ""}
            onChange={(C) =>
              h({
                blocoId: C.target.value,
              })
            }
          >
            <option value="">—</option>
            {w.map((C) => (
              <option key={C.id} value={C.id}>
                {C.c.orgao.split("(")[0].trim()}
                {" · "}
                {C.nome}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Situação">
          <Select
            value={d.status}
            onChange={(C) =>
              h({
                status: C.target.value,
              })
            }
          >
            {Object.entries(TOPIC_STATUS_LABELS).map(([C, x]) => (
              <option key={C} value={C}>
                {x}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Familiaridade (autodeclarada)"
          hint="Não vira nota: o domínio vem de questões"
        >
          <Select
            value={d.familiaridade}
            onChange={(C) =>
              h({
                familiaridade: C.target.value,
              })
            }
          >
            {Object.entries(FAMILIARITY_LABELS).map(([C, x]) => (
              <option key={C} value={C}>
                {x}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Relevância (1–5)">
          <Select
            value={d.relevancia}
            onChange={(C) =>
              h({
                relevancia: Number(C.target.value),
              })
            }
          >
            {[1, 2, 3, 4, 5].map((C) => (
              <option key={C}>{C}</option>
            ))}
          </Select>
        </Field>
        <Field label="Dificuldade (1–5)">
          <Select
            value={d.dificuldade}
            onChange={(C) =>
              h({
                dificuldade: Number(C.target.value),
              })
            }
          >
            {[1, 2, 3, 4, 5].map((C) => (
              <option key={C}>{C}</option>
            ))}
          </Select>
        </Field>
        <Field label="Tempo estimado até evoluir (min)" hint="Estimativa sua, editável">
          <NumberInput
            value={d.estMin}
            onChange={(C) =>
              h({
                estMin: C,
              })
            }
          />
        </Field>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-xs font-medium text-ink2">Concursos que cobram o assunto</span>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {state.concursos.map((C) => (
              <Checkbox
                key={C.id}
                label={C.orgao.split("(")[0].trim()}
                checked={d.concursos.includes(C.id)}
                onChange={(x) =>
                  h({
                    concursos: x ? [...d.concursos, C.id] : d.concursos.filter((b) => b !== C.id),
                  })
                }
              />
            ))}
          </div>
        </div>
        <Field label="Observações" className="sm:col-span-2">
          <Textarea
            value={d.notas}
            onChange={(C) =>
              h({
                notas: C.target.value,
              })
            }
          />
        </Field>
        <Field
          label="Materiais relacionados"
          className="sm:col-span-2"
          hint="Livros, aulas, notebooks do NotebookLM"
        >
          <Textarea
            value={d.materiais}
            onChange={(C) =>
              h({
                materiais: C.target.value,
              })
            }
          />
        </Field>
        <Checkbox
          label="Subtópicos oficiais ainda pendentes"
          checked={d.subPendentes}
          onChange={(C) =>
            h({
              subPendentes: C,
            })
          }
        />
      </div>
      {m && n && (
        <div className="mt-4 rounded-lg bg-surface2 p-3 text-xs text-ink2">
          <p className="font-medium text-ink">
            {"Prioridade atual: "}
            {(n.score * 100).toFixed(0)}
            {"/100 · "}
            {formatMinutes(f.minutes)}
            {" estudados · "}
            {f.valid}
            {" questões válidas"}
            {f.valid ? ` · acerto ${formatPct(f.acc)}` : ""}
          </p>
          <div className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-2">
            {n.parts.map((C) => (
              <div key={C.k} className="flex justify-between gap-2">
                <span>{PRIORITY_FACTORS[C.k].nome}</span>
                <span className="tabular-nums">
                  {C.v == null ? "sem dado" : `${C.v.toFixed(2)} × ${C.w}`}
                </span>
              </div>
            ))}
          </div>
          {d.rev?.history?.length > 0 && (
            <p className="mt-2">
              {"Revisões: "}
              {d.rev.history.map((C) => `${formatDM(C.date)} ${C.outcome}`).join(" · ")}
            </p>
          )}
        </div>
      )}
    </Modal>
  );
}

function ImportTopicsModal({ open, onClose }) {
  let { state, setState } = useApp(),
    [l, o] = useState(""),
    [d, u] = useState(""),
    [L, g] = useState(state.settings.concursoPrincipal),
    m = l
      .split(
        `
`,
      )
      .map((f) => f.replace(/\s+$/, ""))
      .filter((f) => f.trim()),
    h = () => {
      let f = [],
        n = null;
      for (let i of m) {
        let w = /^(\s{2,}|\t|[-–•·]\s)/.test(i),
          v = i.replace(/^[\s\-–•·\d.)]+/, "").trim();
        if (!v) continue;
        let C = {
          ...newTopic(state),
          concursos: [L],
          disciplina: d.trim() || "Sem disciplina",
          nome: v,
          parentId: w ? n : null,
        };
        (w || (n = C.id), f.push(C));
      }
      (setState((i) => ({
        ...i,
        topics: [...i.topics, ...f],
        decisions: [
          ...i.decisions,
          {
            id: uid(),
            data: today(),
            motivo: `Importados ${f.length} assunto(s) em “${d}”`,
            acao: "importação de lista",
          },
        ],
      })),
        o(""),
        onClose());
    };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Importar lista de assuntos"
      footer={
        <>
          <Button onClick={onClose}>Cancelar</Button>
          <Button variant="primary" disabled={!m.length || !d.trim()} onClick={h}>
            {"Importar "}
            {m.length || ""}
          </Button>
        </>
      }
    >
      <div className="grid gap-3">
        <p className="text-xs text-ink2">
          Cole o conteúdo programático do edital, uma linha por assunto. Linhas recuadas (espaços,
          tab ou iniciadas por “-”) viram subassuntos do assunto anterior.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Disciplina">
            <TextInput value={d} onChange={(f) => u(f.target.value)} />
          </Field>
          <Field label="Concurso">
            <Select value={L} onChange={(f) => g(f.target.value)}>
              {state.concursos.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.orgao.split("(")[0].trim()}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Lista">
          <Textarea
            className="min-h-[160px] font-mono text-xs"
            value={l}
            onChange={(f) => o(f.target.value)}
          />
        </Field>
      </div>
    </Modal>
  );
}
