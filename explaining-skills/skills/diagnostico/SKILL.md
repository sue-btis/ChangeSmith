---
name: diagnostico
description: Diagnosticar con datos la operación de un cliente con el ICOS, indicadores, KPIs, metas y el uso de sus sistemas, en un expediente HTML y un archivo de fichas que usa el tablero. Úsala al definir indicadores o el ICOS, armar o rehacer un expediente o analizar el desempeño de un proceso.
---

Si el libro es la anatomía del cliente (cómo está hecho y cómo funciona), el **diagnóstico** dice qué tan sano está, dónde le duele, por qué, cuánto le cuesta y qué estudios faltan. No vuelve a explicar el negocio: enlaza al libro para los conceptos.

Falla igual que un libro: con **demasiadas cifras del mismo peso**, donde el lector no sabe cuál importa, o con **cifras sin "¿y eso qué?"**, donde ve un valor sin saber contra qué compararlo ni qué decisión cambia. Lo evitan el árbol de indicadores, el triaje y la lectura de cada ficha.

Antes de escribir, carga `explaining-skills:lenguaje`. Para el árbol, carga `explaining-skills:diagramas` (tipo cálculo). Para las gráficas, carga `dataviz`.

## Pasos

### 1. Preguntas de negocio

Parte de la estructura del tablero, si existe, o del libro del cliente. Escribe una pregunta por etapa del proceso, como la haría el dueño ("¿La planta muele todo lo que puede?"), más las preguntas globales (costo, confianza del dato).

Termina cuando cada etapa tiene su pregunta. Una cifra que no responde ninguna pregunta no entra al diagnóstico.

### 2. Árbol de indicadores

Arriba va **una cifra principal**, el [ICOS](#icos). Se descompone en factores multiplicativos, cada uno contra su máximo, hasta llegar a lo que se mide. Por ejemplo: ICOS = molienda × lixiviación × venta, y molienda = horas andando × ritmo. Al lado va la cifra de [uso de los sistemas](#uso-de-los-sistemas).

Dibújalo como diagrama de cálculo. Luego haz el **triaje** de cada indicador:

| Clase | Qué es | Dónde va |
|---|---|---|
| Principal | Responde la pregunta de su etapa; uno por etapa | Primera fila de la etapa |
| Apoyo | Explica por qué se mueve el principal (un factor del árbol) | Tarjetas debajo |
| Cuadre | Dice cuánto creerle a una cifra, sin calificar | Confianza del dato |
| Consulta | Útil para trabajar, no para decidir | Apéndice del analista |

Si dudas entre principal y apoyo, es apoyo.

### 3. Fichas

Escribe una ficha por indicador con el formato de [`references/ficha.md`](references/ficha.md) y guárdalas todas en `indicadores.json`, junto al expediente. Las mismas fichas alimentan el expediente y las tarjetas del tablero. Si cambias un indicador, lo cambias ahí.

Termina cuando cada indicador del árbol tiene ficha, y cada ficha tiene referencia, fuente y estado con evidencia.

### 4. Cálculo

Una consulta por indicador en `pipeline/sql/indicadores/`, nombrada como el `id` de su ficha, con vistas compartidas en `_base.sql`. Todas devuelven las mismas columnas: `periodo` (mes o `12m`), `planta`, `metal`, `serie`, `valor`, `valor_alto`, `n`, `descartados` y `nota`. Traen una fila por mes, una del periodo completo y una del grupo. Con ese contrato, una sola página dibuja cualquier indicador.

Cada consulta calcula también su confianza: registros descartados por reglas físicas y cuadres contra la otra fuente. Cada tabla de unidad mínima (turno, viaje, pieza) lleva su propia regla de validez.

**Revisión de cordura antes de leer.** Recorre los resultados buscando:
- valores en 0;
- proporciones imposibles, como más de 100 % de algo que no puede pasarse;
- series que cambian de escala de un mes a otro;
- niveles que no cuadran entre sí.

Cada hallazgo es un error de consulta o un hallazgo del cliente, y hay que decidir cuál antes de escribir la lectura. Valida las cifras con `data:validate-data`.

### 5. Lectura

Para cada indicador principal y de apoyo, en este orden:

1. **Valor y comparación:** contra su referencia, contra el periodo anterior y entre plantas o unidades.
2. **Qué significa:** bien, mal o no se sabe, en una frase.
3. **Por qué:** qué factor del árbol lo mueve, con su cifra.
4. **Cuánto vale:** la pérdida o la mejora, en unidades del producto y en dinero, con la cuenta visible. Si es ingreso, se dice "ingreso bruto". Lleva su condición: que haya insumo para producirlo y que el rendimiento se mantenga. También se nombran los costos que crecen con el volumen. Si se apoya en una hipótesis, dice "si se confirma".
5. **Qué sigue:** una acción o un dato por anotar, en una línea.

Ordena los hallazgos por cuánto valen en dinero. Los tres primeros van al resumen.

### 6. Contradictor

Lanza un agente `contradictor` (de este plugin) con `indicadores.json`, las consultas y los resultados. Busca los errores de la lista de [reglas](#reglas-de-indicadores) y los reporta con su evidencia. Corrige y vuelve a pasar los indicadores que fallaron, hasta que pasen.

## ICOS

El **ICOS** (Índice de Cultura Operativa) es una forma de evaluar cómo trabaja la operación de un cliente. Se lee en dos ejes, mes a mes:

- **Longitudinal:** a lo largo del proceso, de la primera etapa al cobro, para ver en qué eslabón se pierde el producto o el rastro.
- **Vertical:** el mismo ICOS en cada nivel (turno → planta → empresa → grupo), y abierto en sus etapas hasta llegar al indicador que lo mueve.

El ICOS es uno solo en todos los niveles: un índice por todo el proceso, no uno por tramo. Mide la cultura, así que **lo mal hecho y lo no anotado lo bajan**: son justo lo que tiene que enseñar. Cada eslabón entra con dos partes:

- **Lo que cuadra.** Cuando dos registros deben coincidir (lo que llega a la báscula y lo que se muele; el metal producido y el del precipitado), cuenta la cifra menor entre la mayor. Tener de más cuenta igual que tener de menos: en los dos casos hay producto que nadie explica.
- **Lo que se anotó.** La parte del flujo que quedó registrada en ese paso (kilos embarcados con su ensaye, turnos molidos con sus muestras). Un paso sin registro es producto que la operación ya no puede demostrar.

Los cuadres se miden en una ventana corta (por ejemplo, 3 meses móviles) y solo con los periodos que tienen los dos registros, porque patios, tanques y lotes pasan material de un periodo a otro; así un registro que falta se castiga una sola vez, como no anotado. Lo anotado se mide en el periodo y en proporción.

Lo que su proceso no tiene (una báscula en la mina que no existe) no entra ni castiga: es **adicional**, va a sugerencias, y la nota del ICOS lo dice ("la mina no tiene báscula y no entra").

Cuando el producto pasa por todas las etapas en serie, el ICOS del periodo de cada unidad es el producto de sus eslabones. Cada etapa con ICOS propio es un sub-índice del global.

Cuando la operación tiene varios productos (oro y plata), la cifra principal del ICOS los junta en valor a un precio fijo declarado: lo convertido entre lo posible, ambos valuados al mismo precio. El precio solo pondera los productos y no cambia en el periodo, así que no mueve el índice. Cada producto se sigue mostrando aparte, como desglose.

Al juntar periodos (12 meses) o unidades (plantas, sucursales), el ICOS es lo convertido entre lo que se podía convertir, sumado periodo a periodo y unidad a unidad, por ejemplo metal convertido entre metal posible. Nunca es el producto de los factores ya juntados: cada uno se junta con un peso distinto, y el producto infla o hunde el resultado. Los factores juntados se muestran solo como desglose.

## Uso de los sistemas

Al lado del ICOS va la cifra de **uso de los sistemas**: qué tan bien anota la gente lo que pasa. Se reparte así:

- **Si un paso del proceso quedó registrado** entra al ICOS, como "lo que se anotó" de su eslabón.
- **La forma de anotar** (retraso, campos llenos, usuarios, módulos) va al lado, nunca dentro: un registro más puntual taparía una caída de la operación.

Va un bloque por sistema del cliente, cada uno con su indicador principal. Por ejemplo: registros al día en el sistema de planta, y parte del costo que se puede ubicar en el contable. Debajo van el retraso al registrar, los campos clave llenos, los usuarios activos contra las cuentas creadas y los módulos que se usan. El desglose baja hasta cada usuario, por su clave y nunca por su nombre.

## Reglas de indicadores

- **Por lo posible, no por el dato.** Elige el indicador por lo que la operación debería medir. Si el dato no alcanza, se muestra igual, como Parcial, y dice qué falta anotar.
- **Estado de cada indicador.** Clasifica cada dato que pide un indicador, con evidencia: tablas vacías del respaldo original, columnas sin llenar, registros que se dejaron de anotar.
  - **Disponible:** se usa.
  - **Parcial:** va en su etapa, con etiqueta y lo que falta.
  - **Requiere dato:** el dato existe en sus sistemas y no se anota (columna vacía, registro que se dejó de llenar). Va a sugerencias. Si es un paso del proceso, además baja el ICOS en proporción a lo que falta anotar.
  - **Adicional:** su proceso lo hace o lo necesita, pero no se registra en ningún sistema, y sumaría al ICOS si lo anotaran. También va a sugerencias: "si anotan esto, podemos medir esto otro".
  - **Ajeno a su proceso:** no se considera.

  Si falta un dato pero hay una alternativa con datos propios (capacidad demostrada en vez de capacidad de diseño), la alternativa es la definición, no un provisional.
- **Índices objetivos.** Son cadenas multiplicativas con máximo físico, en la unidad del producto, sin pesos inventados. Un eslabón sin registro entra en proporción a lo anotado; el índice nunca se recalcula con los eslabones que quedan. Un cuadre que mide el proceso entra como eslabón (ver [ICOS](#icos)). Un cuadre que solo dice cuánto creerle a una cifra, o que compara en dinero, es compuerta de confianza.
- **Referencia siempre.** Toda cifra se compara contra algo. Si tiene máximo físico, contra él. Si no lo tiene (costos), contra su tendencia: el periodo anterior y las otras unidades. Si es malo desviarse para arriba y para abajo (un equilibrio), la referencia lo dice.
- **Metas.** La meta es la del cliente. Si no la hay, se usa una provisional con una regla defendible, marcada como provisional y documentada; un hueco se lee como trabajo sin terminar. La meta nunca sale del mismo dato que mide.
- **Sumar, no promediar.** Al subir de nivel (turno → mes → año; unidad → planta → empresa → grupo) solo se suman cantidades. Los porcentajes se recalculan con esas sumas. Al llegar al grupo se quita lo que se facturan las empresas entre ellas.
- **Unidades separadas.** Productos distintos (oro y plata, tipos de pieza) se miden por separado. Solo se juntan en dinero, a un precio fijo declarado. Un precio que cambia nunca entra a un índice de desempeño; el fijo solo pondera, como en el ICOS de la operación (ver [ICOS](#icos)).
- **Registros imposibles.** Se descartan, se cuentan y no se corrigen. Toda cifra dice cuántos registros dejó fuera. En el ICOS, un registro descartado de un paso del proceso cuenta como no anotado, una sola vez.

## Dos capas

El expediente sirve al cliente y a quien lo analiza:

- **Capa del cliente:** resumen (ICOS con su serie mensual, uso de los sistemas al lado, y tres hallazgos), una sección por etapa con la misma forma siempre, sugerencias de qué anotar y preguntas. Trae conclusiones y acciones; los conceptos enlazan al libro.
- **Capa del analista:** dentro de cada ficha, un desplegable "Cómo se calcula" con la fórmula, la consulta, la referencia y la confianza. Al final, el apéndice de método y lo que encontró el contradictor.

## Formato HTML

Un solo archivo HTML autocontenido, que lee sus cifras de `indicadores.json` y de los resultados de las consultas, incrustados al generar la página:

- índice lateral fijo con Resumen, las etapas y los bloques globales;
- en cada etapa, primera fila: el indicador principal con su referencia y su lectura; debajo, las tarjetas de apoyo con su gráfica;
- tarjeta con borde de color según el estado, una gráfica por tarjeta y "Qué sigue" en una línea;
- la fuente de cada cifra marcada (sistema del cliente o cálculo nuestro);
- una tabla con todos los indicadores (clase, estado, valor, referencia y fuente), con filtros y un enlace a cada tarjeta;
- tipografía Google Sans, cargada de Google Fonts, y fondo `#FAFAFA` en tema claro.
