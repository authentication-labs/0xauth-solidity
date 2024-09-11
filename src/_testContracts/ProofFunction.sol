pragma solidity 0.8.19;

import { FunctionsClient } from '@chainlink/contracts/src/v0.8/functions/v1_0_0/FunctionsClient.sol';
import { ConfirmedOwner } from '@chainlink/contracts/src/v0.8/shared/access/ConfirmedOwner.sol';
import { FunctionsRequest } from '@chainlink/contracts/src/v0.8/functions/v1_0_0/libraries/FunctionsRequest.sol';

contract FunctionsConsumerExample is FunctionsClient, ConfirmedOwner {
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
    req.initializeRequest(FunctionsRequest.Location.Remote, FunctionsRequest.CodeLanguage.JavaScript, '');

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
