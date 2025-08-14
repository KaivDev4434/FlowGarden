// plants/PlantFactory.js
import { GenericPlant } from './GenericPlant';
import { BonsaiPlant } from './BonsaiPlant';
import { SucculentPlant } from './SucculentPlant';

export class PlantFactory {
  static createPlant(type, container) {
    const plants = {
      generic: GenericPlant,
      sunflower: GenericPlant, // Use generic for sunflower style
      bonsai: BonsaiPlant,
      succulent: SucculentPlant,
      flower: GenericPlant
    };

    const PlantClass = plants[type] || GenericPlant;
    return new PlantClass(container);
  }

  static getAvailablePlantTypes() {
    return [
      { type: 'generic', name: 'Sunflower', description: 'A beautiful blooming sunflower' },
      { type: 'bonsai', name: 'Bonsai Tree', description: 'A zen bonsai tree' },
      { type: 'succulent', name: 'Succulent', description: 'A hardy desert plant' }
    ];
  }
}