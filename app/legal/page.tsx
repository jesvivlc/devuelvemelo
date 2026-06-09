import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Aviso legal, privacidad y términos — Devuélvemelo",
};

export default function LegalPage() {
  const email = "hola@devuelvemelo.app";
  const lastUpdated = "9 de junio de 2026";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 space-y-10 text-sm text-gray-700">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-gray-400 hover:text-gray-600"
      >
        ← Volver
      </Link>

      <header>
        <h1 className="text-2xl font-bold text-gray-900">Aviso legal, privacidad y términos de uso</h1>
        <p className="mt-2 text-gray-400">Última actualización: {lastUpdated}</p>
      </header>

      {/* AVISO LEGAL */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">1. Aviso legal e identificación del responsable</h2>
        <p>
          Devuélvemelo es un servicio operado a título personal. El responsable del servicio puede
          ser contactado en: <a href={`mailto:${email}`} className="text-indigo-600 underline">{email}</a>.
        </p>
        <p>
          El acceso y uso de esta aplicación implica la aceptación plena de los presentes términos.
          Si no estás de acuerdo con alguno de ellos, debes abstenerte de usar el servicio.
        </p>
      </section>

      {/* OBJETO DEL SERVICIO */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">2. Objeto del servicio</h2>
        <p>
          Devuélvemelo es una herramienta de gestión personal que permite al usuario registrar
          préstamos de objetos y deudas económicas, y generar borradores de mensajes de
          reclamación mediante inteligencia artificial.
        </p>
        <p>
          <strong>La aplicación no envía mensajes por sí misma.</strong> Los mensajes generados son
          borradores que el usuario puede revisar, editar y enviar voluntariamente a través de sus
          propias aplicaciones de mensajería (WhatsApp, SMS, correo electrónico, etc.). El usuario
          es el único emisor legal de dichos mensajes y asume plena responsabilidad por su
          contenido y envío.
        </p>
      </section>

      {/* PRIVACIDAD Y DATOS PERSONALES */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">3. Política de privacidad y protección de datos</h2>

        <h3 className="font-medium text-gray-800">3.1 Responsable del tratamiento</h3>
        <p>El responsable del tratamiento de datos es el operador del servicio, contactable en {email}.</p>

        <h3 className="font-medium text-gray-800">3.2 Datos que tratamos</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          <li><strong>Datos de cuenta:</strong> dirección de correo electrónico, usada para autenticación mediante magic link.</li>
          <li><strong>Datos de préstamos:</strong> título, descripción, importe, fechas, fotografías del objeto prestado (opcionales).</li>
          <li><strong>Datos de contactos:</strong> nombre, relación, teléfono y correo electrónico de las personas a las que el usuario ha prestado algo. Estos datos los introduce el propio usuario y hacen referencia a terceros que no son usuarios de la app.</li>
          <li><strong>Datos de uso:</strong> eventos anónimos de interacción (préstamos creados, recordatorios generados, etc.) para mejorar el servicio.</li>
        </ul>

        <h3 className="font-medium text-gray-800">3.3 Finalidad y base legal</h3>
        <p>
          Los datos se tratan para prestar el servicio solicitado por el usuario (base legal:
          ejecución de contrato / interés legítimo). Los datos de uso anónimos se tratan para
          mejorar el servicio (base legal: interés legítimo).
        </p>

        <h3 className="font-medium text-gray-800">3.4 Datos de terceros (deudores)</h3>
        <p>
          El usuario introduce voluntariamente datos de contacto de terceros (nombre, teléfono,
          email). El usuario es responsable de contar con base legal suficiente para tratar esos
          datos y de no introducir información excesiva o innecesaria. Devuélvemelo actúa como
          encargado del tratamiento de esos datos en nombre del usuario.
        </p>
        <p>
          Los datos de terceros <strong>no son accesibles por otros usuarios</strong> ni se usan
          para ningún fin distinto al de prestar el servicio al usuario que los introdujo.
        </p>

        <h3 className="font-medium text-gray-800">3.5 Inteligencia artificial</h3>
        <p>
          Los mensajes de reclamación se generan mediante la API de Anthropic (Claude). Para ello,
          se envía a Anthropic información sobre el préstamo (título, importe, días de retraso,
          relación con el deudor) pero <strong>nunca el nombre real ni el teléfono del deudor</strong>.
          Anthropic procesa los datos conforme a su{" "}
          <a
            href="https://www.anthropic.com/legal/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 underline"
          >
            política de privacidad
          </a>
          .
        </p>

        <h3 className="font-medium text-gray-800">3.6 Conservación de datos</h3>
        <p>
          Los datos se conservan mientras el usuario mantenga su cuenta activa. El usuario puede
          solicitar la eliminación de su cuenta y todos sus datos en cualquier momento escribiendo
          a {email}.
        </p>

        <h3 className="font-medium text-gray-800">3.7 Derechos del usuario</h3>
        <p>
          El usuario puede ejercer sus derechos de acceso, rectificación, supresión, oposición y
          portabilidad escribiendo a{" "}
          <a href={`mailto:${email}`} className="text-indigo-600 underline">{email}</a>.
          Si no obtiene respuesta satisfactoria, puede reclamar ante la{" "}
          <a
            href="https://www.aepd.es"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 underline"
          >
            Agencia Española de Protección de Datos (AEPD)
          </a>
          .
        </p>

        <h3 className="font-medium text-gray-800">3.8 Proveedores de infraestructura</h3>
        <p>Los datos se almacenan en los servidores de los siguientes proveedores:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          <li><strong>Supabase</strong> (base de datos, autenticación, almacenamiento de fotos) — UE/EEA.</li>
          <li><strong>Vercel</strong> (hosting y funciones serverless) — UE/EEA o EE.UU. con garantías adecuadas.</li>
          <li><strong>Anthropic</strong> (generación de texto por IA) — EE.UU., con cero retención de datos de producción.</li>
        </ul>
      </section>

      {/* TÉRMINOS DE USO */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">4. Términos de uso</h2>

        <h3 className="font-medium text-gray-800">4.1 Uso aceptable</h3>
        <p>El usuario se compromete a:</p>
        <ul className="list-disc list-inside space-y-1 text-gray-600">
          <li>Usar el servicio únicamente para gestionar sus propios préstamos reales.</li>
          <li>No introducir datos falsos, ofensivos o que vulneren derechos de terceros.</li>
          <li>No usar los mensajes generados para acosar, amenazar o extorsionar a nadie.</li>
          <li>No intentar acceder a datos de otros usuarios ni vulnerar la seguridad del sistema.</li>
        </ul>

        <h3 className="font-medium text-gray-800">4.2 Limitación de responsabilidad</h3>
        <p>
          Devuélvemelo proporciona los mensajes generados por IA como sugerencias sin valor legal.
          El operador no se hace responsable de las consecuencias derivadas del envío de dichos
          mensajes por parte del usuario, ni de la exactitud de los textos generados.
        </p>
        <p>
          El servicio se presta "tal cual" y sin garantías de disponibilidad ininterrumpida.
        </p>

        <h3 className="font-medium text-gray-800">4.3 Modificaciones</h3>
        <p>
          El operador puede modificar estos términos en cualquier momento. Los cambios relevantes
          se notificarán por correo electrónico o mediante aviso en la aplicación. El uso
          continuado del servicio tras la notificación implica la aceptación de los nuevos términos.
        </p>

        <h3 className="font-medium text-gray-800">4.4 Ley aplicable</h3>
        <p>
          Estos términos se rigen por la legislación española. Para cualquier controversia, las
          partes se someten a los juzgados y tribunales competentes conforme a la normativa
          vigente.
        </p>
      </section>

      {/* COOKIES */}
      <section className="space-y-3">
        <h2 className="text-base font-semibold text-gray-900">5. Cookies</h2>
        <p>
          Devuélvemelo usa exclusivamente cookies técnicas necesarias para el funcionamiento del
          servicio (gestión de sesión, preferencias de onboarding). No se usan cookies de
          seguimiento ni de publicidad. No es necesario un banner de consentimiento de cookies
          para estas cookies estrictamente necesarias.
        </p>
      </section>

      <footer className="border-t pt-6 text-gray-400">
        <p>
          Contacto:{" "}
          <a href={`mailto:${email}`} className="text-indigo-500 underline">
            {email}
          </a>
        </p>
      </footer>
    </div>
  );
}
