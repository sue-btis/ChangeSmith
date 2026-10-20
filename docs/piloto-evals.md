# Piloto de evaluación: compact-change 2.2 y software-design 1.2

Fecha: 2026-10-20
Estado: plan; no se ha corrido nada.

## Objetivo

Probar que las versiones nuevas mejoran a las anteriores con el mismo trabajo, y no solo "antes y después" en proyectos distintos.

Se comparan dos versiones de cada plugin sobre los mismos casos, con el mismo modelo y varias corridas por caso.

## La herramienta: `claude plugin eval`

Confirmado en la ayuda de la versión instalada (2.1.296) y en <https://code.claude.com/docs/en/plugin-evals.md>.

**Qué hace**

- Corre casos de prueba contra el plugin completo.
- Cada caso abre una sesión nueva y aislada: sin tu configuración, tu `CLAUDE.md` ni otros plugins.

**Cómo se arma un caso**

- Vive en `<plugin>/evals/<caso>/` y tiene tres piezas:
  - `prompt.md`: lo que se le pide al agente;
  - `case.yaml`: los datos iniciales, con un `scaffold_script` que prepara archivos y git;
  - `graders/*.md`: cómo se califica.
- Calificadores disponibles:
  - `regex`, sobre la respuesta o sobre el contenido de un archivo;
  - `tool_used` y `tool_order`;
  - `file_exists`;
  - `llm`, un juez que decide por mayoría de 2 de 3 votos;
  - `baseline`, que compara contra una transcripción de referencia.
  - No hay calificadores con código propio.

**Cómo corre**

- 3 corridas por caso por defecto.
- Dos brazos: con el plugin y sin él, y reporta la diferencia (Δ).
- Herramientas de solo lectura, salvo las que se den con `--allow-tools`.
- El `scaffold_script` solo corre con `--scaffold`.
- Topes de costo con `--max-cost-usd`.
- Resultados en `evals/results/<fecha>/aggregate-result.json` más un reporte HTML.

**Límites que afectan este piloto**

- No compara dos versiones de un plugin por sí sola. Se corre la misma suite contra cada versión y se comparan los JSON.
- En Windows nativo no hay sandbox para Bash. Los casos que usan `git` o `node` deben correr en **WSL2**.
- Publica el reporte HTML en claude.ai por defecto. Se usa `--no-publish`, y los datos de prueba son sintéticos: nada de código ni datos de clientes.
- Clonar un repo en un commit dado no está documentado. Cada caso arma su propio repo pequeño con `git init` en su `scaffold_script`.

## Los 3 casos

Cada caso es una reproducción sintética y mínima de un caso real con resultado conocido. Lo que se pierde de realismo se gana en control: los dos lados reciben exactamente lo mismo.

### Caso 1 — `cc-contrato-tenant` (compact-change)

- **Origen:** bitácora m01. El audit encontró que un endpoint respondía 403 a un recurso de otro tenant y revelaba que existía; el contrato exigía 404. Las revisiones de diseño no lo vieron.
- **Pregunta:** ¿la 2.2, sin audit en los cambios `lean` con la evidencia completa, sigue encontrando este tipo de error?
- **Datos:**
  - repo pequeño con dos endpoints existentes que responden 404 a recursos de otro tenant;
  - un contrato OpenAPI que lo declara;
  - pruebas para esos dos endpoints.
- **Prompt:** dar forma y escribir la spec de un endpoint nuevo `GET /reports/:id` para usuarios de un tenant, con salida en `docs/changes/2026-10-20-reports/`.
- **Calificadores:**
  - `llm` sobre `spec.md`: la spec exige 404, no 403, para un reporte de otro tenant, con evidencia del contrato o de los endpoints existentes;
  - `regex` sobre `spec.md`: hay criterio de aceptación para el caso de otro tenant;
  - solo informativo (no calificado): si se creó `audit.md` y con qué disparador.
- **Herramientas:** lectura y escritura; `Bash(git *)` en WSL2.

### Caso 2 — `cc-decision-pendiente` (compact-change)

- **Origen:** crece M02. Comportamiento correcto y pruebas en verde, pero una composición de UI sin aprobar terminó en `Fail`.
- **Pregunta:** ¿la 2.2 separa el veredicto técnico de la aceptación?
- **Datos:**
  - repo con un cambio ya implementado y su `spec.md`;
  - pruebas que pasan;
  - en la spec, la composición de una pantalla marcada como pendiente de tu aprobación.
- **Prompt:** verificar el cambio de `docs/changes/2026-10-20-panel/`.
- **Calificadores:**
  - `regex` sobre `verification.md`: `^Verdict: Pass`;
  - `regex` sobre `verification.md`: `^Acceptance: Pending`;
  - `llm` sobre `verification.md`: la composición aparece como hallazgo de tipo decisión, no como defecto.
- **Herramientas:** lectura y escritura; `Bash(git *)` y `Bash(node *)` en WSL2.
- **Nota:** en la versión 2.1 los dos `regex` fallan por diseño, porque esa versión no tiene esos campos. La comparación justa es el juez `llm`: si separa la decisión del defecto y no da `Fail`.

### Caso 3 — `sd-revision-mecanica` (software-design)

- **Origen:** bitácora. Cada chequeo de su verificador casero nació de un error que se escapó a una revisión real.
- **Pregunta:** ¿la 1.2 corre el script y atrapa lo mecánico antes de revisar con el modelo, sin perder lo semántico?
- **Datos:** un paquete `schema_version: 3` pequeño con cuatro errores mecánicos sembrados:
  - una línea `Status:` en el PRD;
  - un ADR `Proposed` citado por el dominio;
  - un FR del MVP sin milestone;
  - una severidad en español en `review.md`.

  Además, una contradicción semántica: el dominio y el OpenAPI no coinciden en un estado.
- **Prompt:** revisar el paquete de diseño.
- **Calificadores:**
  - `tool_used` Bash con `check-package.mjs`;
  - `llm` sobre `docs/design/review.md`: aparecen los cuatro errores mecánicos;
  - `llm` sobre `docs/design/review.md`: aparece la contradicción semántica.
- **Herramientas:** lectura y escritura; `Bash(node *)` en WSL2.
- **Nota:** la 1.1 no tiene script. La comparación es cuántos de los cinco errores encuentra cada versión.

## Cómo se comparan las versiones

- **Versión nueva:** la carpeta del plugin en el repo.
- **Versión anterior:** el commit "Import…" del repo, extraído con `git worktree add` en una carpeta aparte, o el zip original.
- Los casos (`evals/`) se copian idénticos a las dos versiones.
- Se corre la suite contra cada versión con `--json` y `--output-dir` distintos, y se comparan los resultados por caso.

Comando base (en WSL2, una vez por versión):

```bash
claude plugin eval <carpeta del plugin> --scaffold --trust-plugin --runs 3 -j 2 --no-publish --json <salida>.json --model <modelo fijo> --judge-model <modelo fijo> --max-cost-usd <tope> --allow-tools Read Write Edit "Bash(git *)" "Bash(node *)"
```

## Tamaño y costo

- 3 casos × 3 corridas × 2 brazos (con y sin plugin) × 2 versiones = 36 corridas de agente, más los votos del juez.
- Se pone un tope con `--max-cost-usd`; el monto lo decide Josue.
- Si se quiere bajar el costo, `--ablation none` quita el brazo sin plugin y deja 18 corridas. Se pierde el dato de cuánto aporta el plugin frente a Claude solo.

## Reglas de decisión (fijadas antes de correr)

La versión nueva se da por buena solo si:

1. **Caso 1:** encuentra el error de 403 contra 404 en al menos tantas corridas como la anterior. Si lo encuentra menos, se endurece el disparador del audit antes de seguir.
2. **Caso 2:** no da `Fail` por la decisión pendiente en ninguna corrida, y la anterior sí lo hace en al menos una. Si la anterior tampoco falla, el caso no prueba nada y se reporta así.
3. **Caso 3:** encuentra al menos 4 de los 5 errores en las 3 corridas, y más que la anterior. La contradicción semántica debe aparecer en las dos versiones; si la nueva la pierde, el script le está quitando atención a la revisión.
4. **Δ con y sin plugin:** positivo en los tres casos para la versión nueva.

Con 3 corridas solo se detectan diferencias grandes. Un empate se reporta como empate, no como mejora.

## Pasos

1. Verificar que WSL2 está instalado, con Claude Code ≥ 2.1.269 y git ≥ 2.31 dentro.
2. Generar el esqueleto con `claude plugin eval init --bare <caso>`, para usar el esquema exacto de la versión instalada y no uno supuesto.
3. Escribir los tres casos (datos, prompt y calificadores) en `compact-change-skills/evals/` y `software-design-skills/evals/`.
4. Correr primero **un caso con una corrida**, para validar los datos y los calificadores antes de gastar en el resto.
5. Correr la suite completa contra las dos versiones.
6. Escribir el resultado contra las reglas de decisión en `docs/piloto-evals-resultado.md`.

## Lo que este piloto no prueba

- Flujos de varias sesiones, como Codex implementando y Claude verificando. Cada caso es un solo prompt.
- El efecto en proyectos reales grandes: los datos son sintéticos y pequeños.
- Los defectos que escapan a lo largo de semanas. Eso solo se ve con el seguimiento en uso real.
