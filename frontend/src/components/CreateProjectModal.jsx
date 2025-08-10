import { useState } from 'react';
import { X } from 'lucide-react';

const CreateProjectModal = ({ onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    plantType: 'SUCCULENT'
  });

  const plantTypes = [
    { value: 'SUCCULENT', label: '🌵 Succulent', description: 'Hardy and resilient' },
    { value: 'BONSAI', label: '🌲 Bonsai', description: 'Requires patience and care' },
    { value: 'FLOWER', label: '🌸 Flower', description: 'Blooms with attention' },
    { value: 'HERB', label: '🌿 Herb', description: 'Practical and aromatic' },
    { value: 'TREE', label: '🌳 Tree', description: 'Grows tall with time' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSubmit(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="zen-card max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-zen-200">
          <h2 className="text-xl font-semibold text-zen-800">
            Plant a New Seed 🌱
          </h2>
          <button
            onClick={onClose}
            className="text-zen-500 hover:text-zen-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Project Name */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-zen-700 mb-2">
              Project Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Learn React, Write Novel, Exercise..."
              className="w-full px-3 py-2 border border-zen-300 rounded-lg focus:ring-2 focus:ring-nature-500 focus:border-transparent outline-none transition-all"
              required
              autoFocus
            />
            <p className="text-xs text-zen-500 mt-1">
              Give your project a meaningful name that will motivate you
            </p>
          </div>

          {/* Plant Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-zen-700 mb-3">
              Choose Your Plant Type
            </label>
            <div className="grid grid-cols-1 gap-2">
              {plantTypes.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-center p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.plantType === type.value
                      ? 'border-nature-500 bg-nature-50'
                      : 'border-zen-200 hover:border-zen-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="plantType"
                    value={type.value}
                    checked={formData.plantType === type.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, plantType: e.target.value }))}
                    className="sr-only"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{type.label.split(' ')[0]}</span>
                      <div>
                        <div className="font-medium text-zen-800">
                          {type.label.split(' ').slice(1).join(' ')}
                        </div>
                        <div className="text-sm text-zen-600">
                          {type.description}
                        </div>
                      </div>
                    </div>
                  </div>
                  {formData.plantType === type.value && (
                    <div className="w-5 h-5 bg-nature-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Growth Info */}
          <div className="mb-6 p-4 bg-nature-50 rounded-lg border border-nature-200">
            <h4 className="font-medium text-nature-800 mb-2">🌱 How Growth Works</h4>
            <ul className="text-sm text-nature-700 space-y-1">
              <li>• <strong>Focus sessions</strong> provide water and sunlight</li>
              <li>• <strong>Longer sessions</strong> boost health more</li>
              <li>• <strong>Neglect</strong> causes plants to wither over time</li>
              <li>• <strong>Consistent care</strong> helps plants reach full bloom</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="zen-button-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="zen-button flex-1"
              disabled={!formData.name.trim()}
            >
              Plant Seed
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectModal;
