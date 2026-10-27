# Estimación de costos

Solo cuando el diagrama va a servir para pedir presupuesto. Si es documentación técnica, sáltate esta fase — mete cifras y la conversación se vuelve sobre ellas.

## Estimar después de los hallazgos, nunca antes

Es el error más caro de esta fase, y no es de aritmética.

Una estimación se construye sobre premisas de arquitectura: cuántas réplicas, cuántas bases de datos, qué se comparte. Si la haces sobre la arquitectura que te describieron en vez de sobre la que encontraste en el código, sale una tabla convincente y equivocada — y peor, sale una promesa. Un nivel "escalable" con varias réplicas para un servicio que guarda estado en memoria no es un costo mal calculado: es una capacidad que no existe, vendida.

Deriva siempre de la arquitectura ya corregida. Si un hallazgo cambia una premisa, dilo junto a la cifra: *"este nivel supone sacar el estado de sesión a Redis, que es trabajo de código aparte"*.

## Los rubros

No busques precios de memoria — cambian. Identifica **qué mueve cada rubro** y consulta las cifras vigentes en la calculadora de precios de Azure o en la página del servicio.

| Rubro | Qué mueve el costo | Notas |
|---|---|---|
| **Cómputo** (Container Apps, App Service) | Réplicas × (vCPU, memoria) × horas | Suele ser el rubro mayor junto con la base de datos. Consumo escala a cero; dedicado no |
| **Base de datos** | Nivel + vCores + almacenamiento + retención de respaldos | El segundo rubro grande. Muchas bases pequeñas cuestan distinto que una grande |
| **Hosting estático** | Plan (gratuito o estándar) | Prácticamente fijo y bajo |
| **Registro de contenedores** | Nivel + almacenamiento + replicación geográfica | Bajo salvo que repliques entre regiones |
| **Almacenamiento** | GB guardados + transacciones + salida de datos | Las transacciones sorprenden en cargas con muchos archivos chicos |
| **Observabilidad** | **GB ingeridos por día** × retención | El que más se subestima. Ver abajo |
| **Red** | Gateway VPN por hora · endpoints privados por hora y por endpoint · salida de datos | Ver abajo |
| **Key Vault** | Operaciones | Casi siempre despreciable |
| **DevOps** | Trabajos en paralelo + usuarios | Bajo en equipos chicos |

## Los que se olvidan

**Log Analytics se cobra por ingesta, no por almacenar.** Con registro verboso, la telemetría puede costar más que el cómputo que la produce. Estima los GB por día y ponlos explícitos: es el rubro donde una decisión de configuración —bajar el nivel de log— produce el mayor ahorro por el menor esfuerzo.

**Los endpoints privados se cobran por endpoint y por hora**, más los datos procesados. Cuatro servicios detrás de endpoint privado son cuatro cargos, no uno.

**El gateway VPN es tarifa plana** y corre haya o no tráfico. En un despliegue chico es frecuentemente la línea más grande de toda la tabla, y es la que justifica compartir un gateway central entre ambientes en vez de uno por ambiente.

**La salida de datos** hacia internet se cobra por GB. Importa si el sistema sirve archivos o imágenes a los usuarios.

**Las bases por tenant multiplican.** N bases significan N veces el almacenamiento mínimo y, según el motor, N cargos base. Aquí es donde una agrupación de recursos compartidos cambia por completo la aritmética — y también donde deja de convenir si son pocas.

## Cómo presentar

**Tres niveles anclados a algo real.** No "chico, mediano, grande" sino el número que el negocio reconoce: usuarios concurrentes, tenants, sitios, dispositivos. Que quien aprueba pueda ubicarse solo.

**Rangos, no cifras puntuales.** Un rango comunica honestamente la incertidumbre; un número exacto invita a tratarlo como cotización.

**Fecha y etiqueta de estimado.** Los precios cambian y varían por región y por descuentos del contrato.

**Di qué no incluye.** Licencias, plan de soporte, transferencia entre regiones, y sobre todo el **trabajo de desarrollo** que exija cualquier premisa que hayas marcado.

**Marca el nivel actual.** Si ya hay algo desplegado, señala en qué nivel está hoy: convierte la tabla de una lista de opciones en una ruta.

Formato que funciona, una fila por rubro:

```
Nivel          | Servicio        | SKU sugerido            | USD/mes
Producción     | Container Apps  | 1 réplica · 1 vCPU/2 GB | 40 – 80
inicial        | MySQL Flexible  | B2s + 64 GB             | 50 – 80
50–300         | Log Analytics   | ~3 GB/día · 30 días     | 20 – 40
usuarios       | ...
               | TOTAL                                     | 140 – 250
```

## Antes de entregar la tabla

- Cada premisa de arquitectura que sostiene un nivel está dicha en voz alta.
- Ningún nivel promete capacidad que el código no puede dar hoy.
- Los rubros olvidados —ingesta de logs, endpoints privados, gateway, salida de datos— están o están explícitamente excluidos.
- Está fechada y marcada como estimación.
- Para cifras que van a aprobación, remite a la calculadora de precios de Azure con los SKUs que propusiste.
