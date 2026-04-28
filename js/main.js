// Main Javascript file

document.addEventListener('DOMContentLoaded', () => {
    // Mobile Navigation Toggle
    const mobileToggle = document.getElementById('mobileToggle');
    const navLinks = document.getElementById('navLinks');

    if (mobileToggle) {
        mobileToggle.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            
            const icon = mobileToggle.querySelector('i');
            if (navLinks.classList.contains('active')) {
                icon.classList.remove('fa-bars');
                icon.classList.add('fa-xmark');
            } else {
                icon.classList.remove('fa-xmark');
                icon.classList.add('fa-bars');
            }
        });
    }

    // Sticky Header
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.style.padding = '0';
            header.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
        } else {
            header.style.padding = '0';
            header.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';
        }
    });

    // Reveal elements on scroll
    const revealElements = document.querySelectorAll('.reveal');
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target);
            }
        });
    };
    const revealOptions = { threshold: 0.15, rootMargin: "0px 0px -50px 0px" };
    const revealObserver = new IntersectionObserver(revealCallback, revealOptions);
    revealElements.forEach(element => revealObserver.observe(element));

    // ==== Form Submission Handling ====
    const API_URL = 'http://127.0.0.1:8000/api/enquiry';

    function setupForm(formId, formType) {
        const form = document.getElementById(formId);
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerText;
            submitBtn.innerText = 'Sending...';
            submitBtn.disabled = true;

            // Gather Data
            let formData = { form_type: formType };
            
            if (formType === 'hotel') {
                formData.name = "Guest (Hotel Enquiry)"; // We didn't collect Name in the hotel form per requirements
                formData.mobile = form.querySelector('input[type="tel"]').value;
                formData.email = "Not Provided";
                formData.destination = form.querySelector('select:nth-of-type(1)').value;
                
                const pax = form.querySelectorAll('select')[1].value;
                const rooms = form.querySelectorAll('select')[2].value;
                formData.rooms_persons = `${rooms} Rooms, ${pax} Persons`;
                
                formData.special_req = form.querySelector('textarea').value;
            } else if (formType === 'contact') {
                formData.name = form.querySelectorAll('input[type="text"]')[0].value;
                formData.mobile = form.querySelector('input[type="tel"]').value;
                formData.email = form.querySelector('input[type="email"]').value;
                formData.message = form.querySelector('textarea').value;
            }

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (!response.ok) throw new Error('Submission failed');

                // Show Success Message
                form.style.display = 'none';
                
                const successMsg = document.createElement('div');
                successMsg.innerHTML = `
                    <div style="text-align:center; padding: 2rem 0;">
                        <i class="fa-solid fa-circle-check" style="color: #22c55e; font-size: 4rem; margin-bottom: 1rem;"></i>
                        <h3 style="color: var(--primary-color); font-size: 1.5rem; margin-bottom: 1rem;">Thank you!</h3>
                        <p style="font-size: 1.1rem;">Your enquiry has been received. Our team will contact you shortly.</p>
                    </div>
                `;
                form.parentNode.insertBefore(successMsg, form.nextSibling);

            } catch (error) {
                console.error(error);
                alert("Sorry, there was an error submitting your form. Please try again or contact us directly via WhatsApp.");
                submitBtn.innerText = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }

    setupForm('hotel-form', 'hotel');
    setupForm('contact-form-el', 'contact');
});
