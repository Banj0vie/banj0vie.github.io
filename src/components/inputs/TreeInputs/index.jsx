import React, { useEffect, useMemo, useState, useRef } from "react";
import "./style.css";
import BaseInput from "../BaseInput";
import BaseButton from "../../buttons/BaseButton";
import { useItems } from "../../../hooks/useItems";
import CardView from "../../boxes/CardView";
import BaseCheckBox from "../BaseCheckBox";
import BaseSelect from "../BaseSelect";

const TreeInput = ({ onBack, onSelect, sortable = false }) => {
  const [search, setSearch] = useState("");
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

  // Auto-select all items when component loads
  useEffect(() => {
    if (itemsTree && itemsTree.length > 0 && !loading && checked.size === 0) {
      const allItemIds = new Set();

      const walk = (n) => {
        // Add items from category nodes that have items arrays
        if (n.items && n.items.length > 0) {
          n.items.forEach((item) => allItemIds.add(item.id));
        }
        // Add leaf nodes that have count (user owns these items)
        else if (!n.children && n.count !== undefined && n.count > 0) {
          allItemIds.add(n.id);
        }
        // Recursively process children
        if (n.children) n.children.forEach((c) => walk(c));
      };

      itemsTree.forEach(walk);
      setChecked(allItemIds);
    }
  }, [itemsTree, loading, checked.size]);

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

        const walk = (n) => {
          if (n.items && n.items.length > 0) {
            n.items.forEach((item) => {
              if (isChecked) next.add(item.id);
              else next.delete(item.id);
            });
          } else if (!n.children && n.count !== undefined) {
            if (isChecked) next.add(n.id);
            else next.delete(n.id);
          }
          if (n.children) n.children.forEach((c) => walk(c));
        };
        itemsTree.forEach(walk);
      } else {
        // For other categories, use the existing logic
        const walk = (n, val) => {
          // If this node has items array (category nodes with user items), collect their IDs
          if (n.items && n.items.length > 0) {
            n.items.forEach((item) => {
              if (val) next.add(item.id);
              else next.delete(item.id);
            });
          }
          // If this is a leaf node with count (individual item), use its ID
          else if (!n.children && n.count !== undefined) {
            if (val) next.add(n.id);
            else next.delete(n.id);
          }
          // For category nodes, recursively process children
          if (n.children) n.children.forEach((c) => walk(c, val));
        };
        walk(node, isChecked);
      }

      return next;
    });
  };

  const onReset = () => {
    setSearch("");
    setExpanded(new Set());

    // Select all items instead of clearing
    if (itemsTree && itemsTree.length > 0) {
      const allItemIds = new Set();

      const walk = (n) => {
        if (n.items && n.items.length > 0) {
          n.items.forEach((item) => allItemIds.add(item.id));
        } else if (!n.children && n.count !== undefined && n.count > 0) {
          allItemIds.add(n.id);
        }
        if (n.children) n.children.forEach((c) => walk(c));
      };

      itemsTree.forEach(walk);
      setChecked(allItemIds);
    } else {
      setChecked(new Set());
    }
  };

  const onApply = () => {};

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

      const getAllItemIds = () => {
        const allIds = new Set();
        const walk = (n) => {
          if (n.items && n.items.length > 0) {
            n.items.forEach((item) => allIds.add(item.id));
          } else if (!n.children && n.count !== undefined) {
            allIds.add(n.id);
          }
          if (n.children) n.children.forEach((c) => walk(c));
        };
        itemsTree.forEach(walk);
        return allIds;
      };

      const allItemIds = getAllItemIds();
      return (
        allItemIds.size > 0 &&
        Array.from(allItemIds).every((id) => checked.has(id))
      );
    } else if (node.items && node.items.length > 0) {
      // For category nodes, check if any items are selected
      return node.items.some((item) => checked.has(item.id));
    } else if (!node.children && node.count !== undefined) {
      // For leaf nodes, check if the node itself is selected
      return checked.has(node.id);
    }
    return false;
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
      label: "Date - Oldest",
      value: "date-oldest",
    },
    {
      label: "Date - Newest",
      value: "date-newest",
    },
  ];
  return (
    <div className="tree-input">
      <BaseInput
        className="h-2.5rem"
        value={search}
        setValue={(v) => setSearch(v)}
        placeholder="Search Filters"
      />
      {sortable && <BaseSelect options={sortOptions}></BaseSelect>}
      <div className="tree-list">{filtered.map((n) => renderNode(n))}</div>

      <div className="tree-actions">
        {sortable ? (
          <div className="button-row">
            <BaseButton label="Reset" onClick={onReset} />
            <BaseButton label="Apply" onClick={onApply} />
          </div>
        ) : (
          <BaseButton label="Reset" onClick={onReset} />
        )}
        <BaseButton label="Back" onClick={onBack} />
      </div>
    </div>
  );
};

export default TreeInput;
