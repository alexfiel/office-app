import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
    formatCurrency,
    formatDate,
    formatValidityDate,
    processTransactionComputation
} from './ReportTransferTaxCompSheet';

describe('ReportTransferTaxCompSheet Unit Tests', () => {
    describe('Formatting Utilities', () => {
        it('formatCurrency should format numbers to 2 decimal places with comma separators', () => {
            assert.equal(formatCurrency(0), '0.00');
            assert.equal(formatCurrency(500), '500.00');
            assert.equal(formatCurrency(1234567.89), '1,234,567.89');
            assert.equal(formatCurrency('9876543.21'), '9,876,543.21');
            assert.equal(formatCurrency(null), '0.00');
            assert.equal(formatCurrency(undefined), '0.00');
            assert.equal(formatCurrency('invalid'), '0.00');
        });

        it('formatDate should format dates in MMM D, YYYY format', () => {
            assert.equal(formatDate('2026-08-18'), 'Aug 18, 2026');
            assert.equal(formatDate(new Date('2026-09-17T00:00:00Z')), 'Sep 17, 2026');
            assert.equal(formatDate(null), 'N/A');
            assert.equal(formatDate(undefined), 'N/A');
            assert.equal(formatDate('invalid-date'), 'N/A');
        });

        it('formatValidityDate should identify dates >= 2099 as MAXIMUM INTEREST REACHED', () => {
            assert.equal(formatValidityDate('2099-12-31'), 'MAXIMUM INTEREST REACHED');
            assert.equal(formatValidityDate('2100-01-01'), 'MAXIMUM INTEREST REACHED');
            assert.equal(formatValidityDate('2026-10-16'), 'Oct 16, 2026');
            assert.equal(formatValidityDate(null), 'N/A');
        });
    });

    describe('processTransactionComputation - Single Transaction (Sale)', () => {
        it('should use Consideration when Consideration > Market Value', () => {
            const mockTx = {
                id: 'tx-1',
                t_controlNumber: 'CTO-TAGB-000001',
                t_DateCompute: new Date('2026-09-17'),
                t_validity: new Date('2026-10-17'),
                t_status: 'pending',
                t_transfertaxdetails: [
                    {
                        id: 'dt-1',
                        nt_transferror: 'Juan Dela Cruz',
                        nt_transferee: 'Maria Santos',
                        nt_transactiontype: 'Sale',
                        nt_taxdecnumber: '01-0001',
                        nt_lotnumber: 'Lot 101',
                        nt_area: 500,
                        nt_marketvalue: 500000,
                        nt_considerationvalue: 1000000
                    }
                ]
            };

            const result = processTransactionComputation(mockTx, '2026-09-01');

            assert.equal(result.groups.length, 1);
            const group = result.groups[0];

            assert.equal(group.transferor, 'Juan Dela Cruz');
            assert.equal(group.transferee, 'Maria Santos');
            assert.equal(group.transactionType, 'Sale');
            assert.equal(group.groupTotalMarketValue, 500000);
            assert.equal(group.groupConsideration, 1000000);
            assert.equal(group.groupTaxBase, 1000000);
            assert.equal(group.groupTaxDue, 7500); // 1,000,000 * 0.0075
            assert.equal(result.txTotalTaxDue, 7500);
            assert.equal(result.txHasMinimumTaxApplied, false);

            // Property row has blanks for calculation columns
            const propRow = group.bodyRows[0];
            assert.equal(propRow[0], '01-0001'); // TD No
            assert.equal(propRow[1], 'Lot 101');  // Lot No
            assert.equal(propRow[2], '500');      // Area
            assert.equal(propRow[3], '500,000.00'); // MV
            assert.equal(propRow[4], '');         // Consideration blank on property row
            assert.equal(propRow[5], '');         // Tax Base blank on property row
            assert.equal(propRow[6], '');         // Tax Due blank on property row

            // Summary row shows full computation
            const summaryRow = group.summaryRow;
            assert.equal(summaryRow[0], 'TOTAL:');
            assert.equal(summaryRow[3], '500,000.00');   // Total MV
            assert.equal(summaryRow[4], '1,000,000.00'); // Total Consideration
            assert.equal(summaryRow[5], '1,000,000.00'); // Tax Base (whichever higher)
            assert.equal(summaryRow[6], '7,500.00');     // Tax Due
        });

        it('should use Market Value when Market Value > Consideration', () => {
            const mockTx = {
                id: 'tx-2',
                t_controlNumber: 'CTO-TAGB-000002',
                t_DateCompute: new Date('2026-09-17'),
                t_status: 'pending',
                t_transfertaxdetails: [
                    {
                        id: 'dt-2',
                        nt_transferror: 'Pedro Penduko',
                        nt_transferee: 'Ana Reyes',
                        nt_transactiontype: 'Deed of Sale',
                        nt_taxdecnumber: '02-0002',
                        nt_lotnumber: 'Lot 202',
                        nt_area: 800,
                        nt_marketvalue: 800000,
                        nt_considerationvalue: 300000
                    }
                ]
            };

            const result = processTransactionComputation(mockTx, '2026-09-01');
            const group = result.groups[0];

            assert.equal(group.groupTotalMarketValue, 800000);
            assert.equal(group.groupConsideration, 300000);
            assert.equal(group.groupTaxBase, 800000); // 800,000 > 300,000
            assert.equal(group.groupTaxDue, 6000);   // 800,000 * 0.0075
            assert.equal(result.txTotalTaxDue, 6000);
        });
    });

    describe('processTransactionComputation - Minimum Tax Threshold', () => {
        it('should enforce statutory minimum tax due of Php 500 when raw tax is below 500', () => {
            const mockTx = {
                id: 'tx-min',
                t_controlNumber: 'CTO-TAGB-000003',
                t_DateCompute: new Date('2026-09-17'),
                t_status: 'pending',
                t_transfertaxdetails: [
                    {
                        id: 'dt-min',
                        nt_transferror: 'Jose Rizal',
                        nt_transferee: 'Paciano Rizal',
                        nt_transactiontype: 'Sale',
                        nt_taxdecnumber: '03-0003',
                        nt_lotnumber: 'Lot 303',
                        nt_area: 50,
                        nt_marketvalue: 20000,
                        nt_considerationvalue: 0
                    }
                ]
            };

            const result = processTransactionComputation(mockTx, '2026-09-01');
            const group = result.groups[0];

            // 20,000 * 0.0075 = 150 < 500
            assert.equal(group.groupTaxBase, 20000);
            assert.equal(group.groupTaxDue, 500);
            assert.equal(result.txHasMinimumTaxApplied, true);
        });
    });

    describe('processTransactionComputation - Multiple Properties in a Single Transaction', () => {
        it('should aggregate Market Values and Consideration across multiple parcels belonging to the same transaction', () => {
            const mockTx = {
                id: 'tx-multi-prop',
                t_controlNumber: 'CTO-TAGB-000004',
                t_DateCompute: new Date('2026-09-17'),
                t_status: 'pending',
                t_transfertaxdetails: [
                    {
                        id: 'dt-prop-1',
                        nt_transferror: 'Seller Corp',
                        nt_transferee: 'Buyer Inc',
                        nt_transactiontype: 'Deed of Absolute Sale',
                        nt_taxdecnumber: 'TD-001',
                        nt_lotnumber: 'Lot 1',
                        nt_area: 400,
                        nt_marketvalue: 400000,
                        nt_considerationvalue: 600000 // apportioned
                    },
                    {
                        id: 'dt-prop-2',
                        nt_transferror: 'Seller Corp',
                        nt_transferee: 'Buyer Inc',
                        nt_transactiontype: 'Deed of Absolute Sale',
                        nt_taxdecnumber: 'TD-002',
                        nt_lotnumber: 'Lot 2',
                        nt_area: 600,
                        nt_marketvalue: 600000,
                        nt_considerationvalue: 900000 // apportioned
                    }
                ]
            };

            const result = processTransactionComputation(mockTx, '2026-09-01');
            assert.equal(result.groups.length, 1);
            const group = result.groups[0];

            assert.equal(group.groupTotalMarketValue, 1000000);
            assert.equal(group.groupConsideration, 1500000);
            assert.equal(group.groupTaxBase, 1500000);
            assert.equal(group.groupTaxDue, 11250); // 1,500,000 * 0.0075
            assert.equal(result.txTotalTaxDue, 11250);
            // 2 property rows + 1 TOTAL summary row = 3 rows
            assert.equal(group.bodyRows.length, 3);
        });
    });

    describe('processTransactionComputation - Multiple Distinct Transactions (EJS + Simultaneous Sale)', () => {
        it('should correctly separate transactions and prevent consideration from the Sale leaking into the Extrajudicial Settlement', () => {
            const mockTx = {
                id: 'cmu5cv5280003eoc0wxr4twao',
                t_controlNumber: 'CTO-TAGB-000011',
                t_DateCompute: new Date('2026-09-17T09:56:59.358Z'),
                t_validity: new Date('2026-10-16T16:00:00.000Z'),
                t_status: 'pending',
                t_transfertaxdetails: [
                    {
                        id: 'cmu5cv53u0005eoc0lkn3mdkq',
                        nt_transferror: 'PAZ S. LIM, URSULA S. LIM',
                        nt_transferee: 'DOLORES S. LIM; HEIRS',
                        nt_transactiontype: 'Extrajudicial Settlement',
                        nt_taxdecnumber: '03-0008L-01696',
                        nt_lotnumber: '2403',
                        nt_area: 56678,
                        nt_marketvalue: 108846.95,
                        nt_considerationvalue: 0
                    },
                    {
                        id: 'cmu5cwi1j0007eoc0oe4vs0ew',
                        nt_transferror: 'DOLORES S. LIM; HEIRS',
                        nt_transferee: 'CEBU LANDMASTER INC.',
                        nt_transactiontype: 'Sale',
                        nt_taxdecnumber: '03-0008L-01696',
                        nt_lotnumber: '2403',
                        nt_area: 56678,
                        nt_marketvalue: 979622.55,
                        nt_considerationvalue: 299553910
                    }
                ]
            };

            const result = processTransactionComputation(mockTx, '2026-08-18');

            // Must produce 2 distinct groups
            assert.equal(result.groups.length, 2);

            // Group 1: Extrajudicial Settlement
            const ejsGroup = result.groups.find(g => g.transactionType.toLowerCase().includes('extrajudicial'));
            assert.ok(ejsGroup, 'EJS group should exist');
            assert.equal(ejsGroup.groupTotalMarketValue, 108846.95);
            assert.equal(ejsGroup.groupConsideration, 0); // MUST be 0!
            assert.equal(ejsGroup.groupTaxBase, 108846.95);
            assert.equal(Math.round(ejsGroup.groupTaxDue * 100) / 100, 816.35); // 108,846.95 * 0.0075 = 816.35

            // Group 2: Sale
            const saleGroup = result.groups.find(g => g.transactionType.toLowerCase().includes('sale'));
            assert.ok(saleGroup, 'Sale group should exist');
            assert.equal(saleGroup.groupTotalMarketValue, 979622.55);
            assert.equal(saleGroup.groupConsideration, 299553910);
            assert.equal(saleGroup.groupTaxBase, 299553910);
            assert.ok(Math.abs(saleGroup.groupTaxDue - (299553910 * 0.0075)) < 0.001);
            assert.equal(saleGroup.summaryRow[6], formatCurrency(299553910 * 0.0075));

            // Combined Total
            const expectedTotalTaxDue = (108846.95 * 0.0075) + (299553910 * 0.0075);
            assert.ok(Math.abs(result.txTotalTaxDue - expectedTotalTaxDue) < 0.001);
            assert.equal(formatCurrency(result.txTotalTaxDue), formatCurrency(expectedTotalTaxDue));
        });
    });

    describe('processTransactionComputation - Voided Status', () => {
        it('should set taxDue, penalties, and subtotal to 0 when status is voided', () => {
            const mockTx = {
                id: 'tx-voided',
                t_controlNumber: 'CTO-TAGB-000099',
                t_DateCompute: new Date('2026-09-17'),
                t_status: 'voided',
                t_transfertaxdetails: [
                    {
                        id: 'dt-voided',
                        nt_transferror: 'Vendor',
                        nt_transferee: 'Vendee',
                        nt_transactiontype: 'Sale',
                        nt_taxdecnumber: 'TD-VOID',
                        nt_lotnumber: 'Lot 99',
                        nt_area: 100,
                        nt_marketvalue: 500000,
                        nt_considerationvalue: 1000000
                    }
                ]
            };

            const result = processTransactionComputation(mockTx, '2026-01-01');
            assert.equal(result.isVoided, true);
            assert.equal(result.txTotalTaxDue, 0);
            assert.equal(result.txTotalSurcharge, 0);
            assert.equal(result.txTotalInterest, 0);
            assert.equal(result.txGrandTotal, 0);

            const group = result.groups[0];
            assert.equal(group.groupTaxDue, 0);
            assert.equal(group.groupSurcharge, 0);
            assert.equal(group.groupInterest, 0);
            assert.equal(group.groupSubTotal, 0);
        });
    });
});
