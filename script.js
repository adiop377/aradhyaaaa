document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // Intersection Observer for Reveal Animation
    const revealCallback = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                // Optional: stop observing once revealed
                // observer.unobserve(entry.target);
            }
        });
    };

    const revealObserver = new IntersectionObserver(revealCallback, {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    });

    document.querySelectorAll('.reveal').forEach(el => {
        revealObserver.observe(el);
    });

    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const menuIcon = mobileMenuBtn.querySelector('i');

    mobileMenuBtn.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        const isActive = navLinks.classList.contains('active');
        
        // Toggle icon between menu and close
        if (isActive) {
            mobileMenuBtn.innerHTML = '<i data-lucide="x"></i>';
        } else {
            mobileMenuBtn.innerHTML = '<i data-lucide="menu"></i>';
        }
        lucide.createIcons();
    });

    // Close menu when clicking a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            mobileMenuBtn.innerHTML = '<i data-lucide="menu"></i>';
            lucide.createIcons();
        });
    });

    // Smooth Scrolling for Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Navbar background change on scroll
    const nav = document.querySelector('nav');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            nav.style.padding = '10px 0';
            nav.style.background = 'rgba(255, 255, 255, 0.98)';
            nav.style.boxShadow = '0 4px 20px rgba(0,0,0,0.05)';
        } else {
            nav.style.padding = '15px 0';
            nav.style.background = 'rgba(255, 255, 255, 0.9)';
            nav.style.boxShadow = 'none';
        }
    });

    // 1. Contact Form Submission
    const contactForm = document.querySelector('.contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = contactForm.querySelector('button');
            const originalText = btn.innerHTML;
            
            btn.innerHTML = 'Sending...';
            btn.disabled = true;

            const formData = new FormData(contactForm);
            
            try {
                const response = await fetch('https://formsubmit.co/ajax/aradhyalifesolutions@gmail.com', {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    btn.innerHTML = 'Message Sent!';
                    btn.style.background = '#25D366';
                    contactForm.reset();
                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.style.background = '';
                        btn.disabled = false;
                    }, 3000);
                } else { throw new Error(); }
            } catch (error) {
                btn.innerHTML = 'Error! Try again';
                btn.style.background = '#ef4444';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.disabled = false;
                }, 3000);
            }
        });
    }

    // 2. Main Recruitment Form (the one in the middle of the page)
    const careerForm = document.querySelector('.lead-form');
    if (careerForm) {
        careerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = careerForm.querySelector('button');
            const originalText = btn.innerHTML;
            
            btn.innerHTML = 'Applying...';
            btn.disabled = true;

            const formData = new FormData(careerForm);
            formData.append('_subject', 'New Team Member Application');
            
            try {
                const response = await fetch('https://formsubmit.co/ajax/aradhyalifesolutions@gmail.com', {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    btn.innerHTML = 'Application Sent!';
                    btn.style.background = '#25D366';
                    careerForm.reset();
                    setTimeout(() => {
                        btn.innerHTML = originalText;
                        btn.style.background = '';
                        btn.disabled = false;
                    }, 3000);
                } else { throw new Error(); }
            } catch (error) {
                btn.innerHTML = 'Error! Try again';
                btn.style.background = '#ef4444';
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.disabled = false;
                }, 3000);
            }
        });
    }

    // 3. Recruitment Modal Form
    const recModalForm = document.querySelector('.modal-form:not(#webinarRegForm)');
    if (recModalForm) {
        recModalForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = recModalForm.querySelector('.btn-modal');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.innerHTML = 'Submitting...';
            submitBtn.disabled = true;

            const formData = new FormData(recModalForm);
            formData.append('_subject', 'Modal Recruitment Lead');

            try {
                const response = await fetch('https://formsubmit.co/ajax/aradhyalifesolutions@gmail.com', {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    submitBtn.innerHTML = 'Success!';
                    submitBtn.style.background = '#25D366';
                    setTimeout(() => {
                        const recModal = document.getElementById('recruitmentModal');
                        if (recModal) recModal.classList.remove('active');
                        document.body.style.overflow = '';
                        setTimeout(() => {
                            recModalForm.reset();
                            submitBtn.innerHTML = originalText;
                            submitBtn.style.background = '';
                            submitBtn.disabled = false;
                        }, 500);
                    }, 1500);
                } else { throw new Error(); }
            } catch (error) {
                submitBtn.innerHTML = 'Failed. Try Again';
                submitBtn.style.background = '#ef4444';
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.background = '';
                    submitBtn.disabled = false;
                }, 3000);
            }
        });
    }

    // Hero Profile Card Toggle logic
    const heroBtn = document.getElementById('heroToggle');
    const heroCont = document.querySelector('.hero .container');
    if (heroBtn && heroCont) {
        heroBtn.onclick = function() {
            heroCont.classList.toggle('collapsed');
        };
    }

    // Recruitment Modal Logic
    const recModal = document.getElementById('recruitmentModal');
    const openModalBtn = document.getElementById('openRecruitmentModal');
    const heroJoinBtn = document.getElementById('heroJoinBtn');
    const closeModalBtn = document.getElementById('closeModal');

    if (recModal && (openModalBtn || heroJoinBtn)) {
        const triggers = [openModalBtn, heroJoinBtn];
        triggers.forEach(btn => {
            if(btn) {
                btn.addEventListener('click', () => {
                    recModal.classList.add('active');
                    document.body.style.overflow = 'hidden';
                });
            }
        });

        closeModalBtn.addEventListener('click', () => {
            recModal.classList.remove('active');
            document.body.style.overflow = '';
        });
        recModal.addEventListener('click', (e) => {
            if (e.target === recModal) {
                recModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Webinar Modal Logic
    const webModal = document.getElementById('webinarModal');
    const openWebModalBtn = document.getElementById('openWebinarModal');
    const closeWebModalBtn = document.getElementById('closeWebinarModal');

    if (webModal && openWebModalBtn) {
        openWebModalBtn.addEventListener('click', () => {
            webModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        });

        closeWebModalBtn.addEventListener('click', () => {
            webModal.classList.remove('active');
            document.body.style.overflow = '';
        });

        webModal.addEventListener('click', (e) => {
            if (e.target === webModal) {
                webModal.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Webinar Form Submission
    const webForm = document.getElementById('webinarRegForm');
    if (webForm) {
        webForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = webForm.querySelector('.btn-modal');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.innerHTML = 'Registering...';
            submitBtn.disabled = true;

            const formData = new FormData(webForm);

            try {
                const response = await fetch('https://formsubmit.co/ajax/aradhyalifesolutions@gmail.com', {
                    method: 'POST',
                    body: formData,
                    headers: { 'Accept': 'application/json' }
                });

                if (response.ok) {
                    submitBtn.innerHTML = 'Registered Successfully!';
                    submitBtn.style.background = '#25D366';
                    
                    setTimeout(() => {
                        webModal.classList.remove('active');
                        document.body.style.overflow = '';
                        setTimeout(() => {
                            webForm.reset();
                            submitBtn.innerHTML = originalText;
                            submitBtn.style.background = '';
                            submitBtn.disabled = false;
                        }, 500);
                    }, 2000);
                } else {
                    throw new Error('Failed');
                }
            } catch (error) {
                submitBtn.innerHTML = 'Registration Failed';
                submitBtn.style.background = '#ef4444';
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.background = '';
                    submitBtn.disabled = false;
                }, 3000);
            }
        });
    }

    // Security: Prevent Code Inspection (REMOVED)
    // Anti-inspection scripts like preventing contextmenu ruin mobile UX (e.g. long press).
    // They have been disabled to ensure full cross-device compatibility.
});
