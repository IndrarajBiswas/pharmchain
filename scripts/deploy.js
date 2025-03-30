const { ethers } = require("hardhat");

async function main() {
    console.log("Starting deployment...");

    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Deploy RoleAccessControl
    console.log("\nDeploying RoleAccessControl...");
    const RoleAccessControl = await ethers.getContractFactory("RoleAccessControl");
    const roleAccessControl = await RoleAccessControl.deploy(deployer.address);
    await roleAccessControl.waitForDeployment();
    console.log("RoleAccessControl deployed to:", await roleAccessControl.getAddress());

    // Deploy DrugBatchRegistry
    console.log("\nDeploying DrugBatchRegistry...");
    const DrugBatchRegistry = await ethers.getContractFactory("DrugBatchRegistry");
    const drugBatchRegistry = await DrugBatchRegistry.deploy(await roleAccessControl.getAddress());
    await drugBatchRegistry.waitForDeployment();
    console.log("DrugBatchRegistry deployed to:", await drugBatchRegistry.getAddress());

    // Deploy ZKCredentialIssuer
    console.log("\nDeploying ZKCredentialIssuer...");
    const ZKCredentialIssuer = await ethers.getContractFactory("ZKCredentialIssuer");
    const zkCredentialIssuer = await ZKCredentialIssuer.deploy(await roleAccessControl.getAddress());
    await zkCredentialIssuer.waitForDeployment();
    console.log("ZKCredentialIssuer deployed to:", await zkCredentialIssuer.getAddress());

    // Deploy TransferTracker
    console.log("\nDeploying TransferTracker...");
    const TransferTracker = await ethers.getContractFactory("TransferTracker");
    const transferTracker = await TransferTracker.deploy(
        await roleAccessControl.getAddress(),
        await drugBatchRegistry.getAddress()
    );
    await transferTracker.waitForDeployment();
    console.log("TransferTracker deployed to:", await transferTracker.getAddress());

    // Deploy PrescriptionRegistry
    console.log("\nDeploying PrescriptionRegistry...");
    const PrescriptionRegistry = await ethers.getContractFactory("PrescriptionRegistry");
    const prescriptionRegistry = await PrescriptionRegistry.deploy(
        await roleAccessControl.getAddress(),
        await drugBatchRegistry.getAddress()
    );
    await prescriptionRegistry.waitForDeployment();
    console.log("PrescriptionRegistry deployed to:", await prescriptionRegistry.getAddress());

    // Log all deployed addresses
    console.log("\nDeployment Summary:");
    console.log("-------------------");
    console.log("RoleAccessControl:", await roleAccessControl.getAddress());
    console.log("DrugBatchRegistry:", await drugBatchRegistry.getAddress());
    console.log("ZKCredentialIssuer:", await zkCredentialIssuer.getAddress());
    console.log("TransferTracker:", await transferTracker.getAddress());
    console.log("PrescriptionRegistry:", await prescriptionRegistry.getAddress());
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 