const challenge = args[0];

const GATEWAY = 'https://gateway.pinata.cloud/ipfs';
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

const KP = {
  '@context': [
    'https://www.w3.org/ns/did/v1',
    'https://www.w3.org/ns/data-integrity/v1',
    'https://w3id.org/security/multikey/v1',
  ],
  id: 'did:web:0xauth.co',
  verificationMethod: {
    id: 'did:web:0xauth.co#key-0',
    type: 'Multikey',
    controller: 'did:web:0xauth.co',
    secretKeyMultibase: '',
    publicKeyMultibase:
      'ukiiQxfsSfV0E2QyBlnHTK2MThnd7_-Fyf6u76BUd24uxoDF4UjnXtxUo8b82iuPZBOa8BXd1NpE20x3Rfde9udcd8P8nPVLr80Xh6WLgI9SYR6piNzbHhEVIfgd_Vo9P',
  },
};

try {
  const date = new Date();

  console.log('Verifying');

  // Currently deployed DID doc points to different keys
  // const kp = (
  //   await Functions.makeHttpRequest({
  //     url: 'https://0xauth.co/.well-known/did.json',
  //   })
  // ).data;

  // console.log(kp);

  const vp = (
    await Functions.makeHttpRequest({
      url: `http://localhost:3001/credentials/gen-verify-proof`,
      method: 'post',
      headers: {
        'content-type': 'application/json',
      },
      data: {
        identity_address: '0x76c01dE889D46F9644A96C47E0a25C8e7Dc31A5c',
        credential_type: 'IdentityCredential',
        rules: [],
        challenge: challenge,
      },
    })
  ).data;

  const r = await zkpld.verifyProof(vp, KP, jsonld.documentLoader, {
    challenge: challenge,
    domain: 'https://0xauth.co',
    snarkVerifyingKeys: new Map([
      [
        'https://zkp-ld.org/circuit/lessThanPrvPub',
        lessThanPrvPub64.provingKey,
      ],
    ]),
  });

  if (!r.verified) throw new Error(r.error);

  console.log('Verified in', Date.now() - date.getTime(), 'ms');

  return Functions.encodeUint256(1);
} catch (er) {
  console.log(er);
  return Functions.encodeUint256(0);
}
