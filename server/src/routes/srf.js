import express from 'express';
import { getSheetsService } from '../services/sheetsService.js';

const router = express.Router();

/**
 * GET /api/srf/:leadId
 * Get SRF details for a specific Lead
 */
router.get('/:leadId', async (req, res, next) => {
    try {
        const { leadId } = req.params;
        const service = getSheetsService();
        const sheet = await service.getSRFSheet();
        const rows = await sheet.getRows();

        // Find row by Lead_ID
        const row = rows.find(r => r.get('Lead_ID') === leadId);

        if (!row) {
            return res.status(404).json({ success: false, message: 'SRF not found for this Lead ID' });
        }

        res.json({
            success: true,
            data: {
                lead_id: row.get('Lead_ID'),
                container_type: row.get('Container_Type'),
                size: row.get('Size'),
                temp_spec: row.get('Temperature_Spec'),
                commodity: row.get('Commodity'),
                score: row.get('SRF_Completion_Score')
            }
        });
    } catch (error) {
        next(error);
    }
});

/**
 * POST /api/srf
 * Create or Update SRF for a Lead
 */
router.post('/', async (req, res, next) => {
    try {
        const {
            lead_id,
            container_type,
            size,
            temperature_spec,
            commodity,
            rental_period,
            destination
        } = req.body;

        const service = getSheetsService();
        const sheet = await service.getSRFSheet();
        const rows = await sheet.getRows();

        // Check if SRF already exists
        const existingRow = rows.find(r => r.get('Lead_ID') === lead_id);

        const srfData = {
            Lead_ID: lead_id,
            Container_Type: container_type,
            Size: size,
            Temperature_Spec: temperature_spec,
            Commodity: commodity,
            Rental_Period: rental_period,
            Destination: destination,
            SRF_Completion_Score: '50' // Placeholder calculation
        };

        if (existingRow) {
            existingRow.assign(srfData);
            await existingRow.save();
        } else {
            await sheet.addRow(srfData);
        }

        // Trigger Side-effect: Update Master Sheet SRF Status (Not implemented in this atomic step)

        res.json({
            success: true,
            message: existingRow ? 'SRF Updated' : 'SRF Created',
            data: srfData
        });

    } catch (error) {
        next(error);
    }
});

export default router;
