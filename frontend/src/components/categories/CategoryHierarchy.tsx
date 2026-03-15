import React, { useState } from 'react';

import { ChevronDownIcon, ChevronRightIcon, FolderIcon } from '@heroicons/react/24/outline';

import { CategoryHierarchyNode as CategoryNodeType } from '../../types';

interface CategoryHierarchyProps {
  data: CategoryNodeType[];
  onSelectCategory?: (category: any) => void;
}

interface HierarchyNodeProps {
  node: CategoryNodeType;
  depth: number;
  onSelectCategory?: (category: any) => void;
}

const HierarchyNode: React.FC<HierarchyNodeProps> = ({ node, depth, onSelectCategory }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-green-600';
      case 'expense':
        return 'text-red-600';
      case 'transfer':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleNodeClick = () => {
    if (onSelectCategory) {
      onSelectCategory(node);
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="select-none">
      <div
        className="flex items-center py-2 px-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={handleNodeClick}
      >
        {/* Expand/collapse button */}
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="p-1 hover:bg-gray-200 rounded mr-1 focus:outline-none"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDownIcon className="h-4 w-4 text-gray-500" />
            ) : (
              <ChevronRightIcon className="h-4 w-4 text-gray-500" />
            )}
          </button>
        ) : (
          <span className="w-6" />
        )}

        {/* Color indicator */}
        <div
          className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
          style={{ backgroundColor: node.color }}
          title={`Color: ${node.color}`}
        />

        {/* Icon or fallback */}
        {node.icon ? (
          <span className="mr-2 text-gray-600" role="img" aria-label={node.icon}>
            {node.icon}
          </span>
        ) : (
          <FolderIcon className={`h-4 w-4 mr-2 flex-shrink-0 ${getTypeColor(node.type)}`} />
        )}

        {/* Category name */}
        <span className="text-sm font-medium text-gray-700 truncate">{node.name}</span>

        {/* Type badge */}
        <span
          className={`ml-2 text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
            node.type === 'income'
              ? 'bg-green-100 text-green-700'
              : node.type === 'expense'
                ? 'bg-red-100 text-red-700'
                : 'bg-blue-100 text-blue-700'
          }`}
        >
          {node.type}
        </span>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-4">
          {node.children.map((child) => (
            <HierarchyNode
              key={child.id}
              node={child}
              depth={depth + 1}
              onSelectCategory={onSelectCategory}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CategoryHierarchy: React.FC<CategoryHierarchyProps> = ({ data, onSelectCategory }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <FolderIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-1">No Categories Found</h3>
        <p className="text-sm text-gray-500">Create your first category to see the hierarchy.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Category Hierarchy</h3>
        <span className="text-xs text-gray-500">
          {data.reduce((acc, node) => acc + 1 + (node.children?.length || 0), 0)} categories
        </span>
      </div>
      <div className="space-y-1 max-h-96 overflow-y-auto pr-2">
        {data.map((node) => (
          <HierarchyNode key={node.id} node={node} depth={0} onSelectCategory={onSelectCategory} />
        ))}
      </div>
    </div>
  );
};

export default CategoryHierarchy;
