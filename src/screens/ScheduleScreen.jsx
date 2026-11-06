/**
 * Cronograma: semana, mês, ciclo rotativo e backlog; plano automático e replanejamento.
 */
import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  RefreshCw,
  Trash2,
  WandSparkles,
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button, IconButton } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { EmptyState, PageHeader, ProgressBar, Tabs } from "../components/ui/feedback";
import { NumberInput, Select, TextInput } from "../components/ui/form";
import { useApp } from "../context/AppContext";
import {
  SESSION_STATUS_LABELS,
  SESSION_STATUS_TONE,
  SESSION_TYPE_LABELS,
  SESSION_TYPE_TONE,
} from "../data/constants";
import { cn } from "../lib/cn";
import {
  MONTHS,
  WEEKDAYS_SHORT,
  addDays,
  addMonths,
  daysInMonth,
  formatDM,
  formatMinutes,
  formatWeekdayDM,
  parseISODate,
  startOfMonth,
  today,
  uid,
  weekDates,
  weekdayIndex,
} from "../lib/dates";
import {
  generatePlan,
  grossMinutes,
  netMinutes,
  plannedMinutes,
  replanOverdue,
  regenerateUpcomingPlan,
} from "../lib/planner";

export function ScheduleScreen() {
  let { state, setState, openSession, log } = useApp(),
    todayStr = today(),
    settings = state.settings,
    [d, u] = useState("semana"),
    [L, g] = useState(todayStr),
    [m, h] = useState(""),
    [f, n] = useState(""),
    [i, w] = useState(""),
    [v, C] = useState(null),
    [x, b] = useState(null),
    N = [...new Set(state.topics.map((p) => p.disciplina))],
    I = (p) =>
      (!m || (p.concursoIds || []).includes(m)) &&
      (!i || p.status === i) &&
      (!f ||
        (p.topicIds || []).some((y) => state.topics.find((F) => F.id === y)?.disciplina === f)),
    A = state.sessions.filter(I),
    R = state.sessions.filter((p) => p.status === "planejada" && p.date < todayStr).length,
    S = (p, y) => {
      setState((F) => ({
        ...F,
        sessions: F.sessions.map((U) =>
          U.id === p.id
            ? {
                ...U,
                date: addDays(U.date, y),
                status: U.status === "adiada" ? "planejada" : U.status,
              }
            : U,
        ),
      }));
    },
    O = ({ s: p }) => {
      let y = (p.topicIds || [])
        .map((F) => state.topics.find((U) => U.id === F)?.nome)
        .filter(Boolean);
      return (
        <div
          className={cn(
            "rounded-md border border-line bg-surface p-2 text-xs",
            p.status === "feita" && "opacity-75",
            p.date < todayStr && p.status === "planejada" && "border-crit",
          )}
        >
          <div className="flex flex-wrap items-center gap-1">
            <Badge tone={SESSION_TYPE_TONE[p.tipo]}>{SESSION_TYPE_LABELS[p.tipo]}</Badge>
            <Badge tone={SESSION_STATUS_TONE[p.status]}>{SESSION_STATUS_LABELS[p.status]}</Badge>
            {p.prioridade === "essencial" && <Badge tone="crit">essencial</Badge>}
          </div>
          <button
            className="mt-1 block w-full text-left text-[13px] font-medium leading-snug hover:text-accentInk"
            onClick={() => openSession(p)}
          >
            {y.join(" + ") || SESSION_TYPE_LABELS[p.tipo]}
          </button>
          <div className="mt-1 flex items-center justify-between gap-1 text-ink2">
            <span className="tabular-nums">
              {p.status === "feita"
                ? `${formatMinutes(p.actualMin)} de ${formatMinutes(p.plannedMin)}`
                : formatMinutes(p.plannedMin)}
            </span>
            <span className="flex">
              <IconButton
                icon={ArrowLeft}
                label="Mover para o dia anterior"
                className="!h-6 !w-6"
                onClick={() => S(p, -1)}
              />
              <IconButton
                icon={ArrowRight}
                label="Mover para o dia seguinte"
                className="!h-6 !w-6"
                onClick={() => S(p, 1)}
              />
            </span>
          </div>
        </div>
      );
    },
    P = weekDates(L),
    K = () => {
      let p = generatePlan(state, todayStr, 7);
      C({
        ...p,
        pick: Object.fromEntries(p.sessions.map((y) => [y.id, true])),
        start: todayStr,
        n: 7,
      });
    },
    updatePlan = () => {
      if (!window.confirm("Recalcular sessões automáticas futuras das próximas 4 semanas? Sessões manuais, concluídas e parciais serão preservadas.")) return;
      setState(current => {
        const updated = regenerateUpcomingPlan(current, todayStr, 28);
        return { ...current, sessions: updated.sessions, decisions: [...current.decisions, {
          id: uid(), data: todayStr, motivo: "Atualização adaptativa do cronograma", acao: `${updated.removed} automáticas antigas substituídas por ${updated.added} novas sessões` } ] };
      });
    },
    B = () =>
      b({
        moves: replanOverdue(state, todayStr),
      }),
    H = () => {
      let p = v.sessions.filter((y) => v.pick[y.id]);
      (setState((y) => ({
        ...y,
        sessions: [...y.sessions, ...p],
        decisions: [
          ...y.decisions,
          {
            id: uid(),
            data: todayStr,
            motivo: `Plano sugerido (${v.mix.label}): ${p.length} sessões, ${formatMinutes(p.reduce((F, U) => F + U.plannedMin, 0))}`,
            acao: "plano semanal aceito",
          },
        ],
      })),
        C(null));
    },
    c = () => {
      let p = x.moves;
      if (!p.length) return b(null);
      (setState((y) => ({
        ...y,
        sessions: y.sessions.map((F) => {
          let U = p.find((de) => de.id === F.id);
          return U
            ? U.to
              ? {
                  ...F,
                  date: U.to,
                  status: "planejada",
                  movida: (F.movida || 0) + 1,
                }
              : {
                  ...F,
                  date: null,
                  status: "backlog",
                }
            : F;
        }),
        decisions: [
          ...y.decisions,
          {
            id: uid(),
            data: todayStr,
            motivo: `${p.filter((F) => F.to).length} sessão(ões) atrasada(s) realocada(s) e ${p.filter((F) => !F.to).length} para o backlog`,
            acao: "replanejamento",
          },
        ],
      })),
        b(null));
    };
  return (
    <div>
      <PageHeader
        title="Cronograma e ciclo de estudos"
        sub="O plano é sugerido pelas prioridades, mas vale o que você aceita. Sessões atrasadas são replanejadas sem deslocar o resto da semana."
      >
        <Button icon={WandSparkles} onClick={K}>
          Sugerir 7 dias
        </Button>
        <Button icon={RefreshCw} onClick={updatePlan}>
          Atualizar plano (4 semanas)
        </Button>
        <Button icon={RefreshCw} onClick={B} disabled={!R}>
          Replanejar atrasadas{R ? ` (${R})` : ""}
        </Button>
        <Button
          variant="primary"
          icon={Plus}
          onClick={() =>
            openSession({
              id: null,
              date: todayStr,
            })
          }
        >
          Nova sessão
        </Button>
      </PageHeader>
      <Tabs
        tabs={[
          ["semana", "Semana"],
          ["mes", "Mês"],
          ["ciclo", "Ciclo"],
          ["backlog", "Backlog"],
        ]}
        value={d}
        onChange={u}
      />
      <div className="mt-4 flex flex-col gap-4">
        {(d === "semana" || d === "mes") && (
          <div className="flex flex-wrap items-center gap-2">
            <IconButton
              icon={ChevronLeft}
              label="Anterior"
              onClick={() => g(d === "semana" ? addDays(L, -7) : addMonths(L, -1))}
            />
            <span className="min-w-[10rem] text-center text-[13px] font-medium">
              {d === "semana"
                ? `${formatDM(P[0])} – ${formatDM(P[6])}`
                : `${MONTHS[parseISODate(L).getMonth()]} ${parseISODate(L).getFullYear()}`}
            </span>
            <IconButton
              icon={ChevronRight}
              label="Próximo"
              onClick={() => g(d === "semana" ? addDays(L, 7) : addMonths(L, 1))}
            />
            <Button size="sm" onClick={() => g(todayStr)}>
              Hoje
            </Button>
            <span className="mx-1 hidden h-5 w-px bg-line sm:block" />
            <Select
              aria-label="Filtrar por concurso"
              className="!h-8 w-44"
              value={m}
              onChange={(p) => h(p.target.value)}
            >
              <option value="">Todos os concursos</option>
              {state.concursos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.orgao.split("(")[0].trim()}
                </option>
              ))}
            </Select>
            <Select
              aria-label="Filtrar por disciplina"
              className="!h-8 w-44"
              value={f}
              onChange={(p) => n(p.target.value)}
            >
              <option value="">Todas as disciplinas</option>
              {N.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </Select>
            <Select
              aria-label="Filtrar por situação"
              className="!h-8 w-36"
              value={i}
              onChange={(p) => w(p.target.value)}
            >
              <option value="">Toda situação</option>
              {Object.entries(SESSION_STATUS_LABELS).map(([p, y]) => (
                <option key={p} value={p}>
                  {y}
                </option>
              ))}
            </Select>
          </div>
        )}
        {d === "semana" && (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
            {P.map((p) => {
              let y = A.filter((he) => he.date === p && he.status !== "backlog"),
                F = plannedMinutes(state.sessions, p),
                U = netMinutes(settings, p),
                de = grossMinutes(settings, p);
              return (
                <div
                  key={p}
                  className={cn(
                    "flex min-w-0 flex-col gap-2 rounded-lg border bg-surface p-2.5",
                    p === todayStr ? "border-accent" : "border-line",
                  )}
                >
                  <div className="flex items-baseline justify-between">
                    <span
                      className={cn(
                        "text-[13px] font-semibold",
                        p === todayStr && "text-accentInk",
                      )}
                    >
                      {WEEKDAYS_SHORT[weekdayIndex(p)]} {p.slice(8)}
                    </span>
                    <button
                      className="text-muted hover:text-ink"
                      aria-label={`Adicionar sessão em ${formatDM(p)}`}
                      onClick={() =>
                        openSession({
                          id: null,
                          date: p,
                        })
                      }
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div>
                    <ProgressBar
                      value={U ? F / U : F ? 1 : 0}
                      tone={F > U ? "crit" : "accent"}
                      label={`Carga de ${formatDM(p)}`}
                    />
                    <div
                      className={cn(
                        "mt-1 text-[11px] tabular-nums",
                        F > U ? "text-critInk" : "text-muted",
                      )}
                    >
                      {formatMinutes(F)}
                      {" de "}
                      {formatMinutes(U)}
                      {de !== U ? ` (${formatMinutes(de)} brutos)` : ""}
                    </div>
                  </div>
                  {y.length ? (
                    y.map((he) => <O key={he.id} s={he} />)
                  ) : (
                    <p className="text-[11px] text-muted">{U ? "Livre" : "Sem disponibilidade"}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {d === "mes" &&
          (() => {
            let p = startOfMonth(L),
              y = (weekdayIndex(p) + 6) % 7,
              F = daysInMonth(p),
              U = [
                ...Array(y).fill(null),
                ...Array.from(
                  {
                    length: F,
                  },
                  (de, he) => addDays(p, he),
                ),
              ];
            return (
              <div className="overflow-x-auto">
                <div className="grid min-w-[560px] grid-cols-7 gap-px rounded-lg border border-line bg-line">
                  {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((de) => (
                    <div
                      key={de}
                      className="bg-surface2 px-2 py-1 text-[11px] font-semibold uppercase text-ink2"
                    >
                      {de}
                    </div>
                  ))}
                  {U.map((de, he) => {
                    if (!de) return <div key={he} className="bg-surface2" />;
                    let Ae = A.filter((De) => De.date === de && De.status !== "backlog"),
                      Ke = Ae.reduce((De, Et) => De + Et.plannedMin, 0);
                    return (
                      <button
                        key={de}
                        onClick={() => {
                          (g(de), u("semana"));
                        }}
                        className={cn(
                          "flex min-h-[74px] flex-col items-start gap-1 bg-surface p-1.5 text-left hover:bg-surface2",
                          de === todayStr && "outline outline-2 -outline-offset-2 outline-accent",
                        )}
                      >
                        <span className="text-xs font-medium">{de.slice(8)}</span>
                        {Ae.length > 0 && (
                          <>
                            <span className="text-[11px] tabular-nums text-ink2">
                              {Ae.length}
                              {" sessão(ões) · "}
                              {formatMinutes(Ke)}
                            </span>
                            <span className="flex flex-wrap gap-0.5">
                              {Ae.slice(0, 4).map((De) => (
                                <i
                                  key={De.id}
                                  className={cn(
                                    "h-1.5 w-1.5 rounded-full",
                                    De.status === "feita"
                                      ? "bg-good"
                                      : De.date < todayStr
                                        ? "bg-crit"
                                        : "bg-accent",
                                  )}
                                />
                              ))}
                            </span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        {d === "ciclo" && <CycleView />}
        {d === "backlog" &&
          (() => {
            let p = state.sessions.filter(
              (y) => y.status === "backlog" || (y.status === "adiada" && !y.date),
            );
            return p.length ? (
              <ul className="flex flex-col gap-2">
                {p.map((y) => (
                  <li
                    key={y.id}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-line bg-surface p-3"
                  >
                    <Badge tone={SESSION_TYPE_TONE[y.tipo]}>{SESSION_TYPE_LABELS[y.tipo]}</Badge>
                    <span className="min-w-0 flex-1 truncate text-[13px]">
                      {(y.topicIds || [])
                        .map((F) => state.topics.find((U) => U.id === F)?.nome)
                        .join(" + ") || "Sessão"}
                    </span>
                    <span className="text-xs tabular-nums text-ink2">
                      {formatMinutes(y.plannedMin)}
                    </span>
                    <Button
                      size="sm"
                      onClick={() =>
                        openSession({
                          ...y,
                          date: todayStr,
                          status: "planejada",
                        })
                      }
                    >
                      Reagendar
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Backlog vazio">
                Sessões adiáveis e sem folga vêm para cá ao replanejar, para não acumular dívida na
                semana.
              </EmptyState>
            );
          })()}
      </div>
      <Modal
        open={!!v}
        wide
        onClose={() => C(null)}
        title="Plano sugerido para 7 dias"
        footer={
          <>
            <Button onClick={() => C(null)}>Cancelar</Button>
            <Button
              variant="primary"
              icon={Check}
              disabled={!v || !Object.values(v.pick).some(Boolean)}
              onClick={H}
            >
              Aceitar selecionadas
            </Button>
          </>
        }
      >
        {v &&
          (v.sessions.length === 0 ? (
            <EmptyState title="Nada a sugerir">
              Sem capacidade livre nos próximos 7 dias ou nenhum assunto elegível. Veja a
              disponibilidade em Configurações.
            </EmptyState>
          ) : (
            <>
              <p className="mb-3 text-xs text-ink2">
                {"Estágio: "}
                <b className="text-ink">{v.mix.label}</b>
                {" (alvo: "}
                {v.mix.profundo}
                {"% estudo profundo · "}
                {v.mix.consolidacao}
                {"% consolidação · "}
                {v.mix.avaliacao}
                {"% avaliação). Capacidade já considera a margem de "}
                {settings.bufferPct}
                {"% para imprevistos e o máximo de "}
                {settings.maxAssuntosDia}
                {" assuntos por dia. Nada é gravado até você aceitar."}
              </p>
              <ul className="flex flex-col gap-3">
                {[...new Set(v.sessions.map((p) => p.date))].map((p) => (
                  <li key={p}>
                    <p className="mb-1 text-xs font-semibold">
                      {formatWeekdayDM(p)}
                      {" · "}
                      {formatMinutes(
                        v.sessions
                          .filter((y) => y.date === p && v.pick[y.id])
                          .reduce((y, F) => y + F.plannedMin, 0),
                      )}
                      {" de "}
                      {formatMinutes(netMinutes(settings, p))}
                    </p>
                    {v.sessions
                      .filter((y) => y.date === p)
                      .map((y) => (
                        <div
                          key={y.id}
                          className="flex items-start gap-2 border-t border-line py-1.5"
                        >
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 accent-[var(--accent)]"
                            aria-label="Incluir"
                            checked={!!v.pick[y.id]}
                            onChange={(F) =>
                              C({
                                ...v,
                                pick: {
                                  ...v.pick,
                                  [y.id]: F.target.checked,
                                },
                              })
                            }
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <Badge tone={SESSION_TYPE_TONE[y.tipo]}>
                                {SESSION_TYPE_LABELS[y.tipo]}
                              </Badge>
                              <Badge tone={y.prioridade === "essencial" ? "crit" : "muted"}>
                                {y.prioridade}
                              </Badge>
                              <span className="text-xs tabular-nums text-ink2">
                                {formatMinutes(y.plannedMin)}
                              </span>
                            </div>
                            <p className="text-[13px]">
                              {y.topicIds
                                .map((F) => state.topics.find((U) => U.id === F)?.nome)
                                .join(" + ") || "Simulado semanal"}
                            </p>
                            <p className="text-[11px] text-muted">{y.why}</p>
                          </div>
                        </div>
                      ))}
                  </li>
                ))}
              </ul>
            </>
          ))}
      </Modal>
      <Modal
        open={!!x}
        wide
        onClose={() => b(null)}
        title="Replanejar sessões atrasadas"
        footer={
          <>
            <Button onClick={() => b(null)}>Cancelar</Button>
            <Button variant="primary" icon={Check} onClick={c}>
              Aplicar
            </Button>
          </>
        }
      >
        {x && (
          <>
            <p className="mb-3 text-xs text-ink2">
              Só as sessões vencidas se movem. Essenciais entram primeiro, nas datas com folga (já
              com margem e limite de assuntos por dia); adiáveis vão para o backlog. O restante do
              plano não muda.
            </p>
            <ul className="flex flex-col divide-y divide-line">
              {x.moves.map((p) => {
                let y = state.sessions.find((F) => F.id === p.id);
                return (
                  <li key={p.id} className="flex flex-wrap items-center gap-2 py-2 text-[13px]">
                    <span className="min-w-0 flex-1 truncate">
                      {(y.topicIds || [])
                        .map((F) => state.topics.find((U) => U.id === F)?.nome)
                        .join(" + ") || SESSION_TYPE_LABELS[y.tipo]}
                    </span>
                    <span className="text-xs tabular-nums text-ink2">
                      {formatDM(p.from)}
                      {" → "}
                      {p.to ? formatDM(p.to) : "backlog"}
                    </span>
                    <span className="basis-full text-[11px] text-muted">{p.reason}</span>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Modal>
    </div>
  );
}

function CycleView() {
  let { state, patchSettings, openSession } = useApp(),
    r = state.settings.ciclo,
    todayStr = today(),
    o = (d, u = r.ptr) =>
      patchSettings({
        ciclo: {
          itens: d,
          ptr: u,
        },
      });
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card
        title="Ciclo rotativo"
        sub="Não depende de dia nem horário: ao concluir um bloco, o ciclo avança para o próximo"
        right={
          <Button
            size="sm"
            icon={Plus}
            onClick={() =>
              o([
                ...r.itens,
                {
                  id: uid(),
                  rotulo: "Novo bloco",
                  min: 60,
                },
              ])
            }
          >
            Bloco
          </Button>
        }
      >
        <ol className="flex flex-col gap-2">
          {r.itens.map((d, u) => (
            <li
              key={d.id}
              className={cn(
                "grid grid-cols-[auto_1fr_5rem_auto] items-center gap-2 rounded-md border p-2",
                u === r.ptr % r.itens.length ? "border-accent bg-accentSoft" : "border-line",
              )}
            >
              <span className="w-5 text-center text-xs tabular-nums text-ink2">{u + 1}</span>
              <TextInput
                aria-label={`Rótulo do bloco ${u + 1}`}
                className="!h-8"
                value={d.rotulo}
                onChange={(L) =>
                  o(
                    r.itens.map((g) =>
                      g.id === d.id
                        ? {
                            ...g,
                            rotulo: L.target.value,
                          }
                        : g,
                    ),
                  )
                }
              />
              <NumberInput
                aria-label="Minutos"
                className="!h-8"
                value={d.min}
                onChange={(L) =>
                  o(
                    r.itens.map((g) =>
                      g.id === d.id
                        ? {
                            ...g,
                            min: L || 0,
                          }
                        : g,
                    ),
                  )
                }
              />
              <IconButton
                icon={Trash2}
                label="Remover bloco"
                onClick={() => o(r.itens.filter((L) => L.id !== d.id))}
              />
            </li>
          ))}
        </ol>
        {!r.itens.length && (
          <EmptyState title="Ciclo vazio">
            Adicione blocos com a disciplina e os minutos de cada rodada.
          </EmptyState>
        )}
      </Card>
      <Card title="Próximo bloco">
        {r.itens.length
          ? (() => {
              let d = r.itens[r.ptr % r.itens.length];
              return (
                <div className="flex flex-col gap-3">
                  <p className="text-base font-semibold">{d.rotulo}</p>
                  <p className="text-xs text-ink2">
                    {d.min}
                    {" min · bloco "}
                    {(r.ptr % r.itens.length) + 1}
                    {" de "}
                    {r.itens.length}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="primary"
                      onClick={() =>
                        openSession({
                          id: null,
                          date: todayStr,
                          tipo: "teoria",
                          plannedMin: d.min,
                          cicloRotulo: d.rotulo,
                        })
                      }
                    >
                      Criar sessão deste bloco
                    </Button>
                    <Button onClick={() => o(r.itens, r.ptr + 1)}>Pular para o próximo</Button>
                  </div>
                </div>
              );
            })()
          : null}
        <p className="mt-4 rounded-md bg-surface2 p-3 text-xs text-ink2">
          O ciclo inicial é uma hipótese: dois blocos específicos para cada básico e complementar,
          conforme as prioridades da matriz e os pesos comprovados no edital. Ajuste conforme seu diagnóstico
          mostrar onde estão as lacunas.
        </p>
      </Card>
    </div>
  );
}
