pragma solidity 0.8.19;

import { FunctionsClient } from '@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol';
import { ConfirmedOwner } from '@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol';
import { FunctionsRequest } from '@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol';

string constant FUNCTION_SRC = "const identityAddress=args[0];const challenge=args[1];const GATEWAY='https://gateway.pinata.cloud/ipfs';const DEPS_CID='QmSXHUAiDquwrqFQdWmQ2UesWqDjBawEFEhkbt771z4Sns';const CIRCUITS_CID='Qmf6egtuwoTQ78QH2PtpJwrMdcp3MqdfdpxLP8SvQFM5bz';const GEN_VP_URL=`https://services-dev.0xauth.co/wallet/credentials/gen-verify-proof`;const mainDep=await import(`${GATEWAY}/${DEPS_CID}/index.js`);const zkpld=mainDep.default;const jsonld=mainDep.jsonld;const lessThanPrvPub64=(await import(`${GATEWAY}/${CIRCUITS_CID}/less_than_prv_pub_64.json`,{with:{type:'json'},})).default;const KP={'@context':['https://www.w3.org/ns/did/v1','https://www.w3.org/ns/data-integrity/v1','https://w3id.org/security/multikey/v1',],id:'did:web:0xauth.co',verificationMethod:{id:'did:web:0xauth.co#key-0',type:'Multikey',controller:'did:web:0xauth.co',secretKeyMultibase:'',publicKeyMultibase:'ukiiQxfsSfV0E2QyBlnHTK2MThnd7_-Fyf6u76BUd24uxoDF4UjnXtxUo8b82iuPZBOa8BXd1NpE20x3Rfde9udcd8P8nPVLr80Xh6WLgI9SYR6piNzbHhEVIfgd_Vo9P',},};try{const date=new Date();console.log('Verifying');const req=await Functions.makeHttpRequest({url:GEN_VP_URL,timeout:15_000,method:'POST',headers:{'content-type':'application/json',},data:{identity_address:identityAddress,credential_type:'IdentityCredential',rules:[],challenge:challenge,},});const vp=req.data;if(!vp){throw new Error(`VP request failed`)}"
"const r=await zkpld.verifyProof(vp,KP,jsonld.documentLoader,{challenge:challenge,domain:'https://0xauth.co',});if(!r.verified)throw new Error(r.error);console.log('Verified in',Date.now()-date.getTime(),'ms');return Functions.encodeUint256(1)}catch(er){console.log(er);return Functions.encodeUint256(0)}";

contract ProofFunction is FunctionsClient, ConfirmedOwner {
  using FunctionsRequest for FunctionsRequest.Request;

  bytes32 public s_lastRequestId;
  bytes public s_lastResponse;
  bytes public s_lastError;

  error UnexpectedRequestID(bytes32 requestId);

  event Response(bytes32 indexed requestId, bytes response, bytes err);

  constructor(address router) FunctionsClient(router) ConfirmedOwner(msg.sender) {}

  function sendRequest(
    string[] memory args,
    uint64 subscriptionId,
    uint32 gasLimit,
    bytes32 donID
  ) external onlyOwner returns (bytes32 requestId) {
    FunctionsRequest.Request memory req;
    req.initializeRequestForInlineJavaScript(FUNCTION_SRC);

    if (args.length > 0) req.setArgs(args);
    s_lastRequestId = _sendRequest(req.encodeCBOR(), subscriptionId, gasLimit, donID);
    return s_lastRequestId;
  }

  function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
    if (s_lastRequestId != requestId) {
      revert UnexpectedRequestID(requestId);
    }
    s_lastResponse = response;
    s_lastError = err;
    emit Response(requestId, s_lastResponse, s_lastError);
  }
}
