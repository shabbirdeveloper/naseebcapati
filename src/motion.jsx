import { m, useReducedMotion } from 'framer-motion';

export const motionEase = [.22, 1, .36, 1];
export const motionSpring = { type: 'spring', stiffness: 190, damping: 24, mass: .8 };
export const buttonTransition = { type: 'spring', stiffness: 420, damping: 26 };
export const drawerTransition = { type: 'spring', stiffness: 330, damping: 32 };

export const fadeUpVariants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: .55, ease: motionEase } },
};

export const fadeInVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: .45, ease: motionEase } },
};

export const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: .5, ease: motionEase } },
};

export const staggerVariants = {
  hidden: { opacity: 1 },
  show: { opacity: 1, transition: { staggerChildren: .07, delayChildren: .04 } },
};

export const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: .35, ease: motionEase } },
  exit: { opacity: 0, y: -6, transition: { duration: .2, ease: motionEase } },
};

export const headerVariants = {
  hidden: { opacity: 0, y: -10 },
  show: { opacity: 1, y: 0, transition: { duration: .45, ease: motionEase } },
};

const components = { a: m.a, article: m.article, button: m.button, div: m.div, section: m.section };

export function MotionReveal({ children, className = '', as = 'div', amount = .2, delay = 0, y = 18, ...props }) {
  const reduceMotion = useReducedMotion();
  const Component = components[as] || m.div;
  const variants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : y },
    show: { opacity: 1, y: 0, transition: { duration: .55, delay, ease: motionEase } },
  };
  return <Component {...props} className={className} initial={reduceMotion ? false : 'hidden'} whileInView={reduceMotion ? undefined : 'show'} viewport={{ once: true, amount }} variants={variants}>{children}</Component>;
}

export function MotionGroup({ children, className = '', amount = .15, ...props }) {
  const reduceMotion = useReducedMotion();
  return <m.div {...props} className={className} initial={reduceMotion ? false : 'hidden'} whileInView={reduceMotion ? undefined : 'show'} viewport={{ once: true, amount }} variants={staggerVariants}>{children}</m.div>;
}

export function MotionCard({ children, className = '', as = 'article', index = 0, ...props }) {
  const reduceMotion = useReducedMotion();
  const Component = components[as] || m.div;
  return <Component {...props} className={className} custom={index} variants={itemVariants} initial={reduceMotion ? false : 'hidden'} whileInView={reduceMotion ? undefined : 'show'} viewport={{ once: true, amount: .16 }} layout="position" whileHover={reduceMotion ? undefined : { y: -4 }} whileTap={reduceMotion ? undefined : { scale: .99 }}>{children}</Component>;
}

export function MotionImage({ children, className = '', as = 'div', ...props }) {
  const reduceMotion = useReducedMotion();
  const Component = components[as] || m.div;
  return <Component {...props} className={`motion-image-reveal ${className}`.trim()} initial={reduceMotion ? false : { opacity: 0, clipPath: 'inset(0 100% 0 0)' }} whileInView={reduceMotion ? undefined : { opacity: 1, clipPath: 'inset(0 0% 0 0)' }} viewport={{ once: true, amount: .15 }} transition={reduceMotion ? { duration: 0 } : { duration: .8, ease: motionEase }}>{children}</Component>;
}

export function MotionPage({ children }) {
  const reduceMotion = useReducedMotion();
  return <m.div className="page-transition" initial={reduceMotion ? false : 'initial'} animate={reduceMotion ? undefined : 'animate'} exit={reduceMotion ? undefined : 'exit'} variants={pageVariants}>{children}</m.div>;
}
