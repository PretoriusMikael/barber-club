'use client';
/* eslint-disable react-hooks/static-components --
   MotionComponent is a lookup into a module-level registry (see
   ./create-motion), not a component created during render.
   Its identity is stable for the life of the page, so the rule's concern
   (state resetting on every render) does not apply here. */
import { ReactNode, useRef, useState } from 'react';
import {
  useInView,
  Variant,
  Transition,
  UseInViewOptions,
} from 'motion/react';
import { createMotion } from './create-motion';

export type InViewProps = {
  children: ReactNode;
  variants?: {
    hidden: Variant;
    visible: Variant;
  };
  transition?: Transition;
  viewOptions?: UseInViewOptions;
  as?: React.ElementType;
  once?: boolean
};

const defaultVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export function InView({
  children,
  variants = defaultVariants,
  transition,
  viewOptions,
  as = 'div',
  once
}: InViewProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, viewOptions);

  const [isViewed, setIsViewed] = useState(false)

  const MotionComponent = createMotion(as);

  return (
    <MotionComponent
      ref={ref}
      initial='hidden'
      onAnimationComplete={() => {
        if (once) setIsViewed(true)
      }}
      animate={(isInView || isViewed) ? "visible" : "hidden"}

      variants={variants}
      transition={transition}
    >
      {children}
    </MotionComponent>
  );
}
