import * as Dilithium from 'dilithium-crystals';

export async function generateDilithium() {
  // Library API may be async; adapt as needed
  const kp = await Dilithium.keyPair();
  return { publicKey: kp.publicKey, privateKey: kp.privateKey };
}

export async function dilithiumSign(privateKey, messageBytes) {
  return new Uint8Array(await Dilithium.sign(messageBytes, privateKey));
}

export async function dilithiumVerify(publicKey, messageBytes, signatureBytes) {
  return !!(await Dilithium.verify(messageBytes, signatureBytes, publicKey));
}

