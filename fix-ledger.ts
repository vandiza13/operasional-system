import { PrismaClient, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const adminUser = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
    if (!adminUser) {
        throw new Error("Super Admin not found.");
    }

    await prisma.$transaction(async (tx) => {
        // 1. Temukan semua bon yang statusnya tidak PAID tapi punya payoutBatchId
        const inconsistentExpenses = await tx.expense.findMany({
            where: {
                payoutBatchId: { not: null },
                status: { not: 'PAID' }
            }
        });

        if (inconsistentExpenses.length === 0) {
            console.log("No inconsistent expenses found.");
            return;
        }

        let totalRefund = 0;
        const batchMap = new Map<string, number>();

        for (const exp of inconsistentExpenses) {
            totalRefund += Number(exp.amount);
            const batchId = exp.payoutBatchId as string;
            batchMap.set(batchId, (batchMap.get(batchId) || 0) + Number(exp.amount));
        }

        console.log(`Refunding total: Rp ${totalRefund} from ${inconsistentExpenses.length} expenses.`);

        // 2. Ambil saldo terakhir
        const lastLedgers = await tx.$queryRaw<{balance: any}[]>`SELECT balance FROM OperationalLedger ORDER BY createdAt DESC LIMIT 1 FOR UPDATE`;
        const currentBalance = lastLedgers.length > 0 ? Number(lastLedgers[0].balance) : 0;
        const newBalance = currentBalance + totalRefund;

        // 3. Masukkan record TOP_UP untuk refund
        await tx.operationalLedger.create({
            data: {
                type: TransactionType.TOP_UP,
                amount: totalRefund,
                balance: newBalance,
                description: `Koreksi Sistem: Pengembalian dana pembatalan ${inconsistentExpenses.length} bon`,
                createdBy: adminUser.id
            }
        });

        // 4. Kurangi totalAmount di masing-masing PayoutBatch yang lama
        for (const [batchId, refundAmount] of batchMap.entries()) {
            const batch = await tx.payoutBatch.findUnique({ where: { id: batchId } });
            if (batch) {
                await tx.payoutBatch.update({
                    where: { id: batchId },
                    data: {
                        totalAmount: Number(batch.totalAmount) - refundAmount
                    }
                });
            }
        }

        // 5. Kosongkan payoutBatchId dari expense tersebut agar bisa dicairkan ulang
        const expenseIds = inconsistentExpenses.map(e => e.id);
        await tx.expense.updateMany({
            where: { id: { in: expenseIds } },
            data: { payoutBatchId: null }
        });

        console.log("Koreksi berhasil diselesaikan.");
    });
}

main()
    .catch(e => {
        console.error("Terjadi kesalahan:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
