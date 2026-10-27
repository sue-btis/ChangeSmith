# Azure

Convenciones de nombres, restricciones que muerden en el despliegue y lo que suele faltar. Todo lo de aquí cambia el diagrama o la solicitud a infraestructura.

## Nombres

El patrón que se sostiene es `<abreviatura>-<sistema>-<ambiente>`. Lo importante no es el patrón exacto sino **seguir el que ya exista en la organización**, aunque no coincida con el que tú elegirías.

| Recurso | Abreviatura | Ejemplo |
|---|---|---|
| Resource group | `rg-` | `rg-sistema-prod` |
| Red virtual | `vnet-` | `vnet-sistema-prod` |
| Container app | `ca-` | `ca-sistema-api-prod` |
| Entorno de Container Apps | `cae-` | `cae-sistema-prod` |
| Static Web App | `swa-` | `swa-sistema-prod` |
| App Service | `app-` | `app-sistema-prod` |
| Servidor lógico SQL | `sql-` | `sql-sistema-prod` |
| Elastic pool | `ep-` | `ep-sistema-prod` |
| Key Vault | `kv-` | `kv-sistema-prod` |
| Application Insights | `appi-` | `appi-sistema-prod` |
| Log Analytics | `law-` | `law-sistema-prod` |

Dos recursos no admiten guiones y van todo junto en minúsculas: **Container Registry** (`acrsistemaprod`) y **cuentas de almacenamiento** (`stsistemaprod`, máximo 24 caracteres). Es una restricción de la plataforma, no una elección de estilo.

## Restricciones que muerden

### Container Apps y red virtual

La subred es dedicada y **su tamaño no se cambia después de crear el entorno**. Por eso la pregunta va antes del despliegue, no durante.

| Tipo de entorno | Subred mínima | Delegación |
|---|---|---|
| Workload profiles (el actual) | `/27` | `Microsoft.App/environments` |
| Consumption only (heredado) | `/23` | Ninguna |

Solo el entorno de workload profiles admite rutas definidas por el usuario, salida por NAT gateway, endpoints privados en el entorno y tránsito por un gateway remoto. Si hay que alcanzar una red interna, tiene que ser este.

El rango de la subred **no puede solaparse** con `169.254.0.0/16`, `172.30.0.0/16`, `172.31.0.0/16` ni `192.0.2.0/24`, que reserva Kubernetes por debajo. El entorno de workload profiles reserva además `100.100.0.0/17` y los tres bloques `/19` que siguen.

Y no puede solaparse con la red interna a la que se vaya a conectar. Confirma ese rango antes de elegir el de la red virtual.

### Static Web Apps con backend enlazado

Enlazar un backend suena cómodo y tiene restricciones que lo descartan más veces de las que parece:

- Requiere plan **Standard**.
- El prefijo de ruta tiene que ser `/api`, y el backend debe exponer ese mismo prefijo.
- **Máximo 45 segundos por petición.** Sin WebSockets.
- **No admite backends aislados en red.** El contenedor tiene que quedar con ingress público de todas formas.
- Al enlazarlo, Azure le inyecta un proveedor de identidad que **solo acepta tráfico proxeado por la Static Web App**. Cualquier cliente que llame al backend directamente recibe un rechazo.

Ese último punto es el que descarta el enlace cuando el frontend es un microfrontend montado en otra aplicación: las llamadas salen del origen del anfitrión y nunca pasan por el proxy. En ese caso, dominio propio para el backend y CORS explícito.

### Endpoints privados

Un endpoint privado sin su zona DNS privada no resuelve, y el síntoma es que el nombre sigue apuntando a la dirección pública. Cada zona necesita además estar **vinculada a la red virtual**.

| Servicio | Zona |
|---|---|
| Azure SQL | `privatelink.database.windows.net` |
| Key Vault | `privatelink.vaultcore.azure.net` |
| Blob Storage | `privatelink.blob.core.windows.net` |
| Container Registry | `privatelink.azurecr.io` |

### Orden de creación

Tres trampas que cuestan una vuelta entera:

**El Container App necesita una imagen que ya exista.** Crearlo apuntando a un registro vacío falla al no poder descargarla. El patrón habitual es crearlo con una imagen de arranque pública y que el primer pipeline la reemplace.

**El VPN Gateway tarda de 30 a 45 minutos** en aprovisionarse. Va al principio del script, no al final.

**Las asignaciones de rol tardan en propagarse.** Sin una espera entre medias, el paso siguiente falla por permisos aunque el rol ya esté asignado.

### Lo que no sale de la línea de comandos

Útil al preparar una solicitud a infraestructura, porque delimita qué depende de quién:

- **El lado local del túnel** — configurar el router o firewall de la red interna con la dirección del par y la clave compartida. Lo hace infraestructura en su equipo.
- **La conexión de servicio de Azure DevOps.** Se puede crear la mitad del lado de Azure (registro de aplicación y credencial federada), pero la conexión vive en DevOps, que es otra API.
- **Las reglas de firewall de la red interna** para permitir el puerto desde el rango de la red virtual.

## Lo que suele faltar

Revisa contra el repositorio; casi siempre falta algo de esta lista:

| Falta | Cómo se detecta | Consecuencia |
|---|---|---|
| `Dockerfile` | No está en el repo y el destino son contenedores | No hay qué desplegar |
| SDK de telemetría | Sin paquete de Application Insights ni OpenTelemetry | Solo llegan logs de plataforma |
| Endpoint de salud | Sin ruta de health | Las sondas no saben si la réplica sirve |
| Cabeceras de reenvío | Redirección a HTTPS sin procesarlas | Bucle de redirección detrás del ingress |
| Orígenes de CORS | Comodín en la política | Hay que fijarlos, y el comodín es incompatible con credenciales |

## Costo

Al proponer un ambiente que no es producción, estos tres son donde está el ahorro real:

- **VPN Gateway** es el componente caro y no conviene duplicarlo por ambiente. Lo habitual es uno en una red virtual central, con emparejamiento hacia cada ambiente.
- **Elastic pool** tiene sentido cuando muchas bases de datos con carga irregular comparten capacidad. Con dos o tres, salen más baratas individuales.
- **Log Analytics** puede compartir workspace entre ambientes, con recursos de Application Insights separados para no mezclar métricas.

## Multi-tenant con conexiones dinámicas

Patrón frecuente: las cadenas de conexión de cada tenant viven como filas en una base de datos central, no en Key Vault. Funciona, y conviene dibujarlo explícitamente porque cambia lo que Key Vault significa en el diagrama — pasa a cubrir solo el secreto de arranque, y quien lo lea no debe asumir que protege el resto.

Tiene dos consecuencias que vale la pena señalar una vez:

- **La identidad administrada no aplica** a las bases de datos por tenant, porque la cadena viene de una fila con autenticación por usuario y contraseña.
- **Dar de alta o de baja un tenant es un proceso de datos**, no de configuración. Si esas filas guardan direcciones IP literales en vez de nombres DNS, cualquier cambio de dirección obliga a actualizar filas en base de datos.
