import '@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol';
import '@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol';

abstract contract ProofVerify is FunctionsClient {
  using FunctionsRequest for FunctionsRequest.Request;

  constructor() {}

  function sendRequest() {
    FunctionsRequest.Request memory req;
    req.initializeRequest(req);
  }

  function fulfillRequest(bytes32 requestId, bytes memory response, bytes memory err) internal override {
    if (s_lastRequestId != requestId) {
      revert UnexpectedRequestID(requestId); // Check if request IDs match
    }
    // Update the contract's state variables with the response and any errors
    s_lastResponse = response;
    character = string(response);
    s_lastError = err;

    // Emit an event to log the response
    emit Response(requestId, character, s_lastResponse, s_lastError);
  }
}
