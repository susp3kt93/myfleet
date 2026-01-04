import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// ============================================
// GET /vehicles - List all company vehicles (Admin)
// ============================================
router.get('/', requireAdmin, async (req, res) => {
    try {
        const whereClause = {};

        // Filter by company for COMPANY_ADMIN
        if (req.user.role === 'COMPANY_ADMIN') {
            whereClause.companyId = req.user.companyId;
        }

        const vehicles = await prisma.vehicle.findMany({
            where: whereClause,
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        personalId: true,
                        name: true,
                        photoUrl: true
                    }
                }
            },
            orderBy: [
                { status: 'asc' },
                { plate: 'asc' }
            ]
        });

        res.json(vehicles);
    } catch (error) {
        console.error('[GET /vehicles] Error:', error);
        res.status(500).json({ error: 'Failed to fetch vehicles' });
    }
});

// ============================================
// GET /vehicles/my - Get driver's assigned vehicle
// ============================================
router.get('/my', async (req, res) => {
    try {
        const vehicle = await prisma.vehicle.findFirst({
            where: {
                assignedToId: req.user.id
            },
            include: {
                company: {
                    select: {
                        name: true
                    }
                }
            }
        });

        if (!vehicle) {
            return res.json(null);
        }

        res.json(vehicle);
    } catch (error) {
        console.error('[GET /vehicles/my] Error:', error);
        res.status(500).json({ error: 'Failed to fetch vehicle' });
    }
});

// ============================================
// GET /vehicles/:id - Get single vehicle (Admin)
// ============================================
router.get('/:id', requireAdmin, async (req, res) => {
    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: req.params.id },
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        personalId: true,
                        name: true,
                        email: true,
                        phone: true,
                        photoUrl: true
                    }
                },
                company: {
                    select: {
                        name: true
                    }
                }
            }
        });

        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        // Check company access
        if (req.user.role === 'COMPANY_ADMIN' && vehicle.companyId !== req.user.companyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        res.json(vehicle);
    } catch (error) {
        console.error('[GET /vehicles/:id] Error:', error);
        res.status(500).json({ error: 'Failed to fetch vehicle' });
    }
});

// ============================================
// POST /vehicles - Add new vehicle (Admin)
// ============================================
router.post('/', requireAdmin, async (req, res) => {
    try {
        const {
            type, plate, make, model, year, capacity, color,
            currentMileage, mileageUnit, serviceIntervalMiles,
            insuranceExpiry, motExpiry, taxExpiry
        } = req.body;

        // Validate required fields
        if (!type || !plate || !model) {
            return res.status(400).json({ error: 'Type, plate, and model are required' });
        }

        // Check if plate already exists
        const existingVehicle = await prisma.vehicle.findUnique({
            where: { plate: plate.toUpperCase() }
        });

        if (existingVehicle) {
            return res.status(400).json({ error: 'Vehicle with this plate already exists' });
        }

        // Calculate next service mileage
        const nextServiceMileage = (currentMileage || 0) + (serviceIntervalMiles || 5000);

        const vehicle = await prisma.vehicle.create({
            data: {
                type,
                plate: plate.toUpperCase(),
                make: make || null,
                model,
                year: year ? parseInt(year) : null,
                capacity: capacity || null,
                color: color || null,
                currentMileage: currentMileage || 0,
                mileageUnit: mileageUnit || 'miles',
                serviceIntervalMiles: serviceIntervalMiles || 5000,
                lastServiceMileage: currentMileage || 0,
                nextServiceMileage,
                insuranceExpiry: insuranceExpiry ? new Date(insuranceExpiry) : null,
                motExpiry: motExpiry ? new Date(motExpiry) : null,
                taxExpiry: taxExpiry ? new Date(taxExpiry) : null,
                companyId: req.user.companyId,
                status: 'ACTIVE'
            },
            include: {
                assignedTo: true
            }
        });

        console.log(`[POST /vehicles] Created vehicle ${vehicle.plate} by ${req.user.name}`);
        res.status(201).json(vehicle);
    } catch (error) {
        console.error('[POST /vehicles] Error:', error);
        res.status(500).json({ error: 'Failed to create vehicle' });
    }
});

// ============================================
// PUT /vehicles/:id - Update vehicle (Admin)
// ============================================
router.put('/:id', requireAdmin, async (req, res) => {
    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: req.params.id }
        });

        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        if (req.user.role === 'COMPANY_ADMIN' && vehicle.companyId !== req.user.companyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const {
            type, plate, make, model, year, capacity, color,
            mileageUnit, serviceIntervalMiles,
            insuranceExpiry, motExpiry, taxExpiry, serviceNotes
        } = req.body;

        const updateData = {};
        if (type) updateData.type = type;
        if (plate) updateData.plate = plate.toUpperCase();
        if (make !== undefined) updateData.make = make;
        if (model) updateData.model = model;
        if (year !== undefined) updateData.year = year ? parseInt(year) : null;
        if (capacity !== undefined) updateData.capacity = capacity;
        if (color !== undefined) updateData.color = color;
        if (mileageUnit) updateData.mileageUnit = mileageUnit;
        if (serviceIntervalMiles) updateData.serviceIntervalMiles = parseInt(serviceIntervalMiles);
        if (insuranceExpiry !== undefined) updateData.insuranceExpiry = insuranceExpiry ? new Date(insuranceExpiry) : null;
        if (motExpiry !== undefined) updateData.motExpiry = motExpiry ? new Date(motExpiry) : null;
        if (taxExpiry !== undefined) updateData.taxExpiry = taxExpiry ? new Date(taxExpiry) : null;
        if (serviceNotes !== undefined) updateData.serviceNotes = serviceNotes;

        const updatedVehicle = await prisma.vehicle.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        personalId: true,
                        name: true
                    }
                }
            }
        });

        console.log(`[PUT /vehicles/:id] Updated vehicle ${updatedVehicle.plate}`);
        res.json(updatedVehicle);
    } catch (error) {
        console.error('[PUT /vehicles/:id] Error:', error);
        res.status(500).json({ error: 'Failed to update vehicle' });
    }
});

// ============================================
// PUT /vehicles/:id/assign - Assign vehicle to driver (Admin)
// ============================================
router.put('/:id/assign', requireAdmin, async (req, res) => {
    try {
        const { driverId } = req.body;

        const vehicle = await prisma.vehicle.findUnique({
            where: { id: req.params.id }
        });

        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        if (req.user.role === 'COMPANY_ADMIN' && vehicle.companyId !== req.user.companyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Verify driver exists and is in same company
        const driver = await prisma.user.findUnique({
            where: { id: driverId }
        });

        if (!driver || driver.role !== 'DRIVER') {
            return res.status(400).json({ error: 'Invalid driver' });
        }

        if (req.user.role === 'COMPANY_ADMIN' && driver.companyId !== req.user.companyId) {
            return res.status(403).json({ error: 'Driver not in your company' });
        }

        // Check if driver already has a vehicle
        const existingVehicle = await prisma.vehicle.findFirst({
            where: { assignedToId: driverId }
        });

        if (existingVehicle && existingVehicle.id !== req.params.id) {
            return res.status(400).json({
                error: `Driver already has vehicle ${existingVehicle.plate} assigned`
            });
        }

        const updatedVehicle = await prisma.vehicle.update({
            where: { id: req.params.id },
            data: { assignedToId: driverId },
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        personalId: true,
                        name: true
                    }
                }
            }
        });

        // Create notification for driver
        await prisma.notification.create({
            data: {
                userId: driverId,
                companyId: vehicle.companyId,
                title: 'Vehicle Assigned',
                message: `Vehicle ${updatedVehicle.plate} (${updatedVehicle.make || ''} ${updatedVehicle.model}) has been assigned to you.`,
                data: JSON.stringify({ type: 'VEHICLE_ASSIGNED', vehicleId: updatedVehicle.id })
            }
        });

        console.log(`[PUT /vehicles/:id/assign] Assigned ${updatedVehicle.plate} to ${driver.name}`);
        res.json(updatedVehicle);
    } catch (error) {
        console.error('[PUT /vehicles/:id/assign] Error:', error);
        res.status(500).json({ error: 'Failed to assign vehicle' });
    }
});

// ============================================
// PUT /vehicles/:id/unassign - Unassign vehicle (Admin)
// ============================================
router.put('/:id/unassign', requireAdmin, async (req, res) => {
    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: req.params.id },
            include: { assignedTo: true }
        });

        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        if (req.user.role === 'COMPANY_ADMIN' && vehicle.companyId !== req.user.companyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const previousDriverId = vehicle.assignedToId;

        const updatedVehicle = await prisma.vehicle.update({
            where: { id: req.params.id },
            data: { assignedToId: null },
            include: { assignedTo: true }
        });

        // Notify previous driver
        if (previousDriverId) {
            await prisma.notification.create({
                data: {
                    userId: previousDriverId,
                    companyId: vehicle.companyId,
                    title: 'Vehicle Unassigned',
                    message: `Vehicle ${vehicle.plate} has been unassigned from you.`,
                    data: JSON.stringify({ type: 'VEHICLE_UNASSIGNED', vehicleId: vehicle.id })
                }
            });
        }

        console.log(`[PUT /vehicles/:id/unassign] Unassigned ${updatedVehicle.plate}`);
        res.json(updatedVehicle);
    } catch (error) {
        console.error('[PUT /vehicles/:id/unassign] Error:', error);
        res.status(500).json({ error: 'Failed to unassign vehicle' });
    }
});

// ============================================
// PUT /vehicles/:id/mileage - Update mileage (Admin or assigned Driver)
// ============================================
router.put('/:id/mileage', async (req, res) => {
    try {
        const { mileage } = req.body;

        if (typeof mileage !== 'number' || mileage < 0) {
            return res.status(400).json({ error: 'Valid mileage is required' });
        }

        const vehicle = await prisma.vehicle.findUnique({
            where: { id: req.params.id }
        });

        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        // Check authorization: Admin or assigned driver
        const isAdmin = req.user.role === 'COMPANY_ADMIN' || req.user.role === 'SUPER_ADMIN';
        const isAssignedDriver = vehicle.assignedToId === req.user.id;

        if (!isAdmin && !isAssignedDriver) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Mileage should not decrease
        if (mileage < vehicle.currentMileage) {
            return res.status(400).json({
                error: `Mileage cannot be less than current reading (${vehicle.currentMileage})`
            });
        }

        // Check if maintenance is due
        let newStatus = vehicle.status;
        if (vehicle.nextServiceMileage && mileage >= vehicle.nextServiceMileage) {
            newStatus = 'NEEDS_SERVICE';
        }

        const updatedVehicle = await prisma.vehicle.update({
            where: { id: req.params.id },
            data: {
                currentMileage: mileage,
                status: newStatus
            },
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        personalId: true,
                        name: true
                    }
                }
            }
        });

        // Check if approaching service and notify admin
        const milesUntilService = (vehicle.nextServiceMileage || 0) - mileage;
        if (milesUntilService > 0 && milesUntilService <= 300) {
            // Find company admin to notify
            const admin = await prisma.user.findFirst({
                where: {
                    companyId: vehicle.companyId,
                    role: 'COMPANY_ADMIN'
                }
            });

            if (admin) {
                await prisma.notification.create({
                    data: {
                        userId: admin.id,
                        companyId: vehicle.companyId,
                        title: '🔧 Service Due Soon',
                        message: `Vehicle ${vehicle.plate} needs service in ${milesUntilService} ${vehicle.mileageUnit}. Current: ${mileage}, Due: ${vehicle.nextServiceMileage}`,
                        data: JSON.stringify({ type: 'SERVICE_DUE', vehicleId: vehicle.id })
                    }
                });
            }
        }

        console.log(`[PUT /vehicles/:id/mileage] Updated ${updatedVehicle.plate} mileage to ${mileage}`);
        res.json(updatedVehicle);
    } catch (error) {
        console.error('[PUT /vehicles/:id/mileage] Error:', error);
        res.status(500).json({ error: 'Failed to update mileage' });
    }
});

// ============================================
// PUT /vehicles/:id/status - Change vehicle status (Admin)
// ============================================
router.put('/:id/status', requireAdmin, async (req, res) => {
    try {
        const { status, serviceNotes, unassignDriver } = req.body;

        const validStatuses = ['ACTIVE', 'IN_SERVICE', 'NEEDS_SERVICE', 'INACTIVE'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const vehicle = await prisma.vehicle.findUnique({
            where: { id: req.params.id }
        });

        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        if (req.user.role === 'COMPANY_ADMIN' && vehicle.companyId !== req.user.companyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const updateData = {
            status,
            serviceNotes: serviceNotes || null
        };

        // If vehicle goes to service, optionally unassign driver
        if (status === 'IN_SERVICE' && unassignDriver && vehicle.assignedToId) {
            updateData.assignedToId = null;

            // Notify driver
            await prisma.notification.create({
                data: {
                    userId: vehicle.assignedToId,
                    companyId: vehicle.companyId,
                    title: 'Vehicle In Service',
                    message: `Vehicle ${vehicle.plate} has been sent for service and unassigned from you.`,
                    data: JSON.stringify({ type: 'VEHICLE_IN_SERVICE', vehicleId: vehicle.id })
                }
            });
        }

        // If coming back from service, reset service mileage
        if (vehicle.status === 'IN_SERVICE' && status === 'ACTIVE') {
            updateData.lastServiceMileage = vehicle.currentMileage;
            updateData.nextServiceMileage = vehicle.currentMileage + vehicle.serviceIntervalMiles;
            updateData.lastServiceDate = new Date();
            updateData.serviceNotes = null;
        }

        const updatedVehicle = await prisma.vehicle.update({
            where: { id: req.params.id },
            data: updateData,
            include: {
                assignedTo: {
                    select: {
                        id: true,
                        personalId: true,
                        name: true
                    }
                }
            }
        });

        console.log(`[PUT /vehicles/:id/status] Changed ${updatedVehicle.plate} status to ${status}`);
        res.json(updatedVehicle);
    } catch (error) {
        console.error('[PUT /vehicles/:id/status] Error:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});

// ============================================
// DELETE /vehicles/:id - Delete vehicle (Admin)
// ============================================
router.delete('/:id', requireAdmin, async (req, res) => {
    try {
        const vehicle = await prisma.vehicle.findUnique({
            where: { id: req.params.id }
        });

        if (!vehicle) {
            return res.status(404).json({ error: 'Vehicle not found' });
        }

        if (req.user.role === 'COMPANY_ADMIN' && vehicle.companyId !== req.user.companyId) {
            return res.status(403).json({ error: 'Access denied' });
        }

        await prisma.vehicle.delete({
            where: { id: req.params.id }
        });

        console.log(`[DELETE /vehicles/:id] Deleted vehicle ${vehicle.plate}`);
        res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) {
        console.error('[DELETE /vehicles/:id] Error:', error);
        res.status(500).json({ error: 'Failed to delete vehicle' });
    }
});

// ============================================
// GET /vehicles/drivers/available - Get drivers without vehicles (Admin)
// ============================================
router.get('/drivers/available', requireAdmin, async (req, res) => {
    try {
        const whereClause = {
            role: 'DRIVER',
            isActive: true,
            assignedVehicle: null
        };

        if (req.user.role === 'COMPANY_ADMIN') {
            whereClause.companyId = req.user.companyId;
        }

        const drivers = await prisma.user.findMany({
            where: whereClause,
            select: {
                id: true,
                personalId: true,
                name: true,
                photoUrl: true
            },
            orderBy: { name: 'asc' }
        });

        res.json(drivers);
    } catch (error) {
        console.error('[GET /vehicles/drivers/available] Error:', error);
        res.status(500).json({ error: 'Failed to fetch available drivers' });
    }
});

export default router;
