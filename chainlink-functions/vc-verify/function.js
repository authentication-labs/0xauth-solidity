// import zkpld from '@zkp-ld/jsonld-proofs';
// Load circuit
const jsonld = (await import('npm:jsonld')).default;

const zkpld = (await import('http://localhost:3000/index.js')).default;
const lessThanPrvPub64 = (
  await import('http://localhost:3000/less_than_prv_pub_64.json', {
    with: { type: 'json' },
  })
).default;
const vp = (
  await import('http://localhost:3000/vp.json', { with: { type: 'json' } })
).default;

const kp = (
  await import('http://localhost:3000/keypairs.json', {
    with: { type: 'json' },
  })
).default;
console.log('ID:', lessThanPrvPub64.id);
try {
  const date = new Date();
  console.log('Verifying');
  const r = await zkpld.verifyProof(vp, kp, jsonld.documentLoader, {
    challenge: 'abcde',
    snarkVerifyingKeys: new Map([
      [
        'https://zkp-ld.org/circuit/lessThanPrvPub',
        lessThanPrvPub64.provingKey,
      ],
    ]),
  });
  console.log('Verified!', Date.now() - date.getTime());
  console.log(r);
} catch (er) {
  console.log(er);
}
// const circuit = await import(
//   'https://ipfs.io/ipfs/Qmf6egtuwoTQ78QH2PtpJwrMdcp3MqdfdpxLP8SvQFM5bz/less_than_eq_prv_prv_64.json',
//   {
//     with: { type: 'json' },
//   }
// );

// console.log(zkpld.default);
// console.log(circuit.default.id);
// console.log(await zkpld.keyGen());
Deno.exit(0);
// return Functions.encodeString(circuit.default.id);
