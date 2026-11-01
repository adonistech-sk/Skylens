import { useEffect, useRef } from 'react';
import { startAttitude } from '../../../modules/sky-native';
import { Mat3 } from '../../astronomy/core';
import { applyCompassCorrection, AttitudeFilter, AttitudeSolver, headingMessage } from './attitude';

/** Feeds the sky from the motion sensors while mounted. Stops them when it unmounts. */
export function CompassSession({ orientationRef, onUnavailable, correction = 0, onMessage }: {
  orientationRef: { current: Mat3 | null };
  onUnavailable: () => void;
  correction?: number;
  onMessage?: (message: string | null) => void;
}) {
  const correctionRef = useRef(correction);
  correctionRef.current = correction;

  useEffect(() => {
    const solver = new AttitudeSolver();
    const filter = new AttitudeFilter();
    let last = 0;
    let lastMessage: string | null = '';
    const stop = startAttitude((s) => {
      const r = solver.referenceToDevice(s.matrix as unknown as Mat3, s.gravity as [number, number, number]);
      const filtered = filter.filter(r, last ? s.timestamp - last : 0);
      last = s.timestamp;
      orientationRef.current = applyCompassCorrection(filtered, correctionRef.current);
      const message = headingMessage(s.headingAccuracy, s.frame);
      if (message !== lastMessage) { lastMessage = message; onMessage?.(message); }
    });
    if (!stop) onUnavailable();
    return () => { stop?.(); orientationRef.current = null; };
  }, []);

  return null;
}
