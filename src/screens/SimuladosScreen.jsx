/**
 * Simulados: lançamento por bloco, pontuação com regra de acerto/erro, evolução e principais lacunas.
 */
import { useEffect, useState } from "react";
import { Check, Plus, Trash2, TriangleAlert, WandSparkles } from "lucide-react";
import { BarList } from "../components/charts/BarList";
import { LineChart } from "../components/charts/LineChart";
import { Badge } from "../components/ui/Badge";
import { Button, IconButton } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { EmptyState, PageHeader, StatCard } from "../components/ui/feedback";
import { Field, NumberInput, Select, TextInput, Textarea } from "../components/ui/form";
import { DataTable, Td, Thead, Tr } from "../components/ui/table";
import { useApp } from "../context/AppContext";
import { newSimuladoRow, rowsFromConcurso } from "../data/defaults";
import { formatDM, formatMinutes, today, uid } from "../lib/dates";
import { formatPct, scoreSimulado, stdDev } from "../lib/stats";

export function SimuladosScreen() {
  let { state, upsert, remove } = useApp(),
    settings = state.settings,
    [l, o] = useState(null),
    d = () => {
      let n = state.concursos.find((i) => i.id === settings.concursoPrincipal);
      return {
        id: uid(),
        data: today(),
        nome: `Simulado ${state.simulados.length + 1}`,
        concursoId: n?.id || "",
        banca: n?.banca?.split(" ")[0] || "",
        escopo: "",
        tempoMin: null,
        regra: {
          acerto: n?.scoring?.acerto ?? 1,
          erro: n?.scoring?.erro ?? 0,
        },
        rows: rowsFromConcurso(n),
        lacunas: "",
      };
    },
    u = state.simulados
      .slice()
      .sort((n, i) => n.data.localeCompare(i.data))
      .map((n) => ({
        s: n,
        sc: scoreSimulado(n),
      })),
    L = u
      .filter((n) => n.sc.pctMax != null)
      .map((n) => ({
        x: formatDM(n.s.data),
        y: Math.max(0, n.sc.pctMax),
        n: n.sc.itens,
        low: n.sc.itens < 30,
      })),
    g = {};
  u.forEach(({ s: n, sc: i }) => {
    let w = n.banca || "Sem banca";
    (g[w] || (g[w] = [])).push(i.pctMax);
  });
  let m = {};
  u.forEach(({ sc: n }) =>
    n.rows.forEach((i) => {
      var w;
      if (i.itens) {
        let v =
          m[(w = i.nome)] ||
          (m[w] = {
            a: 0,
            e: 0,
            i: 0,
          });
        ((v.a += i.pts || 0), (v.e += i.itens || 0), (v.i += i.max || 0));
      }
    }),
  );
  let h = Object.entries(m)
      .map(([n, i]) => ({
        label: n,
        value: i.i ? Math.max(0, i.a / i.i) : 0,
        text: `${formatPct(i.i ? i.a / i.i : null)} do máx.`,
        tone: i.i && i.a / i.i < 0.4 ? "crit" : undefined,
      }))
      .sort((n, i) => n.value - i.value),
    f = stdDev(u.map((n) => n.sc.pctMax).filter((n) => n != null));
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Simulados e desempenho"
        sub="Cada simulado usa a regra de pontuação cadastrada para aquele concurso. Sem edital confirmado, não presumimos penalização por erro."
      >
        <Button variant="primary" icon={Plus} onClick={() => o(d())}>
          Novo simulado
        </Button>
      </PageHeader>
      {u.length === 0 ? (
        <EmptyState
          title="Nenhum simulado registrado"
          action={
            <Button variant="primary" onClick={() => o(d())}>
              Registrar simulado
            </Button>
          }
        >
          Se você cadastrou blocos, pesos e notas mínimas do edital, eles serão pré-preenchidos. Caso contrário, informe os blocos e a regra da sua prova.
        </EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard label="Simulados" value={u.length} />
            <StatCard
              label="Último resultado"
              value={formatPct(u[u.length - 1].sc.pctMax)}
              sub={`${u[u.length - 1].sc.pts.toFixed(1)} de ${u[u.length - 1].sc.max} pontos`}
              def="Pontos líquidos ÷ pontos máximos, pela regra do simulado."
            />
            <StatCard
              label="Situação no corte"
              value={
                u[u.length - 1].sc.aprovado == null
                  ? "—"
                  : u[u.length - 1].sc.aprovado
                    ? "Acima dos mínimos"
                    : "Abaixo de algum mínimo"
              }
              tone={
                u[u.length - 1].sc.aprovado === false
                  ? "crit"
                  : u[u.length - 1].sc.aprovado
                    ? "good"
                    : undefined
              }
              sub="Compara cada bloco com a nota mínima informada"
            />
            <StatCard
              label="Estabilidade"
              value={u.length >= 3 && f != null ? `±${(f * 100).toFixed(1)} p.p.` : "—"}
              sub={u.length >= 3 ? "desvio-padrão entre simulados" : "Precisa de 3 simulados"}
              def="Variação do resultado entre simulados. Com poucos simulados, não separa evolução de oscilação."
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card
              title="Evolução entre simulados"
              sub="% da pontuação máxima; ponto vazado = menos de 30 itens"
            >
              {L.length ? <LineChart data={L} label="Evolução dos simulados" /> : null}
            </Card>
            <Card title="Principais lacunas" sub="Pontuação proporcional ao máximo por bloco, conforme regra de cada simulado">
              <BarList rows={h} />
              {Object.keys(g).length > 0 && (
                <div className="mt-4 border-t border-line pt-3">
                  <p className="mb-1.5 text-xs font-medium text-ink2">Por banca</p>
                  {Object.entries(g).map(([n, i]) => (
                    <div key={n} className="flex justify-between text-[13px]">
                      <span>{n}</span>
                      <span className="tabular-nums text-ink2">
                        {formatPct(i.reduce((w, v) => w + v, 0) / i.length)}
                        {" médio · "}
                        {i.length}
                        {" simulado(s)"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
          <DataTable>
            <Thead>
              {[
                "Data",
                "Simulado",
                "Concurso",
                "Acertos / erros / brancos",
                "Pontos",
                "Tempo",
                "",
              ].map((n) => (
                <th
                  key={n}
                  className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink2"
                >
                  {n}
                </th>
              ))}
            </Thead>
            <tbody>
              {[...u].reverse().map(({ s: n, sc: i }) => (
                <Tr key={n.id}>
                  <Td className="text-xs tabular-nums">{formatDM(n.data)}</Td>
                  <Td className="text-[13px] font-medium">
                    {n.nome}
                    <div className="text-[11px] text-muted">{n.escopo}</div>
                  </Td>
                  <Td className="text-xs">
                    {state.concursos
                      .find((w) => w.id === n.concursoId)
                      ?.orgao.split("(")[0]
                      .trim() || "—"}
                  </Td>
                  <Td className="text-xs tabular-nums">
                    {i.acertos}
                    {" / "}
                    {i.erros}
                    {" / "}
                    {i.brancos}
                  </Td>
                  <Td className="text-xs tabular-nums">
                    {i.pts.toFixed(1)}
                    {" / "}
                    {i.max} <span className="text-muted">({formatPct(i.pctMax)})</span>
                  </Td>
                  <Td className="text-xs tabular-nums">
                    {n.tempoMin ? formatMinutes(n.tempoMin) : "—"}
                  </Td>
                  <Td>
                    <Button size="sm" onClick={() => o(n)}>
                      Abrir
                    </Button>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </DataTable>
        </>
      )}
      <SimuladoModal s={l} onClose={() => o(null)} />
    </div>
  );
}

function SimuladoModal({ s: a, onClose }) {
  let { state, upsert, remove } = useApp(),
    [o, d] = useState(null),
    [u, L] = useState(false);
  if (
    (useEffect(() => {
      (d(a ? JSON.parse(JSON.stringify(a)) : null), L(false));
    }, [a]),
    !a || !o)
  )
    return null;
  let g = state.simulados.some((n) => n.id === o.id),
    m = (n) =>
      d({
        ...o,
        ...n,
      }),
    h = scoreSimulado(o),
    f = (n, i) =>
      m({
        rows: o.rows.map((w) =>
          w.id === n
            ? {
                ...w,
                ...i,
              }
            : w,
        ),
      });
  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={g ? "Simulado" : "Novo simulado"}
      footer={
        <>
          {g &&
            (u ? (
              <Button
                variant="danger"
                onClick={() => {
                  (remove("simulados", o.id), onClose());
                }}
              >
                Confirmar exclusão
              </Button>
            ) : (
              <Button variant="danger" icon={Trash2} className="mr-auto" onClick={() => L(true)}>
                Excluir
              </Button>
            ))}
          <Button onClick={onClose}>Cancelar</Button>
          <Button
            variant="primary"
            icon={Check}
            onClick={() => {
              (upsert("simulados", o), onClose());
            }}
          >
            Salvar
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Nome">
          <TextInput
            value={o.nome}
            onChange={(n) =>
              m({
                nome: n.target.value,
              })
            }
          />
        </Field>
        <Field label="Data">
          <TextInput
            type="date"
            value={o.data}
            onChange={(n) =>
              m({
                data: n.target.value,
              })
            }
          />
        </Field>
        <Field label="Concurso">
          <Select
            value={o.concursoId}
            onChange={(n) => {
              let i = state.concursos.find((w) => w.id === n.target.value);
              m({
                concursoId: n.target.value,
                banca: i?.banca?.split(" ")[0] || o.banca,
                regra: {
                  acerto: i?.scoring?.acerto ?? 1,
                  erro: i?.scoring?.erro ?? 0,
                },
              });
            }}
          >
            <option value="">—</option>
            {state.concursos.map((n) => (
              <option key={n.id} value={n.id}>
                {n.orgao.split("(")[0].trim()}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Banca">
          <TextInput
            value={o.banca}
            onChange={(n) =>
              m({
                banca: n.target.value,
              })
            }
          />
        </Field>
        <Field label="Escopo" hint="Disciplinas ou combinação">
          <TextInput
            value={o.escopo}
            onChange={(n) =>
              m({
                escopo: n.target.value,
              })
            }
          />
        </Field>
        <Field label="Tempo total (min)">
          <NumberInput
            value={o.tempoMin}
            onChange={(n) =>
              m({
                tempoMin: n,
              })
            }
          />
        </Field>
        <Field label="Pontos por acerto">
          <NumberInput
            value={o.regra.acerto}
            onChange={(n) =>
              m({
                regra: {
                  ...o.regra,
                  acerto: n ?? 1,
                },
              })
            }
          />
        </Field>
        <Field
          label="Desconto por erro"
          hint="Regra do edital: 1, 0,5 ou 0"
          className="sm:col-span-2"
        >
          <NumberInput
            step="0.25"
            value={o.regra.erro}
            onChange={(n) =>
              m({
                regra: {
                  ...o.regra,
                  erro: n ?? 0,
                },
              })
            }
          />
        </Field>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <h3 className="text-[13px] font-semibold">Resultado por bloco</h3>
        <div className="flex gap-2">
          <Button
            size="sm"
            icon={WandSparkles}
            onClick={() =>
              m({
                rows: rowsFromConcurso(state.concursos.find((n) => n.id === o.concursoId)),
              })
            }
          >
            Usar blocos do edital
          </Button>
          <Button
            size="sm"
            icon={Plus}
            onClick={() =>
              m({
                rows: [...o.rows, newSimuladoRow()],
              })
            }
          >
            Bloco
          </Button>
        </div>
      </div>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full min-w-[640px] text-[13px]">
          <thead>
            <tr className="text-left text-[11px] uppercase text-ink2">
              {[
                "Bloco / assunto",
                "Itens",
                "Certas",
                "Erradas",
                "Brancas",
                "Peso",
                "Nota mín.",
                "Pontos",
                "",
              ].map((n) => (
                <th key={n} className="px-1 py-1 font-semibold">
                  {n}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {h.rows.map((n) => (
              <tr key={n.id} className="border-t border-line">
                <td className="px-1 py-1">
                  <TextInput
                    aria-label="Nome do bloco"
                    className="!h-8"
                    value={n.nome}
                    onChange={(i) =>
                      f(n.id, {
                        nome: i.target.value,
                      })
                    }
                  />
                  <Select
                    aria-label="Assunto do bloco"
                    className="!h-7 mt-1 text-xs"
                    value={n.topicId || ""}
                    onChange={(i) =>
                      f(n.id, {
                        topicId: i.target.value,
                      })
                    }
                  >
                    <option value="">sem assunto específico</option>
                    {state.topics.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nome}
                      </option>
                    ))}
                  </Select>
                </td>
                {["itens", "acertos", "erros", "brancos"].map((i) => (
                  <td key={i} className="w-16 px-1 py-1">
                    <NumberInput
                      aria-label={i}
                      className="!h-8"
                      value={n[i]}
                      onChange={(w) =>
                        f(n.id, {
                          [i]: w ?? 0,
                        })
                      }
                    />
                  </td>
                ))}
                <td className="w-14 px-1">
                  <NumberInput
                    aria-label="Peso"
                    className="!h-8"
                    value={n.peso}
                    onChange={(i) =>
                      f(n.id, {
                        peso: i ?? 1,
                      })
                    }
                  />
                </td>
                <td className="w-16 px-1">
                  <NumberInput
                    aria-label="Nota mínima"
                    className="!h-8"
                    value={n.notaMin}
                    onChange={(i) =>
                      f(n.id, {
                        notaMin: i,
                      })
                    }
                  />
                </td>
                <td className="whitespace-nowrap px-1 text-xs tabular-nums">
                  {n.pts.toFixed(1)}/{n.max}
                  {n.ok === false && (
                    <Badge tone="crit" className="ml-1">
                      abaixo
                    </Badge>
                  )}
                  {n.inconsistent && (
                    <span title="Certas + erradas + brancas ≠ itens" className="ml-1 text-warnInk">
                      <TriangleAlert size={12} className="inline" />
                    </span>
                  )}
                </td>
                <td>
                  <IconButton
                    icon={Trash2}
                    label="Remover bloco"
                    onClick={() =>
                      m({
                        rows: o.rows.filter((i) => i.id !== n.id),
                      })
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 rounded-md bg-surface2 p-3 text-xs text-ink2">
        {"Total: "}
        <b className="text-ink tabular-nums">
          {h.pts.toFixed(1)}
          {" de "}
          {h.max}
        </b>
        {" pontos ("}
        {formatPct(h.pctMax)}) com acerto +{o.regra.acerto}
        {" e erro −"}
        {o.regra.erro}
        {", multiplicados pelo peso do bloco. "}
        {h.aprovado === false ? "Pelo menos um bloco ficou abaixo da nota mínima." : ""}
      </p>
      <Field label="Principais lacunas identificadas" className="mt-3">
        <Textarea
          value={o.lacunas}
          onChange={(n) =>
            m({
              lacunas: n.target.value,
            })
          }
        />
      </Field>
    </Modal>
  );
}
