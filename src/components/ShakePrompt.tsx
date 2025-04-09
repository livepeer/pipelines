import { useShakeDetection } from '../hooks/useShakeDetection';
import { generateRandomPrompt } from '../utils/promptGenerator';
import { useEffect } from 'react';

export const ShakePrompt = () => {
  const handleShake = async () => {
    try {
      const randomPrompt = generateRandomPrompt();
      
      // Replace with your actual API endpoint and method
      const response = await fetch('/api/control', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: randomPrompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit prompt');
      }

      // Handle successful submission
    } catch (error) {
      console.error('Error submitting prompt:', error);
    }
  };

  useShakeDetection(handleShake);

  useEffect(() => {
    if (typeof DeviceMotionEvent !== 'undefined' && 
        // @ts-ignore - iOS specific request method
        typeof DeviceMotionEvent.requestPermission === 'function') {
      // @ts-ignore
      DeviceMotionEvent.requestPermission()
        .then((permissionState: string) => {
          if (permissionState === 'granted') {
            // Permission granted
          }
        })
        .catch(console.error);
    }
  }, []);

  return (
    <div>
      <p>Shake your device to generate a random prompt!</p>
    </div>
  );
}; 