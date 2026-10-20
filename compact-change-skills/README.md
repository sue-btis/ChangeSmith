# Compact Change Skills

Plugin proporcional para preparar, especificar, planear, implementar y verificar cambios de software desde correcciones pequeñas hasta cambios grandes pero acotables.

Compatible con **OpenAI Codex** y **Claude Code**. Los `SKILL.md` están en inglés para maximizar portabilidad entre agentes y runtimes; los artefactos pueden escribirse en el idioma del usuario.

Funciona por sí solo, en cualquier repositorio. Cuando el repositorio tiene un paquete de diseño de `software-design-skills`, además lo respeta.

## Qué cambia en 2.3.1

- **Consumidores con LSP.** La entrada y los consumidores de un contrato se buscan con `findReferences` o `incomingCalls` del LSP cuando hay servidor para ese lenguaje. Si la primera respuesta trae solo la declaración, se reintenta. Sin servidor (SQL, shell) se usa grep, y se anota como tal. Para C#, TypeScript y Python hacen falta sus plugins de LSP instalados.

## Qué cambia en 2.3

- **Las pruebas no se aflojan en silencio.** Borrar, saltar o debilitar una prueba existente exige una decisión en la spec. Si no la hay, es un defecto.
- **Cada spec dice cómo se demuestra que funciona** (`Done when`), de punta a punta.
- **Esfuerzo por etapa.** `medium` por defecto; `high` solo para `critical`, concurrencia, migración o la ronda después de un `Fail`.
- **Tope de tres rondas de corrección.** Después se replantea el enfoque en vez de seguir parchando.
- **Hallazgos `pre-existing`.** Un defecto que ya estaba no bloquea el `Pass` ni se le carga al cambio.
- **Hooks dentro del plugin** (solo Claude Code):
  - `hooks/presupuesto-comentarios.mjs` revisa el presupuesto de comentarios al editar;
  - `hooks/git-guard.mjs` aplica la convención de ramas. No se commitea en `main`, `master` ni `development`. A `main` solo entra merge desde `development`. Las ramas se llaman `<feat|fix|docs|refactor|chore|test>/<descripcion>/<Nombre>`. Antes de cualquier otro commit o push pide confirmación.

  Pruebas: `node --test hooks/*.test.mjs`. Al instalar esta versión, quita de `~/.claude/settings.json` la entrada propia del hook de comentarios para que no corra dos veces. En Codex los hooks no aplican y sus reglas quedan como texto en las skills.

## Qué cambia en 2.2

- **El tamaño ya no decide los documentos.** `quick`, `medium` y `large` eligen la plantilla de la spec. Cada documento opcional tiene su propio disparador.
- **`large` es solo trabajo en paralelo o por etapas.** Exige al menos dos criterios estructurales, y el plan registra uno de ellos.
- **El veredicto técnico va separado de la aceptación del usuario.** Desaparece `Pass with accepted limitations`, y cada hallazgo es un defecto o una decisión.
- **El ciclo de corrección está definido.** Las rondas se registran en `execution.md` y las pasadas de seguimiento van en el mismo `verification.md`, con una regla clara de cierre.
- **El estado vigente vive en un encabezado fijo de `verification.md`**, y un solo comando muestra el de todo el repositorio.
- **Coberturas y mutación son referencia** salvo que el repositorio tenga la herramienta. La mutación manual tiene protocolo.
- **Otros ajustes:** autoverificación acotada, sección "Other Repositories", cambio padre para enmiendas, IDs locales a la carpeta, línea base sin git y comprobación de que un milestone de diseño esté completo antes de implementarlo.

## Flujo

```text
shaping-change ── tamaño, confiabilidad y disparadores
   │
   ├─ [auditing-change]      siempre en strict y critical; en lean si falta un hecho de evidencia
   ├─ writing-change-spec    siempre
   ├─ [writing-change-plan]  si hay escritores en paralelo o migración por etapas
   ├─ implementing-change    siempre; execution.md si hay relevo
   └─ verifying-change       siempre
         ├─ Fail o Blocked → ronda de corrección → pasada de seguimiento
         └─ Pass → aceptación del usuario → cerrado

escalate → detener y reportar por qué el cambio no puede acotarse con seguridad
```

El commit queda fuera del flujo: lo decide y lo hace el usuario.

## Clasificación

Tamaño, documentos y confiabilidad son decisiones independientes. El detalle está en `skills/shaping-change/references/change-sizing.md`.

### Tamaño

- `quick`: una conducta observable, una zona, sin cambio de contrato, migración o frontera de confianza; un escritor en una sentada.
- `medium`: todo cambio acotado que no es quick ni large. Un cambio amplio con un solo escritor en secuencia es medium.
- `large`: al menos dos criterios estructurales: varios escritores al mismo tiempo, contrato congelado antes del trabajo en paralelo, o migración o despliegue por etapas.
- `escalate`: el trabajo no puede acotarse de forma segura por evidencia, ownership, repositorio, decisiones o riesgo.

### Documentos

| Documento | Cuándo se crea |
|---|---|
| `spec.md` | Siempre |
| `verification.md` | Siempre |
| `audit.md` | Siempre en `strict` y `critical`. En `lean`, solo si el shaping no puede establecer con evidencia el punto de entrada, las pruebas que lo cubren o los consumidores de cada contrato que cambia |
| `plan.md` | Si hay varios escritores al mismo tiempo, o una migración o despliegue ordenado entre sesiones |
| `execution.md` | Si hay relevo: verifica otra herramienta u otra sesión, la implementación sigue en otra sesión, o las olas pasan su trabajo a un integrador |

### Confiabilidad

- `lean`: bajo riesgo.
- `strict`: contratos compartidos, regresiones relevantes o lógica de negocio no trivial.
- `critical`: autorización, dinero, datos sensibles, operaciones destructivas, concurrencia o invariantes críticas.

Un cambio puede ser `quick + critical` o `large + strict`.

## Carpeta del cambio

Si el repositorio ya tiene una convención, se sigue. En repositorios nuevos:

```text
docs/changes/YYYY-MM-DD-<slug>/          cambio suelto
docs/changes/YYYY-MM-DD-Mxx-<slug>/      milestone de un plan de diseño
```

- Una enmienda a un cambio ya implementado es una carpeta nueva cuya spec nombra a la anterior como `Parent:`.
- Los IDs son locales a la carpeta y se citan como `<carpeta>#AC-1`.
- No se generan copias separadas de draft, review, freeze o sanity check. La revisión endurece el mismo `spec.md`; el preflight y las rondas actualizan el mismo `execution.md`.

## Estado del cambio

El estado vigente vive en las primeras líneas de `verification.md`:

```text
Verdict: Pass | Fail | Blocked
Acceptance: Pending — <qué espera> | Accepted — <quién>, <fecha>, «cita textual»
Verified by: <otra sesión o agente> | Self-verification (<motivo>)
Open limitations: L-1, L-2 | None
```

El estado de todos los cambios del repositorio:

```bash
grep -H -m4 -E '^(Verdict|Acceptance|Verified by|Open limitations):' docs/changes/*/verification.md
```

Si el repositorio usa otra carpeta para sus cambios, se cambia `docs/changes` en el comando. Cada worktree muestra el estado de su propia rama. Las carpetas verificadas antes de 2.2 tienen otro formato; el comando para leerlas está en `skills/verifying-change/references/verification-template.md`.

Un cambio está cerrado cuando el veredicto es `Pass`, todos los hallazgos están corregidos o aceptados, y la aceptación está registrada. La aceptación solo la escribe la sesión donde el usuario la dio, con su cita textual.

## Integración con software-design-skills

Si el repositorio contiene un manifiesto de diseño canónico (por defecto `docs/spec/manifest.yaml`, o una ruta equivalente descubierta por inspección), trátalo como un índice de autoridades, no como una copia de contenido.

Para cambios brownfield:

```text
manifest -> canonical sources -> audit/spec -> plan -> implement -> verify
```

El `spec.md` declara qué fuentes canónicas son afectadas y si deben actualizarse. El cierre exige que código y fuentes canónicas aplicables vuelvan a estar alineados. La implementación actualiza esas fuentes; la verificación las revisa y nunca edita el manifest.

Para la construcción inicial de un sistema diseñado con `software-design-skills`, se puede invocar directamente `implementing-change` sobre **un solo build slice aprobado** y después `verifying-change`. El preflight comprueba antes que el slice esté completo: sin decisiones abiertas y con contratos, composiciones de UI y criterios de aceptación aprobados. Si falta algo, el trabajo pasa a `writing-change-spec` para congelarlo.

## Autoridad de contexto

Cada fase debe consumir el paquete mínimo necesario.

| Momento | Fuente autoritativa |
|---|---|
| Antes de auditar | solicitud + resultado de `shaping-change` |
| Después de auditar | `audit.md` para hechos del repositorio |
| Antes de implementar | `spec.md` para comportamiento y contratos |
| Durante ejecución planificada | `spec.md` + `plan.md` |
| Antes de declarar terminado | diff real + `spec.md` + evidencia reproducible |
| Estado vigente del cambio | encabezado de `verification.md` |

No pases historiales completos a agentes de implementación. Para un workstream, usa únicamente el spec congelado, la sección relevante del plan y los paths permitidos.

## Skills

- `shaping-change`: inspección inicial, clasificación de tamaño y confiabilidad, disparadores de documentos y auditoría de decisiones.
- `auditing-change`: auditoría read-only persistente, siempre en `strict` y `critical` y en `lean` cuando falta algún hecho de evidencia, con baseline, behavior trace, contratos, consumidores, comandos, ownership candidato y hotspots.
- `writing-change-spec`: especificación proporcional con hechos de evidencia, IDs estables, proveniencia, contratos congelados y self-review antes de marcarla aprobada.
- `writing-change-plan`: plan cuando hay escritores en paralelo o migración por etapas. Para large añade dependencias, Gate 0 opcional, topology, write-set ownership, waves, integration gates y fallback secuencial.
- `implementing-change`: preflight contra el repositorio actual, ejecución controlada por workstream/wave, límites de escritura, pruebas, rondas de corrección y registro de evidencia.
- `verifying-change`: verificación independiente basada en el diff real y la trazabilidad del spec, con hallazgos tipificados, veredicto técnico, aceptación del usuario y pasadas de seguimiento.

## Invocación sugerida

### Claude Code

```text
/shape-software-change
/audit-software-change
/write-change-spec
/write-change-plan
/implement-software-change
/verify-software-change
```

Forma canónica:

```text
/compact-change-skills:shaping-change
/compact-change-skills:auditing-change
/compact-change-skills:writing-change-spec
/compact-change-skills:writing-change-plan
/compact-change-skills:implementing-change
/compact-change-skills:verifying-change
```

### OpenAI Codex

```text
Use $shaping-change for this request. Inspect the repository and choose the smallest safe workflow.
```

Para un cambio con auditoría y plan ya decididos:

```text
Use $auditing-change, then $writing-change-spec and $writing-change-plan. Keep the implementation context bounded to the frozen spec and the assigned workstream.
```

Para ejecutar:

```text
Use $implementing-change. Run the preflight first and stop if the plan is stale or the write set overlaps unrelated work.
```

Para cierre:

```text
Use $verifying-change in independent audit mode. Inspect the declared diff range and verify every applicable requirement and acceptance criterion.
```

## Principios

- No hacer grande un cambio pequeño.
- No hacer pequeño un cambio grande.
- Cada documento se gana su lugar con su disparador, no con el tamaño.
- Preguntar solo por decisiones que cambian corrección, alcance, contrato, seguridad, rollout o testabilidad.
- Resolver por inspección todo lo que el repositorio pueda responder.
- Recomendaciones no equivalen a aprobaciones.
- No permitir que un agente de implementación invente arquitectura o contratos.
- Ningún writer escribe fuera de su write set.
- Generated files, migrations, project files y lockfiles siempre tienen owner explícito cuando pueden cambiar.
- El integration owner revisa el diff real y corre checks combinados.
- No declarar `Pass` usando únicamente el reporte del agente que implementó.
- Un veredicto dice si hay defectos; la aceptación dice qué aceptó el usuario.
