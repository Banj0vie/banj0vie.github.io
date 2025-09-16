import React, { useMemo, useState } from "react";
import "./style.css";
import BaseInput from "../BaseInput";
import BaseButton from "../../buttons/BaseButton";
import { ALL_ITEM_TREE } from "../../../constants/item_all";
import CardView from "../../boxes/CardView";
import BaseCheckBox from "../BaseCheckBox";

const TreeInput = ({ onBack }) => {
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(() => new Set());
  const [checked, setChecked] = useState(() => new Set());

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
      const walk = (n, val) => {
        if (val) next.add(n.id);
        else next.delete(n.id);
        if (n.children) n.children.forEach((c) => walk(c, val));
      };
      walk(node, isChecked);
      return next;
    });
  };

  const onReset = () => {
    setSearch("");
    setExpanded(new Set());
    setChecked(new Set());
  };

  const filtered = useMemo(() => {
    if (!search) return ALL_ITEM_TREE;
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
    return ALL_ITEM_TREE.map(filterNode).filter(Boolean);
  }, [search]);

  const renderNode = (node, level = 0) => {
    const isExpanded = expanded.has(node.id);
    const isChecked = checked.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    return (
      <div
        className="tree-node"
        key={node.id}
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

  return (
    <div className="tree-input">
      <BaseInput
        className="h-2.5rem"
        value={search}
        setValue={(v) => setSearch(v)}
        placeholder="Search Filters"
      />

      <div className="tree-list">{filtered.map((n) => renderNode(n))}</div>

      <div className="tree-actions">
        <BaseButton label="Reset" onClick={onReset} />
        <BaseButton label="Back" onClick={onBack} />
      </div>
    </div>
  );
};

export default TreeInput;
