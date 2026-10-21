# Evidencia del presupuesto de comentarios

Respaldo medido de las reglas que aplica `presupuesto-comentarios.mjs`. Salió de `~/.claude/CLAUDE.md` el 2026-10-20, cuando ese archivo se condensó. El resto de las cifras está en la cabecera del script.

**Por qué no se mide densidad**

- Dentro de un mismo lenguaje la varianza supera a la que hay entre lenguajes: Java promedia 25.9 % con desviación de 11.1 %.
- El propósito del proyecto pesa unas 9 veces más que el lenguaje: Java educativo llega a 57 %, aplicaciones a 6 %.
- Cerca del 59 % de las líneas de comentario en código real son licencias, TODOs y código comentado, que ninguna cifra de densidad debería juzgar.
- SonarQube publicó una regla de 25 % de densidad, la deprecó y la borró en la versión 10.0. Ningún linter de ningún lenguaje impone una densidad máxima.

**Doc con tags es contrato**

`<summary>`, `<param>` y `<response>` alimentan `schema.Description` y `parameter.Description` de OpenAPI. `@param` y `@returns` alimentan TSDoc y API Extractor. `Args:` y `Returns:` son docstrings, y `///` produce dartdoc y los doctests de rustdoc. Por eso no se tocan, sea cual sea su volumen. El sample oficial de OpenAPI de Microsoft tiene DTOs con 2.0 a 2.5 líneas de doc por línea de código, y es correcto.

**Bloques sin tag: una frase de unas 40 palabras como máximo**

- Un comentario de resumen real promedia 1.4 líneas (Pascarella, MSR 2017).
- En TypeScript publicado en npm, el percentil 75 es de 19 palabras.
- La única regla de tamaño máximo en un linter mainstream, `CommentSize` de PMD, corta en 6 líneas.

**Comentarios inline**

Medidos en 20 repos y en npm, se mantienen solos en un p90 de 2 a 4 líneas, así que no necesitan presupuesto.
