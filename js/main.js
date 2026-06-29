// ============================================================
// Veer Travels — Main JavaScript
// EmailJS Integration + Form Handling + UI
// ============================================================

// ==== EmailJS Configuration (Public Keys — safe to expose) ====
const EMAILJS_SERVICE_ID = "service_vyemzsn";
const EMAILJS_TEMPLATE_ID = "template_omjew8n";
const EMAILJS_PUBLIC_KEY = "ySRvYfcXJHPJk4Kss";

// ==== EmailJS will be initialized inside DOMContentLoaded ====
// (ensures the CDN <script> has fully executed before we call init)
let emailjsReady = false;

// ==== DOMContentLoaded — UI + Forms ====
// type="module" scripts are deferred, so DOM is always ready by the time this runs.
// Using the readyState guard makes this safe in all scenarios.
function onReady(fn) {
    if (document.readyState !== 'loading') { fn(); }
    else { document.addEventListener('DOMContentLoaded', fn); }
}
onReady(() => {

    // ==== Initialize EmailJS (v4 requires object form) ====
    try {
        if (typeof emailjs !== 'undefined') {
            emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
            emailjsReady = true;
            console.log("✅ EmailJS initialized. Service:", EMAILJS_SERVICE_ID, "| Template:", EMAILJS_TEMPLATE_ID);
        } else {
            console.error("❌ EmailJS SDK not loaded. Check the <script> tag order in HTML.");
        }
    } catch (err) {
        console.error("❌ EmailJS initialization failed:", err);
    }

    // ---- Mobile Navigation Toggle ----
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

    // ---- Sticky Header ----
    const header = document.getElementById('header');
    const navbar = header ? header.querySelector('.navbar') : null;
    if (header && navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.style.height = '65px';
                header.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
                header.style.boxShadow = '0 4px 20px rgba(13, 43, 77, 0.08)';
            } else {
                navbar.style.height = '80px';
                header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
                header.style.boxShadow = 'var(--shadow-sm)';
            }
        });
    }

    // ---- Reveal on Scroll ----
    const revealElements = document.querySelectorAll('.reveal');
    if (revealElements.length > 0) {
        const revealObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15, rootMargin: "0px 0px -50px 0px" });
        revealElements.forEach(el => revealObserver.observe(el));
    }

    // ================================================================
    // ==== FORM SUBMISSION HANDLER ====
    // ================================================================

    /**
     * Sets up a form to submit via EmailJS.
     * @param {string} formId - The form element's ID
     * @param {string} formType - 'contact' | 'homepage' | 'hotel'
     */
    function setupForm(formId, formType) {
        const form = document.getElementById(formId);
        if (!form) return; // Form not on this page

        let isSubmitting = false; // Duplicate submission guard

        // Attach input listeners to clear error border styling on typing
        const requiredInputs = form.querySelectorAll('[required]');
        requiredInputs.forEach(input => {
            input.addEventListener('input', () => {
                input.style.borderColor = '';
            });
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();

            // ---- Prevent duplicate submissions ----
            if (isSubmitting) {
                console.warn("⚠️ Submission already in progress, ignoring duplicate click.");
                return;
            }

            // ---- Clear previous messages ----
            const msgDiv = form.querySelector('.form-status-message') || document.getElementById('contact-form-message');
            if (msgDiv) {
                msgDiv.style.display = 'none';
                msgDiv.textContent = '';
                msgDiv.className = msgDiv.className.replace(/\s*(success|error|warning)/g, '');
            }

            // ---- Validate required fields ----
            let hasEmptyField = false;
            requiredInputs.forEach(input => {
                if (!input.value.trim()) {
                    hasEmptyField = true;
                    input.style.borderColor = '#dc3545';
                } else {
                    input.style.borderColor = '';
                }
            });

            if (hasEmptyField) {
                showMessage(msgDiv, 'warning', 'Please fill in all required fields.');
                form.reportValidity();
                return;
            }

            // ---- Lock form ----
            isSubmitting = true;
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn ? submitBtn.innerHTML : 'Submit Enquiry';
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
                submitBtn.disabled = true;
            }

            // ---- Gather form data based on type ----
            let rawData = {};
            if (formType === 'contact' || formType === 'homepage') {
                rawData = {
                    name: getFieldValue(form, '[name="name"]'),
                    email: getFieldValue(form, '[name="email"]'),
                    mobile: getFieldValue(form, '[name="mobile"]'),
                    service: getFieldValue(form, '[name="service"]'),
                    message: getFieldValue(form, '[name="message"]'),
                };
            } else if (formType === 'hotel') {
                const selects = form.querySelectorAll('select');
                rawData = {
                    name: "Guest (Hotel Enquiry)",
                    email: "Not Provided",
                    mobile: getFieldValue(form, '[name="mobile"]') || getFieldValue(form, 'input[type="tel"]'),
                    service: selects[0] ? selects[0].value : "Hotel",
                    message: `Rooms: ${selects[2]?.value || 'N/A'}, Persons: ${selects[1]?.value || 'N/A'}. ${getFieldValue(form, 'textarea')}`,
                };
            }

            // Build emailParams matching EXACTLY the template variables:
            // {{name}}, {{mobile}}, {{email}}, {{service}}, {{message}}
            const emailParams = {
                name: rawData.name,
                mobile: rawData.mobile,
                email: rawData.email,
                service: rawData.service,
                message: rawData.message,
            };

            console.log("📧 Sending email with params:", emailParams);
            console.log("📧 Service ID:", EMAILJS_SERVICE_ID);
            console.log("📧 Template ID:", EMAILJS_TEMPLATE_ID);

            // ---- Send via EmailJS ----
            let emailSent = false;

            if (!emailjsReady) {
                console.error("❌ EmailJS is not initialized. Cannot send email.");
            } else {
                try {
                    const response = await emailjs.send(
                        EMAILJS_SERVICE_ID,
                        EMAILJS_TEMPLATE_ID,
                        emailParams
                    );
                    console.log("✅ EmailJS SUCCESS! Status:", response.status, "Text:", response.text);
                    emailSent = true;
                } catch (error) {
                    console.error("❌ EmailJS FAILED!", error);
                    console.error("   Error status:", error?.status);
                    console.error("   Error text:", error?.text);
                }
            }

            // ---- Show result ----
            const success = emailSent;

            if (success) {
                // === SUCCESS ===
                if (formType === 'contact') {
                    showMessage(msgDiv, 'success', '✅ Thank you! Your enquiry has been submitted successfully. We will contact you soon.');
                    form.reset();
                } else {
                    // For homepage/hotel — replace form with success message
                    form.style.display = 'none';
                    const successDiv = document.createElement('div');
                    successDiv.innerHTML = `
                        <div style="text-align:center; padding: 2rem 0;">
                            <i class="fa-solid fa-circle-check" style="color: #22c55e; font-size: 4rem; margin-bottom: 1rem;"></i>
                            <h3 style="color: var(--primary-color); font-size: 1.5rem; margin-bottom: 1rem;">Thank you!</h3>
                            <p style="font-size: 1.1rem;">Your enquiry has been received. Our team will contact you shortly.</p>
                        </div>
                    `;
                    form.parentNode.insertBefore(successDiv, form.nextSibling);
                }
            } else {
                // === FAILURE — show WhatsApp fallback ===
                const whatsappMsg = encodeURIComponent(
                    `Hi Veer Travels! I tried submitting the enquiry form but it failed.\n\nName: ${rawData.name}\nMobile: ${rawData.mobile}\nEmail: ${rawData.email}\nService: ${rawData.service}\nMessage: ${rawData.message}`
                );
                const whatsappLink = `https://wa.me/919727773600?text=${whatsappMsg}`;

                if (formType === 'contact') {
                    showMessage(msgDiv, 'error',
                        `Something went wrong. Please try again or <a href="${whatsappLink}" target="_blank" style="color:#842029; text-decoration:underline; font-weight:600;">send your enquiry via WhatsApp</a>.`
                    );
                } else {
                    let errorDiv = form.parentNode.querySelector('.form-error-message');
                    if (!errorDiv) {
                        errorDiv = document.createElement('div');
                        errorDiv.className = 'form-error-message';
                        errorDiv.style.cssText = 'margin-top:15px; padding:12px 16px; border-radius:8px; font-weight:500; text-align:center; background:#f8d7da; color:#842029; border:1px solid #f5c2c7;';
                        form.parentNode.insertBefore(errorDiv, form.nextSibling);
                    }
                    errorDiv.innerHTML = `Sorry, there was an error. Please <a href="${whatsappLink}" target="_blank" style="color:#842029; text-decoration:underline; font-weight:600;">contact us via WhatsApp</a>.`;
                    errorDiv.style.display = 'block';
                }
            }

            // ---- Unlock form ----
            if (submitBtn) {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
            isSubmitting = false;
        });
    }

    // ---- Helper: get field value by selector ----
    function getFieldValue(form, selector) {
        const el = form.querySelector(selector);
        return el ? el.value.trim() : '';
    }

    // ---- Helper: show inline message ----
    function showMessage(msgDiv, type, html) {
        if (!msgDiv) return;

        const styles = {
            success: { bg: '#d1e7dd', color: '#0f5132', border: '#badbcc' },
            error: { bg: '#f8d7da', color: '#842029', border: '#f5c2c7' },
            warning: { bg: '#fff3cd', color: '#664d03', border: '#ffecb5' },
        };
        const s = styles[type] || styles.warning;

        msgDiv.style.display = 'block';
        msgDiv.style.backgroundColor = s.bg;
        msgDiv.style.color = s.color;
        msgDiv.style.border = `1px solid ${s.border}`;
        msgDiv.style.padding = '12px 16px';
        msgDiv.style.borderRadius = '8px';
        msgDiv.style.fontWeight = '500';
        msgDiv.style.textAlign = 'center';
        msgDiv.style.marginBottom = '15px';
        msgDiv.innerHTML = html;
    }

    // ---- Register all forms ----
    setupForm('contact-form-el', 'contact');
    setupForm('homepage-enquiry-form', 'homepage');
    setupForm('hotel-form', 'hotel');

    console.log("✅ Form handlers registered.");
});
