// On-chain transaction helpers removed. The sandbox doesn't broadcast
// transactions — these stubs exist only so legacy imports keep resolving.
export const sendVersionedTransaction = async () => null;
export const sendTransactionWithRetry = async () => null;
export const isUserRejectError = () => false;
