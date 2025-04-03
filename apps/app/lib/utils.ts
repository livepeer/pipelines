export const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

export const isLivepeerEmail = (user: any): boolean => {
  if (!user) return false;
  
  if (typeof user.email === 'string') {
    return (user.email as string).endsWith('@livepeer.org');
  }
  
  if (user?.email?.address && typeof user.email.address === 'string') {
    return (user.email.address as string).endsWith('@livepeer.org');
  }
  
  if (user?.google?.email && typeof user.google.email === 'string') {
    return (user.google.email as string).endsWith('@livepeer.org');
  }
  
  return false;
};
