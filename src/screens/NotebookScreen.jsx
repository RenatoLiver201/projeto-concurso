/**
 * Registros do NotebookLM por assunto, com prompts prontos para copiar.
 */
import { useEffect, useState } from "react";
import { Check, Copy, ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { EmptyState, PageHeader } from "../components/ui/feedback";
import { Field, Select, TextInput, Textarea } from "../components/ui/form";
import { useApp } from "../context/AppContext";
import { newNotebookEntry } from "../data/defaults";
import { copyToClipboard } from "../lib/clipboard";
import { formatDMY, today } from "../lib/dates";

export function NotebookScreen() {
  let { state, upsert, remove } = useApp(),
    [r, l] = useState(null),
    [o, d] = useState(""),
    [u, L] = useState(null),
    g = (n) => state.topics.find((i) => i.id === n),
    m = (n) => {
      (d(n), setTimeout(() => d(""), 2500));
    },
    h = (n, i) => {
      let w = g(i.topicId),
        v = state.concursos.find((b) => b.id === i.concursoId),
        C = `Notebook: ${i.notebook || "—"} · Fonte: ${i.fonte || "—"}${i.pagina ? ` (${i.pagina})` : ""}`,
        x = v?.banca?.split(" ")[0] || "Não informada";
      return n === "questoes"
        ? `Use APENAS as fontes deste notebook. ${C}.
Assunto: ${w?.nome || "(informe)"}${v ? ` · ${v.orgao.split("(")[0].trim()} · ${v.cargo}` : ""}.
Crie 10 itens de certo/errado no estilo ${x}, com gabarito comentado e a página/trecho que sustenta cada resposta. Misture itens fáceis, médios e com pegadinha. Se a fonte não cobrir o assunto, diga isso em vez de inventar.`
        : n === "resumo"
          ? `Use APENAS as fontes deste notebook. ${C}.
Assunto: ${w?.nome || "(informe)"}.
Faça um resumo de revisão em tópicos curtos (máx. 15 linhas), com os pontos mais cobráveis em prova ${x} e uma lista de termos que costumam gerar confusão. Cite página/seção. Não complete lacunas com conhecimento externo.`
          : `Você é meu tutor. Contexto do meu registro:
- ${C}
- Assunto: ${w?.nome || "—"} (situação: ${w?.status || "—"})
- Resumo validado por mim: ${i.resumo || "—"}
- Dúvidas pendentes: ${i.duvidas || "—"}
- Link: ${i.link || "—"}
Com base apenas nisso: 1) esclareça as dúvidas pendentes; 2) proponha uma sessão de estudo de ${state.settings.sessaoMin} minutos; 3) sugira 5 questões para validar o aprendizado. Diga o que depende de checagem na fonte.`;
    },
    f = async (n, i) => {
      let w = await copyToClipboard(h(n, i));
      (m(
        w
          ? "Instrução copiada. Cole no NotebookLM ou no Claude."
          : "Não consegui copiar: selecione o texto abaixo.",
      ),
        w ||
          L({
            kind: n,
            n: i,
            text: h(n, i),
          }));
    };
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="NotebookLM"
        sub="Este painel não acessa seus notebooks nem sincroniza sozinho. O fluxo é manual: registre a referência aqui, copie a instrução pronta e cole no NotebookLM ou no Claude."
      >
        <Button variant="primary" icon={Plus} onClick={() => l(newNotebookEntry(state))}>
          Nova referência
        </Button>
      </PageHeader>
      <Card title="Como usar" pad>
        <ol className="list-decimal space-y-1 pl-5 text-[13px] text-ink2">
          <li>
            No NotebookLM, mantenha um notebook por concurso (edital, legislação, material de aula,
            questões comentadas).
          </li>
          <li>Aqui, registre o notebook, a fonte, a página e o resumo que você validou.</li>
          <li>
            Use “Questões”, “Resumo” ou “Tutor” para copiar a instrução pronta, e cole onde ela deve
            rodar.
          </li>
          <li>
            Traga de volta os resultados (acertos, erros, dúvidas) para o painel: eles alimentam os
            indicadores.
          </li>
        </ol>
      </Card>
      {o && (
        <p role="status" className="rounded-md bg-goodSoft px-3 py-2 text-xs text-goodInk">
          {o}
        </p>
      )}
      {state.notebooks.length === 0 ? (
        <EmptyState title="Nenhuma referência cadastrada">
          Cadastre a primeira para gerar instruções de estudo, revisão e questões.
        </EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {state.notebooks.map((n) => (
            <li key={n.id} className="rounded-lg border border-line bg-surface p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[13px] font-semibold">{n.notebook || "Sem nome"}</span>
                <Badge tone="muted">
                  {state.concursos
                    .find((i) => i.id === n.concursoId)
                    ?.orgao.split("(")[0]
                    .trim() || "—"}
                </Badge>
                {g(n.topicId) && <Badge tone="info">{g(n.topicId).nome}</Badge>}
                <span className="ml-auto text-[11px] text-muted">
                  {"atualizado "}
                  {formatDMY(n.atualizado)}
                </span>
              </div>
              <p className="mt-1 text-xs text-ink2">
                {n.fonte || "fonte não informada"}
                {n.pagina ? ` · ${n.pagina}` : ""}
                {n.link && (
                  <>
                    {" · "}
                    <a
                      className="inline-flex items-center gap-0.5 text-accentInk hover:underline"
                      href={n.link}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      link
                      <ExternalLink size={11} aria-hidden />
                    </a>
                  </>
                )}
              </p>
              {n.resumo && (
                <p className="mt-2 whitespace-pre-wrap text-[13px]">
                  <b>{"Resumo validado: "}</b>
                  {n.resumo}
                </p>
              )}
              {n.duvidas && (
                <p className="mt-1 whitespace-pre-wrap text-[13px] text-warnInk">
                  <b>{"Dúvidas: "}</b>
                  {n.duvidas}
                </p>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" icon={Copy} onClick={() => f("questoes", n)}>
                  Instrução: questões
                </Button>
                <Button size="sm" icon={Copy} onClick={() => f("resumo", n)}>
                  Instrução: resumo
                </Button>
                <Button size="sm" icon={Copy} onClick={() => f("tutor", n)}>
                  Instrução: tutor (Claude)
                </Button>
                <Button size="sm" icon={Pencil} className="ml-auto" onClick={() => l(n)}>
                  Editar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal open={!!u} onClose={() => L(null)} title="Selecione e copie">
        <Textarea
          readOnly
          className="min-h-[220px] font-mono text-xs"
          value={u?.text || ""}
          onFocus={(n) => n.target.select()}
        />
      </Modal>
      <NotebookModal n={r} onClose={() => l(null)} />
    </div>
  );
}

function NotebookModal({ n: a, onClose }) {
  let { state, upsert, remove } = useApp(),
    [o, d] = useState(null),
    [u, L] = useState(false);
  if (
    (useEffect(() => {
      (d(
        a
          ? {
              ...a,
            }
          : null,
      ),
        L(false));
    }, [a]),
    !a || !o)
  )
    return null;
  let g = state.notebooks.some((h) => h.id === o.id),
    m = (h) =>
      d({
        ...o,
        ...h,
      });
  return (
    <Modal
      open
      wide
      onClose={onClose}
      title="Referência do NotebookLM"
      footer={
        <>
          {g &&
            (u ? (
              <Button
                variant="danger"
                onClick={() => {
                  (remove("notebooks", o.id), onClose());
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
              (upsert("notebooks", {
                ...o,
                atualizado: today(),
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
        <Field label="Nome do notebook">
          <TextInput
            value={o.notebook}
            onChange={(h) =>
              m({
                notebook: h.target.value,
              })
            }
          />
        </Field>
        <Field label="Concurso">
          <Select
            value={o.concursoId}
            onChange={(h) =>
              m({
                concursoId: h.target.value,
              })
            }
          >
            <option value="">—</option>
            {state.concursos.map((h) => (
              <option key={h.id} value={h.id}>
                {h.orgao.split("(")[0].trim()}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Fonte ou documento">
          <TextInput
            value={o.fonte}
            onChange={(h) =>
              m({
                fonte: h.target.value,
              })
            }
          />
        </Field>
        <Field label="Página ou seção">
          <TextInput
            value={o.pagina}
            onChange={(h) =>
              m({
                pagina: h.target.value,
              })
            }
          />
        </Field>
        <Field label="Assunto">
          <Select
            value={o.topicId}
            onChange={(h) =>
              m({
                topicId: h.target.value,
              })
            }
          >
            <option value="">—</option>
            {state.topics.map((h) => (
              <option key={h.id} value={h.id}>
                {h.nome}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Link da fonte (se houver)">
          <TextInput
            value={o.link}
            onChange={(h) =>
              m({
                link: h.target.value,
              })
            }
            placeholder="https://"
          />
        </Field>
        <Field label="Resumo validado" className="sm:col-span-2">
          <Textarea
            value={o.resumo}
            onChange={(h) =>
              m({
                resumo: h.target.value,
              })
            }
          />
        </Field>
        <Field label="Dúvidas pendentes" className="sm:col-span-2">
          <Textarea
            value={o.duvidas}
            onChange={(h) =>
              m({
                duvidas: h.target.value,
              })
            }
          />
        </Field>
      </div>
    </Modal>
  );
}
