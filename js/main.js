// ==== EmailJS Configuration ====
let EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_yq08f6n";      // Replace with your EmailJS Service ID
let EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "template_gfae02o";    // Replace with your EmailJS Template ID
let EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "ySRvYfcXJHPJk4Kss";      // Replace with your EmailJS Public Key
let isEmailJSInitialized = false;

// Dynamically load the EmailJS SDK script and fetch credentials
(function() {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
    script.async = true;

    // Create a promise for script load
    const scriptLoaded = new Promise((resolve) => {
        script.onload = () => resolve(true);
    });

    // Fetch configuration from the backend
    const backendApiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    const configFetched = fetch(`${backendApiUrl.replace(/\/$/, '')}/api/config`)
        .then(response => {
            if (!response.ok) throw new Error("Failed to fetch configuration");
            return response.json();
        })
        .then(data => {
            if (data.emailjs_service_id && data.emailjs_service_id !== "YOUR_SERVICE_ID") {
                EMAILJS_SERVICE_ID = data.emailjs_service_id;
            }
            if (data.emailjs_template_id && data.emailjs_template_id !== "YOUR_TEMPLATE_ID") {
                EMAILJS_TEMPLATE_ID = data.emailjs_template_id;
            }
            if (data.emailjs_public_key && data.emailjs_public_key !== "YOUR_PUBLIC_KEY") {
                EMAILJS_PUBLIC_KEY = data.emailjs_public_key;
            }
            return true;
        })
        .catch(err => {
            console.warn("Backend configuration fetch failed, using hardcoded fallback/env keys:", err);
            return false;
        });

    // Initialize once both are ready
    Promise.all([scriptLoaded, configFetched]).then(() => {
        if (typeof emailjs !== 'undefined' && EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY") {
            emailjs.init({
                publicKey: EMAILJS_PUBLIC_KEY
            });
            isEmailJSInitialized = true;
            console.log("EmailJS successfully initialized!");
        }
    });

    document.head.appendChild(script);
})();

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
    const backendApiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    const API_URL = `${backendApiUrl.replace(/\/$/, '')}/api/enquiry`;

    function setupForm(formId, formType) {
        const form = document.getElementById(formId);
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Clear any previous inline contact message
            if (formType === 'contact') {
                const msgDiv = document.getElementById('contact-form-message');
                if (msgDiv) {
                    msgDiv.style.display = 'none';
                    msgDiv.innerText = '';
                }
            }

            // Field validation
            let hasEmptyField = false;
            const requiredInputs = form.querySelectorAll('[required]');
            requiredInputs.forEach(input => {
                if (!input.value.trim()) {
                    hasEmptyField = true;
                }
            });

            if (hasEmptyField) {
                if (formType === 'contact') {
                    const msgDiv = document.getElementById('contact-form-message');
                    if (msgDiv) {
                        msgDiv.style.display = 'block';
                        msgDiv.style.backgroundColor = '#fff3cd';
                        msgDiv.style.color = '#664d03';
                        msgDiv.style.border = '1px solid #ffecb5';
                        msgDiv.innerText = "Please fill in all required fields.";
                    }
                }
                form.reportValidity();
                return;
            }
            
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
                formData.destination = form.querySelector('select').value;
                formData.message = form.querySelector('textarea').value;
            } else if (formType === 'homepage') {
                formData.name = form.querySelector('input[type="text"]').value;
                formData.mobile = form.querySelector('input[type="tel"]').value;
                formData.email = form.querySelector('input[type="email"]').value;
                formData.destination = form.querySelector('select').value;
                formData.message = form.querySelector('textarea').value;
            }

            let backendSuccess = false;
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    backendSuccess = true;
                } else {
                    console.warn('Backend submission returned non-OK status:', response.status);
                }
            } catch (error) {
                console.warn('Backend API submission failed (likely offline/local-only):', error);
            }

            let emailjsSuccess = false;
            let emailjsAttempted = false;

            // Send via EmailJS (if configured/initialized)
            if (typeof emailjs !== 'undefined' && isEmailJSInitialized && EMAILJS_SERVICE_ID !== "YOUR_SERVICE_ID" && EMAILJS_TEMPLATE_ID !== "YOUR_TEMPLATE_ID") {
                emailjsAttempted = true;
                try {
                    let emailParams = {
                        name: formData.name || "Guest",
                        mobile: formData.mobile || "Not Provided",
                        email: formData.email || "Not Provided",
                        service: formData.destination || "Not Provided",
                        message: formData.message || formData.special_req || "Not Provided"
                    };

                    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, emailParams);
                    console.log("EmailJS notification sent successfully!");
                    emailjsSuccess = true;
                } catch (ejsError) {
                    console.error("EmailJS dispatch failed:", ejsError);
                }
            }

            const overallSuccess = backendSuccess || (emailjsAttempted ? emailjsSuccess : false);

            if (overallSuccess) {
                if (formType === 'contact') {
                    // Show inline success message
                    const msgDiv = document.getElementById('contact-form-message');
                    if (msgDiv) {
                        msgDiv.style.display = 'block';
                        msgDiv.style.backgroundColor = '#d1e7dd';
                        msgDiv.style.color = '#0f5132';
                        msgDiv.style.border = '1px solid #badbcc';
                        msgDiv.innerText = "Thank you! Your enquiry has been submitted successfully.";
                    }
                    
                    // Reset form
                    form.reset();
                    submitBtn.innerText = originalBtnText;
                    submitBtn.disabled = false;
                } else {
                    // Show Success Message and hide form for other types
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
                }
            } else {
                if (formType === 'contact') {
                    // Show inline failure message
                    const msgDiv = document.getElementById('contact-form-message');
                    if (msgDiv) {
                        msgDiv.style.display = 'block';
                        msgDiv.style.backgroundColor = '#f8d7da';
                        msgDiv.style.color = '#842029';
                        msgDiv.style.border = '1px solid #f5c2c7';
                        msgDiv.innerText = "Something went wrong. Please try again.";
                    }
                    submitBtn.innerText = originalBtnText;
                    submitBtn.disabled = false;
                } else {
                    alert("Sorry, there was an error submitting your form. Please try again or contact us directly via WhatsApp.");
                    submitBtn.innerText = originalBtnText;
                    submitBtn.disabled = false;
                }
            }
        });
    }

    setupForm('hotel-form', 'hotel');
    setupForm('homepage-enquiry-form', 'homepage');
});
