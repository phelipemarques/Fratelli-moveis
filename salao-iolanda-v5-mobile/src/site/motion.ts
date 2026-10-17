import gsap from 'gsap';

/**
 * Movimento das seções do site. Cada tipo de elemento tem a própria entrada
 * (não é o mesmo fade em tudo) e nada fica preso: sem pin, só gatilhos e um
 * parallax discreto com scrub. Com movimento reduzido, nada disso roda.
 */
export function initMotion() {
  const mm = gsap.matchMedia();
  mm.add('(prefers-reduced-motion: no-preference)', () => {
    // títulos: linhas sobem de dentro da máscara
    gsap.utils.toArray<HTMLElement>('[data-split]').forEach((title) => {
      gsap.from(title.querySelectorAll('.line > span'), {
        yPercent: 115,
        duration: 1.1,
        ease: 'power4.out',
        stagger: 0.09,
        scrollTrigger: { trigger: title, start: 'top 86%', once: true },
      });
    });

    // textos e blocos: subida curta
    gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
      // deslocamento curto: o rótulo acima do título não chega a passar por cima dele
      gsap.from(el, {
        y: el.classList.contains('eyebrow') ? 8 : 18,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    });

    // fotografias: abrem por máscara, sem distorcer (escala uniforme)
    gsap.utils.toArray<HTMLElement>('[data-mask]').forEach((fig) => {
      gsap.fromTo(
        fig,
        { clipPath: 'inset(18% 12% 18% 12%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: fig, start: 'top 82%', once: true } },
      );
      const inner = fig.firstElementChild;
      if (inner) gsap.from(inner, { scale: 1.18, duration: 1.8, ease: 'expo.out', scrollTrigger: { trigger: fig, start: 'top 82%', once: true } });
    });

    // parallax discreto da foto de cabelo
    gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((fig) => {
      const inner = fig.firstElementChild;
      if (!inner) return;
      gsap.fromTo(inner, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: fig, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // serviços: cada linha entra com a régua desenhando da esquerda
    gsap.utils.toArray<HTMLElement>('.svc').forEach((row) => {
      gsap.from(row, {
        y: 30,
        opacity: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: { trigger: row, start: 'top 88%', once: true },
      });
    });

    // destaques capilares: escada
    const hair = document.querySelectorAll('.hair__list li');
    if (hair.length) {
      gsap.from(hair, {
        x: -24,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        stagger: 0.07,
        scrollTrigger: { trigger: '.hair__list', start: 'top 85%', once: true },
      });
    }

    // portfólio: quadros sobem em ondas, por coluna
    gsap.utils.toArray<HTMLElement>('.pf__cell').forEach((cell, i) => {
      gsap.from(cell.firstElementChild, {
        y: 24,
        opacity: 0,
        duration: 1.1,
        ease: 'power3.out',
        delay: (i % 4) * 0.08,
        scrollTrigger: { trigger: cell, start: 'top 92%', once: true },
      });
    });

    // passos do agendamento e dados de contato
    gsap.utils.toArray<HTMLElement>('.steps li, .contact__info > div').forEach((el, i) => {
      gsap.from(el, {
        y: 20,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out',
        delay: (i % 3) * 0.08,
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      });
    });

    // endereço grande: linhas
    const addr = document.querySelectorAll('.contact__address > span');
    if (addr.length) {
      gsap.from(addr, {
        y: 40,
        opacity: 0,
        duration: 1,
        ease: 'power4.out',
        stagger: 0.08,
        scrollTrigger: { trigger: '.contact__address', start: 'top 85%', once: true },
      });
    }
  });
}
