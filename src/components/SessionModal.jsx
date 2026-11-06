/**
 * Modal "Nova sessão" / "Sessão de estudo": planeja ou registra a conclusão de uma sessão (teoria, questões, revisão, simulado, correção de erros).
 */
import { useEffect, useState } from "react";
import { Check, Trash2 } from "lucide-react";
import { Button } from "./ui/Button";
import { Modal } from "./ui/Modal";
import { Checkbox, Field, NumberInput, Select, TextInput, Textarea } from "./ui/form";
import { useApp } from "../context/AppContext";
import { SESSION_STATUS_LABELS, SESSION_TYPE_LABELS } from "../data/constants";
import { today, uid } from "../lib/dates";
import { applyReview, computeReview, scheduleFirstReview } from "../lib/planner";
import { topicStats } from "../lib/stats";

export function SessionModal({ s: a, onClose }) {
  let { state, setState, upsert, remove, log } = useApp(),
    [u, L] = useState(null),
    [g, m] = useState(false),
    [h, f] = useState("ok"),
    [n, i] = useState(""),
    [w, v] = useState("");
  if (
    (useEffect(() => {
      a
        ? (L({
            id: a.id || uid(),
            date: a.date || today(),
            tipo: "teoria",
            topicIds: [],
            concursoIds: [state.settings.concursoPrincipal],
            plannedMin: state.settings.sessaoMin,
            actualMin: null,
            status: "planejada",
            prioridade: "recomendada",
            notes: "",
            ...a,
          }),
          m(false),
          f("ok"),
          i(""))
        : L(null);
    }, [a]),
    !a || !u)
  )
    return null;
  let C = state.sessions.some((S) => S.id === u.id),
    x = (S) =>
      L({
        ...u,
        ...S,
      }),
    b = (S, O) =>
      x({
        [S]: u[S].includes(O) ? u[S].filter((P) => P !== O) : [...u[S], O],
      }),
    N = ["feita", "parcial"].includes(u.status),
    I = state.topics.filter(
      (S) => !w || (S.nome + S.disciplina).toLowerCase().includes(w.toLowerCase()),
    ),
    A = (S) => {
      let O = {
          ...u,
          ...(S
            ? {
                status: S,
              }
            : {}),
        },
        P = ["feita", "parcial"].includes(O.status);
      P && O.actualMin == null && (O.actualMin = O.plannedMin);
      let K = C && ["feita", "parcial"].includes(state.sessions.find((B) => B.id === O.id)?.status);
      (setState((B) => {
        let H = B.topics,
          c = B.settings;
        if (
          (P &&
            (H = H.map((U) => {
              if (!O.topicIds.includes(U.id)) return U;
              if (O.tipo === "revisao" && !K)
                return applyReview(
                  {
                    ...B,
                    topics: H,
                  },
                  U,
                  h,
                  O.date,
                );
              if (O.tipo === "teoria" && n) {
                let de = {
                  ...U,
                  status: n,
                };
                return (n === "estudado" && (de = scheduleFirstReview(B, de, O.date)), de);
              }
              return U;
            })),
          P && !K)
        ) {
          let U = c.ciclo.itens[c.ciclo.ptr % Math.max(1, c.ciclo.itens.length)];
          O.cicloRotulo &&
            U &&
            O.cicloRotulo === U.rotulo &&
            (c = {
              ...c,
              ciclo: {
                ...c.ciclo,
                ptr: c.ciclo.ptr + 1,
              },
            });
        }
        let { cicloRotulo: p, ...y } = O,
          F = B.sessions.some((U) => U.id === y.id)
            ? B.sessions.map((U) => (U.id === y.id ? y : U))
            : [...B.sessions, y];
        return {
          ...B,
          topics: H,
          settings: c,
          sessions: F,
        };
      }),
        onClose());
    },
    R =
      N && u.tipo === "revisao" && u.topicIds.length === 1
        ? (() => {
            let S = state.topics.find((O) => O.id === u.topicIds[0]);
            return S ? computeReview(state, S, h, topicStats(state, S.id)) : null;
          })()
        : null;
  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={C ? "Sessão de estudo" : "Nova sessão"}
      footer={
        <>
          {C &&
            (g ? (
              <Button
                variant="danger"
                onClick={() => {
                  (remove("sessions", u.id), onClose());
                }}
              >
                Confirmar exclusão
              </Button>
            ) : (
              <Button variant="danger" icon={Trash2} className="mr-auto" onClick={() => m(true)}>
                Excluir
              </Button>
            ))}
          <Button onClick={onClose}>Cancelar</Button>
          {!N && (
            <Button icon={Check} onClick={() => A("feita")}>
              Salvar como feita
            </Button>
          )}
          <Button variant="primary" onClick={() => A()}>
            Salvar
          </Button>
        </>
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {u.why && (
          <p className="rounded-md bg-surface2 px-3 py-2 text-xs text-ink2 sm:col-span-2">
            {"Sugerida porque: "}
            {u.why}
          </p>
        )}
        <Field label="Data">
          <TextInput
            type="date"
            value={u.date || ""}
            onChange={(S) =>
              x({
                date: S.target.value,
              })
            }
          />
        </Field>
        <Field label="Tipo de atividade">
          <Select
            value={u.tipo}
            onChange={(S) =>
              x({
                tipo: S.target.value,
              })
            }
          >
            {Object.entries(SESSION_TYPE_LABELS).map(([S, O]) => (
              <option key={S} value={S}>
                {O}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Duração prevista (min)">
          <NumberInput
            value={u.plannedMin}
            onChange={(S) =>
              x({
                plannedMin: S,
              })
            }
          />
        </Field>
        <Field label="Importância">
          <Select
            value={u.prioridade || "recomendada"}
            onChange={(S) =>
              x({
                prioridade: S.target.value,
              })
            }
          >
            <option value="essencial">Essencial</option>
            <option value="recomendada">Recomendada</option>
            <option value="adiavel">Adiável</option>
          </Select>
        </Field>
        <Field label="Situação">
          <Select
            value={u.status}
            onChange={(S) =>
              x({
                status: S.target.value,
              })
            }
          >
            {Object.entries(SESSION_STATUS_LABELS).map(([S, O]) => (
              <option key={S} value={S}>
                {O}
              </option>
            ))}
          </Select>
        </Field>
        {N && (
          <Field label="Duração real (min)">
            <NumberInput
              value={u.actualMin ?? u.plannedMin}
              onChange={(S) =>
                x({
                  actualMin: S,
                })
              }
            />
          </Field>
        )}
        {N && u.tipo === "revisao" && (
          <Field
            label="Como foi a revisão?"
            hint={
              R
                ? `Próxima em ${R.days} dia(s): ${R.note}`
                : "Ajusta o próximo intervalo de cada assunto"
            }
          >
            <Select value={h} onChange={(S) => f(S.target.value)}>
              <option value="ok">Lembrei bem</option>
              <option value="parcial">Lembrei em parte</option>
              <option value="esqueci">Esqueci</option>
            </Select>
          </Field>
        )}
        {N && u.tipo === "teoria" && (
          <Field
            label="Resultado nos assuntos"
            hint="Teoria concluída inicia o ciclo de revisão, mas não conta como dominado"
          >
            <Select value={n} onChange={(S) => i(S.target.value)}>
              <option value="">Sem alterar a situação</option>
              <option value="estudando">Estudando</option>
              <option value="estudado">Teoria concluída</option>
            </Select>
          </Field>
        )}
        <div className="sm:col-span-2">
          <span className="mb-1 block text-xs font-medium text-ink2">
            Assuntos (uma sessão pode cobrir vários, quando o conteúdo é realmente compartilhado)
          </span>
          <TextInput
            aria-label="Filtrar assuntos"
            placeholder="Filtrar assuntos"
            value={w}
            onChange={(S) => v(S.target.value)}
            className="mb-2"
          />
          <div className="max-h-40 overflow-y-auto rounded-md border border-line p-2">
            {I.length ? (
              I.map((S) => (
                <div key={S.id} className="py-0.5">
                  <Checkbox
                    label={`${S.nome}`}
                    checked={u.topicIds.includes(S.id)}
                    onChange={() => b("topicIds", S.id)}
                  />
                </div>
              ))
            ) : (
              <p className="text-xs text-muted">Nenhum assunto. Cadastre na Matriz.</p>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-xs font-medium text-ink2">Concursos beneficiados</span>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {state.concursos.map((S) => (
              <Checkbox
                key={S.id}
                label={S.orgao.split("(")[0].trim()}
                checked={u.concursoIds.includes(S.id)}
                onChange={() => b("concursoIds", S.id)}
              />
            ))}
          </div>
        </div>
        <Field label="Observações" className="sm:col-span-2">
          <Textarea
            value={u.notes || ""}
            onChange={(S) =>
              x({
                notes: S.target.value,
              })
            }
          />
        </Field>
      </div>
    </Modal>
  );
}
