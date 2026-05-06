// Anchor program setup removed — stub returns null shapes so any component still
// destructuring { program, connection, sendTransaction, publicKey } keeps rendering.
export const useProgram = () => ({
  program: null,
  connection: null,
  publicKey: null,
  sendTransaction: async () => null,
});
export default useProgram;
