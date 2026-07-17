import { forwardRef } from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { m as motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import './accordion.css';

export const Accordion = AccordionPrimitive.Root;

export const AccordionItem = forwardRef(function AccordionItem({ className = '', ...props }, ref) {
  return <AccordionPrimitive.Item ref={ref} className={`ui-accordion-item ${className}`} {...props} />;
});

export const AccordionTrigger = forwardRef(function AccordionTrigger({ children, className = '', ...props }, ref) {
  return <AccordionPrimitive.Header className="ui-accordion-header">
    <AccordionPrimitive.Trigger ref={ref} className={`ui-accordion-trigger ${className}`} {...props}>
      <span>{children}</span><ChevronDown aria-hidden="true" />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>;
});

export const AccordionContent = forwardRef(function AccordionContent({ children, className = '', ...props }, ref) {
  return <AccordionPrimitive.Content ref={ref} className={`ui-accordion-content ${className}`} {...props}>
    <motion.div className="ui-accordion-content-inner" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  </AccordionPrimitive.Content>;
});

