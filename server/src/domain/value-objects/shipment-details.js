export class Dimensions {
  constructor(length, width, height) {
    this.length = Number(length);
    this.width = Number(width);
    this.height = Number(height);

    if ([this.length, this.width, this.height].some(dim => isNaN(dim) || dim <= 0)) {
      throw new Error('Invalid dimensions: all dimensions must be positive numbers');
    }
  }

  getVolume() {
    return this.length * this.width * this.height;
  }

  getVolumetricWeight(factor = 5000) {
    // Industry standard volumetric weight calculation
    return (this.getVolume() / factor);
  }

  toJSON() {
    return {
      length: this.length,
      width: this.width,
      height: this.height
    };
  }
}

export class Weight {
  constructor(value, unit = 'kg') {
    this.value = Number(value);
    this.unit = unit.toLowerCase();

    if (isNaN(this.value) || this.value <= 0) {
      throw new Error('Invalid weight: must be a positive number');
    }

    if (!['kg', 'g', 'lb'].includes(this.unit)) {
      throw new Error('Invalid weight unit: must be kg, g, or lb');
    }
  }

  toKilograms() {
    switch (this.unit) {
      case 'kg': return this.value;
      case 'g': return this.value / 1000;
      case 'lb': return this.value * 0.45359237;
    }
  }

  toJSON() {
    return {
      value: this.value,
      unit: this.unit
    };
  }
}

export class TrackingNumber {
  constructor(value) {
    this.value = value;
  }

  static generate() {
    const prefix = 'CBS';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return new TrackingNumber(`${prefix}${timestamp}${random}`);
  }

  toString() {
    return this.value;
  }

  toJSON() {
    return this.value;
  }
}