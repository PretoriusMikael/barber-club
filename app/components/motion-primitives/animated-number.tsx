'use client';
/* eslint-disable react-hooks/static-components --
   MotionComponent is a lookup into a module-level registry (see
   ./create-motion), not a component created during render.
   Its identity is stable for the life of the page, so the rule's concern
   (state resetting on every render) does not apply here. */
import { cn } from '@/lib/utils';
import { SpringOptions, useSpring, useTransform } from 'motion/react';
import { createMotion } from './create-motion';
import { useEffect } from 'react';

export type AnimatedNumberProps = {
  value: number;
  className?: string;
  springOptions?: SpringOptions;
  as?: React.ElementType;
};

export function AnimatedNumber({
  value,
  className,
  springOptions,
  as = 'span',
}: AnimatedNumberProps) {
  const MotionComponent = createMotion(as);

  const spring = useSpring(value, springOptions);
  const display = useTransform(spring, (current) =>
    Math.round(current).toLocaleString()
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return (
    <MotionComponent className={cn('tabular-nums', className)}>
      {display}
    </MotionComponent>
  );
}
