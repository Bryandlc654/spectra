const mysql = require('mysql2/promise');

const FORMAL_TEMPLATES = [
  {
    name: 'Contrato de Prestación de Servicios Profesionales',
    content: `CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES

CONTRATO DE PRESTACIÓN DE SERVICIOS PROFESIONALES NÚMERO {{contract_number}}

En la ciudad de ________________, a los ______ días del mes de ________________ de {{year}}, celebran el presente contrato de prestación de servicios profesionales (en adelante, "el Contrato") las siguientes partes:

PARTE CONTRATANTE:
{{tenant_name}}
(en adelante, "el Cliente")

PARTE CONTRATADA:
{{freelancer_name}}
(en adelante, "el Profesional")

CLÁUSULAS:

PRIMERA - OBJETO DEL CONTRATO
El Profesional se compromete a prestar los servicios profesionales descritos en el Anexo A del presente Contrato, de conformidad con los términos y condiciones aquí establecidos.

SEGUNDA - VIGENCIA
El presente Contrato tendrá vigencia a partir del {{start_date}} y hasta el {{end_date}}, salvo renovación expresa por escrito de ambas partes.

TERCERA - REMUNERACIÓN
El Cliente pagará al Profesional la suma de {{amount}} (______________________________________), por los servicios prestados según las condiciones establecidas en este Contrato.

CUARTA - FORMA DE PAGO
El pago se realizará de acuerdo con el cronograma establecido en el Anexo B, mediante transferencia bancaria u otro medio acordado por las partes.

QUINTA - CONFIDENCIALIDAD
El Profesional se compromete a mantener estricta confidencialidad sobre toda la información obtenida durante la ejecución de los servicios, tanto durante la vigencia del Contrato como después de su terminación.

SEXTA - PROPIEDAD INTELECTUAL
Todos los trabajos, resultados y materiales creados por el Profesional en virtud de este Contrato serán propiedad exclusiva del Cliente, quien tendrá todos los derechos de autor y propiedad intelectual.

SÉPTIMA - TERMINACIÓN
El Contrato podrá terminarse por mutuo acuerdo, por incumplimiento de cualquiera de las obligaciones aquí contraídas, o por cualquiera de las causales previstas en la ley aplicable.

OCTAVA - LEY APLICABLE Y JURISDICCIÓN
El presente Contrato se rige por las leyes de ________________. Para cualquier controversia derivada del mismo, las partes se someten a la jurisdicción de los tribunales competentes de ________________.

En señal de conformidad, las partes firman el presente Contrato en dos ejemplares del mismo tenor y a un solo efecto.


________________________                    ________________________
FIRMA DEL CLIENTE                          FIRMA DEL PROFESIONAL
{{tenant_name}}                           {{freelancer_name}}`
  },
  {
    name: 'Acuerdo de Confidencialidad y No Divulgación',
    content: `ACUERDO DE CONFIDENCIALIDAD Y NO DIVULGACIÓN

ACUERDO DE CONFIDENCIALIDAD Y NO DIVULGACIÓN NÚMERO {{contract_number}}

En la ciudad de ________________, a los ______ días del mes de ________________ de {{year}}, celebran el presente acuerdo (en adelante, "el Acuerdo") las siguientes partes:

PARTE REVELADORA:
{{tenant_name}}
(en adelante, "la Empresa")

PARTE RECEPTORA:
{{freelancer_name}}
(en adelante, "el Beneficiario")

CONSIDERANDO:
A. La Empresa posee información confidencial y propietaria que desea divulgar al Beneficiario para los fines descritos en este Acuerdo.
B. El Beneficiario desea recibir dicha información bajo las condiciones de confidencialidad aquí establecidas.

POR LO TANTO, las partes acuerdan:

PRIMERA - DEFINICIÓN DE INFORMACIÓN CONFIDENCIAL
Se entenderá por "Información Confidencial" toda información de carácter técnico, comercial, financiero, estratégico o de cualquier otra naturaleza, incluyendo pero no limitándose a: datos, listas, archivos, documentación, bases de datos, software, códigos fuente, algoritmos, diseños, patentes, marcas,Know-how, estrategias de negocio, información de clientes y proveedores.

SEGUNDA - OBLIGACIONES DEL BENEFICIARIO
El Beneficiario se compromete a:
a) Utilizar la Información Confidencial exclusivamente para los fines establecidos en este Acuerdo.
b) No divulgar, revelar ni poner a disposición de terceros dicha información.
c) Adoptar las medidas de seguridad necesarias para proteger la información.
d) Limitar el acceso a la información únicamente al personal que requiera conocimiento de la misma.

TERCERA - DURACIÓN
Las obligaciones de confidencialidad tendrán vigencia por un período de {{duration}} años a partir de la fecha de firma de este Acuerdo.

CUARTA - EXCEPCIONES
No se considerará Información Confidencial aquella que:
a) Sea de dominio público sin culpa del Beneficiario.
b) fuera conocida por el Beneficiario antes de recibir la información.
c) Sea desarrollada independientemente por el Beneficiario.
d) Sea requerida por disposición legal o judicial.

QUINTA - DEVOLUCIÓN DE MATERIALES
Al término de este Acuerdo, el Beneficiario deberá devolver o destruir toda la Información Confidencial recibida, incluyendo copias y resúmenes.

SEXTA - REMEDIOS
Las partes reconocen que la divulgación no autorizada de Información Confidencial causaría daños irreparables. La Empresa tendrá derecho a buscar remedios legales, incluyendo medidas cautelares.

SÉPTIMA - LEY APLICABLE
Este Acuerdo se rige por las leyes de ________________.

En señal de conformidad, las partes firman el presente Acuerdo.


________________________                    ________________________
FIRMA DE LA EMPRESA                        FIRMA DEL BENEFICIARIO
{{tenant_name}}                           {{freelancer_name}}`
  },
  {
    name: 'Contrato de Arrendamiento de Servicios',
    content: `CONTRATO DE ARRENDAMIENTO DE SERVICIOS

CONTRATO DE ARRENDAMIENTO DE SERVICIOS NÚMERO {{contract_number}}

En la ciudad de ________________, a los ______ días del mes de ________________ de {{year}}, celebran el presente contrato (en adelante, "el Contrato") las siguientes partes:

ARRENDADOR:
{{tenant_name}}
(en adelante, "el Propietario")

ARRENDATARIO:
{{freelancer_name}}
(en adelante, "el Usuario")

CLÁUSULAS:

PRIMERA - OBJETO
El Propietario pone a disposición del Usuario los servicios descritos en el Anexo I, quienes los acceptan para su uso conforme a las condiciones de este Contrato.

SEGUNDA - VIGENCIA
El presente Contrato tendrá una duración de {{duration}} meses, iniciándose el {{start_date}} y concluyendo el {{end_date}}, salvo renovación expresa.

TERCERA - CONTRAPRESTACIÓN
El Usuario pagará al Propietario la suma de {{amount}} (______________________________________), de conformidad con el calendario de pagos establecido en el Anexo II.

CUARTA - OBLIGACIONES DEL PROPIETARIO
El Propietario se compromete a:
a) Mantener los servicios en condiciones óptimas de funcionamiento.
b) Proporcionar soporte técnico según los términos acordados.
c) Garantizar la disponibilidad del servicio con un nivel mínimo del 99%.

QUINTA - OBLIGACIONES DEL USUARIO
El Usuario se compromete a:
a) Utilizar los servicios de conformidad con las especificaciones técnicas.
b) No realizar modificaciones no autorizadas.
c) Reportar cualquier incidencia o fallo en un plazo razonable.

SEXTA - PROPIEDAD
Todos los derechos de propiedad intelectual sobre los servicios permanecerán exclusivamente del Propietario.

SÉPTIMA - RESOLUCIÓN
El Contrato podrá resolverse por las causales previstas en la legislación aplicable, previo aviso escrito con un mínimo de treinta (30) días.

OCTAVA - JURISDICCIÓN
Para todos los efectos legales, las partes se someten a la jurisdicción de los tribunales de ________________.


________________________                    ________________________
FIRMA DEL PROPIETARIO                      FIRMA DEL USUARIO
{{tenant_name}}                           {{freelancer_name}}`
  }
];

async function seedFormalTemplates() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '193.203.175.226',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USERNAME || 'u560058480_spectrajul',
    password: process.env.DB_PASSWORD || 'W6c!a4En>',
    database: process.env.DB_DATABASE || 'u560058480_spectrajul',
  });

  try {
    console.log('Connected to database');

    for (const template of FORMAL_TEMPLATES) {
      const [existing] = await connection.execute(
        'SELECT id FROM contract_templates WHERE name = ?',
        [template.name]
      );

      if (existing.length > 0) {
        await connection.execute(
          'UPDATE contract_templates SET content = ? WHERE name = ?',
          [template.content, template.name]
        );
        console.log(`Updated: ${template.name}`);
      } else {
        await connection.execute(
          'INSERT INTO contract_templates (name, content, isActive, createdAt, updatedAt) VALUES (?, ?, 1, NOW(), NOW())',
          [template.name, template.content]
        );
        console.log(`Created: ${template.name}`);
      }
    }

    console.log('Formal templates seeded successfully');
  } catch (error) {
    console.error('Error seeding templates:', error);
  } finally {
    await connection.end();
  }
}

seedFormalTemplates();
