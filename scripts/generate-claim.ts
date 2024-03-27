import { ethers } from "ethers";

async function main() {
    const IssuerAddress = new ethers.Wallet("");

    const userIdentityAddress = "0xed57893ed4EB08031eA274793f392ACbcab83c09"
    const claimTopic = ethers.id("1010102xxxxxxx");
    const claimData = "1"; // Accredited

    const digest = ethers.keccak256(
        ethers.AbiCoder.defaultAbiCoder().encode(
            ['address', 'bytes32', 'bytes'],
            [userIdentityAddress, claimTopic, ethers.toUtf8Bytes(claimData)]
        )
    );
    console.log(`Digest: ${digest}`);


    const signature = await IssuerAddress.signMessage(ethers.getBytes(digest));
    console.log(`Signature: ${signature}`);

    const issuedClaim = {
        topic: claimTopic.toString(),
        scheme: 10101000666004,
        issuer: "0xFfA784fEd2AB6A6944555fF49D0106dA570aC448",
        data: ethers.hexlify(ethers.toUtf8Bytes(claimData)),
        signature: signature,
        uri: "https://ipfs.io/ipfs/bafybeiae5lxras4qzfqyj6j2yhvcvslivmnvgyiat7urm2l3qvofz4ru5u/proof.json"
    };


    console.log(`npx hardhat add-claim --identity ${userIdentityAddress} --from 0x71d0FB3798a74ed4196273fCa97a1403b86FBC69 --claim '${JSON.stringify(issuedClaim)}' --network localhost`);

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
