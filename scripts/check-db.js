const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Checking Users...");
    const users = await prisma.user.findMany();
    console.log(`Found ${users.length} users:`);
    users.forEach(u => console.log(` - ${u.email} (Verified: ${u.emailVerified})`));

    console.log("\nChecking VerificationTokens...");
    const tokens = await prisma.verificationToken.findMany();
    console.log(`Found ${tokens.length} tokens:`);
    tokens.forEach(t => console.log(` - ${t.identifier} | ${t.token} | Expires: ${t.expires}`));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
