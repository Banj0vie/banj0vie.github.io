export const isTransactionRejection = (message) => {
  if (!message) return false;
  
  return message.includes('User denied') ||
    message.includes('User rejected') ||
    message.includes('rejected') ||
    message.includes('cancelled') ||
    message.includes('User cancelled') ||
    message.includes('MetaMask Tx Signature: User denied') ||
    message.includes('User rejected the request') ||
    message.includes('The user rejected the request') ||
    message.includes('Transaction was rejected') ||
    message.includes('User denied transaction') ||
    message.includes('Transaction rejected') ||
    message.includes('User cancelled transaction') ||
    message.includes('Transaction cancelled') ||
    message.includes('User aborted') ||
    message.includes('aborted') ||
    message.includes('denied') ||
    message.includes('reject') ||
    message.includes('4001') ||
    message.includes('ACTION_REJECTED') ||
    message.includes('-32602');
};
