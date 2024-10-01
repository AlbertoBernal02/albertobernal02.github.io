function confirmDownload(event) {
    event.preventDefault(); // Evita la acción predeterminada del enlace
    if (confirm("¿Estás seguro de que deseas descargar el CV?")) {
      window.location.href = event.currentTarget.href;
    }
  }

  function validateForm() {
    // Validación de género
    const gender = document.querySelector('input[name="gender"]:checked');
    if (!gender) {
      alert('Por favor, elige tu sexo.');
      return false;
    }
  
    // Validación de motivo de consulta
    const reason = document.getElementById('reason');
    if (reason.value === "") {
      alert('Por favor, selecciona un motivo de consulta.');
      return false;
    }
  
    // Validación de términos y condiciones
    const terms = document.getElementById('terms');
    if (!terms.checked) {
      alert('Por favor, acepta los términos y condiciones.');
      return false;
    }
  
    return true; // El formulario es válido
  }
  function handleSubmit(event) {
    event.preventDefault(); // Evita el envío del formulario
    const myModal = new bootstrap.Modal(document.getElementById('staticBackdrop'));
    myModal.show(); // Muestra el modal
  }
document.getElementById('closeModalBtn').addEventListener('click', function () {
    document.getElementById('contactForm').reset();
});
