/**
 * Configurações: disponibilidade, bloqueios, metas, pesos, tema, backup/importação JSON e exportação CSV.
 */
import { useRef, useState } from "react";
import { Check, Download, Plus, RotateCcw, Trash2, Upload } from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { Button, IconButton } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { PageHeader } from "../components/ui/feedback";
import { Field, NumberInput, Select, TextInput, Textarea } from "../components/ui/form";
import { useApp } from "../context/AppContext";
import { PRIORITY_FACTORS, STUDY_STAGES } from "../data/constants";
import { createInitialState } from "../data/defaults";
import { saveDownload, toCsv, validateBackup } from "../lib/backup";
import { validateWorkspaceBackup } from "../data/workspace";
import { copyToClipboard } from "../lib/clipboard";
import { WEEKDAYS_LONG, addDays, formatMinutes, today, uid } from "../lib/dates";
import { currentStage, netMinutes, plannedMinutes } from "../lib/planner";

export function SettingsScreen() {
  let { state, setState, patchSettings, sync, replaceAll, importAsProfile, importAllProfiles, exportWorkspace, profile, createProfile, deleteProfile, startWizard } = useApp(),
    settings = state.settings,
    todayStr = today(),
    [u, L] = useState(null),
    [g, m] = useState(""),
    [h, f] = useState(""),
    [n, i] = useState(""),
    [w, v] = useState(false),
    [C, x] = useState(null),
    b = useRef(null),
    N = (c) => {
      (f(c), setTimeout(() => f(""), 3500));
    },
    I = Array.from(
      {
        length: 7,
      },
      (c, p) => netMinutes(settings, addDays(todayStr, p)),
    ).reduce((c, p) => c + p, 0),
    A = Array.from(
      {
        length: 7,
      },
      (c, p) => plannedMinutes(state.sessions, addDays(todayStr, p)),
    ).reduce((c, p) => c + p, 0),
    R = (c, p) => {
      let y = [...settings.horasDia];
      ((y[c] = Math.max(0, Math.round((p || 0) * 60))),
        patchSettings({
          horasDia: y,
        }));
    },
    S = () => JSON.stringify(state, null, 2),
    exportEveryProfile = async () => {
      const all = JSON.stringify(exportWorkspace(), null, 2);
      const result = await saveDownload(`todos-os-perfis-${today()}.json`, all);
      if (result === "saved") N("Backup de todos os perfis salvo.");
      else if (result === "fallback") L({ t: "Todos os perfis (JSON)", v: all });
    },
    O = async () => {
      let c = await saveDownload(`preparacao-backup-${today()}.json`, S());
      c === "saved"
        ? N("Backup salvo.")
        : c === "fallback" &&
          L({
            t: "Backup JSON",
            v: S(),
          });
    },
    P = async () => {
      let c = (F) => state.topics.find((U) => U.id === F),
        p = toCsv(state.questions, [
          {
            h: "data",
            f: (F) => F.date,
          },
          {
            h: "concurso",
            f: (F) => F.concursoId,
          },
          {
            h: "banca",
            f: (F) => F.banca,
          },
          {
            h: "disciplina",
            f: (F) => c(F.topicId)?.disciplina,
          },
          {
            h: "assunto",
            f: (F) => c(F.topicId)?.nome,
          },
          {
            h: "fonte",
            f: (F) => F.fonte,
          },
          {
            h: "resultado",
            f: (F) => (F.correto === true ? "certa" : F.correto === false ? "errada" : "branco"),
          },
          {
            h: "tempo_s",
            f: (F) => F.tempoSeg,
          },
          {
            h: "confianca",
            f: (F) => F.confianca,
          },
          {
            h: "tipo_erro",
            f: (F) => F.tipoErro,
          },
          {
            h: "justificativa",
            f: (F) => F.justificativa,
          },
          {
            h: "revisar",
            f: (F) => F.revisar,
          },
          {
            h: "notebooklm",
            f: (F) => F.notebookRef,
          },
        ]),
        y = await saveDownload(`questoes-${today()}.csv`, p);
      y === "saved"
        ? N("CSV salvo.")
        : y === "fallback" &&
          L({
            t: "Questões (CSV)",
            v: p,
          });
    },
    K = (c) => {
      i("");
      try {
        let p = JSON.parse(c),
          y = validateWorkspaceBackup(p) ? null : validateBackup(p);
        if (y) return i(y);
        x(p);
      } catch {
        i("O conteúdo não é um JSON válido.");
      }
    },
    B = (c) => {
      let p = c.target.files?.[0];
      if (!p) return;
      let y = new FileReader();
      ((y.onload = () => K(String(y.result))),
        (y.onerror = () => i("Não foi possível ler o arquivo.")),
        y.readAsText(p),
        (c.target.value = ""));
    },
    H = settings.pesos;
  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Configurações"
        sub="Tudo aqui é editável e entra nos cálculos. O que ainda não confirmou fica marcado como provisório."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Disponibilidade líquida"
          sub={`Horas por dia para estudo, já descontados trabalho e faculdade${settings.provisorio ? " · CENÁRIO PROVISÓRIO" : ""}`}
        >
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {[1, 2, 3, 4, 5, 6, 0].map((c) => (
              <Field key={c} label={WEEKDAYS_LONG[c].slice(0, 3)}>
                <NumberInput
                  step="0.25"
                  min="0"
                  value={settings.horasDia[c] / 60}
                  onChange={(p) => R(c, p)}
                />
              </Field>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink2">
            {"Semana: "}
            <b className="text-ink">
              {formatMinutes(settings.horasDia.reduce((c, p) => c + p, 0))}
            </b>
            {" brutos · "}
            <b className="text-ink">{formatMinutes(I)}</b>
            {" de capacidade nos próximos 7 dias (margem de "}
            {settings.bufferPct}
            {"%) · "}
            <b className="text-ink">{formatMinutes(A)}</b>
            {" já planejados"}
            {A > I ? " — acima da capacidade" : ""}.
          </p>
          {settings.provisorio && (
            <div className="mt-2 flex items-center gap-2">
              <Badge tone="warn">provisório</Badge>
              <Button
                size="sm"
                icon={Check}
                onClick={() =>
                  patchSettings({
                    provisorio: false,
                  })
                }
              >
                Confirmar esta disponibilidade
              </Button>
            </div>
          )}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Field label="Margem para imprevistos (%)">
              <NumberInput
                value={settings.bufferPct}
                onChange={(c) =>
                  patchSettings({
                    bufferPct: c ?? 0,
                  })
                }
              />
            </Field>
            <Field label="Máx. de assuntos por dia">
              <NumberInput
                value={settings.maxAssuntosDia}
                onChange={(c) =>
                  patchSettings({
                    maxAssuntosDia: c || 1,
                  })
                }
              />
            </Field>
            <Field label="Duração da sessão (min)">
              <NumberInput
                value={settings.sessaoMin}
                onChange={(c) =>
                  patchSettings({
                    sessaoMin: c || 25,
                  })
                }
              />
            </Field>
            <Field label="Duração da revisão (min)">
              <NumberInput
                value={settings.revisaoMin}
                onChange={(c) =>
                  patchSettings({
                    revisaoMin: c || 15,
                  })
                }
              />
            </Field>
          </div>
          <Field
            label="Compromissos fixos (anotação)"
            className="mt-3"
            hint="Trabalho, deslocamentos, faculdade e outros compromissos. Para dias específicos, use os bloqueios ao lado."
          >
            <Textarea
              value={settings.compromissos}
              onChange={(c) =>
                patchSettings({
                  compromissos: c.target.value,
                })
              }
            />
          </Field>
        </Card>
        <Card
          title="Bloqueios por data"
          sub="Reduzem a capacidade de um dia específico"
          right={
            <Button
              size="sm"
              icon={Plus}
              onClick={() =>
                patchSettings({
                  bloqueios: [
                    ...settings.bloqueios,
                    {
                      id: uid(),
                      data: todayStr,
                      min: 60,
                      motivo: "",
                    },
                  ],
                })
              }
            >
              Bloqueio
            </Button>
          }
        >
          {settings.bloqueios.length ? (
            <ul className="flex flex-col gap-2">
              {settings.bloqueios.map((c) => (
                <li key={c.id} className="grid grid-cols-[8.5rem_5rem_1fr_auto] items-center gap-2">
                  <TextInput
                    aria-label="Data"
                    type="date"
                    className="!h-8"
                    value={c.data}
                    onChange={(p) =>
                      patchSettings({
                        bloqueios: settings.bloqueios.map((y) =>
                          y.id === c.id
                            ? {
                                ...y,
                                data: p.target.value,
                              }
                            : y,
                        ),
                      })
                    }
                  />
                  <NumberInput
                    aria-label="Minutos"
                    className="!h-8"
                    value={c.min}
                    onChange={(p) =>
                      patchSettings({
                        bloqueios: settings.bloqueios.map((y) =>
                          y.id === c.id
                            ? {
                                ...y,
                                min: p || 0,
                              }
                            : y,
                        ),
                      })
                    }
                  />
                  <TextInput
                    aria-label="Motivo"
                    className="!h-8"
                    placeholder="Motivo"
                    value={c.motivo}
                    onChange={(p) =>
                      patchSettings({
                        bloqueios: settings.bloqueios.map((y) =>
                          y.id === c.id
                            ? {
                                ...y,
                                motivo: p.target.value,
                              }
                            : y,
                        ),
                      })
                    }
                  />
                  <IconButton
                    icon={Trash2}
                    label="Remover"
                    onClick={() =>
                      patchSettings({
                        bloqueios: settings.bloqueios.filter((p) => p.id !== c.id),
                      })
                    }
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted">
              Nenhum bloqueio. Ex.: prova da faculdade, viagem a trabalho.
            </p>
          )}
        </Card>
        <Card title="Metas e critérios">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Concurso principal">
              <Select
                value={settings.concursoPrincipal || ""}
                onChange={(c) =>
                  patchSettings({
                    concursoPrincipal: c.target.value,
                  })
                }
              >
                <option value="">Escolha um concurso</option>
                {state.concursos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.orgao.split("(")[0].trim()}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Meta de horas por semana">
              <NumberInput
                value={settings.metaHorasSemana}
                onChange={(c) =>
                  patchSettings({
                    metaHorasSemana: c ?? 0,
                  })
                }
              />
            </Field>
            <Field label="Meta de questões por semana">
              <NumberInput
                value={settings.metaQuestoesSemana}
                onChange={(c) =>
                  patchSettings({
                    metaQuestoesSemana: c ?? 0,
                  })
                }
              />
            </Field>
            <Field label="Meta de acerto (%)">
              <NumberInput
                value={Math.round(settings.metaAcerto * 100)}
                onChange={(c) =>
                  patchSettings({
                    metaAcerto: (c ?? 0) / 100,
                  })
                }
              />
            </Field>
            <Field
              label="Amostra mínima por conclusão"
              hint="Abaixo disso, taxas são marcadas como pouco confiáveis"
            >
              <NumberInput
                value={settings.amostraMin}
                onChange={(c) =>
                  patchSettings({
                    amostraMin: Math.max(1, c || 1),
                  })
                }
              />
            </Field>
            <Field label="Meta de segundos por item" hint="Defina conforme a duração e quantidade de itens da sua prova; sem edital é apenas uma meta provisória.">
              <NumberInput
                value={settings.segPorItemMeta}
                onChange={(c) =>
                  patchSettings({
                    segPorItemMeta: c || 60,
                  })
                }
              />
            </Field>
            <Field label="Dia do simulado semanal">
              <Select
                value={settings.simuladoDia}
                onChange={(c) =>
                  patchSettings({
                    simuladoDia: Number(c.target.value),
                  })
                }
              >
                {WEEKDAYS_LONG.map((c, p) => (
                  <option key={p} value={p}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Duração do simulado (min)">
              <NumberInput
                value={settings.simuladoMin}
                onChange={(c) =>
                  patchSettings({
                    simuladoMin: c || 60,
                  })
                }
              />
            </Field>
          </div>
        </Card>
        <Card
          title="Revisão espaçada e estágio"
          sub="Intervalos base em dias; o sistema ajusta por desempenho"
        >
          <div className="flex flex-wrap items-end gap-2">
            {settings.intervalos.map((c, p) => (
              <Field key={p} label={`Revisão ${p + 1}`} className="w-20">
                <NumberInput
                  value={c}
                  onChange={(y) =>
                    patchSettings({
                      intervalos: settings.intervalos.map((F, U) =>
                        U === p ? Math.max(1, y || 1) : F,
                      ),
                    })
                  }
                />
              </Field>
            ))}
            <Button
              size="sm"
              icon={Plus}
              onClick={() =>
                patchSettings({
                  intervalos: [
                    ...settings.intervalos,
                    settings.intervalos[settings.intervalos.length - 1] * 2,
                  ],
                })
              }
            >
              Etapa
            </Button>
            {settings.intervalos.length > 1 && (
              <Button
                size="sm"
                onClick={() =>
                  patchSettings({
                    intervalos: settings.intervalos.slice(0, -1),
                  })
                }
              >
                Remover última
              </Button>
            )}
          </div>
          <Field
            label="Estágio da preparação (mix de blocos)"
            className="mt-4"
            hint={`Automático hoje: ${
              STUDY_STAGES[
                currentStage(
                  {
                    ...state,
                    settings: {
                      ...settings,
                      estagio: "auto",
                    },
                  },
                  todayStr,
                )
              ].label
            }, pela distância da prova com data confirmada`}
          >
            <Select
              value={settings.estagio}
              onChange={(c) =>
                patchSettings({
                  estagio: c.target.value,
                })
              }
            >
              <option value="auto">Automático</option>
              {Object.entries(STUDY_STAGES).map(([c, p]) => (
                <option key={c} value={c}>
                  {p.label}
                  {": "}
                  {p.profundo}/{p.consolidacao}/{p.avaliacao}
                </option>
              ))}
            </Select>
          </Field>
          <p className="mt-1 text-[11px] text-muted">
            Mix = % de estudo profundo / consolidação / avaliação.
          </p>
        </Card>
        <Card
          title="Pesos da prioridade"
          sub="Cada componente é normalizado de 0 a 1. Peso 0 desliga. Dados ausentes saem do cálculo."
        >
          <ul className="flex flex-col gap-2.5">
            {Object.entries(PRIORITY_FACTORS).map(([c, p]) => (
              <li key={c} className="grid grid-cols-[1fr_auto] items-center gap-x-3">
                <label htmlFor={"w-" + c} className="text-[13px]" title={p.ajuda}>
                  {p.nome}
                  <span className="block text-[11px] text-muted">{p.ajuda}</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={"w-" + c}
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={H[c]}
                    onChange={(y) =>
                      patchSettings({
                        pesos: {
                          ...H,
                          [c]: Number(y.target.value),
                        },
                      })
                    }
                    className="w-28 accent-[var(--accent)]"
                  />
                  <span className="w-7 text-right text-xs tabular-nums">{H[c]}</span>
                </div>
              </li>
            ))}
          </ul>
          <Button
            size="sm"
            className="mt-3"
            icon={RotateCcw}
            onClick={() =>
              patchSettings({
                pesos: {
                  relevancia: 3,
                  peso: 2,
                  lacuna: 3,
                  facilidade: 1,
                  tempo: 1.5,
                  esquecimento: 1.5,
                  concursos: 1.5,
                  proximidade: 2.5,
                },
              })
            }
          >
            Restaurar pesos padrão
          </Button>
        </Card>
        <Card
          title="Tipos de erro"
          right={
            <Button
              size="sm"
              icon={Plus}
              onClick={() =>
                patchSettings({
                  tiposErro: [...settings.tiposErro, "Novo tipo"],
                })
              }
            >
              Tipo
            </Button>
          }
        >
          <ul className="flex flex-col gap-2">
            {settings.tiposErro.map((c, p) => (
              <li key={p} className="flex gap-2">
                <TextInput
                  aria-label={`Tipo de erro ${p + 1}`}
                  className="!h-8"
                  value={c}
                  onChange={(y) =>
                    patchSettings({
                      tiposErro: settings.tiposErro.map((F, U) => (U === p ? y.target.value : F)),
                    })
                  }
                />
                <IconButton
                  icon={Trash2}
                  label="Remover tipo"
                  onClick={() =>
                    patchSettings({
                      tiposErro: settings.tiposErro.filter((y, F) => F !== p),
                    })
                  }
                />
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-muted">
            Renomear não altera questões já registradas com o nome antigo.
          </p>
        </Card>
        <Card title="Aparência">
          <Field label="Tema">
            <Select
              value={settings.tema}
              onChange={(c) =>
                patchSettings({
                  tema: c.target.value,
                })
              }
            >
              <option value="system">Seguir o sistema</option>
              <option value="light">Claro</option>
              <option value="dark">Escuro</option>
            </Select>
          </Field>
        </Card>
      </div>
      <Card title="Estudante e concursos" sub="Cada perfil tem dados e histórico independentes.">
        <p className="text-[13px]">Perfil ativo: <b>{profile?.name}</b></p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button onClick={createProfile} icon={Plus}>Criar outro perfil</Button>
          <Button onClick={startWizard} icon={Plus}>Adicionar concurso guiado</Button>
          <Button variant="danger" disabled={!profile} onClick={deleteProfile}>Excluir perfil (se houver outro)</Button>
        </div>
        <p className="mt-2 text-xs text-ink2">Antes de excluir um perfil, exporte o backup JSON abaixo. Excluir não apaga a chave legada v1.</p>
      </Card>
      <Card title="Dados, persistência e backup">
        <p className="text-[13px]">
          <Badge tone={sync.mode === "db" ? "good" : sync.mode === "local" ? "warn" : "crit"}>
            {sync.mode === "db"
              ? "Salvo no banco do artifact"
              : sync.mode === "local"
                ? "Salvo só neste navegador"
                : "Somente nesta sessão"}
          </Badge>{" "}
          <span className="text-xs text-ink2">
            {sync.mode === "db"
              ? `Cada registro é gravado individualmente e sobrevive a atualizações do painel.${sync.last ? " Última gravação às " + sync.last + "." : ""}`
              : sync.mode === "local"
                ? "O banco do artifact não está disponível nesta visualização; os dados ficam no armazenamento local e podem ser apagados ao limpar o navegador. Exporte backups com frequência."
                : "Nenhum armazenamento disponível: os dados se perdem ao fechar a página. Exporte um backup antes de sair."}
          </span>
        </p>
        {sync.error && <p className="mt-1 text-xs text-critInk">{sync.error}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button icon={Download} onClick={O}>
            Exportar JSON (backup completo)
          </Button>
          <Button icon={Download} onClick={exportEveryProfile}>
            Exportar todos os perfis (JSON)
          </Button>
          <Button icon={Download} onClick={P}>
            Exportar questões (CSV)
          </Button>
          <Button icon={Upload} onClick={() => b.current?.click()}>
            Importar JSON
          </Button>
          <input
            ref={b}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={B}
            aria-label="Arquivo de backup"
          />
        </div>
        <Field label="Ou cole um backup JSON" className="mt-3">
          <Textarea className="font-mono text-xs" value={g} onChange={(c) => m(c.target.value)} />
        </Field>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Button disabled={!g.trim()} onClick={() => K(g)}>
            Validar e importar
          </Button>
          {n && (
            <span role="alert" className="text-xs text-critInk">
              {n}
            </span>
          )}
          {h && (
            <span role="status" className="text-xs text-goodInk">
              {h}
            </span>
          )}
        </div>
        <div className="mt-4 border-t border-line pt-3">
          {w ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-critInk">
                Limpa apenas este perfil (sessões, matérias, concursos, questões e notas). Outros perfis e o backup legado são preservados.
              </span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  (replaceAll(createInitialState()), v(false), N("Perfil limpo. Configure outro concurso pelo assistente."));
                }}
              >
                Confirmar
              </Button>
              <Button size="sm" onClick={() => v(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button variant="danger" size="sm" icon={RotateCcw} onClick={() => v(true)}>
              Limpar perfil atual
            </Button>
          )}
        </div>
      </Card>
      <Modal
        open={!!C}
        onClose={() => x(null)}
        title="Importar backup"
        footer={
          <>
            <Button onClick={() => x(null)}>Cancelar</Button>
            <Button
              variant="primary"
              onClick={() => {
                (validateWorkspaceBackup(C) ? importAllProfiles(C) : importAsProfile(C), x(null), m(""), N("Backup importado sem substituir perfis existentes."));
              }}
            >
              Importar sem sobrescrever
            </Button>
          </>
        }
      >
        {C && (
          <p className="text-[13px] text-ink2">
            {validateWorkspaceBackup(C)
              ? `O arquivo contém ${C.profiles.length} perfis. Eles serão adicionados com novos IDs; os perfis atuais não serão substituídos.`
              : `O backup contém ${C.concursos.length} concurso(s), ${C.topics.length} assunto(s), ${C.sessions.length} sessão(ões), ${C.questions.length} questão(ões) e ${C.simulados.length} simulado(s). Ele será importado como um perfil separado.`}
          </p>
        )}
      </Modal>
      <Modal
        open={!!u}
        onClose={() => L(null)}
        title={u?.t || ""}
        footer={
          <Button
            onClick={async () => {
              let c = await copyToClipboard(u.v);
              N(c ? "Copiado." : "Selecione o texto e copie.");
            }}
          >
            Copiar
          </Button>
        }
      >
        <p className="mb-2 text-xs text-ink2">
          O download direto não está disponível nesta visualização. Copie o conteúdo e salve em um
          arquivo.
        </p>
        <Textarea
          readOnly
          className="min-h-[240px] font-mono text-xs"
          value={u?.v || ""}
          onFocus={(c) => c.target.select()}
        />
      </Modal>
    </div>
  );
}
