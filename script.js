/* Anil Kumar — portfolio interactions
   Vanilla JS, no dependencies. Everything here is additive motion:
   it never changes layout and fully backs off for prefers-reduced-motion. */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- EmailJS config for the "Let's talk?" form ----------
     1. Create a free account at https://www.emailjs.com and connect your Gmail as a Service.
     2. Create an Email Template with a "To email" of anildhiman03@gmail.com and body
        variables {{from_name}}, {{from_email}}, {{message}}.
     3. Copy your Public Key, Service ID and Template ID from the EmailJS dashboard
        and paste them below. Until you do, the form still works (validation + captcha)
        but shows a friendly "email isn't wired up yet" message instead of sending. */
  var EMAILJS_PUBLIC_KEY = "REPLACE_WITH_EMAILJS_PUBLIC_KEY";
  var EMAILJS_SERVICE_ID = "REPLACE_WITH_EMAILJS_SERVICE_ID";
  var EMAILJS_TEMPLATE_ID = "REPLACE_WITH_EMAILJS_TEMPLATE_ID";
  var OWNER_EMAIL = "anildhiman03@gmail.com";

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll(".reveal");

  if (reduceMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- Count-up metric ---------- */
  var counters = document.querySelectorAll("[data-count]");
  function runCount(el) {
    var target = parseInt(el.getAttribute("data-count"), 10) || 0;
    if (reduceMotion) { el.textContent = target + "+"; return; }
    var start = null;
    var duration = 900;
    function step(ts) {
      if (start === null) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target) + "+";
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if (counters.length) {
    if (!("IntersectionObserver" in window)) {
      counters.forEach(runCount);
    } else {
      var countObserver = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) {
              runCount(entry.target);
              countObserver.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.6 }
      );
      counters.forEach(function (el) { countObserver.observe(el); });
    }
  }

  /* ---------- Active nav link on scroll ---------- */
  var navLinks = document.querySelectorAll("nav a[data-nav]");
  var sections = Array.prototype.map.call(navLinks, function (link) {
    return document.getElementById(link.getAttribute("data-nav"));
  }).filter(Boolean);

  if (sections.length && "IntersectionObserver" in window) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var id = entry.target.id;
          var link = document.querySelector('nav a[data-nav="' + id + '"]');
          if (!link) return;
          if (entry.isIntersecting) {
            navLinks.forEach(function (l) { l.classList.remove("active"); });
            link.classList.add("active");
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 }
    );
    sections.forEach(function (s) { navObserver.observe(s); });
  }

  /* ---------- Cursor-follow glow on cards ---------- */
  if (!reduceMotion && window.matchMedia("(hover: hover)").matches) {
    var glowCards = document.querySelectorAll("[data-glow]");
    glowCards.forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty("--gx", ((e.clientX - rect.left) / rect.width) * 100 + "%");
        card.style.setProperty("--gy", ((e.clientY - rect.top) / rect.height) * 100 + "%");
      });
    });
  }

  /* ---------- "Let's talk?" dialog: open/close, honeypot, math captcha, EmailJS ---------- */
  var talkDialog = document.getElementById("talkDialog");
  var talkForm = document.getElementById("talkForm");

  if (talkDialog && talkForm) {
    var talkStatus = document.getElementById("talkStatus");
    var talkSubmit = document.getElementById("talkSubmit");
    var talkCaptchaLabel = document.getElementById("talkCaptchaLabel");
    var talkCaptchaInput = document.getElementById("talkCaptcha");
    var talkCompany = document.getElementById("talkCompany");
    var talkName = document.getElementById("talkName");
    var talkEmail = document.getElementById("talkEmail");
    var talkMessage = document.getElementById("talkMessage");
    var captchaAnswer = 0;

    function newCaptcha() {
      var a = 1 + Math.floor(Math.random() * 9);
      var b = 1 + Math.floor(Math.random() * 9);
      captchaAnswer = a + b;
      talkCaptchaLabel.textContent = "What is " + a + " + " + b + "?";
      talkCaptchaInput.value = "";
    }

    function setStatus(msg, state) {
      talkStatus.textContent = msg;
      if (state) talkStatus.setAttribute("data-state", state);
      else talkStatus.removeAttribute("data-state");
    }

    function openTalk() {
      newCaptcha();
      setStatus("", null);
      if (typeof talkDialog.showModal === "function") {
        talkDialog.showModal();
      } else {
        talkDialog.setAttribute("open", "");
      }
      if (talkName) setTimeout(function () { talkName.focus(); }, 30);
    }

    function closeTalk() {
      if (typeof talkDialog.close === "function" && talkDialog.open) {
        talkDialog.close();
      } else {
        talkDialog.removeAttribute("open");
      }
    }

    document.querySelectorAll("[data-open-talk]").forEach(function (btn) {
      btn.addEventListener("click", openTalk);
    });
    document.querySelectorAll("[data-close-talk]").forEach(function (btn) {
      btn.addEventListener("click", closeTalk);
    });

    /* Click on the native <dialog> backdrop (outside the form box) closes it */
    talkDialog.addEventListener("click", function (e) {
      var rect = talkDialog.getBoundingClientRect();
      var inDialog = e.clientY >= rect.top && e.clientY <= rect.bottom && e.clientX >= rect.left && e.clientX <= rect.right;
      if (!inDialog) closeTalk();
    });

    var emailReady = typeof emailjs !== "undefined" && EMAILJS_PUBLIC_KEY.indexOf("REPLACE_") !== 0;
    if (emailReady) emailjs.init(EMAILJS_PUBLIC_KEY);

    talkForm.addEventListener("submit", function (e) {
      e.preventDefault();

      /* Honeypot: invisible to humans, bots fill it in. Pretend success, send nothing. */
      if (talkCompany && talkCompany.value.trim() !== "") {
        setStatus("Thanks — I'll get back to you soon.", "ok");
        talkForm.reset();
        setTimeout(closeTalk, 1400);
        return;
      }

      if (!talkForm.checkValidity()) {
        talkForm.reportValidity();
        return;
      }

      if (parseInt(talkCaptchaInput.value, 10) !== captchaAnswer) {
        setStatus("That answer isn't quite right — try again.", "error");
        newCaptcha();
        talkCaptchaInput.focus();
        return;
      }

      if (!emailReady) {
        setStatus("Email isn't wired up yet — please use the link below to reach me directly.", "error");
        return;
      }

      var params = {
        from_name: talkName.value.trim(),
        from_email: talkEmail.value.trim(),
        message: talkMessage.value.trim(),
        to_email: OWNER_EMAIL
      };

      talkSubmit.disabled = true;
      var originalLabel = talkSubmit.textContent;
      talkSubmit.textContent = "Sending…";
      setStatus("Sending your message…", null);

      emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, params).then(
        function () {
          setStatus("Thanks — I'll get back to you soon.", "ok");
          talkForm.reset();
          talkSubmit.disabled = false;
          talkSubmit.textContent = originalLabel;
          setTimeout(closeTalk, 1600);
        },
        function (err) {
          console.error("EmailJS send failed:", err);
          setStatus("Something went wrong sending that — please email me directly below.", "error");
          talkSubmit.disabled = false;
          talkSubmit.textContent = originalLabel;
        }
      );
    });
  }

})();
