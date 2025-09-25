import React, { useEffect, useState, useRef, useMemo } from "react";
import "./style.css";
import BaseInput from "../BaseInput";
import BaseButton from "../../buttons/BaseButton";
import { useItems } from "../../../hooks/useItems";
import CardView from "../../boxes/CardView";
import BaseCheckBox from "../BaseCheckBox";
import BaseSelect from "../BaseSelect";

const TreeInput = ({ onBack, onSelect, onSearch, search = "", sortable = false, sortby = "price-asc", setSortBy = () => {} }) => {
  const [expanded, setExpanded] = useState(() => new Set());
  const [checked, setChecked] = useState(() => new Set());
  const { items: itemsTree, loading, error } = useItems();
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });

  useEffect(() => {
    onSelectRef.current(Array.from(checked));
  }, [checked]);

  // Call reset once when component loads to select all items by default
  useEffect(() => {
    if (itemsTree && itemsTree.length > 0 && !loading) {
      onReset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsTree, loading]);
  
  const toggleExpand = (id) => {
    setExpanded((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleCheck = (node, isChecked) => {
    setChecked((s) => {
      const next = new Set(s);

      if (node.id === "ALL") {
        // For "All" category, select/deselect all items
        if (!itemsTree || itemsTree.length === 0) return s;

        // Get all available item IDs from the tree (all items, regardless of ownership)
        const getAllItemIds = () => {
          const allIds = new Set();
          const walk = (n) => {
            // If this node has items array (category nodes with items), collect their IDs
            if (n.items && n.items.length > 0) {
              n.items.forEach((item) => allIds.add(item.id));
            }
            // If this is a leaf node representing an actual item (all items, regardless of count/ownership)
            else if (!n.children && n.id && typeof n.id === 'string' && n.id !== 'ALL') {
              allIds.add(n.id);
            }
            // Recursively process children
            if (n.children) n.children.forEach((c) => walk(c));
          };
          itemsTree.forEach(walk);
          return allIds;
        };

        const allItemIds = getAllItemIds();
        
        // Add or remove all item IDs based on isChecked
        allItemIds.forEach((id) => {
          if (isChecked) {
            next.add(id);
          } else {
            next.delete(id);
          }
        });
      } else {
        // For category nodes, get all items in this category and toggle them (all items, regardless of ownership)
        const getCategoryItemIds = (categoryNode) => {
          const itemIds = new Set();
          const walk = (n) => {
            if (n.items && n.items.length > 0) {
              n.items.forEach((item) => itemIds.add(item.id));
            } else if (!n.children && n.id && typeof n.id === 'string' && n.id !== 'ALL') {
              itemIds.add(n.id);
            }
            if (n.children) n.children.forEach((c) => walk(c));
          };
          walk(categoryNode);
          return itemIds;
        };
        // if it is not category it should be id of the item
        if (!node.children) {
          if (isChecked) {
            next.add(node.id);
          } else {
            next.delete(node.id);
          }
        } else {
          const categoryItemIds = getCategoryItemIds(node);
          categoryItemIds.forEach((id) => {
            if (isChecked) {
              next.add(id);
            } else {
              next.delete(id);
            }
          });
        }        
      }
      return next;
    });
  };

  const onReset = () => {
    onSearch("");
    setExpanded(new Set());
    // Reset button selects all items (all items, regardless of ownership)
    if (itemsTree && itemsTree.length > 0) {
      const allItemIds = new Set();

      const walk = (node) => {
        // If this node has items array, add all item IDs
        if (node.items && Array.isArray(node.items)) {
          node.items.forEach((item) => {
            if (item.id) {
              allItemIds.add(item.id);
            }
          });
        }
        
        // If this node has children, walk through them recursively
        if (node.children && Array.isArray(node.children)) {
          node.children.forEach((child) => walk(child));
        }
        
        // Also check if this node itself is an item (has an id and is not a category)
        if (node.id && !node.children && !node.items && typeof node.id === 'string' && node.id !== 'ALL') {
          allItemIds.add(node.id);
        }
      };

      itemsTree.forEach(walk);
      setChecked(allItemIds);
    } else {
      setChecked(new Set());
    }
  };

  const filtered = useMemo(() => {
    if (!itemsTree || loading) return [];
    if (!search) return itemsTree;

    const matchesSearch = (node, q) => {
      if (!q) return true;
      const lower = q.toLowerCase();
      if (node.label && node.label.toLowerCase().includes(lower)) return true;
      if (node.children) return node.children.some((c) => matchesSearch(c, q));
      return false;
    };

    const filterNode = (n) => {
      if (!matchesSearch(n, search)) return null;
      const out = { ...n };
      if (out.children) {
        out.children = out.children.map(filterNode).filter(Boolean);
      }
      return out;
    };
    return itemsTree.map(filterNode).filter(Boolean);
  }, [search, itemsTree, loading]);

  const isNodeChecked = (node) => {
    if (node.id === "ALL") {
      // For "All" category, check if all available items are selected
      if (!itemsTree || itemsTree.length === 0) return false;

      // Get all available item IDs from the tree (all items, regardless of ownership)
      const getAllItemIds = () => {
        const allIds = new Set();
        const walk = (n) => {
          // If this node has items array (category nodes with items), collect their IDs
          if (n.items && n.items.length > 0) {
            n.items.forEach((item) => allIds.add(item.id));
          }
          // If this is a leaf node representing an actual item (all items, regardless of count/ownership)
          else if (!n.children && n.id && n.id !== 'ALL') {
            allIds.add(n.id);
          }
          // Recursively process children
          if (n.children) n.children.forEach((c) => walk(c));
        };
        itemsTree.forEach(walk);
        return allIds;
      };

      const allItemIds = getAllItemIds();
      
      // Return true only if there are items available AND all of them are checked
      return allItemIds.size > 0 && Array.from(allItemIds).every((id) => checked.has(id));
    } else {
      // For category nodes, check if all items in this category are selected (all items, regardless of ownership)
      const getCategoryItemIds = (categoryNode) => {
        const itemIds = new Set();
        const walk = (n) => {
          if (n.items && n.items.length > 0) {
            n.items.forEach((item) => itemIds.add(item.id));
          } else if (!n.children && n.id && n.id !== 'ALL') {
            itemIds.add(n.id);
          }
          if (n.children) n.children.forEach((c) => walk(c));
        };
        walk(categoryNode);
        return itemIds;
      };
      
      const categoryItemIds = getCategoryItemIds(node);
      
      // If no items in this category, return false
      if (categoryItemIds.size === 0) return false;
      
      // Return true only if ALL items in this category are checked
      return Array.from(categoryItemIds).every((id) => checked.has(id));
    }
  };

  const renderNode = (node, level = 0) => {
    const isExpanded = expanded.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isChecked = isNodeChecked(node);
    return (
      <div
        className="tree-node"
        key={`${node.id}-${level}`}
        style={search.length > 0 ? {} : { paddingLeft: `${level * 12}px` }}
      >
        {(search.length === 0 || (search.length > 0 && !hasChildren)) && (
          <div>
            <CardView
              className="tree-row"
              secondary={hasChildren}
              onClick={() => hasChildren && toggleExpand(node.id)}
            >
              <div className="tree-label">{node.label}</div>
              <BaseCheckBox
                isChecked={isChecked}
                onChange={(checked) => toggleCheck(node, checked)}
              />
            </CardView>
          </div>
        )}
        {((search.length === 0 && hasChildren && isExpanded) ||
          (search.length > 0 && hasChildren)) && (
          <div className="tree-children">
            {node.children.map((c) => renderNode(c, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="tree-input">
        <div className="tree-loading">Loading items...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tree-input">
        <div className="tree-error">Error loading items: {error}</div>
        <BaseButton label="Back" onClick={onBack} />
      </div>
    );
  }

  const sortOptions = [
    {
      label: "Price - ASC",
      value: "price-asc",
    },
    {
      label: "Price - DESC",
      value: "price-desc",
    },
    {
      label: "Name - ASC",
      value: "name-asc",
    },
    {
      label: "Name - DESC",
      value: "name-desc",
    },
  ];

  return (
    <div className="tree-input">
      <div className="tree-header">
        <BaseInput
          className="h-2.5rem"
          placeholder="Search items..."
          value={search}
          setValue={onSearch}
        />
        {sortable && (
          <BaseSelect
            options={sortOptions}
            value={sortby}
            setValue={setSortBy}
          />
        )}
      </div>
      <div className="tree-content">
        {filtered.map((node) => renderNode(node))}
      </div>
      <div className="tree-buttons">
        <BaseButton label="Reset" onClick={onReset} />
        <BaseButton label="Back" onClick={onBack} />
      </div>
    </div>
  );
};

export default TreeInput;