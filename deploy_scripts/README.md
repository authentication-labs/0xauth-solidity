First copy/move 01_deploy_amoy.ts into deploy folder and run 
```
yarn fork:deploy amoy
```

if everything goes fine, copy the bridge and gateway address and paste it in op_sepolia deploy file.

Sometimes while deploying it reuses the existing contracts, and causes admin errors, so add networks with new name in hardhat.config.ts and also in env, so it deploys cleanly

then 

```
yarn deploy network
```

copy/move back 01_deploy_amoy.ts into deploy_scripts folder

Secondly, move 02_deploy_sepolia.ts into deploy folder and run, make sure to add op_sepolia network into hardhat.config.ts and also in env
```
yarn fork:deploy op_sepolia
```

