const form = document.querySelector('#formCredito');
    const resultadoDiv = document.querySelector('#resultado');
    const historialDiv = document.querySelector('#historial');
    const vaciarHistorialBtn = document.querySelector('#vaciarHistorial');
    const resumenDiv = document.querySelector('#resumen');

    // Recuperamos los clientes del localStorage (si existen)
    let clientes = JSON.parse(localStorage.getItem("clientes")) || [];

    // Funciones de cálculo
    function calcularMontoDisponible(sueldo, otrosIngresos, gastos, tarjetaCredito) {
      return (sueldo + otrosIngresos) - (gastos + tarjetaCredito);
    }
    function calcularCreditoMaximo(montoDisponible, aniosCredito) {
      return montoDisponible * aniosCredito;
    }
    // Función para simular la aprobación del crédito
    function simularCredito(cliente, apiData) {
      const { sueldo, otrosIngresos, montoDisponibleValor, creditoMaximoValor, aniosCredito, nombreCliente } = cliente;
      const ingresoTotal = sueldo + otrosIngresos;
      const factorAprobacion = apiData.factorAprobacion || 1;
      const creditoAjustado = creditoMaximoValor * factorAprobacion;
      if (montoDisponibleValor > 600000 && ingresoTotal > 1000000) {
        return `Cliente: ${nombreCliente} ha sido APROBADO para un crédito de ${creditoAjustado.toFixed(2)} por un plazo de ${aniosCredito} años.`;
      } else {
        return `Cliente: ${nombreCliente} NO ha sido aprobado para un crédito.`;
      }
    }

    // Función para guardar clientes en localStorage
    function guardarClientesEnStorage() {
      localStorage.setItem("clientes", JSON.stringify(clientes));
    }

    // Función para actualizar el historial y el resumen en el DOM
    function actualizarHistorial() {
      historialDiv.innerHTML = '';
      clientes.forEach((cliente, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span>Cliente: ${cliente.nombreCliente}, Monto Disponible: ${cliente.montoDisponibleValor}</span>
          <div class="botones">
            <button onclick="editarCliente(${index})">Editar</button>
            <button onclick="eliminarCliente(${index})">Eliminar</button>
          </div>
        `;
        historialDiv.appendChild(li);
      });
      actualizarResumen();
    }
    
    function actualizarResumen() {
      let totalSimulaciones = clientes.length;
      let aprobados = clientes.filter(c => c.aprobado).length;
      let noAprobados = totalSimulaciones - aprobados;
      let totalCreditoAprobado = clientes.reduce((acum, c) => acum + (c.aprobado ? c.creditoAjustado : 0), 0);
      resumenDiv.innerHTML = `
        <p>Total Simulaciones: ${totalSimulaciones}</p>
        <p>Aprobados: ${aprobados}</p>
        <p>No Aprobados: ${noAprobados}</p>
        <p>Total Crédito Aprobado: ${totalCreditoAprobado.toFixed(2)}</p>
      `;
    }

    // Función asíncrona que simula obtener datos de una API externa
    function obtenerDatosAPI(cliente) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve({
            factorAprobacion: 1.1,
            tasaInteres: 0.15,
            mensaje: "Datos de API simulados"
          });
        }, 2000);
      });
    }

    // Manejo del evento submit del formulario
    form.addEventListener('submit', function (event) {
      event.preventDefault(); // Prevenir el envío tradicional

      // Capturamos y convertimos los valores ingresados
      const nombreCliente   = document.getElementById('nombre').value;
      const sueldo          = parseFloat(document.getElementById('sueldo').value);
      const otrosIngresos   = parseFloat(document.getElementById('otrosIngresos').value);
      const gastos          = parseFloat(document.getElementById('gastos').value);
      const tarjetaCredito  = parseFloat(document.getElementById('tarjetaCredito').value);
      const aniosCredito    = parseFloat(document.getElementById('aniosCredito').value);
      
      // Preparamos el contenido HTML para confirmar los datos
      const htmlContent = `
        <p><strong>Nombre:</strong> ${nombreCliente}</p>
        <p><strong>Sueldo:</strong> ${sueldo}</p>
        <p><strong>Otros Ingresos:</strong> ${otrosIngresos}</p>
        <p><strong>Gastos:</strong> ${gastos}</p>
        <p><strong>Tarjeta de Crédito:</strong> ${tarjetaCredito}</p>
        <p><strong>Años de Crédito:</strong> ${aniosCredito}</p>
      `;
      
      Swal.fire({
        title: 'Confirma tus datos',
        html: htmlContent,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, enviar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          const montoDisponibleValor = calcularMontoDisponible(sueldo, otrosIngresos, gastos, tarjetaCredito);
          const creditoMaximoValor = calcularCreditoMaximo(montoDisponibleValor, aniosCredito);
          
          // Creamos el objeto cliente
          let cliente = {
            nombreCliente,
            sueldo,
            otrosIngresos,
            gastos,
            tarjetaCredito,
            aniosCredito,
            montoDisponibleValor,
            creditoMaximoValor
          };
          
          // Indicador de carga mientras se simula la llamada a la API
          Swal.fire({
            title: 'Procesando...',
            text: 'Obteniendo datos de la API...',
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });
          
          // Llamamos a la función asíncrona para obtener datos de la API
          obtenerDatosAPI(cliente)
            .then(apiData => {
              const aprobado = (montoDisponibleValor > 600000 && (sueldo + otrosIngresos) > 1000000);
              cliente.aprobado = aprobado;
              cliente.creditoAjustado = aprobado ? creditoMaximoValor * apiData.factorAprobacion : 0;
              
              const resultado = simularCredito(cliente, apiData);
              resultadoDiv.innerHTML = resultado;
              
              // Agregamos el cliente al historial y actualizamos el almacenamiento y la vista
              clientes.push(cliente);
              guardarClientesEnStorage();
              actualizarHistorial();
              
              Swal.fire({
                title: 'Enviado!',
                text: 'Tus datos han sido enviados correctamente.',
                icon: 'success'
              });
              form.reset();
            })
            .catch(error => {
              Swal.fire({
                title: 'Error',
                text: 'Hubo un problema al obtener datos de la API.',
                icon: 'error'
              });
            });
        }
      });
    });

    // Función global para editar un cliente (invocada desde onclick)
    window.editarCliente = function(index) {
      const cliente = clientes[index];
      Swal.fire({
        title: 'Editar Cliente',
        html: `
          <input id="swal-input1" class="swal2-input" placeholder="Nombre" value="${cliente.nombreCliente}">
          <input id="swal-input2" type="number" class="swal2-input" placeholder="Sueldo" value="${cliente.sueldo}">
          <input id="swal-input3" type="number" class="swal2-input" placeholder="Otros Ingresos" value="${cliente.otrosIngresos}">
          <input id="swal-input4" type="number" class="swal2-input" placeholder="Gastos" value="${cliente.gastos}">
          <input id="swal-input5" type="number" class="swal2-input" placeholder="Tarjeta de Crédito" value="${cliente.tarjetaCredito}">
          <input id="swal-input6" type="number" class="swal2-input" placeholder="Años de Crédito" value="${cliente.aniosCredito}">
        `,
        focusConfirm: false,
        preConfirm: () => {
          return {
            nombreCliente: document.getElementById('swal-input1').value,
            sueldo: parseFloat(document.getElementById('swal-input2').value),
            otrosIngresos: parseFloat(document.getElementById('swal-input3').value),
            gastos: parseFloat(document.getElementById('swal-input4').value),
            tarjetaCredito: parseFloat(document.getElementById('swal-input5').value),
            aniosCredito: parseFloat(document.getElementById('swal-input6').value)
          };
        }
      }).then((result) => {
        if (result.isConfirmed) {
          const nuevosDatos = result.value;
          nuevosDatos.montoDisponibleValor = calcularMontoDisponible(nuevosDatos.sueldo, nuevosDatos.otrosIngresos, nuevosDatos.gastos, nuevosDatos.tarjetaCredito);
          nuevosDatos.creditoMaximoValor = calcularCreditoMaximo(nuevosDatos.montoDisponibleValor, nuevosDatos.aniosCredito);
          const aprobado = (nuevosDatos.montoDisponibleValor > 600000 && (nuevosDatos.sueldo + nuevosDatos.otrosIngresos) > 1000000);
          nuevosDatos.aprobado = aprobado;
          nuevosDatos.creditoAjustado = aprobado ? nuevosDatos.creditoMaximoValor * 1.1 : 0;
          
          // Actualizamos el registro del cliente
          clientes[index] = { ...clientes[index], ...nuevosDatos };
          guardarClientesEnStorage();
          actualizarHistorial();
          Swal.fire({
            title: 'Actualizado!',
            text: 'El cliente ha sido actualizado correctamente.',
            icon: 'success'
          });
        }
      });
    };

    // Función global para eliminar un cliente
    window.eliminarCliente = function(index) {
      Swal.fire({
        title: '¿Estás seguro?',
        text: "Esta acción eliminará el registro permanentemente.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          clientes.splice(index, 1);
          guardarClientesEnStorage();
          actualizarHistorial();
          Swal.fire({
            title: 'Eliminado!',
            text: 'El registro ha sido eliminado.',
            icon: 'success'
          });
        }
      });
    };

    // Vaciar todo el historial
    vaciarHistorialBtn.addEventListener('click', () => {
      Swal.fire({
        title: '¿Vaciar historial?',
        text: "Esta acción eliminará todas las simulaciones.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, vaciar',
        cancelButtonText: 'Cancelar'
      }).then((result) => {
        if (result.isConfirmed) {
          clientes = [];
          guardarClientesEnStorage();
          actualizarHistorial();
          Swal.fire({
            title: 'Historial vaciado',
            text: 'Todas las simulaciones han sido eliminadas.',
            icon: 'success'
          });
        }
      });
    });
    // Actualizamos el historial al cargar la página
    document.addEventListener('DOMContentLoaded', actualizarHistorial);