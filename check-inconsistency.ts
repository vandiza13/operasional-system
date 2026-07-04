import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const inconsistentExpenses = await prisma.expense.findMany({
        where: {
            payoutBatchId: { not: null },
            status: { not: 'PAID' }
        }
    });

    console.log(`Found ${inconsistentExpenses.length} inconsistent expenses.`);
    let totalRefund = 0;
    for (const exp of inconsistentExpenses) {
        console.log(`- Expense ${exp.id}: amount ${exp.amount}, current status ${exp.status}, batch ${exp.payoutBatchId}`);
        totalRefund += Number(exp.amount);
    }
    console.log(`Total amount that needs to be refunded: ${totalRefund}`);
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
