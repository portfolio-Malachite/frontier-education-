(() => {
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector("[data-menu-toggle]");
  const mobileMenu = document.querySelector("[data-mobile-menu]");
  const navLinks = document.querySelectorAll('a[href^="#"]');
  const form = document.querySelector("#enquiry-form");
  const status = document.querySelector("#form-status");
  const stickyCta = document.querySelector(".mobile-sticky-cta");
  const testimonialTrack = document.querySelector("[data-testimonial-track]");
  const prevButton = document.querySelector("[data-carousel-prev]");
  const nextButton = document.querySelector("[data-carousel-next]");

  const setMenuOpen = (isOpen) => {
    if (!toggle || !mobileMenu) return;
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    mobileMenu.classList.toggle("is-open", isOpen);
    document.body.classList.toggle("menu-open", isOpen);
  };

  if (toggle && mobileMenu) {
    toggle.addEventListener("click", () => {
      const isOpen = toggle.getAttribute("aria-expanded") === "true";
      setMenuOpen(!isOpen);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") setMenuOpen(false);
    });
  }

  const updateHeader = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  const updateStickyCta = () => {
    if (!stickyCta) return;
    const shouldShow = window.innerWidth < 768 && window.scrollY > 520;
    stickyCta.classList.toggle("is-visible", shouldShow);
  };

  updateHeader();
  updateStickyCta();
  window.addEventListener("scroll", updateHeader, { passive: true });
  window.addEventListener("scroll", updateStickyCta, { passive: true });
  window.addEventListener("resize", updateStickyCta);

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const hash = link.getAttribute("href");
      if (!hash || hash === "#") return;

      const target = hash === "#top" ? document.querySelector("#top") : document.querySelector(hash);
      if (!target) return;

      event.preventDefault();
      setMenuOpen(false);
      target.scrollIntoView({ behavior: "smooth", block: "start" });

      if (history.pushState) {
        history.pushState(null, "", hash);
      }
    });
  });

  const sectionIds = ["courses", "campuses", "why", "testimonials", "contact"];
  const activeLinks = [...document.querySelectorAll(".desktop-nav a, .mobile-panel a")].filter((link) => {
    const href = link.getAttribute("href") || "";
    return sectionIds.some((id) => href === `#${id}`);
  });

  if ("IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;
        const id = visible.target.id;
        activeLinks.forEach((link) => {
          link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
        });
      },
      { rootMargin: "-25% 0px -55% 0px", threshold: [0.2, 0.5, 0.8] }
    );

    sectionIds.forEach((id) => {
      const section = document.getElementById(id);
      if (section) navObserver.observe(section);
    });
  }

  const revealItems = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealItems.length) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.15 }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const setFieldError = (field, message) => {
    const wrapper = field.closest(".field");
    const error = document.querySelector(`[data-error-for="${field.id}"]`);

    field.setAttribute("aria-invalid", message ? "true" : "false");
    if (wrapper) wrapper.classList.toggle("is-invalid", Boolean(message));
    if (error) error.textContent = message;
  };

  const validateField = (field) => {
    const value = field.value.trim();

    if (field.hasAttribute("required") && !value) {
      setFieldError(field, "Please complete this field.");
      return false;
    }

    if (field.type === "email" && value) {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      if (!isEmail) {
        setFieldError(field, "Please enter a valid email address.");
        return false;
      }
    }

    if (field.type === "tel" && value) {
      const digits = value.replace(/\D/g, "");
      if (digits.length < 7) {
        setFieldError(field, "Please enter a valid phone number.");
        return false;
      }
    }

    if (field.tagName === "TEXTAREA" && value.length > 500) {
      setFieldError(field, "Please keep your message under 500 characters.");
      return false;
    }

    setFieldError(field, "");
    return true;
  };

  if (form) {
    const fields = [...form.querySelectorAll("input, select, textarea")];

    fields.forEach((field) => {
      field.addEventListener("blur", () => validateField(field));
      field.addEventListener("input", () => {
        if (field.getAttribute("aria-invalid") === "true") validateField(field);
      });
      field.addEventListener("change", () => validateField(field));
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const isValid = fields.map(validateField).every(Boolean);

      if (!isValid) {
        const firstInvalid = form.querySelector('[aria-invalid="true"]');
        if (firstInvalid) firstInvalid.focus();
        if (status) status.textContent = "";
        return;
      }

      form.reset();
      fields.forEach((field) => setFieldError(field, ""));

      if (status) {
        status.textContent = "Thank you! Your enquiry has been received. Our study advisor will contact you shortly.";
      }
    });
  }

  const scrollTestimonials = (direction) => {
    if (!testimonialTrack) return;
    const amount = Math.max(260, testimonialTrack.clientWidth * 0.82);
    testimonialTrack.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  if (prevButton && nextButton && testimonialTrack) {
    prevButton.addEventListener("click", () => scrollTestimonials(-1));
    nextButton.addEventListener("click", () => scrollTestimonials(1));
  }
})();
