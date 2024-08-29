const GATEWAY = args[0];

const DEPS_CID = 'QmSXHUAiDquwrqFQdWmQ2UesWqDjBawEFEhkbt771z4Sns';
const CIRCUITS_CID = 'Qmf6egtuwoTQ78QH2PtpJwrMdcp3MqdfdpxLP8SvQFM5bz';

const mainDep = await import(`${GATEWAY}/${DEPS_CID}/index.js`);
const zkpld = mainDep.default;
const jsonld = mainDep.jsonld;

const lessThanPrvPub64 = (
  await import(`${GATEWAY}/${CIRCUITS_CID}/less_than_prv_pub_64.json`, {
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
  if (!r.verified) throw new Error(r.error);
  console.log('Verified in', Date.now() - date.getTime(), 'ms');
  console.log(r);

  return Functions.encodeUint256(1);
} catch (er) {
  console.log(er);
  return Functions.encodeUint256(0);
}
