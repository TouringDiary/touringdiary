import React from 'react';

interface ComponentSelectorProps {
  keys: string[];
  selectedKey: string;
  onSelect: (key: string) => void;
}

const ComponentSelector: React.FC<ComponentSelectorProps> = ({ keys, selectedKey, onSelect }) => {
  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <h3 className="text-sm font-semibold mb-3 text-gray-600 uppercase tracking-wider">
        Component Styles
      </h3>
      <div className="flex flex-col space-y-1">
        {keys.map((key) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            className={`
              w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-blue-500
              ${
                selectedKey === key
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-white hover:bg-gray-100 text-gray-700'
              }
            `}
          >
            {key}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ComponentSelector;
