// 1. Capturamos elementos del DOM
const form = document.querySelector('#formCredito');
const resultadoDiv = document.querySelector('#resultado');
const historialDiv = document.querySelector('#historial');

// 2. Recuperamos los clientes almacenados (si existen) en localStorage
let clientes = JSON.parse(localStorage.getItem("clientes")) || [];

// 3. Función para calcular el monto disponible
function calcularMontoDisponible(sueldo, otrosIngresos, gastos, tarjetaCredito) {
    return (sueldo + otrosIngresos) - (gastos + tarjetaCredito);
}

// 4. Función para calcular el crédito máximo
function calcularCreditoMaximo(montoDisponible, aniosCredito) {
    return montoDisponible * aniosCredito;
}

// 5. Función para simular la aprobación del crédito
// Se incorpora la data extraída de la API (por ejemplo, un factor de aprobación)
function simularCredito(cliente, apiData) {
    // Desestructuramos el objeto cliente
    const { sueldo, otrosIngresos, montoDisponibleValor, creditoMaximoValor, aniosCredito, nombreCliente } = cliente;
    const ingresoTotal = sueldo + otrosIngresos;
    
    // Ajustamos el crédito máximo con el factor obtenido de la API
    const factorAprobacion = apiData.factorAprobacion || 1;
    const creditoAjustado = creditoMaximoValor * factorAprobacion;

    if (montoDisponibleValor > 600000 && ingresoTotal > 1000000) {
        return `Cliente: ${nombreCliente} ha sido APROBADO para un crédito de ${creditoAjustado.toFixed(2)} por un plazo de ${aniosCredito} años.`;
    } else {
        return `Cliente: ${nombreCliente} NO ha sido aprobado para un crédito.`;
    }
}

// 6. Función para guardar los clientes en localStorage
function guardarClientesEnStorage() {
    localStorage.setItem("clientes", JSON.stringify(clientes));
}

// 7. Función para actualizar el historial de simulaciones en el DOM
function actualizarHistorial() {
    historialDiv.innerHTML = '';
    clientes.forEach(cliente => {
        const li = document.createElement('li');
        li.textContent = `Cliente: ${cliente.nombreCliente}, Monto Disponible: ${cliente.montoDisponibleValor}`;
        historialDiv.appendChild(li);
    });
}

// 8. Función asíncrona que simula obtener datos de una API externa
// Aquí se usa un retardo de 2 segundos para emular una llamada AJAX/fetch
function obtenerDatosAPI(cliente) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            // Simulamos la respuesta de la API:
            resolve({
                factorAprobacion: 1.1,   // Ejemplo: aumenta el crédito máximo en un 10%
                tasaInteres: 0.15,        // Podrías usar esta tasa en cálculos adicionales
                mensaje: "Datos de API simulados"
            });
            // Si fuera necesario simular un error, se podría usar:
            // reject(new Error("Error al obtener datos"));
        }, 2000);
    });
}

// 9. Manejador del evento submit del formulario
form.addEventListener('submit', function (event) {
    event.preventDefault(); // Evitamos el envío tradicional del formulario

    // 9a. Capturamos los valores ingresados en el formulario y los convertimos a número
    const nombreCliente   = document.getElementById('nombre').value;
    const sueldo          = parseFloat(document.getElementById('sueldo').value);
    const otrosIngresos   = parseFloat(document.getElementById('otrosIngresos').value);
    const gastos          = parseFloat(document.getElementById('gastos').value);
    const tarjetaCredito  = parseFloat(document.getElementById('tarjetaCredito').value);
    const aniosCredito    = parseFloat(document.getElementById('aniosCredito').value);

    // 9b. Preparamos un contenido HTML con los datos para confirmar con el usuario
    const htmlContent = `
      <p><strong>Nombre:</strong> ${nombreCliente}</p>
      <p><strong>Sueldo:</strong> ${sueldo}</p>
      <p><strong>Otros Ingresos:</strong> ${otrosIngresos}</p>
      <p><strong>Gastos:</strong> ${gastos}</p>
      <p><strong>Tarjeta de Crédito:</strong> ${tarjetaCredito}</p>
      <p><strong>Años de Crédito:</strong> ${aniosCredito}</p>
    `;
    
    // 9c. Se muestra una alerta de confirmación usando SweetAlert2
    Swal.fire({
      title: 'Confirma tus datos',
      html: htmlContent,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Sí, enviar',
      cancelButtonText: 'Cancelar'
    }).then((result) => {
      if (result.isConfirmed) {
        // 9d. Realizamos los cálculos:
        const montoDisponibleValor = calcularMontoDisponible(sueldo, otrosIngresos, gastos, tarjetaCredito);
        const creditoMaximoValor = calcularCreditoMaximo(montoDisponibleValor, aniosCredito);

        // Creamos el objeto cliente con la información y cálculos realizados
        const cliente = {
          nombreCliente,
          sueldo,
          otrosIngresos,
          gastos,
          tarjetaCredito,
          aniosCredito,
          montoDisponibleValor,
          creditoMaximoValor
        };

        // 9e. Mostramos un indicador de carga mientras se simula la llamada a la API
        Swal.fire({
          title: 'Procesando...',
          text: 'Obteniendo datos para simulacion',
          allowOutsideClick: false,
          didOpen: () => {
              Swal.showLoading();
          }
        });

        // 9f. Llamamos a la función asíncrona que simula obtener datos de la API
        obtenerDatosAPI(cliente)
          .then(apiData => {
            // Una vez obtenida la respuesta de la API, simulamos el crédito usando la data extraída
            const resultado = simularCredito(cliente, apiData);
            resultadoDiv.innerHTML = resultado;

            // Agregamos el cliente al array, actualizamos localStorage y el historial en el DOM
            clientes.push(cliente);
            guardarClientesEnStorage();
            actualizarHistorial();

            // Mostramos un mensaje de éxito al usuario
            Swal.fire({
              title: 'Enviado!',
              text: 'Tus datos han sido enviados correctamente.',
              icon: 'success'
            });

            // Reseteamos el formulario para una nueva entrada
            form.reset();
          })
          .catch(error => {
            // Si ocurre algún error en la llamada a la API, se muestra un mensaje de error
            Swal.fire({
              title: 'Error',
              text: 'Hubo un problema al obtener datos de la API.',
              icon: 'error'
            });
          });
      }
    });
});

// 10. Al cargar la página, actualizamos el historial de simulaciones
document.addEventListener('DOMContentLoaded', actualizarHistorial);
