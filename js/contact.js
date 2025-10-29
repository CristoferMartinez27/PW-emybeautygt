emailjs.init('2C74fPEjtCXGxNFEn');

const CATALOG_LINK = 'https://www.canva.com/design/DAGf-7LORw0/7BUEamJG_hTz8HQuW5-0Kg/edit';

document.getElementById('contactForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const businessName = document.getElementById('businessName').value;
    const contactName = document.getElementById('contactName').value;
    const contactEmail = document.getElementById('contactEmail').value;
    const contactPhone = document.getElementById('contactPhone').value;
    const message = document.getElementById('message').value;
    
    const formMessage = document.getElementById('formMessage');
    const submitButton = e.target.querySelector('button[type="submit"]');
    
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';
    
    const templateParams = {
        to_email: contactEmail,
        business_name: businessName,
        contact_name: contactName,
        contact_phone: contactPhone,
        message: message || 'Sin mensaje adicional',
        catalog_link: CATALOG_LINK,
        reply_to: contactEmail
    };
    
    try {
        await emailjs.send('service_56t8s5k', 'template_oqt3gxi', templateParams);
        
        formMessage.textContent = 'Solicitud enviada exitosamente. Recibirá el catálogo en su correo pronto.';
        formMessage.className = 'form-message success';
        formMessage.style.display = 'block';
        
        document.getElementById('contactForm').reset();
        
        setTimeout(() => {
            formMessage.style.display = 'none';
        }, 5000);
        
    } catch (error) {
        console.error('Error al enviar email:', error);
        formMessage.textContent = 'Error al enviar la solicitud. Por favor, intente nuevamente o contáctenos por WhatsApp.';
        formMessage.className = 'form-message error';
        formMessage.style.display = 'block';
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Enviar Solicitud';
    }
});