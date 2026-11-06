/**
 * Central de concursos: comparar concursos, interseção de assuntos e detalhe de cada concurso (fatos, prazos, fontes, pendências, estrutura da prova).
 */
import { useEffect, useState } from "react";
import { ArrowLeft, Check, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button, IconButton } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { EmptyState, PageHeader, ProgressBar, Tabs } from "../components/ui/feedback";
import { Checkbox, Field, NumberInput, Select, TextInput, Textarea } from "../components/ui/form";
import { DataTable, Td, Thead, Tr } from "../components/ui/table";
import { useApp } from "../context/AppContext";
import { CONCURSO_STATUS, SOURCE_KIND } from "../data/constants";
import { newConcurso } from "../data/defaults";
import { useSortableTable } from "../hooks/useSortableTable";
import { cn } from "../lib/cn";
import { diffDays, formatDMY, today, uid } from "../lib/dates";
import { coverageStats } from "../lib/planner";
import { topicStats } from "../lib/stats";

export function ConcursosScreen() {
  let { state, setState, upsert, remove, log, startWizard } = useApp(),
    [o, d] = useState(null),
    [u, L] = useState("lista"),
    [g, m] = useState(null),
    todayStr = today(),
    f = state.concursos.map((v) => {
      let C = coverageStats(state, v.id),
        x = state.topics.filter((b) => b.concursos.includes(v.id));
      return {
        ...v,
        cv: C,
        shared: x.filter((b) => b.concursos.length > 1).length,
        excl: x.filter((b) => b.concursos.length === 1).length,
        dias: v.dataProva ? diffDays(v.dataProva, todayStr) : null,
      };
    }),
    { sorted: n, th: i } = useSortableTable(f, "prioridade", "desc"),
    w = state.concursos.find((v) => v.id === o);
  return w ? (
    <ConcursoDetail c={w} onBack={() => d(null)} onEdit={() => m(w)} edit={g} setEdit={m} />
  ) : (
    <div>
      <PageHeader
        title="Central de concursos"
        sub="Cada informação traz o tipo (oficial, fonte secundária, histórico, projeção ou hipótese). Dados sem confirmação ficam em pendências, nunca como fato."
      >
        <Button variant="primary" icon={Plus} onClick={startWizard}>
          Novo concurso guiado
        </Button>
        <Button icon={Plus} onClick={() => m(newConcurso())}>
          Cadastro manual
        </Button>
      </PageHeader>
      <Tabs
        tabs={[
          ["lista", "Comparar concursos"],
          ["matriz", "Interseção de assuntos"],
        ]}
        value={u}
        onChange={L}
      />
      <div className="mt-4">
        {u === "lista" ? (
          <DataTable>
            <Thead>
              {i("orgao", "Concurso")}
              {i("status", "Situação")}
              {i("banca", "Banca")}
              {i("dias", "Prova")}
              {i("prioridade", "Prioridade")}
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink2">
                Assuntos
              </th>
              <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink2">
                Cobertura
              </th>
            </Thead>
            <tbody>
              {n.map((v) => (
                <Tr key={v.id} className={cn(!v.ativo && "opacity-60")}>
                  <Td>
                    <button
                      className="text-left font-medium text-accentInk hover:underline"
                      onClick={() => d(v.id)}
                    >
                      {v.orgao.split("(")[0].trim()}
                    </button>
                    <div className="text-xs text-ink2">
                      {v.cargo}
                      {v.area ? ` · ${v.area}` : ""}
                    </div>
                    {v.editalMeta && <div className="mt-1 text-[11px] text-warnInk">Base: {v.editalMeta.tipo} · informada pelo estudante, não verificada oficialmente</div>}
                  </Td>
                  <Td>
                    <Badge tone={CONCURSO_STATUS[v.status].tone}>
                      {CONCURSO_STATUS[v.status].label}
                    </Badge>
                  </Td>
                  <Td className="text-xs">{v.banca}</Td>
                  <Td className="tabular-nums text-xs">
                    {v.dataProva ? (
                      <>
                        {formatDMY(v.dataProva)}
                        <div className="text-muted">
                          {v.dias >= 0 ? `em ${v.dias} dias` : "realizada"}
                        </div>
                      </>
                    ) : (
                      <span className="text-muted">sem data</span>
                    )}
                  </Td>
                  <Td>
                    <Select
                      aria-label={`Prioridade de ${v.orgao}`}
                      className="!h-8 w-16"
                      value={v.prioridade}
                      onChange={(C) => {
                        (upsert("concursos", {
                          ...v,
                          cv: undefined,
                          shared: undefined,
                          excl: undefined,
                          dias: undefined,
                          prioridade: Number(C.target.value),
                        }),
                          log(
                            `Prioridade de ${v.orgao.split("(")[0].trim()} alterada para ${C.target.value}`,
                            "prioridade estratégica",
                          ));
                      }}
                    >
                      {[1, 2, 3, 4, 5].map((C) => (
                        <option key={C}>{C}</option>
                      ))}
                    </Select>
                  </Td>
                  <Td className="text-xs tabular-nums">
                    {v.shared}
                    {" comp. · "}
                    {v.excl}
                    {" excl."}
                  </Td>
                  <Td className="min-w-[8rem]">
                    {v.cv.total ? (
                      <>
                        <ProgressBar value={v.cv.studied / v.cv.total} />
                        <div className="mt-1 text-[11px] text-ink2 tabular-nums">
                          {v.cv.studied}/{v.cv.total}
                        </div>
                      </>
                    ) : (
                      <span className="text-xs text-muted">conteúdo pendente</span>
                    )}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </DataTable>
        ) : (
          <TopicCoverageGrid />
        )}
        <p className="mt-3 text-xs text-muted">
          Prioridade estratégica (1–5) é decisão sua e entra no planejamento junto com a relevância
          e a proximidade das provas. Nenhuma probabilidade de aprovação é calculada: não há base
          defensável para isso.
        </p>
      </div>
      <ConcursoEditModal
        c={g}
        onClose={() => m(null)}
        onSave={(v) => {
          (upsert("concursos", v), m(null));
        }}
      />
    </div>
  );
}

function TopicCoverageGrid() {
  let { state, setState } = useApp(),
    t = state.concursos.filter((l) => l.ativo);
  if (!state.topics.length)
    return (
      <EmptyState title="Nenhum assunto cadastrado">
        Cadastre assuntos na Matriz de disciplinas e marque quais concursos cobram cada um.
      </EmptyState>
    );
  let r = (l, o) =>
    setState((d) => ({
      ...d,
      topics: d.topics.map((u) =>
        u.id === l.id
          ? {
              ...u,
              concursos: u.concursos.includes(o)
                ? u.concursos.filter((L) => L !== o)
                : [...u.concursos, o],
            }
          : u,
      ),
    }));
  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-2xl text-xs text-ink2">
        Marque onde cada assunto é cobrado. Nomes parecidos não significam equivalência: marque só o
        que o edital realmente cobra, e use as observações do assunto para registrar diferenças de
        nível, banca ou legislação específica.
      </p>
      <DataTable>
        <Thead>
          <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink2">
            Assunto
          </th>
          {t.map((l) => (
            <th
              key={l.id}
              className="px-3 py-2 text-center text-[11px] font-semibold uppercase tracking-wide text-ink2"
            >
              {l.orgao.match(/\(([^)]+)\)/)?.[1] || l.orgao.slice(0, 8)}
            </th>
          ))}
          <th className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink2">
            Tipo
          </th>
        </Thead>
        <tbody>
          {state.topics.map((l) => (
            <Tr key={l.id}>
              <Td>
                <span className="text-[13px]">{l.nome}</span>
                <div className="text-[11px] text-muted">{l.disciplina}</div>
              </Td>
              {t.map((o) => (
                <Td key={o.id} className="text-center">
                  <input
                    type="checkbox"
                    aria-label={`${l.nome} em ${o.orgao}`}
                    checked={l.concursos.includes(o.id)}
                    onChange={() => r(l, o.id)}
                    className="h-4 w-4 accent-[var(--accent)]"
                  />
                </Td>
              ))}
              <Td>
                <Badge tone={l.concursos.length > 1 ? "info" : "muted"}>
                  {l.concursos.length > 1
                    ? "compartilhado"
                    : l.concursos.length === 1
                      ? "exclusivo"
                      : "sem concurso"}
                </Badge>
              </Td>
            </Tr>
          ))}
        </tbody>
      </DataTable>
    </div>
  );
}

function ListSection({ title, items, render, onAdd, onRemove, addLabel }) {
  return (
    <Card
      title={title}
      right={
        <Button size="sm" icon={Plus} onClick={onAdd}>
          {addLabel || "Adicionar"}
        </Button>
      }
    >
      {items.length === 0 ? (
        <p className="text-xs text-muted">Nada cadastrado.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-line">
          {items.map((d, u) => (
            <li key={d.id || u} className="flex items-start gap-2 py-2">
              {render(d)}
              <IconButton
                icon={Trash2}
                label="Remover"
                onClick={() => onRemove(d, u)}
                className="ml-auto shrink-0"
              />
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function ConcursoDetail({ c: a, onBack, onEdit, edit, setEdit }) {
  let { state, upsert, remove, log, nav } = useApp(),
    [m, h] = useState(null),
    f = (x) =>
      upsert("concursos", {
        ...a,
        ...x,
      }),
    n = state.topics.filter((x) => x.concursos.includes(a.id)),
    i = [...new Set(n.map((x) => x.disciplina))].map((x) => {
      let b = n.filter((N) => N.disciplina === x);
      return {
        dn: x,
        total: b.length,
        studied: b.filter((N) => N.status === "estudado").length,
        validated: b.filter((N) => {
          let I = topicStats(state, N.id);
          return N.status === "estudado" && I.valid >= state.settings.amostraMin && I.acc >= 0.7;
        }).length,
      };
    }),
    w = coverageStats(state, a.id),
    v = a.dataProva ? diffDays(a.dataProva, today()) : null,
    C = () => {
      let { kind: x, data: b } = m,
        N = {
          fato: "fatos",
          fonte: "fontes",
          pend: "pendencias",
          prazo: "prazos",
          bloco: "blocos",
        }[x],
        I = a[N] || [],
        A = I.some((R) => (R.id ?? R) === b.id);
      (f({
        [N]: A ? I.map((R) => (R.id === b.id ? b : R)) : [...I, b],
      }),
        h(null));
    };
  return (
    <div className="flex flex-col gap-4">
      <button
        className="inline-flex w-fit items-center gap-1 text-xs text-accentInk hover:underline"
        onClick={onBack}
      >
        <ArrowLeft size={14} aria-hidden />
        Todos os concursos
      </button>
      <PageHeader title={a.orgao} sub={`${a.cargo}${a.area ? " · " + a.area : ""}`}>
        <Badge tone={CONCURSO_STATUS[a.status].tone}>{CONCURSO_STATUS[a.status].label}</Badge>
        <Button icon={Pencil} onClick={onEdit}>
          Editar dados
        </Button>
      </PageHeader>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-[13px]">
        {[
          ["Banca", a.banca || "—"],
          ["Edital de referência", a.edital || "—"],
          [
            "Data da prova",
            a.dataProva
              ? `${formatDMY(a.dataProva)}${v != null ? ` (${v >= 0 ? `em ${v} dias` : "realizada"})` : ""}`
              : "Sem data confirmada",
          ],
          ["Última verificação", formatDMY(a.verificacao)],
        ].map(([x, b]) => (
          <div key={x} className="rounded-lg border border-line bg-surface p-3">
            <div className="text-xs text-ink2">{x}</div>
            <div className="mt-0.5 font-medium">{b}</div>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ListSection
          title="Informações e rastreabilidade"
          items={a.fatos || []}
          addLabel="Informação"
          onAdd={() =>
            h({
              kind: "fato",
              data: {
                id: uid(),
                rotulo: "",
                valor: "",
                tipo: "secundaria",
                fonte: "",
              },
            })
          }
          onRemove={(x) =>
            f({
              fatos: a.fatos.filter((b) => b.id !== x.id),
            })
          }
          render={(x) => (
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold">{x.rotulo}</span>
                <Badge tone={SOURCE_KIND[x.tipo].tone}>{SOURCE_KIND[x.tipo].label}</Badge>
                <button
                  className="text-muted hover:text-ink"
                  aria-label="Editar"
                  onClick={() =>
                    h({
                      kind: "fato",
                      data: x,
                    })
                  }
                >
                  <Pencil size={12} />
                </button>
              </div>
              <p className="text-[13px] text-ink">{x.valor}</p>
              {x.fonte && (
                <p className="text-[11px] text-muted">
                  {"Fonte: "}
                  {x.fonte}
                </p>
              )}
            </div>
          )}
        />
        <div className="flex flex-col gap-4">
          <ListSection
            title="Estrutura da prova e critérios"
            items={a.blocos || []}
            addLabel="Bloco"
            onAdd={() =>
              h({
                kind: "bloco",
                data: {
                  id: uid(),
                  nome: "",
                  tipo: "objetiva",
                  itens: 0,
                  peso: 1,
                  notaMin: null,
                },
              })
            }
            onRemove={(x) =>
              f({
                blocos: a.blocos.filter((b) => b.id !== x.id),
              })
            }
            render={(x) => (
              <div className="min-w-0 flex-1 text-[13px]">
                <div className="flex items-center gap-1.5 font-medium">
                  {x.nome}
                  <button
                    className="text-muted hover:text-ink"
                    aria-label="Editar"
                    onClick={() =>
                      h({
                        kind: "bloco",
                        data: x,
                      })
                    }
                  >
                    <Pencil size={12} />
                  </button>
                </div>
                <div className="text-xs text-ink2 tabular-nums">
                  {x.itens} {x.tipo === "discursiva" ? "questões" : "itens"}
                  {x.peso != null ? ` · peso ${x.peso}` : ""}
                  {x.pontosMax
                    ? ` · ${x.pontosMax} pts`
                    : x.peso != null
                      ? ` · ${x.itens * x.peso} pts`
                      : ""}
                  {x.notaMin != null ? ` · nota mínima ${x.notaMin}` : ""}
                </div>
              </div>
            )}
          />
          <Card title="Regra de pontuação">
            <p className="text-[13px] font-medium">{a.scoring?.modelo || "Não definida"}</p>
            <p className="text-xs text-ink2">
              Acerto +{a.scoring?.acerto ?? 1}
              {" · erro −"}
              {a.scoring?.erro ?? 0}
              {" · branco 0"}
            </p>
            {a.scoring?.nota && <p className="mt-1 text-xs text-muted">{a.scoring.nota}</p>}
            <p className="mt-2 text-[11px] text-muted">
              O simulador usa esta regra, e não uma fórmula única. Edite em “Editar dados”.
            </p>
          </Card>
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Progresso por disciplina"
          sub={`${w.studied}/${w.total} concluídos · ${w.validated} validados com questões`}
          right={
            <Button size="sm" onClick={() => nav("matriz")}>
              Abrir matriz
            </Button>
          }
        >
          {i.length ? (
            <ul className="flex flex-col gap-3">
              {i.map((x) => (
                <li key={x.dn}>
                  <div className="mb-1 flex justify-between gap-2 text-[13px]">
                    <span className="truncate">{x.dn}</span>
                    <span className="tabular-nums text-ink2">
                      {x.studied}/{x.total}
                      {" · "}
                      {x.validated}
                      {" val."}
                    </span>
                  </div>
                  <ProgressBar value={x.total ? x.studied / x.total : 0} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Conteúdo programático pendente">
              Quando o edital sair, cadastre as disciplinas e os tópicos na Matriz (há importação de
              lista colada).
            </EmptyState>
          )}
        </Card>
        <ListSection
          title="Prazos e datas"
          items={[...(a.prazos || [])].sort((x, b) => x.data.localeCompare(b.data))}
          addLabel="Data"
          onAdd={() =>
            h({
              kind: "prazo",
              data: {
                id: uid(),
                rotulo: "",
                data: today(),
                tipo: "oficial",
              },
            })
          }
          onRemove={(x) =>
            f({
              prazos: a.prazos.filter((b) => b.id !== x.id),
            })
          }
          render={(x) => {
            let b = diffDays(x.data, today());
            return (
              <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-[13px]">
                <span className="w-20 shrink-0 tabular-nums font-medium">{formatDMY(x.data)}</span>
                <span className="min-w-0 flex-1">{x.rotulo}</span>
                <Badge tone={SOURCE_KIND[x.tipo]?.tone}>{SOURCE_KIND[x.tipo]?.label}</Badge>
                <span className="text-xs text-ink2">
                  {b === 0 ? "hoje" : b > 0 ? `em ${b}d` : `há ${-b}d`}
                </span>
                <button
                  className="text-muted hover:text-ink"
                  aria-label="Editar"
                  onClick={() =>
                    h({
                      kind: "prazo",
                      data: x,
                    })
                  }
                >
                  <Pencil size={12} />
                </button>
              </div>
            );
          }}
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ListSection
          title="Fontes consultadas"
          items={a.fontes || []}
          addLabel="Fonte"
          onAdd={() =>
            h({
              kind: "fonte",
              data: {
                id: uid(),
                titulo: "",
                url: "",
                tipo: "oficial",
              },
            })
          }
          onRemove={(x) =>
            f({
              fontes: a.fontes.filter((b) => b.id !== x.id),
            })
          }
          render={(x) => (
            <div className="min-w-0 flex-1 text-[13px]">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone={SOURCE_KIND[x.tipo]?.tone}>{SOURCE_KIND[x.tipo]?.label}</Badge>
                {x.url ? (
                  <a
                    className="inline-flex min-w-0 items-center gap-1 text-accentInk hover:underline"
                    href={x.url}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <span className="truncate">{x.titulo}</span>
                    <ExternalLink size={12} aria-hidden />
                  </a>
                ) : (
                  <span>{x.titulo}</span>
                )}
                <button
                  className="text-muted hover:text-ink"
                  aria-label="Editar"
                  onClick={() =>
                    h({
                      kind: "fonte",
                      data: x,
                    })
                  }
                >
                  <Pencil size={12} />
                </button>
              </div>
            </div>
          )}
        />
        <ListSection
          title="Pendências de pesquisa"
          items={(a.pendencias || []).map((x, b) => ({
            id: x.id || "p" + b,
            texto: x.texto || x,
          }))}
          addLabel="Pendência"
          onAdd={() =>
            h({
              kind: "pend",
              data: {
                id: uid(),
                texto: "",
              },
            })
          }
          onRemove={(x, b) =>
            f({
              pendencias: a.pendencias.filter((N, I) => I !== b),
            })
          }
          render={(x) => <p className="min-w-0 flex-1 text-[13px]">{x.texto}</p>}
        />
      </div>
      <Modal
        open={!!m}
        onClose={() => h(null)}
        title={
          m
            ? {
                fato: "Informação",
                fonte: "Fonte",
                pend: "Pendência",
                prazo: "Data",
                bloco: "Bloco de prova",
              }[m.kind]
            : ""
        }
        footer={
          <>
            <Button onClick={() => h(null)}>Cancelar</Button>
            <Button variant="primary" icon={Check} onClick={C}>
              Salvar
            </Button>
          </>
        }
      >
        {m && <ConcursoItemForm m={m} setM={h} />}
      </Modal>
      <ConcursoEditModal
        c={edit}
        onClose={() => setEdit(null)}
        onSave={(x) => {
          (upsert("concursos", x),
            setEdit(null),
            log(`Dados de ${x.orgao.split("(")[0].trim()} atualizados`, "cadastro do concurso"));
        }}
        onDelete={(x) => {
          (remove("concursos", x), setEdit(null), onBack());
        }}
      />
    </div>
  );
}

function ConcursoItemForm({ m: a, setM }) {
  let t = a.data,
    r = (o) =>
      setM({
        ...a,
        data: {
          ...t,
          ...o,
        },
      }),
    l = Object.entries(SOURCE_KIND);
  return a.kind === "fato" ? (
    <div className="grid gap-3">
      <Field label="Rótulo">
        <TextInput
          value={t.rotulo}
          onChange={(o) =>
            r({
              rotulo: o.target.value,
            })
          }
        />
      </Field>
      <Field label="Valor">
        <Textarea
          value={t.valor}
          onChange={(o) =>
            r({
              valor: o.target.value,
            })
          }
        />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Tipo">
          <Select
            value={t.tipo}
            onChange={(o) =>
              r({
                tipo: o.target.value,
              })
            }
          >
            {l.map(([o, d]) => (
              <option key={o} value={o}>
                {d.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Fonte">
          <TextInput
            value={t.fonte}
            onChange={(o) =>
              r({
                fonte: o.target.value,
              })
            }
          />
        </Field>
      </div>
    </div>
  ) : a.kind === "fonte" ? (
    <div className="grid gap-3">
      <Field label="Título">
        <TextInput
          value={t.titulo}
          onChange={(o) =>
            r({
              titulo: o.target.value,
            })
          }
        />
      </Field>
      <Field label="Link">
        <TextInput
          value={t.url}
          onChange={(o) =>
            r({
              url: o.target.value,
            })
          }
          placeholder="https://"
        />
      </Field>
      <Field label="Tipo">
        <Select
          value={t.tipo}
          onChange={(o) =>
            r({
              tipo: o.target.value,
            })
          }
        >
          {l.map(([o, d]) => (
            <option key={o} value={o}>
              {d.label}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  ) : a.kind === "pend" ? (
    <Field label="Pendência">
      <Textarea
        value={t.texto}
        onChange={(o) =>
          r({
            texto: o.target.value,
          })
        }
      />
    </Field>
  ) : a.kind === "prazo" ? (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Descrição" className="sm:col-span-2">
        <TextInput
          value={t.rotulo}
          onChange={(o) =>
            r({
              rotulo: o.target.value,
            })
          }
        />
      </Field>
      <Field label="Data">
        <TextInput
          type="date"
          value={t.data}
          onChange={(o) =>
            r({
              data: o.target.value,
            })
          }
        />
      </Field>
      <Field label="Tipo">
        <Select
          value={t.tipo}
          onChange={(o) =>
            r({
              tipo: o.target.value,
            })
          }
        >
          {l.map(([o, d]) => (
            <option key={o} value={o}>
              {d.label}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  ) : (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Nome" className="sm:col-span-2">
        <TextInput
          value={t.nome}
          onChange={(o) =>
            r({
              nome: o.target.value,
            })
          }
        />
      </Field>
      <Field label="Tipo">
        <Select
          value={t.tipo}
          onChange={(o) =>
            r({
              tipo: o.target.value,
            })
          }
        >
          <option value="objetiva">Objetiva</option>
          <option value="discursiva">Discursiva</option>
        </Select>
      </Field>
      <Field label="Itens / questões">
        <NumberInput
          value={t.itens}
          onChange={(o) =>
            r({
              itens: o,
            })
          }
        />
      </Field>
      <Field label="Peso por item" hint="Vazio se desconhecido">
        <NumberInput
          value={t.peso}
          onChange={(o) =>
            r({
              peso: o,
            })
          }
        />
      </Field>
      <Field label="Nota mínima" hint="Vazio se não há">
        <NumberInput
          value={t.notaMin}
          onChange={(o) =>
            r({
              notaMin: o,
            })
          }
        />
      </Field>
      {t.tipo === "discursiva" && (
        <Field label="Pontos máximos">
          <NumberInput
            value={t.pontosMax}
            onChange={(o) =>
              r({
                pontosMax: o,
              })
            }
          />
        </Field>
      )}
    </div>
  );
}

function ConcursoEditModal({ c: a, onClose, onSave, onDelete }) {
  let [l, o] = useState(null),
    [d, u] = useState(false);
  if (
    (useEffect(() => {
      (o(a ? JSON.parse(JSON.stringify(a)) : null), u(false));
    }, [a]),
    !a || !l)
  )
    return null;
  let L = (m) =>
      o({
        ...l,
        ...m,
      }),
    g = (m) =>
      o({
        ...l,
        scoring: {
          ...l.scoring,
          ...m,
        },
      });
  return (
    <Modal
      open
      onClose={onClose}
      wide
      title="Dados do concurso"
      footer={
        <>
          {onDelete &&
            (d ? (
              <Button variant="danger" onClick={() => onDelete(l.id)}>
                Confirmar exclusão
              </Button>
            ) : (
              <Button variant="danger" icon={Trash2} onClick={() => u(true)} className="mr-auto">
                Excluir
              </Button>
            ))}
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            icon={Check}
            onClick={() => onSave(l)}
            disabled={!l.orgao.trim()}
          >
            Salvar
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Órgão">
          <TextInput
            value={l.orgao}
            onChange={(m) =>
              L({
                orgao: m.target.value,
              })
            }
          />
        </Field>
        <Field label="Cargo">
          <TextInput
            value={l.cargo}
            onChange={(m) =>
              L({
                cargo: m.target.value,
              })
            }
          />
        </Field>
        <Field label="Área / especialidade">
          <TextInput
            value={l.area}
            onChange={(m) =>
              L({
                area: m.target.value,
              })
            }
          />
        </Field>
        <Field label="Banca">
          <TextInput
            value={l.banca}
            onChange={(m) =>
              L({
                banca: m.target.value,
              })
            }
          />
        </Field>
        <Field label="Edital de referência" className="sm:col-span-2">
          <TextInput
            value={l.edital}
            onChange={(m) =>
              L({
                edital: m.target.value,
              })
            }
          />
        </Field>
        <Field label="Situação encontrada">
          <Select
            value={l.status}
            onChange={(m) =>
              L({
                status: m.target.value,
              })
            }
          >
            {Object.entries(CONCURSO_STATUS).map(([m, h]) => (
              <option key={m} value={m}>
                {h.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Prioridade estratégica (1–5)">
          <Select
            value={l.prioridade}
            onChange={(m) =>
              L({
                prioridade: Number(m.target.value),
              })
            }
          >
            {[1, 2, 3, 4, 5].map((m) => (
              <option key={m}>{m}</option>
            ))}
          </Select>
        </Field>
        <Field label="Data da prova" hint="Só preencha se confirmada ou provável">
          <TextInput
            type="date"
            value={l.dataProva}
            onChange={(m) =>
              L({
                dataProva: m.target.value,
              })
            }
          />
        </Field>
        <Field label="Última verificação">
          <TextInput
            type="date"
            value={l.verificacao}
            onChange={(m) =>
              L({
                verificacao: m.target.value,
              })
            }
          />
        </Field>
        <Field label="Regra de pontuação (descrição)" className="sm:col-span-2">
          <TextInput
            value={l.scoring.modelo}
            onChange={(m) =>
              g({
                modelo: m.target.value,
              })
            }
            placeholder="Ex.: Cebraspe certo/errado"
          />
        </Field>
        <Field label="Pontos por acerto">
          <NumberInput
            value={l.scoring.acerto}
            onChange={(m) =>
              g({
                acerto: m,
              })
            }
          />
        </Field>
        <Field
          label="Pontos descontados por erro"
          hint="1 = cada erro anula um acerto; 0,5 = metade; 0 = sem penalização"
        >
          <NumberInput
            value={l.scoring.erro}
            onChange={(m) =>
              g({
                erro: m,
              })
            }
            step="0.25"
          />
        </Field>
        <div className="sm:col-span-2">
          <Checkbox
            label="Concurso ativo no planejamento"
            checked={l.ativo}
            onChange={(m) =>
              L({
                ativo: m,
              })
            }
          />
        </div>
      </div>
    </Modal>
  );
}
