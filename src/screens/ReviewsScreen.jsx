/**
 * Revisões espaçadas: vencidas, próximas 14 dias, retenção e registro de resultado.
 */
import { useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { EmptyState, PageHeader, StatCard } from "../components/ui/feedback";
import { Field, NumberInput, Select, TextInput } from "../components/ui/form";
import { DataTable, Td, Thead, Tr } from "../components/ui/table";
import { useApp } from "../context/AppContext";
import { REVIEW_OUTCOMES } from "../data/constants";
import { addDays, diffDays, formatDM, formatMinutes, today, uid } from "../lib/dates";
import { activeTopics, applyReview, computeReview } from "../lib/planner";
import { formatPct, topicStats } from "../lib/stats";

export function ReviewsScreen() {
  let { state, setState, patchSettings, nav } = useApp(),
    todayStr = today(),
    settings = state.settings,
    [d, u] = useState(null),
    L = activeTopics(state).filter((x) => x.rev?.due).sort((x, b) => x.rev.due.localeCompare(b.rev.due)),
    g = L.filter((x) => x.rev.due <= todayStr),
    m = L.filter((x) => x.rev.due > todayStr && x.rev.due <= addDays(todayStr, 14)),
    h = activeTopics(state).filter((x) => x.status === "estudado" && !x.rev?.due),
    f = activeTopics(state)
      .flatMap((x) =>
        (x.rev?.history || []).map((b) => ({
          ...b,
          t: x,
        })),
      )
      .sort((x, b) => b.date.localeCompare(x.date)),
    n = f.filter((x) => x.outcome === "ok").length,
    ReviewRow = ({ t: x }) => {
      let b = topicStats(state, x.id),
        N = diffDays(todayStr, x.rev.due);
      return (
        <Tr>
          <Td>
            <div className="text-[13px]">{x.nome}</div>
            <div className="text-[11px] text-muted">{x.disciplina}</div>
          </Td>
          <Td className="text-xs tabular-nums">
            {formatDM(x.rev.due)}
            {N > 0 && (
              <Badge tone="warn" className="ml-1">
                {N}d atraso
              </Badge>
            )}
          </Td>
          <Td className="text-xs tabular-nums">{x.rev.stage}</Td>
          <Td className="text-xs tabular-nums">
            {b.valid ? `${formatPct(b.acc)} (n=${b.valid})` : "—"}
          </Td>
          <Td className="text-xs tabular-nums">{x.rev.lapses}</Td>
          <Td>
            <Button
              size="sm"
              icon={Check}
              onClick={() =>
                u({
                  t: x,
                  outcome: "ok",
                  min: settings.revisaoMin,
                  date: todayStr,
                })
              }
            >
              Registrar
            </Button>
          </Td>
        </Tr>
      );
    },
    w = (
      <Thead>
        {["Assunto", "Revisar em", "Estágio", "Acerto", "Lapsos", ""].map((x) => (
          <th
            key={x}
            className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink2"
          >
            {x}
          </th>
        ))}
      </Thead>
    ),
    v = () => {
      let { t: x, outcome: b, min: N, date: I } = d;
      (setState((A) => ({
        ...A,
        topics: A.topics.map((R) => (R.id === x.id ? applyReview(A, R, b, I) : R)),
        sessions: [
          ...A.sessions,
          {
            id: uid(),
            date: I,
            tipo: "revisao",
            topicIds: [x.id],
            concursoIds: x.concursos,
            plannedMin: N,
            actualMin: N,
            status: "feita",
            prioridade: "essencial",
            notes: `Revisão: ${REVIEW_OUTCOMES[b][0]}`,
          },
        ],
      })),
        u(null));
    },
    C = d ? computeReview(state, d.t, d.outcome, topicStats(state, d.t.id)) : null;
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Revisões espaçadas"
        sub="Os intervalos iniciais (1, 7 e 30 dias) são só o ponto de partida: cada resultado, o acerto em questões, a importância e a dificuldade do assunto ajustam o próximo intervalo."
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Vencidas"
          value={g.length}
          tone={g.length ? "warn" : "good"}
          sub={
            g.length ? `≈ ${formatMinutes(g.length * settings.revisaoMin)} de revisão` : "Em dia"
          }
          def="Assuntos com data de revisão hoje ou antes."
        />
        <StatCard label="Próximos 14 dias" value={m.length} />
        <StatCard
          label="Retenção"
          value={f.length ? formatPct(n / f.length) : "—"}
          sub={
            f.length ? `${n} de ${f.length} revisões sem esquecimento` : "Sem revisões registradas"
          }
          def="Revisões em que você lembrou bem ÷ revisões registradas. Com poucas revisões, é só um indicativo."
        />
        <StatCard
          label="Intervalos base"
          value={settings.intervalos.join(" · ")}
          sub="dias; editável em Configurações"
        />
      </div>
      <Card title="Vencidas">
        {g.length ? (
          <DataTable>
            {w}
            <tbody>
              {g.map((x) => (
                <ReviewRow key={x.id} t={x} />
              ))}
            </tbody>
          </DataTable>
        ) : (
          <EmptyState icon={RotateCcw} title="Nenhuma revisão vencida">
            As revisões nascem quando uma teoria é marcada como concluída. Marque o assunto como
            “Teoria concluída” na Matriz ou ao fechar uma sessão de teoria.
          </EmptyState>
        )}
      </Card>
      <Card title="Próximas (14 dias)">
        {m.length ? (
          <DataTable>
            {w}
            <tbody>
              {m.map((x) => (
                <ReviewRow key={x.id} t={x} />
              ))}
            </tbody>
          </DataTable>
        ) : (
          <p className="text-xs text-muted">Nada previsto.</p>
        )}
      </Card>
      {h.length > 0 && (
        <Card title="Teoria concluída sem ciclo de revisão">
          <ul className="flex flex-wrap gap-1.5">
            {h.map((x) => (
              <Badge key={x.id} tone="warn">
                {x.nome}
              </Badge>
            ))}
          </ul>
          <p className="mt-2 text-xs text-ink2">
            Abra o assunto na Matriz e salve de novo para iniciar o ciclo.
          </p>
        </Card>
      )}
      <Card
        title="Histórico de revisões"
        sub="Cada linha registra como o intervalo seguinte foi decidido"
      >
        {f.length ? (
          <DataTable>
            <Thead>
              {["Data", "Assunto", "Resultado", "Próximo intervalo", "Como foi calculado"].map(
                (x) => (
                  <th
                    key={x}
                    className="px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-ink2"
                  >
                    {x}
                  </th>
                ),
              )}
            </Thead>
            <tbody>
              {f.slice(0, 40).map((x, b) => (
                <Tr key={b}>
                  <Td className="text-xs tabular-nums">{formatDM(x.date)}</Td>
                  <Td className="text-[13px]">{x.t.nome}</Td>
                  <Td>
                    <Badge tone={REVIEW_OUTCOMES[x.outcome][1]}>
                      {REVIEW_OUTCOMES[x.outcome][0]}
                    </Badge>
                  </Td>
                  <Td className="text-xs tabular-nums">
                    {x.dias}
                    {" dia(s)"}
                  </Td>
                  <Td className="text-[11px] text-muted">{x.nota}</Td>
                </Tr>
              ))}
            </tbody>
          </DataTable>
        ) : (
          <p className="text-xs text-muted">Sem histórico ainda.</p>
        )}
      </Card>
      <Modal
        open={!!d}
        onClose={() => u(null)}
        title="Registrar revisão"
        footer={
          <>
            <Button onClick={() => u(null)}>Cancelar</Button>
            <Button variant="primary" icon={Check} onClick={v}>
              Salvar
            </Button>
          </>
        }
      >
        {d && (
          <div className="grid gap-3 sm:grid-cols-2">
            <p className="text-[13px] font-medium sm:col-span-2">{d.t.nome}</p>
            <Field label="Como foi?">
              <Select
                value={d.outcome}
                onChange={(x) =>
                  u({
                    ...d,
                    outcome: x.target.value,
                  })
                }
              >
                <option value="ok">Lembrei bem</option>
                <option value="parcial">Lembrei em parte</option>
                <option value="esqueci">Esqueci</option>
              </Select>
            </Field>
            <Field label="Duração (min)">
              <NumberInput
                value={d.min}
                onChange={(x) =>
                  u({
                    ...d,
                    min: x || 0,
                  })
                }
              />
            </Field>
            <Field label="Data">
              <TextInput
                type="date"
                value={d.date}
                onChange={(x) =>
                  u({
                    ...d,
                    date: x.target.value,
                  })
                }
              />
            </Field>
            <p className="rounded-md bg-surface2 p-3 text-xs text-ink2 sm:col-span-2">
              {"Próxima revisão em "}
              <b className="text-ink">
                {C.days}
                {" dia(s)"}
              </b>
              {" ("}
              {formatDM(addDays(d.date, C.days))}
              {"). Cálculo: "}
              {C.note}.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
