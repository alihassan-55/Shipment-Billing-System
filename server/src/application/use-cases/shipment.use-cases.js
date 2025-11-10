import { Shipment, ShipmentStatus } from '../../domain/entities/shipment.entity.js';
import { Dimensions, Weight, TrackingNumber } from '../../domain/value-objects/shipment-details.js';
import { Money } from '../../domain/value-objects/money.js';

class ShipmentUseCaseError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

export class CreateShipmentUseCase {
  constructor(shipmentRepository, customerRepository, consigneeRepository) {
    this.shipmentRepository = shipmentRepository;
    this.customerRepository = customerRepository;
    this.consigneeRepository = consigneeRepository;
  }

  async execute(shipmentData) {
    try {
      // Input validation
      if (!shipmentData?.customerId) {
        throw new ShipmentUseCaseError('Customer ID is required', 'VALIDATION_ERROR');
      }
      if (!shipmentData?.consigneeId) {
        throw new ShipmentUseCaseError('Consignee ID is required', 'VALIDATION_ERROR');
      }
      if (!shipmentData?.dimensions || !shipmentData?.weight) {
        throw new ShipmentUseCaseError('Dimensions and weight are required', 'VALIDATION_ERROR');
      }

      // Verify customer exists and is active
      const customer = await this.customerRepository.findById(shipmentData.customerId);
      if (!customer) {
        throw new ShipmentUseCaseError('Customer not found', 'NOT_FOUND');
      }
      if (!customer.isActive()) {
        throw new ShipmentUseCaseError('Customer is not active', 'INVALID_STATE');
      }

      // Verify consignee exists
      const consignee = await this.consigneeRepository.findById(shipmentData.consigneeId);
      if (!consignee) {
        throw new ShipmentUseCaseError('Consignee not found', 'NOT_FOUND');
      }

      // Create value objects
      const dimensions = new Dimensions(
        shipmentData.dimensions.length,
        shipmentData.dimensions.width,
        shipmentData.dimensions.height
      );
      
      const weight = new Weight(shipmentData.weight.value, shipmentData.weight.unit);
      const cost = new Money(shipmentData.cost);

      // Generate tracking number if not provided
      const trackingNumber = shipmentData.trackingNumber 
        ? new TrackingNumber(shipmentData.trackingNumber)
        : TrackingNumber.generate();

      // Create shipment entity
      const shipment = Shipment.create({
        ...shipmentData,
        trackingNumber,
        dimensions,
        weight,
        cost
      });

      // Save to repository
      const savedShipment = await this.shipmentRepository.create(shipment);

      return {
        success: true,
        data: savedShipment.toJSON()
      };
    } catch (error) {
      if (error instanceof ShipmentUseCaseError) {
        throw error;
      }
      throw new ShipmentUseCaseError(
        'Failed to create shipment: ' + error.message,
        'INTERNAL_ERROR'
      );
    }
  }
}

export class UpdateShipmentStatusUseCase {
  constructor(shipmentRepository) {
    this.shipmentRepository = shipmentRepository;
  }

  async execute(id, status, notes = '') {
    try {
      if (!Object.values(ShipmentStatus).includes(status)) {
        throw new ShipmentUseCaseError('Invalid shipment status', 'VALIDATION_ERROR');
      }

      const shipment = await this.shipmentRepository.findById(id);
      if (!shipment) {
        throw new ShipmentUseCaseError('Shipment not found', 'NOT_FOUND');
      }

      shipment.updateStatus(status, notes);
      const updatedShipment = await this.shipmentRepository.update(shipment);

      return {
        success: true,
        data: updatedShipment.toJSON()
      };
    } catch (error) {
      if (error instanceof ShipmentUseCaseError) {
        throw error;
      }
      throw new ShipmentUseCaseError(
        'Failed to update shipment status: ' + error.message,
        'INTERNAL_ERROR'
      );
    }
  }
}

import { ShipmentStatus } from '../../domain/entities/shipment.entity';

export class GetShipmentUseCase {
  constructor(shipmentRepository) {
    this.shipmentRepository = shipmentRepository;
  }

  async execute(id) {
    try {
      const shipment = await this.shipmentRepository.findById(id);
      if (!shipment) {
        throw new ShipmentUseCaseError('Shipment not found', 'NOT_FOUND');
      }

      return {
        success: true,
        data: shipment.toJSON()
      };
    } catch (error) {
      if (error instanceof ShipmentUseCaseError) {
        throw error;
      }
      throw new ShipmentUseCaseError(
        'Failed to get shipment: ' + error.message,
        'INTERNAL_ERROR'
      );
    }
  }
}

export class TrackShipmentUseCase {
  constructor(shipmentRepository) {
    this.shipmentRepository = shipmentRepository;
  }

  async execute(trackingNumber) {
    try {
      if (!trackingNumber) {
        throw new ShipmentUseCaseError('Tracking number is required', 'VALIDATION_ERROR');
      }

      const shipment = await this.shipmentRepository.findByTrackingNumber(trackingNumber);
      if (!shipment) {
        throw new ShipmentUseCaseError('Shipment not found', 'NOT_FOUND');
      }

      return {
        success: true,
        data: {
          ...shipment.toJSON(),
          statusHistory: shipment.getStatusHistory()
        }
      };
    } catch (error) {
      if (error instanceof ShipmentUseCaseError) {
        throw error;
      }
      throw new ShipmentUseCaseError(
        'Failed to track shipment: ' + error.message,
        'INTERNAL_ERROR'
      );
    }
  }
}

export class ListCustomerShipmentsUseCase {
  constructor(shipmentRepository, customerRepository) {
    this.shipmentRepository = shipmentRepository;
    this.customerRepository = customerRepository;
  }

  async execute(customerId, filters = {}) {
    try {
      // Validate filters
      if (filters.status && !Object.values(ShipmentStatus).includes(filters.status)) {
        throw new ShipmentUseCaseError('Invalid status filter', 'VALIDATION_ERROR');
      }

      const customer = await this.customerRepository.findById(customerId);
      if (!customer) {
        throw new ShipmentUseCaseError('Customer not found', 'NOT_FOUND');
      }

      const shipments = await this.shipmentRepository.findByCustomer(customerId, filters);

      return {
        success: true,
        data: shipments.map(s => s.toJSON())
      };
    } catch (error) {
      if (error instanceof ShipmentUseCaseError) {
        throw error;
      }
      throw new ShipmentUseCaseError(
        'Failed to list customer shipments: ' + error.message,
        'INTERNAL_ERROR'
      );
    }
  }
}

export class GetShipmentsForInvoicingUseCase {
  constructor(shipmentRepository, customerRepository) {
    this.shipmentRepository = shipmentRepository;
    this.customerRepository = customerRepository;
  }

  async execute(customerId) {
    try {
      const customer = await this.customerRepository.findById(customerId);
      if (!customer) {
        throw new ShipmentUseCaseError('Customer not found', 'NOT_FOUND');
      }

      const shipments = await this.shipmentRepository.findUnassignedDelivered(customerId);

      return {
        success: true,
        data: shipments.map(s => s.toJSON())
      };
    } catch (error) {
      if (error instanceof ShipmentUseCaseError) {
        throw error;
      }
      throw new ShipmentUseCaseError(
        'Failed to get invoiceable shipments: ' + error.message,
        'INTERNAL_ERROR'
      );
    }
  }
}

// Export error class for use in controllers
export { ShipmentUseCaseError };